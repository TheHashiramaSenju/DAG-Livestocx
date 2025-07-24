"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from 'wagmi/connectors';
import { http } from 'wagmi';
import { primordialTestnet } from '../chains';
import { Toaster } from 'react-hot-toast';

let config: any = null;

if (typeof window !== 'undefined') {
  config = createConfig({
    chains: [primordialTestnet],
    connectors: [
      injected({ target: 'metaMask' }),
      walletConnect({ projectId: '5bd2fb1271f048ef01b0252c4758ca7f' }),
    ],
    transports: {
      [primordialTestnet.id]: http('https://rpc.primordial.bdagscan.com'),
    },
    ssr: false,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export default function Web3ProviderWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <Toaster position="top-center" />
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}
