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


// 用于部署合约，利用hardhat-deploy插件创建FundMe合约的部署脚本，以供在测试代码中复用合约部署逻辑。
// 因为之前写的部署合约的task任务，在测试代码中不能复用，所以需要创建一个部署脚本，以供在测试代码中复用合约部署逻辑（还可以复用部署的合约，避免每一个测试用例都重复部署一遍合约）。
/**
 * 函数的两个入参是 hardhat-deploy 提供的工具。这是两个函数对象。
 * getNamedAccounts：用于获取在 hardhat.config.js 中定义的命名账户（namedAccounts配置项）。
 * deployments：提供了一些用于部署合约的工具和方法。
 */
module.exports= async({getNamedAccounts, deployments}) => {
    // 获取在 hardhat.config.js 中定义的名为 firstAccount 的账户地址
    const {firstAccount} = await getNamedAccounts();
    // 获取 deployments 对象，用于部署合约
    const {deploy} = deployments;

    // 部署 FundMe 合约，使用 firstAccount 作为部署者，并传递构造函数的参数180
    await deploy("FundMe", {
        from: firstAccount,
        args: [180],
        log: true, // 是否在控制台打印部署过程中的日志信息
    });
}

// 为部署脚本指定标签，以便在测试代码中复用。
// 这里指定标签为 ["all", "fundme"]，表示该部署脚本属于 "all" 标签组，并且是 "fundme" 标签组的一部分。
// 在测试代码中，可以通过标签来选择性地运行或部署特定的合约。
module.exports.tags = ["all", "fundme"];

