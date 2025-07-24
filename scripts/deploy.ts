// scripts/deploy.ts

import hre from "hardhat"; // This is the corrected way to import Hardhat Runtime Environment
import { formatEther } from "ethers"; // This import for formatEther is correct

async function main() {
  // Destructure ethers and upgrades from the Hardhat Runtime Environment (hre)
  const { ethers, upgrades } = hre; 

  console.log("🚀 Starting deployment process...");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", formatEther(balance), "BDAG"); // Changed ETH to BDAG as per your chain config

  // 1. Deploy TestStablecoin
  console.log("\n🪙 Deploying TestStablecoin...");
  const TestStablecoin = await ethers.getContractFactory("TestStablecoin");
  const stablecoin = await TestStablecoin.deploy();
  await stablecoin.waitForDeployment();
  const stablecoinAddress = await stablecoin.getAddress();
  console.log("✅ Test Stablecoin (TUSDC) deployed to:", stablecoinAddress);

  // 2. Deploy LivestockAssetNFT
  console.log("\n🐄 Deploying LivestockAssetNFT...");
  const LivestockAssetNFT = await ethers.getContractFactory("LivestockAssetNFT");
  const livestockNft = await LivestockAssetNFT.deploy();
  await livestockNft.waitForDeployment();
  const livestockNftAddress = await livestockNft.getAddress();
  console.log("✅ LivestockAssetNFT deployed to:", livestockNftAddress);

  // 3. Deploy LivestockManager (Upgradeable Proxy)
  console.log("\nMANAGER Deploying LivestockManager (Upgradeable)...");
  const LivestockManager = await ethers.getContractFactory("LivestockManager");
  const livestockManagerProxy = await upgrades.deployProxy(
    LivestockManager,
    [deployer.address, livestockNftAddress, stablecoinAddress],
    { initializer: "initialize", kind: "uups" }
  );
  await livestockManagerProxy.waitForDeployment();
  const managerAddress = await livestockManagerProxy.getAddress();
  console.log("✅ LivestockManager (Proxy) deployed to:", managerAddress);

  // 4. CRITICAL STEP: Transfer ownership of the NFT contract to the Manager
  console.log("\n🔒 Transferring ownership of NFT contract to Manager...");
  const tx = await livestockNft.transferOwnership(managerAddress);
  await tx.wait();
  console.log("✅ Ownership transferred successfully.");

  // 5. Verification Step
  console.log("\n🔍 Verifying deployment...");

  const stablecoinAddrFromManager = await livestockManagerProxy.acceptedStablecoin();
  const nftAddrFromManager = await livestockManagerProxy.livestockAssetNFT();

  if (stablecoinAddrFromManager.toLowerCase() !== stablecoinAddress.toLowerCase()) {
    throw new Error("Verification failed: Stablecoin address mismatch!");
  }
  if (nftAddrFromManager.toLowerCase() !== livestockNftAddress.toLowerCase()) {
    throw new Error("Verification failed: NFT address mismatch!");
  }

  const newOwner = await livestockNft.owner();
  if (newOwner.toLowerCase() !== managerAddress.toLowerCase()) {
      throw new Error("Verification failed: NFT Ownership transfer failed!");
  }

  console.log("\n🎉🎉🎉 All contracts deployed and configured successfully! 🎉🎉🎉");
  console.log("----------------------------------------------------");
  console.log("TestStablecoin Address:", stablecoinAddress);
  console.log("LivestockAssetNFT Address:", livestockNftAddress);
  console.log("LivestockManager (Proxy) Address:", managerAddress);
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});