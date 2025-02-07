// scripts/listen.js
const { ethers } = require("hardhat");
const { vars } = require("hardhat/config");
const fs = require("fs");
const path = require("path");

async function main() {
  // Hardhat の vars.get を利用して、デプロイ済みコントラクトのアドレスを取得する
  const contractAddress = await vars.get("CONTRACT_ADDRESS_FOR_SNFT");
  if (!contractAddress) {
    throw new Error("Please set CONTRACT_ADDRESS_FOR_SNFT using 'npx hardhat set'.");
  }

  // 書き込み可能なトランザクションを送信するため、サインアーターを取得
  const [signer] = await ethers.getSigners();

  // artifacts から SpecialNFT の ABI を読み込む
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/SpecialNFT.sol/SpecialNFT.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // サインアーターを用いて、コントラクトのインスタンスを作成（状態変更可能なインスタンス）
  const contract = new ethers.Contract(contractAddress, abi, signer);

  // TimeElapsed イベントの監視（発火時にトークンIDなどを出力）
  contract.on("TimeElapsed", (tokenId, event) => {
    console.log("TimeElapsed event captured:");
    console.log(`Token ID: ${tokenId.toString()}`);
  });

  // 例として、トークンID 4 の triggerTimeElapsed を1分ごとに呼び出す
  const tokenIdToTrigger = 4;
  setInterval(async () => {
    console.log("Calling triggerTimeElapsed for token ID:", tokenIdToTrigger);
    try {
      const tx = await contract.triggerTimeElapsed(tokenIdToTrigger);
      console.log("Transaction sent. Waiting for confirmation...");
      await tx.wait();
      console.log("triggerTimeElapsed executed successfully for token ID:", tokenIdToTrigger);
    } catch (error) {
      // エラーの場合、たとえば条件未達の場合は revert するためエラーメッセージを出力
      console.error("Error calling triggerTimeElapsed:", error.message);
    }
  }, 60 * 1000); // 60秒ごとに実行

  console.log("Listening for events and calling triggerTimeElapsed every minute...");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
