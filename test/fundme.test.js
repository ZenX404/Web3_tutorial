// 编写对fundme合约的测试代码
// hardhat-toolbox：这个是hardhat框架提供的工具箱，用于开发智能合约的。其中已经包含了js测试框架mocha和chai了，所以不需要再单独安装了（正常使用依赖的流程是先通过npm安装依赖，然后在代码中require引入依赖）
// 这里我们直接引入chai依赖即可。

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
    // 为了让beforeEach中复制的合约对象可以在每一个it中使用，所以要把这复用的对象定义在外面，扩大它们的作用域
    let fundMe;
    let firstAccount;
    // 在每个it测试用例执行之前，都会执行beforeEach函数，这样就可以实现逻辑复用
    // beforeEach中完成了合约的部署以及合约对象的获取，实现测试用例中的复用
    beforeEach(async function() {
        // 在test中，我们可以通过deployments.fixture()来调用我们写的部署脚本（使用hardhat-deploy插件），这样就可以实现测试用例中的复用
        // 使用hardhat-deploy插件的fixture函数，来部署合约   执行all标签组中的所有部署脚本
        await deployments.fixture(["all"]);
        // 获取在hardhat.config.js中定义的名为firstAccount的账户地址  注意这里直接获取的地址
        firstAccount = (await getNamedAccounts()).firstAccount;
        // 获取当前已经部署的fundme合约部署对象（fundMeDeployment）。只要是通过hardhat-deploy插件部署的合约，都会被记录在deployments对象中，
        // 这样，后续我们就可以通过合约名称来获取已经部署的合约，这样就不用每个测试用例都重复部署了
        const fundMeDeployment = await deployments.get("FundMe");
        // 通过合约部署对象的address属性，获取已经部署的fundme合约的地址
        // 进而，通过ethers.getContractAt函数，通过链上地址获取已部署在区块链上的fundme合约对象，进而可以调用合约的函数
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
    })

    // 测试用例1：测试fundme合约的owner是否是mag.sender
    // it()函数是chai库提供的，用于定义一个测试用例（每一个测试用例就是用于测试合约的某一种情况或者功能），有两个入参，第一个入参是测试用例名称，第二个入参是测试用例的测试代码函数。因为函数内使用了await，所以函数需要是async异步函数
    it("test if the owner is msg.sender", async function() {
        // // 在合约开发中，js代码调用函数都要用await来等待完成后再向后执行，因为区块链上是有延迟的

        // // 获取要发送部署合约请求的帐号，因为hardhat框架默认使用hardhat.config.js中accounts配置的第一个帐号来执行合约请求调用
        // const [firstAccount] = await ethers.getSigners();
        // // 获取fundme合约的工厂对象，用于部署fundme合约
        // const fundMeFactory = await ethers.getContractFactory("FundMe");
        // // fundme合约的工厂对象调用部署合约函数，来部署fundme合约
        // const fundMe = await fundMeFactory.deploy(180);

        // 有了beforeEach()中的复用逻辑，上面的代码就可以都注释掉了

        // await deploy()只是等待合约部署请求发送成功，但并不能保证合约真的完成部署了，为了避免后续代码报错，需要在这里等待一下合约部署成功
        await fundMe.waitForDeployment();
        // 获取fundme合约的owner，并断言owner是否等于firstAccount.address，来判断fundme合约的构造函数是否被成功执行，进而判断fundme合约是否成功部署
        // 注意这里要取firstAccount的address，而不是firstAccount，因为firstAccount是一个Signer类型的对象，需要取对象的address属性
        // 这里获取fundMe.owner()的值时，需要用await来等待，因为区块链有延迟。fundMe.owner()是一个异步函数（solidity自动给owner属性加的getter函数，默认都是异步的）
        assert.equal((await fundMe.owner()), firstAccount);
    });

})