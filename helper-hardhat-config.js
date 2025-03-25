// 这个文件用于配置一些hardhat项目中需要用到的常量参数

const DECIMAL = 8;
const INITIAL_ANSWER = 300000000000;
// 定义两个网络名称，只要是这两个网络名称，就使用本地mock合约
// hardhat是指的本地临时网络，就是只有部署运行的时候是存在的，运行结束后就销毁的网络
// local是指会在本地持续存在的网络，相当于我们部署了一条区块链网络在本地，不管我们是否部署或运行合约，它都会一致存在
const devlopmentChains = ["hardhat", "local"];
// fundme合约的锁定期时长
const LOCK_TIME = 180;
// 要等待的区块数
const CONFIRMATIONS = 5;

// 定义一个对象，用于存储不同网络的配置信息
// 这个对象的key是网络的chainId，value是该网络要引用的合约地址
const networkConfig = {
    // sepolia
    11155111: {
        // chainlink提供在sepolia网络上的eth转换usd预言机合约的地址
        ethUsdDataFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
    },
    // bsc testnet
    97: {
        ethUsdDataFeed: "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7"
    }
}

// 导出变量，这样在其他文件中就可以使用这些变量（前提要先引入这个文件）
// 在js语法中，这个写法是非常常见的，所有引入依赖后，能得到一个可以使用的工具对象，那个对象都会在引入的代码文件中有一个导出操作，只有导出了，外部才能使用
module.exports = {
    DECIMAL,
    INITIAL_ANSWER,
    devlopmentChains, // 要把这个常量导出，别的文件才能使用
    networkConfig,
    LOCK_TIME
}

