
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol"; // Path updated
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
interface ILivestockAssetNFT {
    function safeMint(address to, string memory uri) external returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferOwnership(address newOwner) external;
}

contract LivestockManager is
    Initializable, PausableUpgradeable, AccessControlUpgradeable,
    UUPSUpgradeable, ReentrancyGuardUpgradeable
{
    using Strings for uint256;

    //  Roles 
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");

    // State Variables - @mukesh - committed 15 JULY 2025
    IERC20 public acceptedStablecoin;
    ILivestockAssetNFT public livestockAssetNFT;

    // Structs @vignesh -> Please update the contract keys in next github commit
    struct LivestockDetails {
        string healthStatus; 
        uint256 age;         
        uint256 lastVaccinationDate;
        string insuranceId;
    }

    struct Listing {
        uint256 tokenId;
        address owner;
        uint256 totalShares;
        uint256 availableShares;
        uint256 pricePerShare;
        string category;
        string livestockType;
        LivestockDetails details;
        bool isVerified;
        bool isActive;
        uint256 createdAt;
    }
    
    struct RoleRequest {
        address user;
        bytes32 role;
        bool pending;
    }

    struct Investment {
        uint256 listingId;
        uint256 sharesOwned;
    }

    // --- Mappings ---
    mapping(uint256 => Listing) public listings;
    mapping(address => Investment[]) public userInvestments;
    mapping(uint256 => mapping(address => uint256)) public investmentShares;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => bool) public hasRequestedRole;
    RoleRequest[] public roleRequests;

    uint256 public listingCounter;

    // --- Events ---
    event ListingCreated(uint256 indexed listingId, uint256 indexed tokenId, address indexed owner);
    event ListingVerified(uint256 indexed listingId, address indexed auditor);
    event InvestmentMade(uint256 indexed listingId, address indexed investor, uint256 numberOfShares, uint256 totalCost);
    event FundsClaimed(address indexed owner, uint256 amount);
    event RoleRequested(address indexed user, bytes32 indexed role);
    event RoleApproved(address indexed user, bytes32 indexed role, address indexed admin);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address _admin, address _livestockAssetNFT, address _acceptedStablecoin) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PLATFORM_ADMIN_ROLE, _admin);
        _grantRole(AUDITOR_ROLE, _admin);
        _grantRole(FARMER_ROLE, _admin); // Admin is also a farmer for testing
        _grantRole(INVESTOR_ROLE, _admin); // Admin is also an investor for testing

        livestockAssetNFT = ILivestockAssetNFT(_livestockAssetNFT);
        acceptedStablecoin = IERC20(_acceptedStablecoin);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function requestRole(bytes32 _role) external whenNotPaused {
        require(_role == FARMER_ROLE || _role == INVESTOR_ROLE, "Invalid role");
        require(!hasRole(FARMER_ROLE, msg.sender) && !hasRole(INVESTOR_ROLE, msg.sender), "Already has role");
        require(!hasRequestedRole[msg.sender], "Request pending");

        hasRequestedRole[msg.sender] = true;
        roleRequests.push(RoleRequest({ user: msg.sender, role: _role, pending: true }));
        emit RoleRequested(msg.sender, _role);
    }
    
    function getPendingRoleRequests() public view returns (RoleRequest[] memory) {
        uint pendingCount = 0;
        for (uint i = 0; i < roleRequests.length; i++) {
            if (roleRequests[i].pending) {
                pendingCount++;
            }
        }
        RoleRequest[] memory pending = new RoleRequest[](pendingCount);
        uint counter = 0;
        for (uint i = 0; i < roleRequests.length; i++) {
            if (roleRequests[i].pending) {
                pending[counter] = roleRequests[i];
                counter++;
            }
        }
        return pending;
    }

    function approveRole(address _user, bytes32 _role, uint _requestIndex) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(roleRequests[_requestIndex].user == _user, "Index mismatch");
        require(roleRequests[_requestIndex].pending, "Not pending");
        roleRequests[_requestIndex].pending = false;
        grantRole(_role, _user);
        emit RoleApproved(_user, _role, msg.sender);
    }

    function createListing(
        uint256 _totalShares,
        uint256 _pricePerShare,
        string memory _category,
        string memory _livestockType,
        LivestockDetails memory _details
    ) external whenNotPaused nonReentrant onlyRole(FARMER_ROLE) {
        require(_totalShares > 0, "Shares must be > 0");
        require(_pricePerShare > 0, "Price must be > 0");

        string memory metadataJson = _buildMetadataJSON(_livestockType, _category, _details);
        uint256 newTokenId = livestockAssetNFT.safeMint(msg.sender, metadataJson);
        
        listingCounter++;
        uint256 newListingId = listingCounter;

        listings[newListingId] = Listing({
            tokenId: newTokenId,
            owner: msg.sender,
            totalShares: _totalShares,
            availableShares: _totalShares,
            pricePerShare: _pricePerShare,
            category: _category,
            livestockType: _livestockType,
            details: _details,
            isVerified: false,
            isActive: true,
            createdAt: block.timestamp
        });

        emit ListingCreated(newListingId, newTokenId, msg.sender);
    }
    
    function invest(uint256 _listingId, uint256 _numberOfShares) external whenNotPaused nonReentrant onlyRole(INVESTOR_ROLE) {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(listing.availableShares >= _numberOfShares, "Not enough shares");
        require(_numberOfShares > 0, "Must buy > 0 shares");

        uint256 totalCost = _numberOfShares * listing.pricePerShare;
        require(acceptedStablecoin.balanceOf(msg.sender) >= totalCost, "Insufficient balance");
        require(acceptedStablecoin.allowance(msg.sender, address(this)) >= totalCost, "Check allowance");

        listing.availableShares -= _numberOfShares;
        
        if (investmentShares[_listingId][msg.sender] == 0) {
            userInvestments[msg.sender].push(Investment(_listingId, _numberOfShares));
        } else {
             for(uint i=0; i < userInvestments[msg.sender].length; i++){
                if(userInvestments[msg.sender][i].listingId == _listingId){
                    userInvestments[msg.sender][i].sharesOwned += _numberOfShares;
                    break;
                }
            }
        }
        investmentShares[_listingId][msg.sender] += _numberOfShares;

        acceptedStablecoin.transferFrom(msg.sender, address(this), totalCost);
        pendingWithdrawals[listing.owner] += totalCost;

        emit InvestmentMade(_listingId, msg.sender, _numberOfShares, totalCost);
    }

    function verifyListing(uint256 _listingId) external onlyRole(AUDITOR_ROLE) {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(!listing.isVerified, "Already verified");
        listing.isVerified = true;
        emit ListingVerified(_listingId, msg.sender);
    }

    function claimFunds() external nonReentrant {
        uint256 amountToClaim = pendingWithdrawals[msg.sender];
        require(amountToClaim > 0, "No funds");
        pendingWithdrawals[msg.sender] = 0;
        acceptedStablecoin.transfer(msg.sender, amountToClaim);
        emit FundsClaimed(msg.sender, amountToClaim);
    }
    
    // THE FIX: changed 'view' to 'pure' **
    function _buildMetadataJSON(string memory name, string memory category, LivestockDetails memory details) internal pure returns (string memory) {
        string memory json = string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(abi.encodePacked(
                '{"name":"', name, '",',
                '"description":"A fractionalized livestock asset on LivestocX.",',
                '"image":"ipfs://bafybeifkbyreyjloq36s52xfj7n22a7dtk22b3s2ce6k3y4a6z5f5z6z6y",', // A generic cow image placeholder
                '"attributes":[',
                '{"trait_type":"Category","value":"', category, '"},',
                '{"trait_type":"Health Status","value":"', details.healthStatus, '"},',
                '{"trait_type":"Age (months)","value":"', details.age.toString(), '"},',
                '{"trait_type":"Insurance ID","value":"', details.insuranceId, '"},',
                '{"trait_type":"Last Vaccination","display_type":"date","value":', details.lastVaccinationDate.toString(), '}',
                ']}'
            )))
        ));
        return json;
    }

    // View Functions 
    function getAllListings() public view returns (Listing[] memory) {
        uint activeCount = 0;
        for (uint i = 1; i <= listingCounter; i++) { if (listings[i].isActive) activeCount++; }
        Listing[] memory allListings = new Listing[](activeCount);
        uint counter = 0;
        for (uint i = 1; i <= listingCounter; i++) { if (listings[i].isActive) { allListings[counter] = listings[i]; counter++; }}
        return allListings;
    }
    
    function getMyFarmerListings() public view onlyRole(FARMER_ROLE) returns (Listing[] memory) {
        uint myCount = 0;
        for (uint i = 1; i <= listingCounter; i++) { if (listings[i].owner == msg.sender) myCount++; }
        Listing[] memory myListings = new Listing[](myCount);
        uint counter = 0;
        for (uint i = 1; i <= listingCounter; i++) { if (listings[i].owner == msg.sender) { myListings[counter] = listings[i]; counter++; }}
        return myListings;
    }

    function getMyInvestments() public view onlyRole(INVESTOR_ROLE) returns (Investment[] memory) {
        return userInvestments[msg.sender];
    }

    // Admin Functions 
    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) { _unpause(); }
}


//  Base64 encoding library
library Base64 {
    bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        bytes memory TBytes = TABLE;

        uint256 L = data.length;
        string memory result = new string(4 * ((L + 2) / 3));
        bytes memory R = bytes(result);
        uint256 i;
        uint256 j = 0;

        for (i = 0; i < L; i += 3) {
            uint256 val = uint256(uint8(data[i]));
            val = i + 1 < L ? val * 256 + uint256(uint8(data[i+1])) : val * 256 * 256;
            val = i + 2 < L ? val * 256 + uint256(uint8(data[i+2])) : val * 256 * 256;
            
            R[j+0] = TBytes[val >> 18];
            R[j+1] = TBytes[(val >> 12) & 63];
            R[j+2] = i + 1 < L ? TBytes[(val >> 6) & 63] : bytes1("=")[0];
            R[j+3] = i + 2 < L ? TBytes[val & 63] : bytes1("=")[0];
            j += 4;
        }
        return result;
    }
}
