// 编写对fundme合约的测试代码
// hardhat-toolbox：这个是hardhat框架提供的工具箱，用于开发智能合约的。其中已经包含了js测试框架mocha和chai了，所以不需要再单独安装了（正常使用依赖的流程是先通过npm安装依赖，然后在代码中require引入依赖）
// 这里我们直接引入chai依赖即可。


/**
 * 单元测试在开发的时候是必备的，因为一个代码可能会有很多人参与开发，会进行修改
 * 每一个功能点都配套有对应的单元测试，这样就可以让后续功能修改者在修改代码后，来测试自己修改后的功能是否正常
 * 所以开发项目，每个功能配套单元测试用例是必须的。可以让AI帮忙写测试用例
 */

// 引入依赖，这样在后面的代码中就可以使用ethers和assert对象
const {ethers} = require("hardhat");
// assert对象是chai库提供的，所以要引入chai依赖
const {assert, expect} = require("chai");
// helpers对象是hardhat-network-helpers插件提供的，用于测试中模拟各种场景，比如可以模拟本地测试网络环境中的时间流逝
const helpers = require("@nomicfoundation/hardhat-network-helpers")

const {devlopmentChains} = require("../../helper-hardhat-config")
// 判断当前网络是否是本地测试网络，如果不是本地测试网络，则跳过单元测试
!devlopmentChains.includes(network.name)
? describe.skip
:
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
    let fundMeSecondAccount;
    let firstAccount;
    let mockV3Aggregator
    // 在每个it测试用例执行之前，都会执行beforeEach函数，这样就可以实现逻辑复用
    // beforeEach中完成了合约的部署以及合约对象的获取，实现测试用例中的复用
    beforeEach(async function() {
        // 在test中，我们可以通过deployments.fixture()来调用我们写的部署脚本（使用hardhat-deploy插件），这样就可以实现测试用例中的复用
        // 使用hardhat-deploy插件的fixture函数，来部署合约   执行all标签组中的所有部署脚本
        await deployments.fixture(["all"]);
        // 获取在hardhat.config.js中定义的名为firstAccount的账户地址  注意这里直接获取的地址
        firstAccount = (await getNamedAccounts()).firstAccount;
        secondAccount = (await getNamedAccounts()).secondAccount;
        // 获取当前已经部署的fundme合约部署对象（fundMeDeployment）。只要是通过hardhat-deploy插件部署的合约，都会被记录在deployments对象中，
        // 这样，后续我们就可以通过合约名称来获取已经部署的合约，这样就不用每个测试用例都重复部署了
        const fundMeDeployment = await deployments.get("FundMe");
        // 动态获取mock合约在本地的部署地址，因为每次重新部署mock合约，部署的地址都会变
        mockV3Aggregator = await deployments.get("MockV3Aggregator");
        // 通过合约部署对象的address属性，获取已经部署的fundme合约的地址
        // 进而，通过ethers.getContractAt函数，通过链上地址获取已部署在区块链上的fundme合约对象，进而可以调用合约的函数
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
        // ethers.getContract()函数的作用是获取FundMe合约对象，通过这个对象调用合约函数时，使用的是secondAccount这个地址
        // fundMeSecondAccount是FundMe合约对象
        // ethers.getContract这个函数只有安装引入hardhat-deploy-ethers包之后，才能使用
        fundMeSecondAccount = await ethers.getContract("FundMe", secondAccount);

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



    // 我们要测试比较重要的函数，判断标准就是看这个函数有没有涉及到资产的转移
    // 所以我们要测试FundMe合约中的 fund、getFund、refund函数，这三个函数都设计到资产变动

    // 测试fund函数
    // unit test for fund function  对fund函数进行单元测试
    // window open, value greater then minimum value, funder balance

    // fund函数测试用例1：窗口关闭，转账金额大于最小值，这种情况下众筹投资应该失败
    it("window close, value grater than minimum, fund fail", 
        async function() {
            // make sure the window is closed   确保窗口已经关闭
            // 使用helpers对象的time.increase函数，给本地测试网络时间戳增加200秒，模拟时间流逝
            await helpers.time.increase(200); // 合约中设置的窗口时间是180，所以设置200，窗口肯定就关闭了
            // 使用helpers对象的mine函数，模拟挖矿，使得上面增加时间戳的效果生效
            await helpers.mine();
            // value is greater minimum value
            // 使用expect函数，断言fund函数在给定参数下会reverted，即会失败。expect是chai测试库提供的，需要在最上面声明引入
            // expect()函数的作用是判断函数执行时候达到了期望的结果
            // 这里我们调用fund函数，给0.1个ETH，这肯定是大于最小众筹金额了(solidity没有小数，所以通过ethers.parseEther()将字符串转换未wei)
            // 然后在revertedWith()中期望程序会报"window is closed"，这个是我们在合约中写的如果窗口关闭，就报这个错误
            // 只要是fund函数返回"window is closed"，那么就表明我们的测试用例通过了
            // 此时我们已经设定了窗口已经关闭了，所以如果fund()函数功能正常，这个测试用例就应该通过
            await expect(fundMe.fund({value: ethers.parseEther("0.1")}))
                .to.be.revertedWith("window is close");
    });
    
    // fund函数测试用例2：窗口打开，转账金额小于最小值，这种情况下众筹投资应该失败
    it("window open, value is less than minimum, fund failed", 
        async function() {
            // 使用expect函数，必须使用await，否则任何情况下都会显示通过
            await expect(fundMe.fund({value: ethers.parseEther("0.00001")}))
                .to.be.revertedWith("Send more ETH")
        }
    );

    // fund函数测试用例3：窗口打开，转账金额大于最小值，这种情况下众筹投资应该成功
    it("Window open, value is greater minimum, fund success", 
        async function() {
            // greater than minimum
            await fundMe.fund({value: ethers.parseEther("0.1")})
            // 获取合约存储众筹收款地址余额的mapping，然后获取投资人地址对应的余额
            // 这里我们使用的是firstAccount调用的fundme合约，所以这里获取的余额就是firstAccount的余额
            const balance = await fundMe.fundersToAmount(firstAccount)
            // 断言众筹收款地址的余额是否等于0.1个ETH，如果等于0.1个ETH，就表明fund函数调用成功了
            await expect(balance).to.equal(ethers.parseEther("0.1"))
        }
    );   

    // unit test for getFund
    // onlyOwner, windowClose, target reached
    // getfund函数测试用例1：窗口关闭，众筹目标达到，getFund函数应该失败
    it("not onwer, window closed, target reached, getFund failed", 
        async function() {
            // make sure the target is reached   保证已经达到众筹目标金额
            await fundMe.fund({value: ethers.parseEther("1")});

            // make sure the window is closed
            await helpers.time.increase(200);
            await helpers.mine();
            
            // 使用fundMeSecondAccount对象调用fund函数时，使用的是非合约所有者的地址（合约所有者的地址是firstAccount）
            await expect(fundMeSecondAccount.getFund())
                .to.be.revertedWith("this function can only be called by owner");
        }
    );

    // getfund函数测试用例2：窗口仍然开启，众筹目标达到，getFund函数应该失败
    it("window open, target reached, getFund failed", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("1")})
            await expect(fundMe.getFund())
                .to.be.revertedWith("window is not close")
        }
    );

    // getfund函数测试用例3：窗口关闭，众筹目标未达到，getFund函数应该失败
    it("window closed, target not reached, getFund failed",
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.1")})
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()            
            await expect(fundMe.getFund())
                .to.be.revertedWith("Target is not reached")
        }
    );

    // getfund函数测试用例4：窗口关闭，众筹目标达到，getFund函数应该成功
    it("window closed, target reached, getFund success", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("1")});
            // make sure the window is closed
            await helpers.time.increase(200);
            await helpers.mine();   
            // 断言getFund函数会触发FundWithdrawByOwner事件，并且事件的入参是1个ETH
            await expect(fundMe.getFund())
                .to.emit(fundMe, "FundWithdrawByOwner") // 预期会有一个名为FundWithdrawByOwner事件
                .withArgs(ethers.parseEther("1")) // 预期事件的入参是1个ETH
        }
    );

    // unit test for refund
    // windowClosed, target not reached, funder has balance

    // refund函数测试用例1：窗口开启，众筹目标未达到，投资人有余额，refund函数应该失败
    it("window open, target not reached, funder has balance", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.1")})
            await expect(fundMe.refund())
                .to.be.revertedWith("window is not close");
        }
    );

    // refund函数测试用例2：窗口关闭，众筹目标达到，投资人有余额，refund函数应该失败
    it("window closed, target reach, funder has balance", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("1")})
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()  
            await expect(fundMe.refund())
                .to.be.revertedWith("Target is reached");
        }
    );


    // refund函数测试用例3：窗口关闭，众筹目标未达到，投资人没有余额，refund函数应该失败
    it("window closed, target not reach, funder does not has balance", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.1")})
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()  
            await expect(fundMeSecondAccount.refund())
                .to.be.revertedWith("there is no fund for you");
        }
    );

    // refund函数测试用例4：窗口关闭，众筹目标未达到，投资人有余额，refund函数应该成功
    it("window closed, target not reached, funder has balance", 
        async function() {
            // 使用fundMe对象调用fund函数，默认采用的是firstAccount地址，因为创建fundme对象的时候默认就是规定后续通过该对象调用函数都采用firstAccount地址
            await fundMe.fund({value: ethers.parseEther("0.1")})
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()  
            await expect(fundMe.refund())
                .to.emit(fundMe, "RefundByFunder") // 预期会有一个名为RefundByFunder事件
                .withArgs(firstAccount, ethers.parseEther("0.1")) // 预期事件的入参是firstAccount和0.1个ETH
        }
    );
})