// scripts/listen.js
const { ethers } = require("hardhat");
const axios = require("axios");
const { vars } = require("hardhat/config");
const fs = require("fs");
const path = require("path");
const aesCmac = require('node-aes-cmac').aesCmac;


async function main() {
  // webhookUrlの取得をmain関数の中に移動
  const webhookUrl = await vars.get("WEBHOOK_URL_WHEN_TIMEELASPLED");
  console.log("webhook url: " + webhookUrl);
  // if (!webhookUrl) {
  //     console.error("Usage: node script.js <webhook_url>");
  //     process.exit(1);
  // }

  // Hardhat の vars.get を利用して、デプロイ済みコントラクトのアドレスを取得
  const contractAddress = await vars.get("CONTRACT_ADDRESS_FOR_SNFT");
  if (!contractAddress) {
    throw new Error("Please set CONTRACT_ADDRESS_FOR_SNFT using 'npx hardhat set'.");
  }

  // Hardhat のプロバイダーを利用
  const provider = ethers.provider;

  // ネットワーク情報を取得して表示
  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId);
  console.log("Network Name:", network.name); // カスタムネットワークの場合は "unknown" かもしれません

  // トランザクション送信用にサインアーターを取得
  const [signer] = await ethers.getSigners();

  // artifacts から SpecialNFT の ABI を読み込み、コントラクトインスタンスを生成
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/SpecialNFT.sol/SpecialNFT.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const contract = new ethers.Contract(contractAddress, abi, signer);

  // TimeElapsed イベントの監視
  contract.on("TimeElapsed", async (tokenId, event) => {
    console.log("TimeElapsed event captured:");
    console.log(`Token ID: ${tokenId.toString()}`);
    wm2_cmd()
    // if (webhookUrl) {
    //     try {
    //         const response = await axios.post(webhookUrl, { tokenId: tokenId.toString() });
    //         console.log("Webhook triggered:", response.status);
    //     } catch (error) {
    //         console.error("Error triggering webhook:", error.message);
    //     }    
    // }
  });

  console.log("Listening for events and checking condition for token IDs 0 to 10 every minute...");

  // 1分ごとにトークンID 0～10 について条件チェックおよび実行
  setInterval(async () => {
    for (let tokenId = 0; tokenId <= 10; tokenId++) {
      try {
        // view 関数 isTimeElapsed を呼び出して条件をチェック（ガス代はかかりません）
        const conditionMet = await contract.isTimeElapsed(tokenId);
        console.log(`Check token ID ${tokenId}:`, conditionMet);
        if (conditionMet) {
          console.log(`Condition met for token ID ${tokenId}. Sending triggerTimeElapsed transaction...`);
          const tx = await contract.triggerTimeElapsed(tokenId);
          console.log(`Transaction sent for token ID ${tokenId}. Waiting for confirmation...`);
          await tx.wait();
          console.log(`triggerTimeElapsed executed successfully for token ID: ${tokenId}`);
        }
      } catch (error) {
        console.error(`Error for token ID ${tokenId}:`, error.message);
      }
    }
  }, 60 * 1000); // 60秒ごとに実行
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


let wm2_cmd = async () => {

  let sesame_id = await vars.get("SESAME_UUID");
  let sesame_api_key = await vars.get("SESAME_API_KEY");
  let key_secret_hex = await vars.get("SESAME_KEY_SECRET_HEX");
  let cmd = 83  //(toggle:88,lock:82,unlock:83)
  let history = "Toggled via API"
  let base64_history = Buffer.from(history).toString('base64');

  let sign = generateRandomTag(key_secret_hex)
  let after_cmd = await axios({
      method: 'post',
      url: `https://app.candyhouse.co/api/sesame2/${sesame_id}/cmd`,
      headers: {'x-api-key': sesame_api_key},
      data: {
          cmd: cmd,
          history: base64_history,
          sign: sign
      }
  })
};


function generateRandomTag(secret) {
  let key = Buffer.from(secret, 'hex')
  const date = Math.floor(Date.now() / 1000);
  const dateDate = Buffer.allocUnsafe(4);
  dateDate.writeUInt32LE(date);
  const message = Buffer.from(dateDate.slice(1, 4));
  return aesCmac(key, message);
}

