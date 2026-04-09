const { ethers } = require("hardhat");

async function main() {
  console.log("Starting HOPE contract deployment...\n");

  // Get the deployer wallet
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with wallet:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Wallet balance:", ethers.formatEther(balance), "MATIC\n");

  // ── Deploy HOPEFactory ──────────────────────────────────────────────────────
  // Arguments:
  //   hopeAdmin  → deployer acts as admin for now (update later)
  //   usdcToken  → on local network we use a mock USDC we deploy first
  console.log("Step 1: Deploying MockERC20 (test USDC)...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed at:", usdcAddress);

  console.log("\nStep 1.5: Minting test USDC to deployer...");
  const mintAmount = ethers.parseUnits("100000", 6); // 100,000 USDC
  await mockUSDC.mint(deployer.address, mintAmount);

  const usdcBalance = await mockUSDC.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", ethers.formatUnits(usdcBalance, 6), "USDC");


  console.log("\nStep 2: Deploying HOPEFactory...");
  const HOPEFactory = await ethers.getContractFactory("HOPEFactory");
  const factory = await HOPEFactory.deploy(
    deployer.address,  // hopeAdmin — deployer wallet for now
    usdcAddress        // USDC token address
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("HOPEFactory deployed at:", factoryAddress);

  // ── Verify deployment ───────────────────────────────────────────────────────
  console.log("\nStep 3: Verifying deployment...");
  const owner     = await factory.owner();
  const hopeAdmin = await factory.hopeAdmin();
  const usdc      = await factory.usdcToken();
  const isPaused  = await factory.isPaused();
  const count     = await factory.getCampaignCount();

  console.log("  owner:            ", owner);
  console.log("  hopeAdmin:        ", hopeAdmin);
  console.log("  usdcToken:        ", usdc);
  console.log("  isPaused:         ", isPaused);
  console.log("  campaignCount:    ", count.toString());

  
  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Network:          ", network.name);
  console.log("MockUSDC:         ", usdcAddress);
  console.log("HOPEFactory:      ", factoryAddress);
  console.log("\nAdd these to your frontend .env:");
  console.log(`VITE_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`VITE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`VITE_NETWORK=localhost`);



}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });