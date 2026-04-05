const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

function generateClaimHash(beneficiaryId, campaignId, salt) {
  return ethers.solidityPackedKeccak256(
    ["string", "string", "string"],
    [beneficiaryId, campaignId, salt]
  );
}

describe("HOPECampaign", function () {

  let campaign, mockUSDC;
  let owner, partner, hopeAdmin, donor1, donor2, stranger;

  const GOAL_AMOUNT = ethers.parseUnits("10000", 6);
  const DONATION_AMOUNT = ethers.parseUnits("1000", 6);
  const SALT = "hope-secret-salt-2024";
  let deadline;

  beforeEach(async function () {
    [owner, partner, hopeAdmin, donor1, donor2, stranger] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    await mockUSDC.mint(donor1.address, ethers.parseUnits("50000", 6));
    await mockUSDC.mint(donor2.address, ethers.parseUnits("50000", 6));

    deadline = (await time.latest()) + 30 * 24 * 60 * 60;

    const HOPECampaign = await ethers.getContractFactory("HOPECampaign");
    campaign = await HOPECampaign.deploy(
      partner.address, hopeAdmin.address, await mockUSDC.getAddress(),
      "Kerala Flood Relief 2024", "Help flood victims in Kerala",
      "Kerala, India", "flood-relief", "QmTestIPFSHash123",
      GOAL_AMOUNT, deadline
    );
    await campaign.waitForDeployment();
  });

  // ── 1. Deployment ──────────────────────────────────────────────────────────
  describe("Deployment", function () {

    it("Should set the correct partner address", async function () {
      expect(await campaign.partner()).to.equal(partner.address);
    });

    it("Should set the correct HOPE admin address", async function () {
      expect(await campaign.hopeAdmin()).to.equal(hopeAdmin.address);
    });

    it("Should set the correct goal amount", async function () {
      expect(await campaign.goalAmount()).to.equal(GOAL_AMOUNT);
    });

    it("Should start as active with zero raised", async function () {
      expect(await campaign.isActive()).to.equal(true);
      expect(await campaign.raisedAmount()).to.equal(0);
    });

    it("Should start with beneficiaries unlocked", async function () {
      expect(await campaign.beneficiariesLocked()).to.equal(false);
    });

    it("Should store campaign details correctly", async function () {
      expect(await campaign.title()).to.equal("Kerala Flood Relief 2024");
      expect(await campaign.location()).to.equal("Kerala, India");
      expect(await campaign.category()).to.equal("flood-relief");
    });
  });

  // ── 2. Donations ───────────────────────────────────────────────────────────
  describe("Donations", function () {

    beforeEach(async function () {
      await mockUSDC.connect(donor1).approve(await campaign.getAddress(), DONATION_AMOUNT);
    });

    it("Should accept a valid donation", async function () {
      await campaign.connect(donor1).donate(DONATION_AMOUNT);
      expect(await campaign.raisedAmount()).to.equal(DONATION_AMOUNT);
    });

    it("Should track individual donor amounts", async function () {
      await campaign.connect(donor1).donate(DONATION_AMOUNT);
      expect(await campaign.donations(donor1.address)).to.equal(DONATION_AMOUNT);
    });

    it("Should emit DonationReceived event", async function () {
      await expect(campaign.connect(donor1).donate(DONATION_AMOUNT))
        .to.emit(campaign, "DonationReceived")
        .withArgs(donor1.address, DONATION_AMOUNT, DONATION_AMOUNT);
    });

    it("Should accumulate multiple donations", async function () {
      await mockUSDC.connect(donor2).approve(await campaign.getAddress(), DONATION_AMOUNT);
      await campaign.connect(donor1).donate(DONATION_AMOUNT);
      await campaign.connect(donor2).donate(DONATION_AMOUNT);
      expect(await campaign.raisedAmount()).to.equal(DONATION_AMOUNT * 2n);
    });

    it("Should reject zero amount donation", async function () {
      await expect(campaign.connect(donor1).donate(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject donation after deadline", async function () {
      await time.increaseTo(deadline + 1);
      await expect(campaign.connect(donor1).donate(DONATION_AMOUNT))
        .to.be.revertedWith("Campaign deadline has passed");
    });

    it("Should reject donation to closed campaign", async function () {
      await campaign.connect(partner).closeCampaign();
      await expect(campaign.connect(donor1).donate(DONATION_AMOUNT))
        .to.be.revertedWith("Campaign is not active");
    });
  });

  // ── 3. Beneficiary Registration ────────────────────────────────────────────
  describe("Beneficiary Registration", function () {

    let hash1, hash2;

    beforeEach(async function () {
      hash1 = generateClaimHash("BEN001", "CAMP001", SALT);
      hash2 = generateClaimHash("BEN002", "CAMP001", SALT);
    });

    it("Should allow partner to register beneficiaries", async function () {
      await campaign.connect(partner).registerBeneficiaries([hash1, hash2], "QmHash", 2);
      expect(await campaign.beneficiaryCount()).to.equal(2);
    });

    it("Should allow HOPE admin to register beneficiaries", async function () {
      await campaign.connect(hopeAdmin).registerBeneficiaries([hash1], "QmHash", 1);
      expect(await campaign.beneficiaryCount()).to.equal(1);
    });

    it("Should mark hashes as existing after registration", async function () {
      await campaign.connect(partner).registerBeneficiaries([hash1, hash2], "QmHash", 2);
      expect(await campaign.claimHashExists(hash1)).to.equal(true);
      expect(await campaign.claimHashExists(hash2)).to.equal(true);
    });

    it("Should reject registration from stranger", async function () {
      await expect(
        campaign.connect(stranger).registerBeneficiaries([hash1], "QmHash", 1)
      ).to.be.revertedWith("Only partner or HOPE admin can do this");
    });

    it("Should reject duplicate claim hashes", async function () {
      await campaign.connect(partner).registerBeneficiaries([hash1], "QmHash", 1);
      await expect(
        campaign.connect(partner).registerBeneficiaries([hash1], "QmHash", 1)
      ).to.be.revertedWith("Duplicate claim hash");
    });

    it("Should reject mismatched count", async function () {
      await expect(
        campaign.connect(partner).registerBeneficiaries([hash1, hash2], "QmHash", 5)
      ).to.be.revertedWith("Hash count mismatch");
    });

    it("Should reject registration after locking", async function () {
      await campaign.connect(partner).registerBeneficiaries([hash1], "QmHash", 1);
      await campaign.connect(partner).lockBeneficiaries();
      await expect(
        campaign.connect(partner).registerBeneficiaries([hash2], "QmHash", 1)
      ).to.be.revertedWith("Beneficiaries already locked");
    });
  });

  // ── 4. Lock Beneficiaries ──────────────────────────────────────────────────
  describe("Lock Beneficiaries", function () {

    it("Should allow partner to lock", async function () {
      const hash = generateClaimHash("BEN001", "CAMP001", SALT);
      await campaign.connect(partner).registerBeneficiaries([hash], "QmHash", 1);
      await campaign.connect(partner).lockBeneficiaries();
      expect(await campaign.beneficiariesLocked()).to.equal(true);
    });

    it("Should reject locking with no beneficiaries", async function () {
      await expect(campaign.connect(partner).lockBeneficiaries())
        .to.be.revertedWith("No beneficiaries registered");
    });

    it("Should reject locking by stranger", async function () {
      const hash = generateClaimHash("BEN001", "CAMP001", SALT);
      await campaign.connect(partner).registerBeneficiaries([hash], "QmHash", 1);
      await expect(campaign.connect(stranger).lockBeneficiaries())
        .to.be.revertedWith("Only campaign partner can do this");
    });
  });

  // ── 5. Claim Funds ─────────────────────────────────────────────────────────
  describe("Claim Funds", function () {

    let hash1, hash2;
    const TOTAL = ethers.parseUnits("2000", 6);

    beforeEach(async function () {
      hash1 = generateClaimHash("BEN001", "CAMP001", SALT);
      hash2 = generateClaimHash("BEN002", "CAMP001", SALT);

      await mockUSDC.connect(donor1).approve(await campaign.getAddress(), TOTAL);
      await campaign.connect(donor1).donate(TOTAL);

      await campaign.connect(partner).registerBeneficiaries([hash1, hash2], "QmHash", 2);
      await campaign.connect(partner).lockBeneficiaries();
    });

    it("Should release equal share to partner", async function () {
      const before = await mockUSDC.balanceOf(partner.address);
      await campaign.connect(partner).claimFunds(hash1);
      const after = await mockUSDC.balanceOf(partner.address);
      expect(after - before).to.equal(TOTAL / 2n);
    });

    it("Should mark hash as used after claim", async function () {
      await campaign.connect(partner).claimFunds(hash1);
      expect(await campaign.claimHashUsed(hash1)).to.equal(true);
    });

    it("Should increment claimed count", async function () {
      await campaign.connect(partner).claimFunds(hash1);
      expect(await campaign.claimedCount()).to.equal(1);
    });

    it("Should emit FundsClaimed event", async function () {
      await expect(campaign.connect(partner).claimFunds(hash1))
        .to.emit(campaign, "FundsClaimed");
    });

    it("Should reject double claim", async function () {
      await campaign.connect(partner).claimFunds(hash1);
      await expect(campaign.connect(partner).claimFunds(hash1))
        .to.be.revertedWith("Already claimed");
    });

    it("Should reject invalid claim hash", async function () {
      const fakeHash = generateClaimHash("FAKE", "FAKE", "FAKE");
      await expect(campaign.connect(partner).claimFunds(fakeHash))
        .to.be.revertedWith("Invalid claim hash");
    });

    it("Should reject claim before locking", async function () {
      const HOPECampaign = await ethers.getContractFactory("HOPECampaign");
      const fresh = await HOPECampaign.deploy(
        partner.address, hopeAdmin.address, await mockUSDC.getAddress(),
        "Test", "Test", "Test", "test", "QmTest", GOAL_AMOUNT, deadline
      );
      const hash = generateClaimHash("BEN001", "CAMP002", SALT);
      await fresh.connect(partner).registerBeneficiaries([hash], "QmHash", 1);
      await expect(fresh.connect(partner).claimFunds(hash))
        .to.be.revertedWith("Beneficiaries not locked yet");
    });

    it("Should allow HOPE admin to process claims", async function () {
      await expect(campaign.connect(hopeAdmin).claimFunds(hash1)).to.not.be.reverted;
    });

    it("Should reject claim from stranger", async function () {
      await expect(campaign.connect(stranger).claimFunds(hash1))
        .to.be.revertedWith("Only partner or HOPE admin can do this");
    });
  });

  // ── 6. Close Campaign ──────────────────────────────────────────────────────
  describe("Close Campaign", function () {

    it("Should allow partner to close", async function () {
      await campaign.connect(partner).closeCampaign();
      expect(await campaign.isActive()).to.equal(false);
    });

    it("Should return remaining USDC to partner on close", async function () {
      const amount = ethers.parseUnits("500", 6);
      await mockUSDC.connect(donor1).approve(await campaign.getAddress(), amount);
      await campaign.connect(donor1).donate(amount);

      const before = await mockUSDC.balanceOf(partner.address);
      await campaign.connect(partner).closeCampaign();
      const after = await mockUSDC.balanceOf(partner.address);

      expect(after - before).to.equal(amount);
    });

    it("Should emit CampaignClosed event", async function () {
      await expect(campaign.connect(partner).closeCampaign())
        .to.emit(campaign, "CampaignClosed");
    });

    it("Should reject closing already closed campaign", async function () {
      await campaign.connect(partner).closeCampaign();
      await expect(campaign.connect(partner).closeCampaign())
        .to.be.revertedWith("Campaign already closed");
    });

    it("Should reject closing by stranger", async function () {
      await expect(campaign.connect(stranger).closeCampaign())
        .to.be.revertedWith("Only campaign partner can do this");
    });
  });

  // ── 7. View Functions ──────────────────────────────────────────────────────
  describe("View Functions", function () {

    it("Should return correct campaign details", async function () {
      const details = await campaign.getCampaignDetails();
      expect(details._partner).to.equal(partner.address);
      expect(details._title).to.equal("Kerala Flood Relief 2024");
      expect(details._goalAmount).to.equal(GOAL_AMOUNT);
      expect(details._isActive).to.equal(true);
    });

    it("Should verify valid hash correctly", async function () {
      const hash = generateClaimHash("BEN001", "CAMP001", SALT);
      await campaign.connect(partner).registerBeneficiaries([hash], "QmHash", 1);
      const [isValid, hasBeenClaimed] = await campaign.verifyClaimHash(hash);
      expect(isValid).to.equal(true);
      expect(hasBeenClaimed).to.equal(false);
    });

    it("Should return false for invalid hash", async function () {
      const fakeHash = generateClaimHash("FAKE", "FAKE", "FAKE");
      const [isValid, hasBeenClaimed] = await campaign.verifyClaimHash(fakeHash);
      expect(isValid).to.equal(false);
      expect(hasBeenClaimed).to.equal(false);
    });

    it("Should return correct USDC balance", async function () {
      const amount = ethers.parseUnits("500", 6);
      await mockUSDC.connect(donor1).approve(await campaign.getAddress(), amount);
      await campaign.connect(donor1).donate(amount);
      expect(await campaign.getBalance()).to.equal(amount);
    });
  });
});
