// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 引入chainlink的预言机合约，用于获取链下汇率数据
// 如果引入预言机合约，就不能在本地部署测试了，需要把部署到测试网络中，才能够使用预言机
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// 众筹合约要实现哪些功能？
// 1. 创建一个收款函数
// 2. 记录投资人并且查看
// 3. 在锁定期内，达到目标值，生产商可以提款
// 4. 在锁定期内，没有达到目标值，投资人在锁定期以后退款

contract FundMe {

    mapping(address => uint256) public fundersToAmount;

    // 引入AggregatorV3Interface预言机合约对象。在solidity中，一个合约就可以作为一个类型
    // 用internal修饰，表明只有当前合约内部的函数才能调用这个变量
    AggregatorV3Interface internal dataFeed;

    // 设置最小投资金额，solidity中10**18表示10的18次方，1*10^18 wei = 1 ETH
    uint256 constant MINIMUM_VALUE = 1 * 10 ** 18;  // 设置为最少投资1usd

    // 设置众筹合约的目标值
    // constant修饰后就会变成常量，该值就无法被修改了。常量一般用大写字母命名
    uint256 constant TARGET = 1000 * 10 ** 18;

    // 合约所有者
    address public owner;

    // 合约部署时间戳
    uint256 deploymentTimestamp;
    // 锁定期时长
    uint256 lockTime;

    address erc20Addr;

    // 标记生产商是否已经完成提款
    bool public getFundSuccess = false;

    // 生产商提款事件  当合约所有者调用getFund函数时，会触发该事件
    // event是solidity中定义事件的语法，达成某个条件就可以发出该事件，有点类似于日志
    // 入参是提款金额
    event FundWithdrawByOwner(uint256 amount);
    // 投资人退款事件  当投资人调用refund函数时，会触发该事件
    // 入参是投资人地址和退款金额
    event RefundByFunder(address funder, uint256 amount);

    // 智能合约的构造函数
    // 第一个参数是锁定期时长，第二个参数是预言机合约地址
    // 如果我们部署到sepolia测试网络，那么这里就直接传入真实的chainlink预言机提供的sepolia合约地址
    // 如果我们是自己本地部署测试，就传入我们在本地部署的mock合约地址
    constructor(uint256 _lockTime, address dateFeedAddr) {
        // 在构造函数中初始化喂价对象
        // 我们这里采用sepolia testnet（sepolia测试网络），所以在初始化的时候要传入chainlink中提供的sepolia测试网络地址（在sepolia测试网络中部署的预言机地址），这样才能调用到部署在测试网络上的预言机
        // 我们要把合约部署到什么网络上，下面这个初始化就要传入对应网络的预言机部署地址
        dataFeed = AggregatorV3Interface(dateFeedAddr);

        // 在合约部署的时候会调用构造函数，然后就可以初始化合约所有者为当时部署合约的地址
        owner = msg.sender;

        // msg系统变量表示的是当前这次交易
        // block系统变量表示的是当前的区块
        // block.timestamp表示当前区块的时间戳是多少
        // 记录合约部署的时间
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }


    // 收款函数
    // external可以被外部调用，但是不能在合约内部被调用
    // 如果该函数想要收取原生通证，比如如果我们在以太坊上部署智能合约，以太坊的原生通证就是ETH以太币，那么我们想要收取以太币的话就需要在该函数上加上payable关键字
    function fund() external payable {
        
        // require(condition, "") 当condition是false时，就会回退本次交易（revert），并提出相应的错误信息
        // 只有当condition是true时，才会成功执行本次交易
        require(convertEthToUsd(msg.value) >= MINIMUM_VALUE, "Send more ETH");
        // 获取当前发起这次交易的区块的时间戳，确保当前时间还在锁定期内
        require(block.timestamp < deploymentTimestamp + lockTime, "window is close");

        // 记录下投资人的地址以及他投资了多少金额
        fundersToAmount[msg.sender] = msg.value;
    }


    // 该函数返回 1ETH等于多少USD的价格
    // 该函数是AggregatorV3Interface预言机合约提供的
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    // 入参单位是wei，转换未usd
    function convertEthToUsd(uint256 ethAmount) internal view returns (uint256) {
        // 获取1ETH能兑换多少usd
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        // 将eth换算为usd
        // (ETH amount) * (ETH price) = (ETH value)
        // 我们传入的ethAmount单位是wei，但是预言机返回的换算并不是按照wei换算的，所以相乘的结果还要除以10^8
        return ethAmount * ethPrice / (10 ** 8);

    }

    // 转移合约所有权
    function transferOwnership(address newOwner) public onlyOwner {
        // 只能是合约所有者才能去转移合约所有权
        owner = newOwner;
    }

    // 在锁定期内，达到目标值，生产商可以提款
    // external修饰表明是一个外部函数，可以被外部调用
    // onlyOwner修改器修饰， 只有合约所有者才能提款
    function getFund() external windowClose onlyOwner {
        // this表示当前合约，address(this)能获取到当前合约的地址，进而就能获取到当前合约已经收取了多少钱
        require(convertEthToUsd(address(this).balance) /*balance的单位是wei*/ >= TARGET, "Target is not reached");

        // solidity中转账操作提供了三个函数，transfer、send和call，其中前两个就是单纯的转账，
        // 第三个call是在实现转行的同时，还能调用指定的函数，来提供更多额外的操作，只要是专场场景都可以用call实现，所以solidity官方推荐用call。当然可能一些老的项目里还会用transfer和send。
        // 1、transfer: transfer ETH and revert if tx failed   如果交易失败，就会回滚本次交易，付款方和收款方的余额都不会有变化
        // 将合约地址上的余额转移到msg.sender，注意这里因为涉及到转账，所以需要把msg.sender转换成payable
        // payable(msg.sender).transfer(address(this).balance);

        // 2、send: transfer ETH and return false if failed
        // send与transfer的区别就是send会返回一个bool变量，表示该交易是否成功
        // bool success = payable(msg.sender).send(address(this).balance);
        // require(success, "tx failed");

        // 3、call: transfer ETH with data return value of function and bool   它在转账的同时，还可以去调用一些payable函数
        bool success;
        // 记录提款总金额
        /**
         * payable(msg.sender)：将调用合约函数的地址（msg.sender）转换为payable类型，以便可以接收以太币。
            .call{value: balance}("")：使用call方法向msg.sender发送以太币。
            value: balance：指定要发送的以太币数量，这里是合约的全部余额。
            ("")：表示不调用任何函数，只进行转账操作。
            success：call方法返回一个布尔值，表示转账是否成功。
         */
        uint256 balance = address(this).balance;
        // 将当前合约（因为call函数是被当前智能合约执行的）中的自己转给msg.sender这个地址
        (success, ) = payable(msg.sender).call{value: balance}(""); // 这里我们并没有调用额外的函数，所以只会返回交易是否成功的bool类型变量
        require(success, "transfer tx failed");
        
        // 转移所有钱之后，需要把fundersToAmount数组中所有用户的值都清零

        // 标记生产商已经完成提款
        getFundSuccess = true;

        // 触发生产商提款事件
        // emit event
        // emit关键字用于发送事件
        emit FundWithdrawByOwner(balance);
    }

    // 在锁定期内，没有达到目标值，投资人在锁定期以后退款
    // 应用windowClose修改器
    function refund() external windowClose {
        require(convertEthToUsd(address(this).balance) < TARGET, "Target is reached");
        // 检查一下当前调用合约的这个人之前是否有过众筹投款记录
        require(fundersToAmount[msg.sender] != 0, "there is no fund for you");

        bool success;
        uint256 balance = fundersToAmount[msg.sender];
        // 把当时该用户投的钱退款
        (success, ) = payable(msg.sender).call{value: balance}(""); // 这里我们并没有调用额外的函数，所以只会返回交易是否成功的bool类型变量
        require(success, "transfer tx failed");
        // 清空该用户的fund金额，防止重复退款bug
        fundersToAmount[msg.sender] = 0;

        // 触发退款事件
        emit RefundByFunder(msg.sender, balance);
    }

    // 修改用户投资余额
    function setFunderToAmount(address funder, uint256 amountToUpdate) external {
        // 只有外部erc20合约地址才能调用该函数来修改用户投资余额
        require(msg.sender == erc20Addr, "you do not have permission to call this funtion");
        fundersToAmount[funder] = amountToUpdate;
    }

    // 设置外部erc20合约地址
    // 只有当前合约拥有者才能调用该函数
    function setErc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }

    // 定义一个修改器
    // 这里使用修改器来简化代码
    // 有点类似于spring中的AOP切面
    modifier windowClose() {
        // 时间锁
        require(block.timestamp >= deploymentTimestamp + lockTime, "window is not close");
        // 表示应用该修改器的函数的逻辑。这样写相当于在应用该修改器最开始执行上面的require，然后再去执行自己的代码
        _;
    }

    // 定义一个修改器
    modifier onlyOwner() {
        require(msg.sender == owner, "this function can only be called by owner");
        // 表示应用该修改器的函数的逻辑。这样写相当于在应用该修改器最开始执行上面的require，然后再去执行自己的代码
        _;
    }
}