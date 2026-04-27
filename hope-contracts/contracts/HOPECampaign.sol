// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);
}

contract HOPECampaign is ReentrancyGuard {
    // ─────────────────────────────────────────────
    //  State Variables
    // ─────────────────────────────────────────────

    address public partner;
    address public factory;
    address public hopeAdmin;
    address public usdcToken;

    string public title;
    string public description;
    string public location;
    string public category;

    // IPFS CID of the beneficiary document — set once at registration, never overwritten
    string public documentCID;

    // goalAmount is informational metadata only — not enforced on-chain
    uint256 public goalAmount;

    // deadline is a Unix timestamp — donations are blocked after this point.
    // The campaign still requires manual closeCampaign() by the partner to formally close.
    uint256 public deadline;

    uint256 public raisedAmount;
    uint256 public beneficiaryCount;
    uint256 public claimedCount;

    // Tracks total USDC transferred to partner via claimFunds.
    // Remaining unclaimed funds = raisedAmount - claimedAmount
    uint256 public claimedAmount;

    bool public isActive;
    bool public beneficiariesLocked;
    bool public isPaused;
    bool public donationsOpen;

    mapping(bytes32 => bool) public claimHashExists;
    mapping(bytes32 => bool) public claimHashUsed;
    mapping(address => uint256) public donations;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event DonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 totalRaised
    );
    event BeneficiariesRegisteredAndLocked(
        uint256 count,
        string ipfsCID,
        uint256 timestamp
    );
    event BeneficiariesRegistered(
        uint256 count,
        string ipfsCID,
        uint256 timestamp
    );
    event BeneficiariesLocked(uint256 count, uint256 timestamp);
    event DonationsOpened(address indexed partner, uint256 timestamp);
    event FundsClaimed(
        bytes32 indexed claimHash,
        uint256 amount,
        uint256 claimedCount,
        uint256 claimedAmount,
        uint256 timestamp
    );
    event CampaignClosed(
        uint256 totalRaised,
        uint256 claimedCount,
        uint256 timestamp
    );
    event CampaignPaused(address indexed admin, uint256 timestamp);
    event CampaignUnpaused(address indexed admin, uint256 timestamp);

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    modifier onlyPartner() {
        require(msg.sender == partner, "Only campaign partner can do this");
        _;
    }

    modifier onlyPartnerOrAdmin() {
        require(
            msg.sender == partner || msg.sender == hopeAdmin,
            "Only partner or HOPE admin can do this"
        );
        _;
    }

    modifier onlyHopeAdmin() {
        require(msg.sender == hopeAdmin, "Only HOPE admin can do this");
        _;
    }

    // Guards donation calls:
    // - Campaign must be active (not closed by partner)
    // - Campaign must not be paused
    // - block.timestamp must still be within deadline
    // - Donations window must be open (set after beneficiaries are locked)
    modifier campaignActive() {
        require(isActive, "Campaign is not active");
        require(!isPaused, "Campaign is paused");
        require(block.timestamp <= deadline, "Campaign deadline has passed");
        require(donationsOpen, "Donations are not open yet");
        _;
    }

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    constructor(
        address _partner,
        address _hopeAdmin,
        address _usdcToken,
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _category,
        string memory _documentCID,
        uint256 _goalAmount,
        uint256 _deadline
    ) {
        // Zero-address guards
        require(_partner != address(0), "Invalid partner address");
        require(_hopeAdmin != address(0), "Invalid admin address");
        require(_usdcToken != address(0), "Invalid token address");

        // Deadline must be in the future
        require(_deadline > block.timestamp, "Deadline must be in the future");

        factory = msg.sender;
        partner = _partner;
        hopeAdmin = _hopeAdmin;
        usdcToken = _usdcToken;
        title = _title;
        description = _description;
        location = _location;
        category = _category;
        documentCID = _documentCID;
        goalAmount = _goalAmount;
        deadline = _deadline;

        isActive = true;
        isPaused = false;
        beneficiariesLocked = false;
        donationsOpen = false;

        raisedAmount = 0;
        beneficiaryCount = 0;
        claimedCount = 0;
        claimedAmount = 0;
    }

    // ─────────────────────────────────────────────
    //  Step 1 — Register, Lock & Open Donations (atomic, one-time)
    // ─────────────────────────────────────────────

    // Partner calls this once with the full beneficiary batch from Firestore.
    // Registers all claim hashes, locks the beneficiary list, and opens
    // the donation window — all in one transaction.
    // No re-registration is possible after this call.
    function registerLockAndOpenDonations(
        bytes32[] calldata _claimHashes,
        string calldata _ipfsCID,
        uint256 _count
    ) external onlyPartner nonReentrant {
        require(!beneficiariesLocked, "Beneficiaries already locked");
        require(!isPaused, "Campaign is paused");
        require(!donationsOpen, "Donations already open");
        require(_count > 0, "Must register at least one beneficiary");
        require(_claimHashes.length == _count, "Hash count mismatch");

        // Register each claim hash — no duplicates allowed
        for (uint256 i = 0; i < _claimHashes.length; i++) {
            require(_claimHashes[i] != bytes32(0), "Invalid claim hash");
            require(!claimHashExists[_claimHashes[i]], "Duplicate claim hash");
            claimHashExists[_claimHashes[i]] = true;
        }

        // Set beneficiary count exactly (not +=, this is one-time only)
        beneficiaryCount = _count;
        documentCID = _ipfsCID;

        // Lock — no further registration possible
        beneficiariesLocked = true;

        // Open donation window
        donationsOpen = true;

        emit BeneficiariesRegisteredAndLocked(
            _count,
            _ipfsCID,
            block.timestamp
        );
        emit BeneficiariesRegistered(_count, _ipfsCID, block.timestamp);
        emit BeneficiariesLocked(_count, block.timestamp);
        emit DonationsOpened(msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────
    //  Step 2 — Donate
    // ─────────────────────────────────────────────

    // Donor sends USDC to the campaign.
    // Donor must approve this contract address on the USDC token before calling.
    // Only accepted when: campaign is active, not paused, within deadline, and donations are open.
    function donate(uint256 _amount) external nonReentrant campaignActive {
        require(_amount > 0, "Amount must be greater than 0");

        IERC20 usdc = IERC20(usdcToken);
        bool success = usdc.transferFrom(msg.sender, address(this), _amount);
        require(success, "USDC transfer failed");

        raisedAmount += _amount;
        donations[msg.sender] += _amount;

        emit DonationReceived(msg.sender, _amount, raisedAmount);
    }

    // ─────────────────────────────────────────────
    //  Step 3 — Close Campaign
    // ─────────────────────────────────────────────

    // Partner formally closes the campaign.
    // This stops donations and begins the claim window.
    // NO funds are moved here — all fund transfers happen only in claimFunds().
    function closeCampaign() external onlyPartner {
        require(isActive, "Campaign already closed");
        require(
            beneficiariesLocked,
            "Beneficiaries must be locked before closing"
        );

        isActive = false;
        donationsOpen = false;

        emit CampaignClosed(raisedAmount, claimedCount, block.timestamp);
    }

    // ─────────────────────────────────────────────
    //  Step 4 — Claim Funds (per beneficiary)
    // ─────────────────────────────────────────────

    // Called by partner or admin when a beneficiary presents their QR code.
    // Verifies the claim hash, computes the share, and transfers to partner.
    // Partner then distributes cash or goods to the beneficiary in the field.
    //
    // Share calculation:
    // - Every beneficiary receives raisedAmount / beneficiaryCount
    // - The LAST claimant receives the remainder:
    //   (raisedAmount - claimedAmount) to ensure 100% of funds are distributed
    //   with no dust left in the contract.
    function claimFunds(
        bytes32 _claimHash
    ) external nonReentrant onlyPartnerOrAdmin {
        require(!isActive, "Campaign must be closed before claiming");
        require(beneficiariesLocked, "Beneficiaries not locked");
        require(claimHashExists[_claimHash], "Invalid claim hash");
        require(!claimHashUsed[_claimHash], "Already claimed");
        require(beneficiaryCount > 0, "No beneficiaries registered");
        require(raisedAmount > 0, "No funds raised");

        // Compute this beneficiary's share.
        // Last claimant absorbs the remainder to ensure zero dust.
        uint256 shareAmount;
        if (claimedCount == beneficiaryCount - 1) {
            // Last beneficiary: gets everything remaining
            shareAmount = raisedAmount - claimedAmount;
        } else {
            shareAmount = raisedAmount / beneficiaryCount;
        }

        require(shareAmount > 0, "Share amount is zero");

        IERC20 usdc = IERC20(usdcToken);
        require(
            usdc.balanceOf(address(this)) >= shareAmount,
            "Insufficient contract balance"
        );

        // Update state before transfer (checks-effects-interactions)
        claimHashUsed[_claimHash] = true;
        claimedCount++;
        claimedAmount += shareAmount;

        // Transfer share to partner — partner distributes to beneficiary in the field
        bool success = usdc.transfer(partner, shareAmount);
        require(success, "Fund transfer failed");

        emit FundsClaimed(
            _claimHash,
            shareAmount,
            claimedCount,
            claimedAmount,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────
    //  Admin Controls
    // ─────────────────────────────────────────────

    // Only HOPE admin can pause — prevents partner from freezing their own campaign
    function pauseCampaign() external onlyHopeAdmin {
        require(!isPaused, "Campaign is already paused");
        require(isActive, "Campaign must be active to pause");
        isPaused = true;
        emit CampaignPaused(msg.sender, block.timestamp);
    }

    // Only HOPE admin can unpause
    function unpauseCampaign() external onlyHopeAdmin {
        require(isPaused, "Campaign is not paused");
        require(isActive, "Cannot unpause a closed campaign");
        isPaused = false;
        emit CampaignUnpaused(msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────
    //  View Functions
    // ─────────────────────────────────────────────

    // Returns full campaign state in one call for frontend consumption.
    // remainingAmount = raisedAmount - claimedAmount (unclaimed funds still in contract)
    function getCampaignDetails()
        external
        view
        returns (
            address _partner,
            string memory _title,
            string memory _location,
            uint256 _goalAmount,
            uint256 _raisedAmount,
            uint256 _claimedAmount,
            uint256 _remainingAmount,
            uint256 _deadline,
            uint256 _beneficiaryCount,
            uint256 _claimedCount,
            bool _isActive,
            bool _isPaused,
            bool _beneficiariesLocked,
            bool _donationsOpen,
            string memory _documentCID
        )
    {
        return (
            partner,
            title,
            location,
            goalAmount,
            raisedAmount,
            claimedAmount,
            raisedAmount - claimedAmount,
            deadline,
            beneficiaryCount,
            claimedCount,
            isActive,
            isPaused,
            beneficiariesLocked,
            donationsOpen,
            documentCID
        );
    }

    // Returns whether a claim hash is valid and whether it has already been used.
    function verifyClaimHash(
        bytes32 _claimHash
    ) external view returns (bool isValid, bool hasBeenClaimed) {
        return (claimHashExists[_claimHash], claimHashUsed[_claimHash]);
    }

    // Returns current USDC balance held by this contract.
    // Should equal raisedAmount - claimedAmount after close.
    function getBalance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }
}
