require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

/** @type import("hardhat/config").HardhatUserConfig */
module.exports = {
  solidity: "0.8.23",
  paths: {
    sources: "contracts",
    tests: "hardhat-tests",
    cache: "hardhat-cache",
    artifacts: "hardhat-artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
  },
};
