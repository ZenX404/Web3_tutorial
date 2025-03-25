// 1、import ethers
// 2、create main function
// 3、execute main function 


/**
 * 完成这个合约部署代码并执行后，我们可能会有些疑问
 * 为什么我们并没有输入私钥，也没有调用MetaMask，怎么也能成功部署合约，并且还返回了一个合约地址呢？
 * 这是因为使用hardhat框架时（引入hardhat包），在部署合约的时候hardhat会自动帮我们生成一个临时的本地网络（当项目终止后，本地网络就会销毁）
 * 我们的合约就会部署到本地网络中，并生成一个本地测试地址。（这个和remix本地部署的功能是一样的）
 */

/**
 * 在JavaScript中，const是一个用于声明常量的关键字。
 * 常量是指在声明后不能被重新赋值的变量。
 * 也就是说，一旦你使用const声明了一个变量并赋值后，你就不能再给这个变量赋予新的值
 */
// 在js语法中，如果要引入一个包，就需要定义一个常量
// 下面这个代码的意思是引入hardhat包中的ethers依赖（hardhat中有很多依赖包，我们只需要引入ethers依赖即可）
// 引入之后，我们就可以在下面使用ethers这个对象了
const { ethers } = require("hardhat");


// 通过合约工厂来部署FundMe合约
// 用async修饰，表示这个函数是一个异步函数
// 只有异步函数才能使用await关键字
async function main() {
    // create factory  创建合约工厂
    // 通过ethers.js这个依赖，来创建FundMe合约工厂。传入的就是我们自己写的FundMe.sol合约的名称
    // 而且这里要注意所有需要创建变量的地方，都需要使用await关键字，
    // 因为ethers.getContractFactory是一个异步函数，创建合约工厂可能需要比较长的时间，
    // 如果不使用await关键字，有可能前面合约工厂还没有创建完成，就开始执行后面的代码，然后是用未完成创建的合约工厂变量就会报错
    /**
     * await 关键字用于等待一个异步操作完成，才会继续向后执行
     */
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
     * 合约部署之后，字节码被etherscan收录可能会有延迟
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
        // 等待5个区块  避免eth浏览器未将刚刚部署的合约录入，导致api报错
        // fundMe.deploymentTransaction(): 获取合约部署的交易
        await fundMe.deploymentTransaction().wait(5);
        verifyFundMe(fundMe.target, [180]);
    } else {
        console.log("verification skipping ...");
    }


    /**
     * 部署并验证完合约后，我们就可以通过ethers.js来调用智能合约中的函数了（用js来调用solidity）
     */

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
    const fundTx = await fundMe.fund({value: ethers.parseEther("0.001")});
    await fundTx.wait();

    // check balance of contract  打完款之后，我们就可以查看一下合约的余额是多少
    // 查看合约地址的余额，需要使用ethers.provider.getBalance()函数，这个函数需要传入一个合约地址，然后返回一个以太坊的金额
    const contractBalance = await ethers.provider.getBalance(fundMe.target);
    console.log(`Contract balance: ${contractBalance}`);

    // fund contract with second account 使用第二个账号打款
    // 使用connect()函数来连接第二个账号，然后调用fund()函数
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.001")});
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
}

// 验证合约
async function verifyFundMe(fundmeAddr, args) {
    // 除了使用命令行来验证合约，hardhat还支持通过js来验证合约
    // hre变量就是headhat的运行时环境，通过这个可以实现在js中调用命令行里的命令，进而实现验证合约的效果
    await hre.run("verify:verify", {
        address: fundmeAddr, // 要验证的合约地址
        constructorArguments: args // 要验证的合约的构造函数入参，注意这里要传入一个数组
      });
}

// 执行合约部署函数 
/**
 * js中函数可以作为一个变量，如果我们这里只写main，表示的是main函数这个对象本身
 * 但是当我们想执行这个函数的时候，就可以写main()，表示执行main函数
 */
// 执行main函数，并且catch一下异常
// js语法中函数对象可以作为参数传递给另一个函数
// js语法中，() => {}表示的一个函数，前面的()中是函数的入参，后面的{}中是函数体
// 所以相当于向catch()函数中再传入一个函数作为入参
// 这里传入catch的函数的入参是error，然后在该入参函数中去输出错误信息
main().catch((error) => {
    // 打印错误信息
    console.error(error);
    // 正常退出使用0
    // 非正常退出使用1
    process.exit(1);
});
