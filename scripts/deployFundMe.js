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
const { ethers } = require("hardhat");


// 通过合约工厂来部署FundMe合约
// 用async修饰，表示这个函数是一个异步函数
// 只有异步函数才能使用await关键字
async function main() {
    // create factory  创建合约工厂
    // 通过ethers.js这个依赖，来创建FundMe合约工厂
    // 而且这里要注意所有需要创建变量的地方，都需要使用await关键字，
    // 因为ethers.getContractFactory是一个异步函数，创建合约工厂可能需要比较长的时间，
    // 如果不使用await关键字，有可能前面合约工厂还没有创建完成，就开始执行后面的代码，然后是用未完成创建的合约工厂变量就会报错
    /**
     * await 关键字用于等待一个异步操作完成，才会继续向后执行
     */
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    
    // deploy contract from factory  通过合约工厂来部署智能合约
    // deploy()函数只能保证把部署合约的命令发送给区块链，但是不能保证合约已经部署完成
    // deplay()函数的入参应该和FundMe.sol合约中构造函数的入参一致
    const fundMe = await fundMeFactory.deploy(10);
    // 所以需要await等待合约在区块链上部署完成，再继续向后执行
    await fundMe.waitForDeployment();

    // 打印合约地址
    console.log("FundMe deployed to:", await fundMe.target);
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
