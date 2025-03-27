// function deployFunction() {
//     console.log("this is a deploy function")
// }
// 导出该函数，这样在其他文件中就可以通过require引入该函数。这里就把函数作为一个对象赋值给module.exports.default了
// module.exports.default = deployFunction;

// async (hre) => {}这是一种匿名函数写法，()中是入参，=>后面是函数体
// 下面这段代码的导出效果和上面这段代码的效果是一样的
// module.exports= async () => {
//     console.log("this is a deploy function")
// }

// 引入helper-hardhat-config.js文件，获取devlopmentChains常量
// 可以同时引入多个常量
const {devlopmentChains, networkConfig, LOCK_TIME, CONFIRMATIONS} = require("../helper-hardhat-config");

// 用于部署合约，利用hardhat-deploy插件创建FundMe合约的部署脚本，以供在测试代码中复用合约部署逻辑。
// 因为之前写的部署合约的task任务，在测试代码中不能复用，所以需要创建一个部署脚本，以供在测试代码中复用合约部署逻辑（还可以复用部署的合约，避免每一个测试用例都重复部署一遍合约）。
// 通过hardhat-deploy组件完成部署，我们可以直接通过命令 npx hardhat deploy --tag tagName 来部署合约
// 使用hardhat-deploy组件部署的合约，会被记录下来部署地址，在后面可以直接通过deployments对象来获取已经部署的合约地址，进而复用已部署的合约对象，避免重复部署
/**
 * 函数的两个入参是 hardhat-deploy 提供的工具。这是两个函数对象。
 * getNamedAccounts：用于获取在 hardhat.config.js 中定义的命名账户（namedAccounts配置项）。
 * deployments：提供了一些用于部署合约的工具和方法。
 */
module.exports= async({getNamedAccounts, deployments}) => {
    // 获取在 hardhat.config.js 中定义的名为 firstAccount 的账户地址
    // 该用户就是要发出部署合约请求的地址
    const {firstAccount} = await getNamedAccounts();
    // 获取 deployments 对象，用于部署合约
    const {deploy} = deployments;

    // 定义一个变量，用于存储预言机合约地址
    let dateFeedAddr;
    let confirmations = 0;
    // 如果当前网络环境是本地（netwaork.name是hardhat.config.js中的配置项，默认是hardhat，如果我们命令输入别的网络名称，那么这个配置项就会换成别的网络），那么就使用本地mock合约
    if (devlopmentChains.includes(network.name)) {
        // 获取在本地部署的mock合约地址
        // 只要是前面通过hardhat-deploy组件部署的合约，都会被记录下来，在后面可以直接通过deployments对象来获取已经部署的合约地址，进而复用已部署的合约对象，避免重复部署
        const mockV3Aggregator = await deployments.get("MockV3Aggregator"); // 通过合约名称来获取已经部署的mock合约对象
        dateFeedAddr = mockV3Aggregator.address;
        // 本地环境下设置为0，才不会导致部署合约的时候一直等待
        confirmations = 0;
    // 非本地网络
    } else {
        // networkConfig是helper-hardhat-config.js中导出的常量，是一个对象，对象的key是网络的chainId，value是该网络要引用的合约地址
        // network.config.chainId是当前网络的chainId，networkConfig[network.config.chainId]用来获取所需要预言机服务在当前网络的合约地址
        dateFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed;
        confirmations = CONFIRMATIONS;
    }
    
    // 部署 FundMe 合约，使用 firstAccount 作为部署者，并传递构造函数的参数180
    // delpoy函数会返回部署的合约对象
    const fundme = await deploy("FundMe", {
        from: firstAccount,
        args: [LOCK_TIME, dateFeedAddr], // 传入构造函数入参，第一个参数是锁定期时长，第二个参数是预言机合约地址
        log: true, // 是否在控制台打印部署过程中的日志信息
        // 需要注意。如果是在本地测试网络环境下，waitConfirmations需要设定为0，否则合约永远都不会被部署，他会一直在这里等待产生区块。
        // 因为本地测试网络下，是不会像真正的区块链主网或者测试网一样，会时刻产生新区块的，本地网络不会有新区块，如果这个配置项设置大于0，那么就会一直等待
        waitConfirmations: confirmations  // hardhat-deploy组件的配置项，用于设置等待的区块数,避免合约还没有部署完成就向后执行导致程序报错
    });

    // remove deployments directory or add --reset flag if you redeploy contract
    // 如果需要重新部署合约（因为hardhat-deploy组件会缓存合约部署信息，会默认复用已部署的合约），请删除 deployments 目录或添加 --reset 标志
    // npx hardhat deploy --network sepolia --reset


    // 验证合约  只有当合约部署到sepolia网络，并且有ETHERSCAN_API_KEY时，才验证合约
    // 部署在本地时不需要验证合约
    if (hre.network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
        await hre.run("verify:verify", {
            address: fundme.address, // 要验证的合约地址
            constructorArguments: [LOCK_TIME, dateFeedAddr] // 要验证的合约的构造函数入参，注意这里要传入一个数组
        });
    } else {
        console.log("skipping verification: not on sepolia network or no ETHERSCAN_API_KEY");
    }
}

// 为部署脚本指定标签，以便在测试代码中复用。
// 这里指定标签为 ["all", "fundme"]，表示该部署脚本属于 "all" 和 "fundme" 标签组。
// 在测试代码中，可以通过标签来选择性地运行或部署特定的合约。
module.exports.tags = ["all", "fundme"];

