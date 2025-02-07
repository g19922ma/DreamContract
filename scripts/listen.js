// scripts/listen.js
const { ethers } = require("hardhat");
const { vars } = require("hardhat/config");
const fs = require("fs");
const path = require("path");

async function main() {
  // Hardhat の vars.get を利用して、CONTRACT_ADDRESS_FOR_SNFT を取得する
  const contractAddress = await vars.get("CONTRACT_ADDRESS_FOR_SNFT");
  if (!contractAddress) {
    throw new Error("Please set CONTRACT_ADDRESS_FOR_SNFT using 'npx hardhat set'.");
  }

  // Hardhat のネットワーク設定により、ethers.provider が自動でセットされているので、それを利用
  const provider = ethers.provider;

  // artifacts から SpecialNFT の ABI を読み込む
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/SpecialNFT.sol/SpecialNFT.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // コントラクトインスタンスを生成
  const contract = new ethers.Contract(contractAddress, abi, provider);

  // TimeElapsed イベントの監視
  contract.on("TimeElapsed", (tokenId, event) => {
    console.log("Time Elapsed.");
    console.log(`Token ID: ${tokenId.toString()}`);
  });

  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId);
  console.log("Network Name:", network.name); // カスタムネットワークの場合は "unknown" かもしれません

  console.log("Listening for TimeElapsed events on network:", await provider.getNetwork());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
