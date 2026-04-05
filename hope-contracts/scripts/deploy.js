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

  // ── Test: create a sample campaign ─────────────────────────────────────────
  console.log("\nStep 4: Creating a test campaign...");
  const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const goalAmount = ethers.parseUnits("10000", 6); // $10,000 USDC

  const tx = await factory.createCampaign({
    title:       "Kerala Flood Relief 2024",
    description: "Help flood victims in Kerala, India",
    location:    "Kerala, India",
    category:    "flood-relief",
    documentCID: "QmTestIPFSHash123",
    goalAmount:  goalAmount,
    deadline:    deadline,
  });

  const receipt = await tx.wait();
  console.log("  Campaign creation tx:", receipt.hash);

  const allCampaigns = await factory.getAllCampaigns();
  const campaignAddress = allCampaigns[0];
  console.log("  Campaign contract deployed at:", campaignAddress);

  // ── Test: check campaign details ────────────────────────────────────────────
  const HOPECampaign = await ethers.getContractFactory("HOPECampaign");
  const campaign = HOPECampaign.attach(campaignAddress);
  const details  = await campaign.getCampaignDetails();

  console.log("\nStep 5: Campaign details from contract:");
  console.log("  title:             ", details._title);
  console.log("  location:          ", details._location);
  console.log("  goalAmount:        ", ethers.formatUnits(details._goalAmount, 6), "USDC");
  console.log("  raisedAmount:      ", ethers.formatUnits(details._raisedAmount, 6), "USDC");
  console.log("  isActive:          ", details._isActive);
  console.log("  beneficiaryCount:  ", details._beneficiaryCount.toString());

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Network:          ", network.name);
  console.log("MockUSDC:         ", usdcAddress);
  console.log("HOPEFactory:      ", factoryAddress);
  console.log("Test Campaign:    ", campaignAddress);
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