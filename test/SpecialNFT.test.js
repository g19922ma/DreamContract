const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpecialNFT", function () {
  let specialNFT, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    // サインアーケータを取得
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const SpecialNFTFactory = await ethers.getContractFactory("SpecialNFT");
    // コントラクトのデプロイ
    specialNFT = await SpecialNFTFactory.deploy();
    // ethers v6 では deployed() の代わりに waitForDeployment() を使用
    await specialNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await specialNFT.name()).to.equal("SpecialNFT");
      expect(await specialNFT.symbol()).to.equal("SNFT");
    });
  });

  describe("Minting", function () {
    it("Should mint a token and assign it to the owner", async function () {
      const tx = await specialNFT.mint(owner.address, 1); // 1 分後にイベント発行可能
      await tx.wait();
      // 最初の mint なら tokenId は 1
      expect(await specialNFT.ownerOf(1)).to.equal(owner.address);
      expect(await specialNFT.balanceOf(owner.address)).to.equal(1);
    });

    it("Should generate correct tokenURI", async function () {
      const tx = await specialNFT.mint(owner.address, 1);
      await tx.wait();
      const tokenURI = await specialNFT.tokenURI(1);
      // _baseURI() で指定した "https://qurihara.github.io/nft1/md/" に tokenId が連結される
      expect(tokenURI).to.equal("https://qurihara.github.io/nft1/md/1");
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(specialNFT.mint(owner.address, 1))
        .to.emit(specialNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, 1);
    });
  });

  describe("ERC-721 Transfers", function () {
    beforeEach(async function () {
      // 事前に tokenId 1 を mint
      await specialNFT.mint(owner.address, 1);
    });

    it("Should transfer token from owner to another address", async function () {
      await specialNFT.transferFrom(owner.address, addr1.address, 1);
      expect(await specialNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await specialNFT.balanceOf(owner.address)).to.equal(0);
      expect(await specialNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should safeTransfer token from owner to another address", async function () {
      await specialNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr2.address, 1);
      expect(await specialNFT.ownerOf(1)).to.equal(addr2.address);
      expect(await specialNFT.balanceOf(owner.address)).to.equal(0);
      expect(await specialNFT.balanceOf(addr2.address)).to.equal(1);
    });
  });

  describe("TimeElapsed Event Triggering", function () {
    beforeEach(async function () {
      // tokenId 1 を mint (1 分後にイベント発行可能)
      await specialNFT.mint(owner.address, 1);
    });

    it("Should revert triggerTimeElapsed before time elapses", async function () {
      await expect(specialNFT.triggerTimeElapsed(1))
        .to.be.revertedWith("Time has not elapsed yet");
    });

    it("Should emit TimeElapsed event after specified time has elapsed", async function () {
      // EVM の時間を 61 秒進める
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await expect(specialNFT.triggerTimeElapsed(1))
        .to.emit(specialNFT, "TimeElapsed")
        .withArgs(1);
    });

    it("Should revert triggerTimeElapsed if event already emitted", async function () {
      // 時間を進めて初回呼び出しでイベント発行
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");
      await specialNFT.triggerTimeElapsed(1);

      // すでにイベント発行済みのため再度呼び出すと revert する
      await expect(specialNFT.triggerTimeElapsed(1))
        .to.be.revertedWith("Event already emitted");
    });
  });
});
