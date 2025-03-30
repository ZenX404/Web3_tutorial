// 编写对fundme合约的集成测试代码


/**
 * 单元测试一般是在本地测试，但是本地测试并不能100%还原项目生产环境
 * 比如本地测试时我们使用预言机喂价引入的是mock合约，但是真正生产合约是直接用的chainlink部署到主网上的合约，mock合约只是一个模拟的合约，并没有实现正确的功能
 * 所以要想最大程度还原，我们需要部署到sepolia测试网上，引用chainlink在测试网上的预言机合约，这样才能是模拟和生产环境一样的情况
 * 所以这就需要我们进行集成测试，集成测试是要把合约部署到测试网上，然后进行测试
 */

// 引入依赖，这样在后面的代码中就可以使用ethers和assert对象
const {ethers} = require("hardhat");
// assert对象是chai库提供的，所以要引入chai依赖
const {assert, expect} = require("chai");
// helpers对象是hardhat-network-helpers插件提供的，用于测试中模拟各种场景，比如可以模拟本地测试网络环境中的时间流逝
const helpers = require("@nomicfoundation/hardhat-network-helpers");
// 引入helper-hardhat-config配置文件，获取devlopmentChains配置
const {devlopmentChains} = require("../../helper-hardhat-config");

// 判断当前网络是否是本地测试网络，如果是本地测试网络，则跳过集成测试
devlopmentChains.includes(network.name)
? describe.skip
:

/**
 * 在集成测试中，我们只需要去写在单元测试里没有办法涵盖到的功能测试点。
 * 比如使用chainlink预言机，在单元测试中是无法真正进行测试的，就需要通过集成测试部署到测试网来进行测试
 * 像那种只有owner才能调用的函数，在单元测试中就可以进行测试，也就没必要再在集成测试中再测试一遍了
 */
describe("test fundme contract", async function() {
    // 为了让beforeEach中复制的合约对象可以在每一个it中使用，所以要把这复用的对象定义在外面，扩大它们的作用域
    let fundMe;
    let firstAccount;
    // 在每个it测试用例执行之前，都会执行beforeEach函数，这样就可以实现逻辑复用
    // beforeEach中完成了合约的部署以及合约对象的获取，实现测试用例中的复用
    beforeEach(async function() {
        await deployments.fixture(["all"]);
        firstAccount = (await getNamedAccounts()).firstAccount;
        const fundMeDeployment = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
    });

    // test fund and getFund successfully
    // fund和getFund两个函数都用到了预言机喂价，所以集成测试要来测试这两个函数，来测试在真实的预言机喂价下，合约是否能正常工作
    it("fund and getFund successfully", 
        async function() {
            // make sure target reached
            await fundMe.fund({value: ethers.parseEther("0.5")}) // 3000 * 0.5 = 1500
            // make sure window closed
            // 这里要让时间流逝超过180秒，来保证窗口关闭
            // 这里就和单元测试的写法不一样了，单元测试中是使用helpers对象的time.increase函数，来增加本地网络的时间戳
            // 但是这里我们是要部署到sepolia测试网中的，就不能随意更改时间戳了，就需要真正的在现实时间中的等待超过180秒才行
            // 所以下面的写法，是js中等待指定时长，再向后执行的写法
            // js中时间单位是毫秒，所以要用再乘以1000，才是秒
            /**
             * 这段代码是一个 JavaScript 中常见的用于创建延迟的方式，特别是在异步操作中。
             * 代码解释:
             *  new Promise：
             *      这是 JavaScript 中创建一个新的 Promise 对象的语法。Promise 是用于处理异步操作的对象。
             *  resolve => setTimeout(resolve, 181 * 1000)：
             *      这是一个箭头函数，作为 Promise 的执行函数，这个匿名函数作为入参传入到Promise构造函数中。
             *  setTimeout 是 JavaScript 中的一个函数，用于在指定的毫秒数后执行一个函数。
             *  resolve 是 Promise 的一个函数参数，用于将 Promise 的状态从“未完成”变为“已完成”。
             *  181 * 1000：表示 181 秒（因为 setTimeout 的时间参数是以毫秒为单位的）。
             *  await：
             *      await 是一个关键字，用于等待一个 Promise 完成。在 await 之后的代码将暂停执行，直到 Promise 完成。
             *      这里 await 使得代码在 181 秒的延迟完成之前不会继续执行。
             * 
             *  这是匿名函数的另外一种写法：
             *      =>右边的setTimeout(resolve, 181 * 1000)是该匿名函数的函数体   
             *      =>左边的resolve是该匿名函数的入参，相当于表明要把resolve作为参数传入到setTimeout函数中
             */
            await new Promise(resolve => setTimeout(resolve, 181 * 1000));
            // make sure we can get receipt 
            // 之前讲过在真正的区块链网络中执行时有延迟的，使用await只能保证等待发送调用函数命令成功后，再向后执行，但是并不一定能保证函数在链上真正执行成功后才向后执行
            // 这就导致有可能向后执行时函数其实并没有被执行完成，导致后续的代码报错。这一点和前面使用单元测试是在本地网络测试的情况不同，因为本地网络基本没有延迟，所以发送了调用函数请求一般就会马上被执行成功，并不会出现上述情况。
            // 所以这里需要使用txReceipt对象来保证函数在链上真正执行成功后，再向后执行
            // 通过fundMe调用函数，并且获取该函数在链上的交易回执
            const getFundTx = await fundMe.getFund()
            // 保证函数在链上真正执行成功后，再向后执行。同时获取函数调用后的结果信息getFundReceipt
            const getFundReceipt = await getFundTx.wait()
            // 将getFundReceipt对象中的事件信息emitEvents进行解构，来断言是否达到预期
            expect(getFundReceipt)
                .to.be.emit(fundMe, "FundWithdrawByOwner") // 断言该交易回执对象是否触发了fundMe合约的FundWithdrawByOwner事件
                .withArgs(ethers.parseEther("0.5")) // 断言该交易回执对象是否触发了fundMe合约的FundWithdrawByOwner事件，并且该事件的参数是否为ethers.parseEther("0.5")
        }
    );


    // test fund and refund successfully
    it("fund and refund successfully",
        async function() {
            // make sure target not reached
            await fundMe.fund({value: ethers.parseEther("0.1")}) // 3000 * 0.1 = 300
            // make sure window closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000))
            // make sure we can get receipt 
            const refundTx = await fundMe.refund()
            const refundReceipt = await refundTx.wait()
            expect(refundReceipt)
                .to.be.emit(fundMe, "RefundByFunder")
                .withArgs(firstAccount, ethers.parseEther("0.1"))
        }
    );

    
})