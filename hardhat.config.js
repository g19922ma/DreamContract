require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */

// vars.get()で、セットした環境変数を取得できる
const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");
const ACCOUNT_PRIVATE_KEY = vars.get("ACCOUNT_PRIVATE_KEY");


module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [ACCOUNT_PRIVATE_KEY],
      gasPrice: 25000000000,  // 25 GWEI
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://api-amoy.polygonscan.com",
        },
      },
    ],
  },
};

