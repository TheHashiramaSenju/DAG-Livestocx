# Data-Integrations

### 14. Advanced Integration Examples

#### 14.1 Web3Modal Integration with Custom Chains

```typescript
// src/lib/web3Config.ts
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!

const blockDAGPrimordial = {
  chainId: 1043,
  name: 'BlockDAG Primordial Testnet',
  currency: 'BDAG',
  explorerUrl: '[https://explorer.primordial.bdagscan.com](https://explorer.primordial.bdagscan.com)',
  rpcUrl: '[https://rpc.primordial.bdagscan.com](https://rpc.primordial.bdagscan.com)'
}

const metadata = {
  name: 'LivestocX',
  description: 'Agricultural Asset Tokenization Platform',
  url: '[https://livestocx.vercel.app](https://livestocx.vercel.app)',
  icons: ['[https://livestocx.vercel.app/icon.png](https://livestocx.vercel.app/icon.png)']
}

export const config = defaultWagmiConfig({ chains: [blockDAGPrimordial], projectId, metadata })

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  themeMode: 'light',
})
```

***

### 15. Real-Time Data Synchronization

#### 15.1 WebSocket Integration for Live Updates

A WebSocket server can be implemented to push real-time events from the blockchain to all connected clients, avoiding the need for constant polling.

```typescript
// Example client-side WebSocket connection
useEffect(() => {
  const ws = new WebSocket('wss://[api.livestocx.com/events](https://api.livestocx.com/events)');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Update state based on event type (e.g., LISTING_CREATED)
    toast.info(`New event: ${data.type}`);
    refreshData();
  };
  return () => ws.close();
}, [refreshData]);
```

***

### 16. Production Deployment Configuration

#### 16.1 Docker Configuration

```dockerfile
# Dockerfile for Next.js app
FROM node:18-alpine AS base

# Build stage
FROM base AS builder
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["yarn", "start"]
```

#### 16.2 Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: livestocx-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: livestocx
  template:
    metadata:
      labels:
        app: livestocx
    spec:
      containers:
      - name: frontend
        image: livestocx/frontend:latest
        ports:
        - containerPort: 3000
```

***

### 17. Comprehensive Testing Strategy

#### 17.1 End-to-End Testing with Playwright

```typescript
// e2e/farmer-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Farmer Asset Creation Workflow', () => {
  test('should allow a farmer to create a new asset listing', async ({ page }) => {
    await page.goto('http://localhost:3000/farmer-dashboard');
    await page.click('button:has-text("Create New Asset")');
    
    await page.fill('input[name="livestockType"]', 'Highland Cattle');
    await page.fill('input[name="totalShares"]', '1000');
    await page.click('button:has-text("Submit for Verification")');
    
    // Mock MetaMask interaction here if needed
    
    await expect(page.locator('text=Asset submitted successfully')).toBeVisible();
  });
});
```

***

### 18. Security Audit Checklist

#### 18.1 Smart Contract Security

* [x] Re-entrancy guards implemented.
* [x] Integer overflow/underflow protection (Solidity >0.8).
* [x] Access control checks on all critical functions.
* [x] Emergency pause mechanism in place.
* [x] Use of `block.timestamp` is secure (no business logic dependency).
* [x] No unchecked external calls.
* [x] Third-party audit scheduled.

#### 18.2 Frontend Security Measures

* [x] Input sanitization on all user-provided data.
* [x] Address validation using `ethers.isAddress`.
* [x] Protection against Cross-Site Scripting (XSS).
* [x] Secure handling of local storage.
* [x] Content Security Policy (CSP) headers configured.

***

### 19. Community & Governance Features

#### 19.1 Decentralized Governance Implementation

A future phase includes a governance module where LSTX token holders can propose and vote on platform upgrades, fee changes, and new features.

```solidity
// Future governance contract structure
contract LivestocXGovernance {
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    IERC20 public governanceToken; // LSTX token for voting
    uint256 public proposalThreshold; // Min tokens to create a proposal

    event ProposalCreated(uint256 id, address proposer, string description);
    event Voted(uint256 proposalId, address voter, bool support, uint256 voteWeight);

    constructor(address _tokenAddress, uint256 _proposalThreshold) {
        governanceToken = IERC20(_tokenAddress);
        proposalThreshold = _proposalThreshold;
    }

    function createProposal(string memory _description) external {
        require(governanceToken.balanceOf(msg.sender) >= proposalThreshold, "Insufficient tokens to create proposal");
        
        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.proposer = msg.sender;
        newProposal.description = _description;
        newProposal.deadline = block.timestamp + 7 days;
        
        emit ProposalCreated(proposalCount, msg.sender, _description);
    }

    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp < proposal.deadline, "Voting period has ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 voteWeight = governanceToken.balanceOf(msg.sender);
        require(voteWeight > 0, "No voting power");

        if (_support) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.againstVotes += voteWeight;
        }

        proposal.hasVoted[msg.sender] = true;
        emit Voted(_proposalId, msg.sender, _support, voteWeight);
    }

    // Additional functions for executing passed proposals would follow
}
```
