import { createConfig, http } from 'wagmi';

// ✅ FIX: Define the custom chain as a simple constant object.
// The `defineChain` helper is no longer used in recent wagmi versions.
export const blockDagChain = {
  id: 1043,
  name: 'Primordial Testnet',
  nativeCurrency: {
    name: 'BlockDAG',
    symbol: 'BDAG',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.primordial.bdagscan.com'] },
  },
  blockExplorers: {
    default: { name: 'BDAGScan', url: 'https://explorer.blockdag.network' },
  },
  testnet: true,
} as const; // Using 'as const' provides stricter typing, which is good practice.

// 2. Create the configuration using ONLY your custom chain.
// This ensures your dApp is correctly configured for your specific network.
export const config = createConfig({
  chains: [blockDagChain],
  transports: {
    [blockDagChain.id]: http(),
  },
});
