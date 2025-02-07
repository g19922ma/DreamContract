// scripts/deploy.js
require("dotenv").config();

async function main() {
  // Hardhat のグローバル ethers からサインアーケータを取得
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // SpecialNFT コントラクトのファクトリを取得してデプロイ
  const SpecialNFT = await ethers.getContractFactory("SpecialNFT");
  const specialNFT = await SpecialNFT.deploy();
  await specialNFT.deployed();

  console.log("SpecialNFT deployed to:", specialNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
