// 文件名前缀是00.表示它的部署执行要在01-delpoy-fund-me.js之前

// 引入我们自己创建的常量参数配置文件，这样就可以直接引用配置文件中的常量参数
const {DECIMAL, INITIAL_ANSWER, devlopmentChains} = require("../helper-hardhat-config");

// 部署 MockV3Aggregator mock合约
module.exports= async({getNamedAccounts, deployments}) => {

    if (devlopmentChains.includes(network.name)) {
        // 获取在 hardhat.config.js 中定义的名为 firstAccount 的账户地址
        // 该用户就是要发出部署合约请求的地址
        const {firstAccount} = await getNamedAccounts();
        // 获取 deployments 对象，用于部署合约
        const {deploy} = deployments;

        // 部署 FundMe 合约，使用 firstAccount 作为部署者，并传递构造函数的参数180
        await deploy("MockV3Aggregator", {
            from: firstAccount,
            args: [DECIMAL, INITIAL_ANSWER], // 合约构造函数的入参   第一个参数是返回的金额保留几位小数   第二个参数是要转换的金额，也就是要把300000000000wei转换对应的usd金额，并保留8位小数
            log: true, // 是否在控制台打印部署过程中的日志信息
        });
    } else {
        console.log("skipping mock deployment: not on a development chain");
    }
    
}

// 为部署脚本指定标签，以便在测试代码中复用。
// 这里指定标签为 ["all", "mock"]，表示该部署脚本属于 "all"和"mock" 标签组。
// 在测试代码中，可以通过标签来选择性地运行或部署特定的合约。
module.exports.tags = ["all", "mock"];