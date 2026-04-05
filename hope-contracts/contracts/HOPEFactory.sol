// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./HOPECampaign.sol";

contract HOPEFactory {

  // ─── State Variables ──────────────────────────────────────────────────────
  address public owner;
  address public hopeAdmin;
  address public usdcToken;
  bool public isPaused;

  address[] public allCampaigns;
  mapping(address => address[]) public partnerCampaigns;
  mapping(address => bool) public isCampaignFromFactory;

  // ─── Struct ───────────────────────────────────────────────────────────────
  // Groups campaign creation params to avoid "stack too deep" error
  struct CampaignParams {
    string title;
    string description;
    string location;
    string category;
    string documentCID;
    uint256 goalAmount;
    uint256 deadline;
  }

  // ─── Events ───────────────────────────────────────────────────────────────
  event CampaignCreated(
    address indexed campaignAddress,
    address indexed partner,
    string title,
    uint256 goalAmount,
    uint256 deadline,
    uint256 timestamp
  );
  event FactoryPaused(address by, uint256 timestamp);
  event FactoryUnpaused(address by, uint256 timestamp);
  event AdminUpdated(address newAdmin, uint256 timestamp);

  // ─── Modifiers ────────────────────────────────────────────────────────────
  modifier onlyOwner() {
    require(msg.sender == owner, "Only HOPE owner can do this");
    _;
  }

  modifier notPaused() {
    require(!isPaused, "Factory is paused");
    _;
  }

  // ─── Constructor ──────────────────────────────────────────────────────────
  constructor(address _hopeAdmin, address _usdcToken) {
    owner     = msg.sender;
    hopeAdmin = _hopeAdmin;
    usdcToken = _usdcToken;
    isPaused  = false;
  }

  // ─── Functions ────────────────────────────────────────────────────────────

  // Deploys a new HOPECampaign contract for the calling partner
  // Uses a struct to group params and avoid stack too deep error
  function createCampaign(CampaignParams calldata params)
    external
    notPaused
    returns (address)
  {
    require(bytes(params.title).length > 0, "Title cannot be empty");
    require(params.goalAmount >= 100 * 1e6, "Minimum goal is 100 USDC");
    require(
      params.deadline > block.timestamp + 1 days,
      "Deadline must be at least 1 day from now"
    );

    HOPECampaign campaignContract = new HOPECampaign(
      msg.sender,
      hopeAdmin,
      usdcToken,
      params.title,
      params.description,
      params.location,
      params.category,
      params.documentCID,
      params.goalAmount,
      params.deadline
    );

    address campaignAddress = address(campaignContract);

    allCampaigns.push(campaignAddress);
    partnerCampaigns[msg.sender].push(campaignAddress);
    isCampaignFromFactory[campaignAddress] = true;

    emit CampaignCreated(
      campaignAddress,
      msg.sender,
      params.title,
      params.goalAmount,
      params.deadline,
      block.timestamp
    );

    return campaignAddress;
  }

  // ─── View Functions ───────────────────────────────────────────────────────

  function getAllCampaigns() external view returns (address[] memory) {
    return allCampaigns;
  }

  function getPartnerCampaigns(address _partner) external view returns (address[] memory) {
    return partnerCampaigns[_partner];
  }

  function getCampaignCount() external view returns (uint256) {
    return allCampaigns.length;
  }

  // ─── Admin Functions ──────────────────────────────────────────────────────

  function pauseFactory() external onlyOwner {
    isPaused = true;
    emit FactoryPaused(msg.sender, block.timestamp);
  }

  function unpauseFactory() external onlyOwner {
    isPaused = false;
    emit FactoryUnpaused(msg.sender, block.timestamp);
  }

  function updateHopeAdmin(address _newAdmin) external onlyOwner {
    require(_newAdmin != address(0), "Invalid address");
    hopeAdmin = _newAdmin;
    emit AdminUpdated(_newAdmin, block.timestamp);
  }
}
