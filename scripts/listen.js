// scripts/listen.js

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  // 環境変数から Alchemy の API キーを取得
  const ALCHEMY_API_KEY = await vars.get("ALCHEMY_API_KEY");
  if (!ALCHEMY_API_KEY) {
    throw new Error("Please set ALCHEMY_API_KEY using 'npx hardhat set'.");
  }

  // Polygon Amoy 用の RPC URL を組み立てる
  const rpcUrl = `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  // 環境変数からデプロイ済みコントラクトのアドレスを取得
  const contractAddress = await vars.get("CONTRACT_ADDRESS");
  if (!contractAddress) {
    throw new Error("Please set CONTRACT_ADDRESS using 'npx hardhat set'.");
  }

  // artifacts から SpecialNFT の ABI を読み込む
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/SpecialNFT.sol/SpecialNFT.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // コントラクトインスタンスを作成
  const contract = new ethers.Contract(contractAddress, abi, provider);

  // TimeElapsed イベントの監視
  contract.on("TimeElapsed", (tokenId, event) => {
    console.log("Time Elapsed.");
    console.log(`Token ID: ${tokenId.toString()}`);
  });

  console.log("Listening for TimeElapsed events on Polygon Amoy network...");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
