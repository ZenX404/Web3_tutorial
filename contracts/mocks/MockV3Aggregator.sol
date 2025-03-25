// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 使用chainlink的mock合约
// mock合约用于在本地测试环境中模拟链上合约的行为（这个合约仅仅是保证本地测测试是代码能正常运行，但并不保证返回数据的准确性）
// 因为有一些我们需要引入的链上合约比如一些预言机，这些都是部署在链上的，我们在本地部署的合约无法去调用这些合约
// 为了我们在本地部署测试的时候方便，我们可以使用mock合约来模拟这些链上合约的行为
// 通过在本地引入对应合约的mock合约，我们就可以在本地测试环境中使用mock合约来模拟链上合约的行为
import "@chainlink/contracts/src/v0.8/tests/MockV3Aggregator.sol";

// 在solidity引入了mock合约后，还需要使用hardhat框架在js中本地部署该mock合约，这样我们才能真正使用它