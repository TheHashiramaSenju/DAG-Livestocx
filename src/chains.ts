import { defineChain } from 'viem'

export const primordialTestnet = defineChain({
  id: 1043,
  name: 'Primordial Testnet',
  network: 'primordial',
  nativeCurrency: {
    decimals: 18,
    name: 'BDAG',
    symbol: 'BDAG',
  },
  rpcUrls: {
    default: { http: ['https://rpc.primordial.bdagscan.com'] },
  },
  blockExplorers: {
    default: { name: 'BlockDAG Explorer', url: 'https://explorer.blockdag.network' },
  },
  testnet: true,
})
