# Troubleshooting

### Troubleshooting

| Symptom                                  | Likely Cause                          | Resolution                                                                                                                |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| MetaMask window never appears            | Wallet not connected or wrong chain   | 1. Open MetaMask, select _Primordial_. 2. Reload page and reconnect.                                                      |
| `VM Exception: revert NOT_AUTHORISED`    | Caller lacks the correct role         | Ensure the current wallet has `FARMER_ROLE`, `INVESTOR_ROLE`, or `DEFAULT_ADMIN`. Use the Admin dashboard to grant roles. |
| `transaction underpriced` when deploying | Hardhat gas price too low vs. network | Add `gasPrice: 15000000000` (15 gwei) in `hardhat.config.ts` network section.                                             |
| Front-end shows stale data               | Caching or RPC lag                    | Click **Refresh** in dashboards or perform a hard refresh (Ctrl+Shift+R).                                                 |
| `network mismatch` toast on connect      | MetaMask points to wrong RPC          | Manually switch to BlockDAG _Primordial_ (Chain ID 1043) in MetaMask.                                                     |
