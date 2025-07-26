# Installations and Environment Setups

## LivestocX DApp — Extended Technical Guide

### 1. Installation & Environment Setup

#### 1.1 Prerequisites

* Node.js ≥ 18
* Yarn v1 or newer
* Git CLI
* MetaMask browser extension
* BlockDAG **Primordial** Testnet RPC endpoint

#### 1.2 Quick-start (one-liner)

```bash
git clone [https://github.com/livestocx-protocol/livestocx-dapp.git](https://github.com/livestocx-protocol/livestocx-dapp.git) && cd livestocx-dapp && yarn && yarn dev
```

#### 1.3 Step-by-step

1.  **Clone the monorepo**

    ```bash
    git clone [https://github.com/livestocx-protocol/livestocx-dapp.git](https://github.com/livestocx-protocol/livestocx-dapp.git)
    cd livestocx-dapp
    ```
2.  **Install dependencies** (front-end, contracts & tooling)

    ```bash
    yarn
    yarn workspace @livestocx/contracts install
    ```
3.  **Create an `.env`** at the project root:

    ```env
    NEXT_PUBLIC_PROJECT_ID=d3a4a6d5a7e1a3e6a9d1b2c5f8a7b3c2
    NEXT_PUBLIC_RPC_URL=[https://rpc.primordial.bdagscan.com](https://rpc.primordial.bdagscan.com)
    PRIVATE_KEY=your_deployer_private_key_here # used by Hardhat scripts
    ```
4.  **Compile contracts**

    ```bash
    yarn workspace @livestocx/contracts hardhat compile
    ```
5.  **Deploy to Primordial testnet**

    ```bash
    yarn workspace @livestocx/contracts hardhat run scripts/deploy.ts --network primordial
    ```
6.  **Run the DApp**

    ```bash
    yarn dev
    ```
7. **Open** `http://localhost:3000` and connect MetaMask to _Primordial_.

***

### 2. Smart-Contract Architecture

| Contract            | Standard                | Purpose                                               | Key Roles                                       |
| ------------------- | ----------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| `LivestockManager`  | Custom (UUPS, Pausable) | Tokenizes on-farm assets into fractional NFT listings | `DEFAULT_ADMIN`, `FARMER_ROLE`, `INVESTOR_ROLE` |
| `LivestockAssetNFT` | ERC-721                 | Represents ownership of the tokenized asset           | `MINTER_ROLE`                                   |
| `TUSDC`             | ERC-20 (6 decimals)     | Platform-pegged stablecoin used for primary markets   | `MINTER_ROLE`                                   |
| `Treasury`          | Pull-payment escrow     | Holds sale proceeds, distributes funds                | `DEFAULT_ADMIN`                                 |
| `PriceOracle`       | Chainlink AggregatorV3  | Off-chain price feeds for USD/BDAG conversion         | N/A                                             |

#### 2.1 Core Functions (LivestockManager)

```solidity
function createListing(
    uint256 totalShares,
    uint256 pricePerShare,   // 6-decimals (TUSDC)
    string  category,
    string  livestockType,
    Details calldata meta          // struct shown below
) external onlyRole(FARMER_ROLE); 

function invest(
    uint256 listingId,
    uint256 shares,
    uint256 maxPricePerShare
) external onlyRole(INVESTOR_ROLE);

function verifyListing(uint256 listingId)
    external onlyRole(DEFAULT_ADMIN);

function claimFunds() external;   // farmer withdrawal

struct Details {
    string  healthStatus;
    uint256 ageMonths;
    uint256 inspectionDate;        // Unix epoch
    string  insuranceId;
}
```

#### 2.2 Key Events

```solidity
event ListingCreated(
    uint256 indexed listingId,
    address indexed farmer,
    uint256 totalShares
);

event Invested(
    uint256 indexed listingId,
    address indexed investor,
    uint256 shares
);

event ListingVerified(
    uint256 indexed listingId,
    address indexed admin
);
```

#### 2.3 Security Features

* **Re-entrancy guard** on all external state-changing calls.
* **Pull-payment** model: proceeds are withdrawn by farmers with `claimFunds()` to avoid forced transfers.
* **EIP-712 typed-data** signed permits to allow gas-less approval of TUSDC.
* **Role-based access** using OpenZeppelin `AccessControl` for minting, verification and treasury operations.
* **Pausable** contract for emergency stops.

***

### 3. Front-end Usage Examples

#### 3.1 Create an Asset (Farmer)

```tsx
const { createAssetWithMetaMask } = useRealMetaMask();

await createAssetWithMetaMask({
  livestockType: 'Angus Cattle',
  totalShares: 1_000,
  pricePerShare: '150',     // 150 TUSDC
  category: 'Livestock',
  healthStatus: 'Excellent',
  age: 24,
  insuranceId: 'INS-2025-001'
});
```

#### 3.2 Invest in a Listing (Investor)

```tsx
const { investWithMetaMask } = useRealMetaMask();

await investWithMetaMask(
  listingId,          // uint256
  10,                 // shares to buy
  '160'               // max price tolerable
);
```

#### 3.3 Verify Listing (Admin)

```tsx
const { verifyListing } = useContractInteractions();
await verifyListing(listingId); // MetaMask pops up
```

***

### 4. API Documentation (TypeScript Typings)

```ts
/**
 * Returns metadata for a listing.
 * @param listingId Listing identifier
 */
getListingMetadata(listingId: BigNumberish): Promise<ListingMetadata>;

/**
 * Claims accumulated proceeds for `msg.sender` (farmer).
 * Emits {FundsClaimed}.
 */
claimFunds(): Promise<void>;

/**
 * Mints `amount` TUSDC to `to`.
 * REQUIRES: caller has MINTER_ROLE
 */
mint(to: string, amount: BigNumberish): Promise<void>;

export interface ListingMetadata {
  id: bigint;
  farmer: `0x${string}`;
  totalShares: bigint;
  pricePerShare: bigint;
  category: string;
  livestockType: string;
  isVerified: boolean;
}
```
