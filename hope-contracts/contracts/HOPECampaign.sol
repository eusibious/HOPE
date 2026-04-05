// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HOPECampaign is ReentrancyGuard {
    //  State Variables
    address public partner;
    address public factory;
    address public hopeAdmin;
    address public usdcToken;

    string public title;
    string public description;
    string public location;
    string public category;
    string public documentCID;

    uint256 public goalAmount;
    uint256 public raisedAmount;
    uint256 public deadline;
    uint256 public beneficiaryCount;
    uint256 public claimedCount;

    bool public isActive;
    bool public beneficiariesLocked;

    mapping(bytes32 => bool) public claimHashExists;
    mapping(bytes32 => bool) public claimHashUsed;
    mapping(address => uint256) public donations;

    // Events
    event DonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 totalRaised
    );
    event BeneficiariesRegistered(
        uint256 count,
        string ipfsCID,
        uint256 timestamp
    );
    event FundsClaimed(
        bytes32 indexed claimHash,
        uint256 amount,
        uint256 timestamp
    );
    event CampaignClosed(
        uint256 totalRaised,
        uint256 totalClaimed,
        uint256 timestamp
    );

    // Modifiers
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

    modifier campaignActive() {
        require(isActive, "Campaign is not active");
        require(block.timestamp <= deadline, "Campaign deadline has passed");
        _;
    }

    // Constructor
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
        beneficiariesLocked = false;
        raisedAmount = 0;
        beneficiaryCount = 0;
        claimedCount = 0;
    }

    // Functions

    // Donor calls this to send USDC to the campaign
    // Donor must approve this contract on USDC before calling
    function donate(uint256 _amount) external nonReentrant campaignActive {
        require(_amount > 0, "Amount must be greater than 0");

        IERC20 usdc = IERC20(usdcToken);
        bool success = usdc.transferFrom(msg.sender, address(this), _amount);
        require(success, "USDC transfer failed");

        raisedAmount += _amount;
        donations[msg.sender] += _amount;

        emit DonationReceived(msg.sender, _amount, raisedAmount);
    }

    // Partner or HOPE admin registers verified beneficiaries
    // Only claim hashes stored on-chain — personal details stay on IPFS
    function registerBeneficiaries(
        bytes32[] calldata _claimHashes,
        string calldata _ipfsCID,
        uint256 _count
    ) external onlyPartnerOrAdmin {
        require(!beneficiariesLocked, "Beneficiaries already locked");
        require(_claimHashes.length == _count, "Hash count mismatch");
        require(_count > 0, "Must register at least one beneficiary");

        for (uint256 i = 0; i < _claimHashes.length; i++) {
            require(!claimHashExists[_claimHashes[i]], "Duplicate claim hash");
            claimHashExists[_claimHashes[i]] = true;
        }

        beneficiaryCount += _count;
        documentCID = _ipfsCID;

        emit BeneficiariesRegistered(_count, _ipfsCID, block.timestamp);
    }

    // Partner locks beneficiary list — no more additions after this
    function lockBeneficiaries() external onlyPartner {
        require(beneficiaryCount > 0, "No beneficiaries registered");
        beneficiariesLocked = true;
    }

    // Partner scans beneficiary QR code and calls this to release their share
    // Each beneficiary receives an equal split of total raised funds
    function claimFunds(
        bytes32 _claimHash
    ) external nonReentrant onlyPartnerOrAdmin {
        require(beneficiariesLocked, "Beneficiaries not locked yet");
        require(claimHashExists[_claimHash], "Invalid claim hash");
        require(!claimHashUsed[_claimHash], "Already claimed");
        require(beneficiaryCount > 0, "No beneficiaries registered");

        uint256 shareAmount = raisedAmount / beneficiaryCount;
        require(shareAmount > 0, "No funds to distribute");

        IERC20 usdc = IERC20(usdcToken);
        require(
            usdc.balanceOf(address(this)) >= shareAmount,
            "Insufficient balance"
        );

        // Update state before transfer (checks-effects-interactions pattern)
        claimHashUsed[_claimHash] = true;
        claimedCount++;

        bool success = usdc.transfer(partner, shareAmount);
        require(success, "Fund transfer failed");

        emit FundsClaimed(_claimHash, shareAmount, block.timestamp);
    }

    // Partner closes campaign and returns any remaining funds
    function closeCampaign() external onlyPartner nonReentrant {
        require(isActive, "Campaign already closed");
        isActive = false;

        IERC20 usdc = IERC20(usdcToken);
        uint256 remaining = usdc.balanceOf(address(this));

        if (remaining > 0) {
            bool success = usdc.transfer(partner, remaining);
            require(success, "Failed to return remaining funds");
        }

        emit CampaignClosed(raisedAmount, claimedCount, block.timestamp);
    }

    // View Functions (free to call — no gas)

    function getCampaignDetails()
        external
        view
        returns (
            address _partner,
            string memory _title,
            string memory _location,
            uint256 _goalAmount,
            uint256 _raisedAmount,
            uint256 _deadline,
            uint256 _beneficiaryCount,
            uint256 _claimedCount,
            bool _isActive,
            bool _beneficiariesLocked,
            string memory _documentCID
        )
    {
        return (
            partner,
            title,
            location,
            goalAmount,
            raisedAmount,
            deadline,
            beneficiaryCount,
            claimedCount,
            isActive,
            beneficiariesLocked,
            documentCID
        );
    }

    function verifyClaimHash(
        bytes32 _claimHash
    ) external view returns (bool isValid, bool hasBeenClaimed) {
        return (claimHashExists[_claimHash], claimHashUsed[_claimHash]);
    }

    function getBalance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }
}
