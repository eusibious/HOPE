const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("HOPEFactory", function () {

  let factory, mockUSDC;
  let owner, hopeAdmin, partner1, partner2, stranger;
  let deadline;

  const GOAL = ethers.parseUnits("10000", 6);

  const defaultParams = (deadline) => ({
    title: "Kerala Flood Relief 2024",
    description: "Help flood victims",
    location: "Kerala, India",
    category: "flood-relief",
    documentCID: "QmTestHash123",
    goalAmount: GOAL,
    deadline: deadline,
  });

  beforeEach(async function () {
    [owner, hopeAdmin, partner1, partner2, stranger] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    const HOPEFactory = await ethers.getContractFactory("HOPEFactory");
    factory = await HOPEFactory.deploy(hopeAdmin.address, await mockUSDC.getAddress());
    await factory.waitForDeployment();

    deadline = (await time.latest()) + 30 * 24 * 60 * 60;
  });

  // ── 1. Deployment ──────────────────────────────────────────────────────────
  describe("Deployment", function () {

    it("Should set correct owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Should set correct HOPE admin", async function () {
      expect(await factory.hopeAdmin()).to.equal(hopeAdmin.address);
    });

    it("Should set correct USDC address", async function () {
      expect(await factory.usdcToken()).to.equal(await mockUSDC.getAddress());
    });

    it("Should start unpaused", async function () {
      expect(await factory.isPaused()).to.equal(false);
    });

    it("Should start with zero campaigns", async function () {
      expect(await factory.getCampaignCount()).to.equal(0);
    });
  });

  // ── 2. Create Campaign ─────────────────────────────────────────────────────
  describe("Create Campaign", function () {

    it("Should deploy a new campaign contract", async function () {
      const params = defaultParams(deadline);
      const tx = await factory.connect(partner1).createCampaign(params);
      const receipt = await tx.wait();

      expect(await factory.getCampaignCount()).to.equal(1);
    });

    it("Should return the campaign address", async function () {
      const params = defaultParams(deadline);
      const campaignAddress = await factory.connect(partner1).createCampaign.staticCall(params);
      expect(campaignAddress).to.be.properAddress;
    });

    it("Should track campaign in allCampaigns", async function () {
      const params = defaultParams(deadline);
      await factory.connect(partner1).createCampaign(params);
      const all = await factory.getAllCampaigns();
      expect(all.length).to.equal(1);
    });

    it("Should track campaign under partner address", async function () {
      const params = defaultParams(deadline);
      await factory.connect(partner1).createCampaign(params);
      const partnerCampaigns = await factory.getPartnerCampaigns(partner1.address);
      expect(partnerCampaigns.length).to.equal(1);
    });

    it("Should mark campaign as from factory", async function () {
      const params = defaultParams(deadline);
      const campaignAddress = await factory.connect(partner1).createCampaign.staticCall(params);
      await factory.connect(partner1).createCampaign(params);
      expect(await factory.isCampaignFromFactory(campaignAddress)).to.equal(true);
    });

    it("Should emit CampaignCreated event", async function () {
      const params = defaultParams(deadline);
      await expect(factory.connect(partner1).createCampaign(params))
        .to.emit(factory, "CampaignCreated");
    });

    it("Should set partner1 as campaign partner", async function () {
      const params = defaultParams(deadline);
      const campaignAddress = await factory.connect(partner1).createCampaign.staticCall(params);
      await factory.connect(partner1).createCampaign(params);

      const HOPECampaign = await ethers.getContractFactory("HOPECampaign");
      const campaign = HOPECampaign.attach(campaignAddress);
      expect(await campaign.partner()).to.equal(partner1.address);
    });

    it("Should allow multiple campaigns from same partner", async function () {
      const params1 = defaultParams(deadline);
      const params2 = { ...defaultParams(deadline), title: "Second Campaign" };

      await factory.connect(partner1).createCampaign(params1);
      await factory.connect(partner1).createCampaign(params2);

      const partnerCampaigns = await factory.getPartnerCampaigns(partner1.address);
      expect(partnerCampaigns.length).to.equal(2);
    });

    it("Should allow campaigns from different partners", async function () {
      await factory.connect(partner1).createCampaign(defaultParams(deadline));
      await factory.connect(partner2).createCampaign(defaultParams(deadline));

      expect(await factory.getCampaignCount()).to.equal(2);
      expect((await factory.getPartnerCampaigns(partner1.address)).length).to.equal(1);
      expect((await factory.getPartnerCampaigns(partner2.address)).length).to.equal(1);
    });

    it("Should reject empty title", async function () {
      const params = { ...defaultParams(deadline), title: "" };
      await expect(factory.connect(partner1).createCampaign(params))
        .to.be.revertedWith("Title cannot be empty");
    });

    it("Should reject goal below minimum", async function () {
      const params = { ...defaultParams(deadline), goalAmount: ethers.parseUnits("50", 6) };
      await expect(factory.connect(partner1).createCampaign(params))
        .to.be.revertedWith("Minimum goal is 100 USDC");
    });

    it("Should reject deadline too soon", async function () {
      const badDeadline = (await time.latest()) + 3600; // only 1 hour away
      const params = { ...defaultParams(deadline), deadline: badDeadline };
      await expect(factory.connect(partner1).createCampaign(params))
        .to.be.revertedWith("Deadline must be at least 1 day from now");
    });

    it("Should reject campaign creation when paused", async function () {
      await factory.connect(owner).pauseFactory();
      await expect(factory.connect(partner1).createCampaign(defaultParams(deadline)))
        .to.be.revertedWith("Factory is paused");
    });
  });

  // ── 3. Pause / Unpause ─────────────────────────────────────────────────────
  describe("Pause and Unpause", function () {

    it("Should allow owner to pause", async function () {
      await factory.connect(owner).pauseFactory();
      expect(await factory.isPaused()).to.equal(true);
    });

    it("Should allow owner to unpause", async function () {
      await factory.connect(owner).pauseFactory();
      await factory.connect(owner).unpauseFactory();
      expect(await factory.isPaused()).to.equal(false);
    });

    it("Should emit FactoryPaused event", async function () {
      await expect(factory.connect(owner).pauseFactory())
        .to.emit(factory, "FactoryPaused");
    });

    it("Should emit FactoryUnpaused event", async function () {
      await factory.connect(owner).pauseFactory();
      await expect(factory.connect(owner).unpauseFactory())
        .to.emit(factory, "FactoryUnpaused");
    });

    it("Should reject pause from stranger", async function () {
      await expect(factory.connect(stranger).pauseFactory())
        .to.be.revertedWith("Only HOPE owner can do this");
    });

    it("Should allow campaigns again after unpausing", async function () {
      await factory.connect(owner).pauseFactory();
      await factory.connect(owner).unpauseFactory();
      await expect(
        factory.connect(partner1).createCampaign(defaultParams(deadline))
      ).to.not.be.reverted;
    });
  });

  // ── 4. Update Admin ────────────────────────────────────────────────────────
  describe("Update HOPE Admin", function () {

    it("Should allow owner to update admin", async function () {
      await factory.connect(owner).updateHopeAdmin(stranger.address);
      expect(await factory.hopeAdmin()).to.equal(stranger.address);
    });

    it("Should emit AdminUpdated event", async function () {
      await expect(factory.connect(owner).updateHopeAdmin(stranger.address))
        .to.emit(factory, "AdminUpdated");
    });

    it("Should reject zero address", async function () {
      await expect(factory.connect(owner).updateHopeAdmin(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address");
    });

    it("Should reject update from stranger", async function () {
      await expect(factory.connect(stranger).updateHopeAdmin(stranger.address))
        .to.be.revertedWith("Only HOPE owner can do this");
    });
  });
});
