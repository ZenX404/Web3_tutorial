/**
 * 我们可以把一段代码逻辑构建成一个task，然后通过npx hardhat task_name来执行这段代码
 * 下面我们就来写一个部署合约的task
 */

// 引入hardhat包中的task依赖，这样后面我们就可以直接使用task这个对象了
const { task } = require("hardhat/config");

// 创建名为deploy-fundme任务（名字后面第二个参数是描述），并设置任务的执行逻辑
// setAction()函数要传入一个函数作为入参，传入的函数就是task任务的执行逻辑
// 这里我们就通过创建匿名函数的语法，来设置任务逻辑
// 入参函数也有两个参数，一个是taskArgs，是task任务需要的参数，另一个是hardhat的运行时环境，用于调用hardhat提供的函数
task("deploy-fundme", "Deploy the FundMe contract").setAction(async (taskArgs, hre) => {
    // create factory  创建合约工厂
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    
    // deploy contract from factory  通过合约工厂来部署智能合约，并得到合约对象，后面就可以调用合约的函数了
    // deploy()函数只能保证把部署合约的命令发送给区块链，但是不能保证合约已经部署完成
    // deplay()函数的入参应该和FundMe.sol合约中构造函数的入参一致
    const fundMe = await fundMeFactory.deploy(180);
    // 所以需要await等待合约在区块链上部署完成，再继续向后执行
    await fundMe.waitForDeployment();

    // 打印合约地址
    console.log("FundMe deployed to:", await fundMe.target);

    // verify fundme
    /**
     * 合约部署之后，被etherscan收录可能会有延迟
     * 虽然上面在执行部署合约fundMe.waitForDeployment()时使用了await，会等待部署成功后再向后执行
     * 但是合约成功部署，并不意味着它已经被etherscan收录
     * 如果此时合约还没有被收录，我们去验证合约就可能会报错
     * 所以这里我们要等待几个区块（等待链上已经创建了几个区块后再向后执行），然后再去执行验证合约
     */
    // 判断当前合约部署到的网络是否是sepolia测试网络（通过获取合约部署到的公链的chainId判断）,如果是将合约部署到测试网络上，那么就需要验证合约
    // 如果只是将合约部署到本地网络，就没有必要验证合约了
    // 并且还要保证存在etherscan的api key，否则也无法调用合约验证接口
    if (hre.network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for 5 confirmations...");
        // 等待5个区块
        // fundMe.deploymentTransaction(): 获取合约部署的交易
        await fundMe.deploymentTransaction().wait(5);
        verifyFundMe(fundMe.target, [180]);
    } else {
        console.log("verification skipping ...");
    }
})

// 验证合约
async function verifyFundMe(fundmeAddr, args) {
    // 除了使用命令行来验证合约，hardhat还支持通过js来验证合约
    // hre变量就是headhat的运行时环境，通过这个可以实现在js中调用命令行里的命令，进而实现验证合约的效果
    await hre.run("verify:verify", {
        address: fundmeAddr, // 要验证的合约地址
        constructorArguments: args // 要验证的合约的构造函数入参，注意这里要传入一个数组
      });
}

// 导出模块
module.exports = {};
