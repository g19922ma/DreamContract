// scripts/deploySpecialNFT.js

async function main() {
    // Hardhat のグローバル ethers からサインアーケータを取得
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
  
    // SpecialNFT コントラクトのファクトリを取得してデプロイ
    const SpecialNFT = await ethers.getContractFactory("SpecialNFT");
    const specialNFT = await SpecialNFT.deploy();
    await specialNFT.waitForDeployment(); // ethers v6 の場合は waitForDeployment() を使用
  
    // コントラクトのアドレスは getAddress() で取得可能
    console.log("SpecialNFT deployed to:", await specialNFT.getAddress());
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  