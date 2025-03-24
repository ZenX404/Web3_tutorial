// 编写对fundme合约的测试代码
// hardhat-toolbox：这个是hardhat框架提供的工具箱，用于开发智能合约的。其中已经包含了js测试框架mocha和chai了，所以不需要再单独安装了（正常使用依赖的流程是先通过npm安装依赖，然后在代码中require引入依赖）
// 这里我们直接引入mocha和chai的依赖即可。

// 引入依赖，这样在后面的代码中就可以使用ethers和assert对象
const {ethers} = require("hardhat");
// assert对象是chai库提供的，所以要引入chai依赖
const {assert} = require("chai");


/**
 * describe函数在JavaScript的测试框架（如Mocha、Jest等）中用于定义一个测试套件。
 * 它的主要作用是将一组相关的测试用例组织在一起，以便更好地管理和阅读测试代码。
 * 第一个入参是测试套件的名字，第二个入参是测试套件的测试代码函数。
 * 
 * 一个describe()中有多个it()，一个it()就是一个测试用例。
 */
describe("test fundme contract", async function() {
    // 测试用例1：测试fundme合约的owner是否是mag.sender
    // it()函数是chai库提供的，用于定义一个测试用例（每一个测试用例就是用于测试合约的某一种情况或者功能），有两个入参，第一个入参是测试用例名称，第二个入参是测试用例的测试代码函数。因为函数内使用了await，所以函数需要是async异步函数
    it("test if the owner is msg.sender", async function() {
        // 在合约开发中，js代码调用函数都要用await来等待完成后再向后执行，因为区块链上是有延迟的

        // 获取要发送部署合约请求的帐号，因为hardhat框架默认使用hardhat.config.js中accounts配置的第一个帐号来执行合约请求调用
        const [firstAccount] = await ethers.getSigners();
        // 获取fundme合约的工厂对象，用于部署fundme合约
        const fundMeFactory = await ethers.getContractFactory("FundMe");
        // fundme合约的工厂对象调用部署合约函数，来部署fundme合约
        const fundMe = await fundMeFactory.deploy(180);
        // await deploy()只是等待合约部署请求发送成功，但并不能保证合约真的完成部署了，为了避免后续代码报错，需要在这里等待一下合约部署成功
        await fundMe.waitForDeployment();
        // 获取fundme合约的owner，并断言owner是否等于firstAccount.address，来判断fundme合约的构造函数是否被成功执行，进而判断fundme合约是否成功部署
        // 注意这里要取firstAccount的address，而不是firstAccount，因为firstAccount是一个Signer类型的对象，需要取对象的address属性
        // 这里获取fundMe.owner()的值时，需要用await来等待，因为区块链有延迟。fundMe.owner()是一个异步函数（solidity自动给owner属性加的getter函数，默认都是异步的）
        assert.equal((await fundMe.owner()), firstAccount.address);
    });

})