# Smart Contract Archtiecture

### 🏗️ Smart Contract Architecture

#### Core Contracts

**LivestockManager.sol** - Main platform logic

```solidity
- Asset tokenization and listing management
- Investment processing and share distribution  
- Role-based access control (Farmer/Investor/Admin/Auditor)
- Emergency pause functionality
- Upgradeable proxy pattern
```

**LivestockAssetNFT.sol** - Asset representation

```solidity
- ERC-721 compliant livestock NFTs
- Metadata management with IPFS integration
- Batch minting capabilities
- Transfer restrictions for verified assets
```

**TestStablecoin.sol** - Platform currency

```solidity
- ERC-20 TUSDC for stable value transactions
- Minting/burning capabilities for admins
- Platform fee collection mechanism
- Multi-signature treasury support
```

#### Deployed Contracts (BlockDAG Primordial Testnet)

```
LivestockManager: 0x724550c719e4296B8B75C8143Ab6228141bC7747
LivestockAssetNFT: 0x6740bcf0BF975a270d835617Bb516D7c4ACEceA4  
TestStablecoin: 0xcE3C341664C9D836b7748429Afae9A19088bf9Be

Transacted NFTs Addresses 

Minted NFTs - 0x6740bcf0BF975a270d835617Bb516D7c4ACEceA4 

NFTs Names 
ERC721 - Cattle, Jersey Cow, Kaangeyan Breed

```
