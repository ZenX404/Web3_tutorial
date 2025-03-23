const { task } = require("hardhat/config");

task("interact-fundme", "Interact with the FundMe contract")
    // 这个task需要得到fundme合约对象，所以这里需要传入fundme合约的地址
    // addParam()函数用于设置task的参数，第一个参数是参数的名称，第二个参数是参数的描述，后面就可以通过taskArgs.addr来获取这个参数
    .addParam("addr", "The address of the FundMe contract")
    .setAction(async (taskArgs, hre) => {
        // 首先创建fundme合约工厂
        const fundMeFactory = await ethers.getContractFactory("FundMe");
        // 然后使用工厂创建fundme合约对象。注意这里并不需要通过fundMeFactory来部署合约了，因为执行这个task的时候，fundme合约已经部署好了
        // 这里我们只需要根据合约所在的地址来创建fundMe合约对象即可。使用工厂的attach()函数来创建fundme合约对象，传入的参数是fundme合约的地址
        const fundMe = fundMeFactory.attach(taskArgs.addr);

        // init 2 accounts 初始化两个账户
        // 这里初始化两个账号，是要初始化一个数组，js中初始化数组就像下面这样写在[]中。const表示常量
        // ethers.getSigners()用于获取hardhat.config.js中accounts数组中私钥对应的两个账号，这是ethers.js包中提供的函数
        // 在区块链开发中，调用相应的函数前面到要加上await，因为区块链有延迟
        const [firstAccount, secondAccount] = await ethers.getSigners();

        // fund contract with first account  用第一个账号给合约打款
        // 默认使用hardhat.config.js中accounts数组中的第一个账号，所以这里不用connect指定用哪个账号
        // 这里fundMe.fund()函数是智能合约中的一个函数，需要传入一个对象（js中对象类型的入参需要用{}包裹），对象中需要指定value属性，value属性需要传入一个以太坊的金额（value和金额之间用:分隔），这里我们传入0.1个以太坊
        // 这里需要使用ethers.parseEther()函数来将0.1转换为以太坊的金额，因为以太坊中没有小数，所以需要用parseEther()函数来转换
        // 因为调用fund()函数后，虽然使用了await，但是这仅仅是等待fund()函数交易请求发送成功，并不意味着交易已经完成
        // 所以这里需要使用fundTx.wait()函数来等待交易完成
        const fundTx = await fundMe.fund({ value: ethers.parseEther("0.001") });
        await fundTx.wait();

        // check balance of contract  打完款之后，我们就可以查看一下合约的余额是多少
        // 查看合约地址的余额，需要使用ethers.provider.getBalance()函数，这个函数需要传入一个合约地址，然后返回一个以太坊的金额
        const contractBalance = await ethers.provider.getBalance(fundMe.target);
        console.log(`Contract balance: ${contractBalance}`);

        // fund contract with second account 使用第二个账号打款
        // 使用connect()函数来连接第二个账号，然后调用fund()函数
        const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({ value: ethers.parseEther("0.001") });
        await fundTxWithSecondAccount.wait();

        // check balance of contract  再次检查合约余额
        const contractBalanceAfterSecondAccount = await ethers.provider.getBalance(fundMe.target);
        console.log(`Contract balance: ${contractBalanceAfterSecondAccount}`);

        // check mapping fundersToAmount 查看第一个账号和第二个账号在合约的mapping中记录的金额
        // solidity中，会默认给合约的成员变量添加一个getter函数，所以这里可以直接通过fundMe.fundersToAmount(firstAccount.address)来获取第一个账号在合约的fundersToAmount这个mapping中记录的金额
        // 传入的是第一个账号的地址
        const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address);
        console.log(`First account balance: ${firstAccountBalanceInFundMe}`);
        const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address);
        console.log(`Second account balance: ${secondAccountBalanceInFundMe}`);
    })

/**
 * module.exports：
 *      在 Node.js 中，module.exports 是用于导出模块内容的对象。它决定了当其他文件使用 require 导入该模块时，实际得到的内容。
 * {}（空对象）：
 *      这里将 module.exports 设置为一个空对象 {}，意味着这个模块没有导出任何内容。
 *      当其他文件使用 require('./deploy-fundme') 导入这个模块时，得到的将是一个空对象。
 * 
 * 
 * 在 Hardhat 中，任务的注册是通过 task 函数实现的，而不是通过 module.exports。
 * 因此，只要在 hardhat.config.js 中引入包含任务定义的文件，任务就会被自动注册并可用。
 * 您可以通过 npx hardhat <task-name> 来执行这些任务。
 * 
 * 所以，这里写一个空白的到处只是为了在index.js中引入这个文件时，不会报错
 * 然后就可以直接通过index.js引入到hardhat.config.js中，这样就可以使用这个task了
 */
module.exports = {};
