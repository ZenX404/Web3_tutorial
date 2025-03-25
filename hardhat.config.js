// 这个文件夹用于配置hardhat，比如合约要部署到哪个网络上
// 在这个文件中配置的变量，属于项目全局变量，在项目的任何地方都可以使用，不需要在其他位置引入该配置文件，直接就能使用

// 使用npm安装完依赖后，如果想在hardhat项目中使用，就需要在这个配置文件中require引入该依赖

// 引入hardhat的工具箱，这样就可以使用hardhat的工具箱中的工具
require("@nomicfoundation/hardhat-toolbox"); 
// 引入dotenv依赖，这样就可以读取.env配置文件中设置的常量
// require("dotenv").config();
// 我们使用env-enc依赖加密敏感信息，读取配置文件中的常量就不需要dotenv这个依赖了，直接用env-enc依赖即可
// env-enc加密后的信息存储在了.env-enc文件中
require("@chainlink/env-enc").config();
// 引入我们自己编写的task，这样才可以在hardhat中使用我们自己编写的task
// require("./tasks/deploy-fundme");
// require("./tasks/interact-fundme");
// 因为我们写了index.js文件，所以这里只需要引入./task即可，因为他会默认自动找./task目录下名为index.js的文件
// 因为我们在index.js编写了模块化导出，所以就不需要我们把每一个task文件都引入进来了
require("./tasks");
require("hardhat-deploy");

// 引入.env中的常量
const SEPOLIA_URL = process.env.SEPOLIA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // hardhat默认网络就是hardhat本地网络，就是我们部署在本地时hardhat会构建的网络
  // defaultNetwork: hardhat   
  solidity: "0.8.28",
  // 手动设置合约要部署到的网络及地址
  networks: {
    // 我们可以找一些网络提供商来获取一些测试网络的地址，比如Alchemy, Infura, QuicNode等，有一些免费的水龙头也可以获取测试网络地址
    // 添加以太坊的sepolia测试网络，这样我们就剋有通过hardhat将合约部署到sepolia测试网络上
    sepolia: {
      // url是通过提供商Infura给的sepolia测试网络url，可以让我们访问到sepolia测试网络上，后缀拼上了Infura给的token
      url: SEPOLIA_URL,
      // accounts用来设置要发送合约部署请求的地址所对应的私钥。数组中写的是地址对应的私钥，这个信息很敏感，不能公布出去！
      // 注意，下面设置的私钥对应的地址并不是合约最终要部署到的地址，而是用来发送合约部署请求的地址
      // 合约最终要部署到的地址是另外全新的地址，会往区块点中最新的区块上追加数据块来部署合约
      accounts: [PRIVATE_KEY, PRIVATE_KEY_1],
      chainId: 11155111 // 添加chainId，这个是一条区块链的唯一标识，sepolia测试网络的chainId是11155111
    }
  },
  // 这个是hardhat-verify通过js或者命令来调用etherscan实现验证合约时，需要设置etherscan的api token
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  },
  /**
   * 这是 Hardhat 的一个配置选项，通常与 hardhat-deploy 插件一起使用。
   * 它允许您为账户分配易于识别的名称，以便在部署脚本中更方便地引用。
   * 
   * 通过这种方式，您可以在部署脚本中使用 firstAccount 和 secondAccount 来引用具体的账户，
   * 而不需要直接使用账户地址或索引。这使得代码更具可读性和可维护性。
   */
  namedAccounts: {
    // firstAccount和secondAccount是为账户分配易于识别的名称，以便在部署脚本中更方便地引用。
    // 分别对应于上面配置项accounts数组中的第一个和第二个账户。
    firstAccount: {
      // default: 0 和 default: 1 指定了在默认网络配置中，firstAccount 和 secondAccount 分别对应于 accounts 数组中的第 0 和第 1 个账户。 
      default: 0
    },
    secondAccount: {
      default: 1
    },
  }
};
