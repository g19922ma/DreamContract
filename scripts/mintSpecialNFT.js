// scripts/mint.js

async function main() {
    // 環境変数からデプロイ済みコントラクトのアドレスを取得
    const contractAddress = await vars.get("CONTRACT_ADDRESS");
    if (!contractAddress) {
      throw new Error("Please set CONTRACT_ADDRESS using 'npx hardhat set'.");
    }
  
    // サインアーケータを取得
    const [signer] = await ethers.getSigners();
  
    // コントラクトファクトリからインスタンスを取得し、attach() で指定アドレスのインスタンスを作成
    const SpecialNFT = await ethers.getContractFactory("SpecialNFT");
    const specialNFT = SpecialNFT.attach(contractAddress);
  
    // 例として、mint 時に 2 分後に TimeElapsed イベント発行可能とする
    const xMinutes = 2;
    const mintTx = await specialNFT.mint(signer.address, xMinutes);
    const receipt = await mintTx.wait();
  
    // ERC-721 の Transfer イベントから tokenId を取得
    const transferEvent = receipt.events.find((e) => e.event === "Transfer");
    const tokenId = transferEvent.args.tokenId;
  
    console.log("Minted NFT with tokenId:", tokenId.toString());
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  