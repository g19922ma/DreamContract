// scripts/mintSpecialNFT.js
const { vars } = require("hardhat/config");

async function main() {
  // Hardhat の vars.get を用いてデプロイ済みコントラクトアドレスを取得
  const contractAddress = await vars.get("CONTRACT_ADDRESS_FOR_SNFT");
  if (!contractAddress) {
    throw new Error("Please set CONTRACT_ADDRESS_FOR_SNFT using 'npx hardhat set'.");
  }

  // サインアーケータを取得
  const [signer] = await ethers.getSigners();

  // SpecialNFT コントラクトのインスタンスを取得（既にデプロイ済みのアドレスに attach）
  const SpecialNFT = await ethers.getContractFactory("SpecialNFT");
  const specialNFT = SpecialNFT.attach(contractAddress);

  // 例として、mint 時に2分後に TimeElapsed イベント発行可能とする
  const xMinutes = 2;
  const mintTx = await specialNFT.mint(signer.address, xMinutes);
  const receipt = await mintTx.wait();

  // デバッグ用：receipt.logs の中身を出力
  console.log("Receipt logs:", receipt.logs);

  let transferEvent = null;
  // receipt.logs から Transfer イベントを探す
  for (const log of receipt.logs) {
    try {
      const parsedLog = specialNFT.interface.parseLog(log);
      if (parsedLog.name === "Transfer") {
        transferEvent = parsedLog;
        break;
      }
    } catch (error) {
      // このログが当該コントラクトのイベントでなければ無視する
    }
  }

  // もし receipt.logs から見つからなかった場合、queryFilter でブロック内のイベントを検索する
  if (!transferEvent) {
    const filter = specialNFT.filters.Transfer(ethers.ZeroAddress, signer.address);
    const events = await specialNFT.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
    if (events.length > 0) {
      transferEvent = events[0];
    }
  }

  if (!transferEvent) {
    throw new Error("Transfer event not found in transaction logs");
  }

  const tokenId = transferEvent.args.tokenId;
  console.log("Minted NFT with tokenId:", tokenId.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
