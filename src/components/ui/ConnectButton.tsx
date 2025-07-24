'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { injected, walletConnect } from '@wagmi/connectors';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ConnectButton() {
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showModal, setShowModal] = useState(false);

  const targetChainId = 1043; // BlockDAG Primordial Testnet

  const handleConnect = async (connector: any) => {
    try {
      connect({ connector });
      setShowModal(false);
      toast.success('Connecting to wallet...');
    } catch (error: any) {
      toast.error('Failed to connect wallet');
    }
  };

  const handleSwitchToBlockDAG = async () => {
    if (chainId !== targetChainId) {
      try {
        await switchChain({ chainId: targetChainId });
        toast.success('Switched to Primordial Testnet');
      } catch (error: any) {
        toast.error('Failed to switch network');
      }
    }
  };

  const isCorrectNetwork = chainId === targetChainId;

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        {!isCorrectNetwork && (
          <button
            onClick={handleSwitchToBlockDAG}
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Switch to BlockDAG
          </button>
        )}
        
        <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2">
          <div className={`h-2 w-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <span className="text-sm font-medium text-green-800">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        
        <button
          onClick={() => disconnect()}
          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
      >
        Connect Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-6 text-center">
              <h3 className="text-xl font-bold text-gray-800">Connect Your Wallet</h3>
              <p className="mt-2 text-gray-600">Choose a wallet to connect to LivestocX</p>
            </div>

            <div className="space-y-3">
              {connectors
                .filter(connector => connector.id !== 'safe') // Filter out problematic connectors
                .map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => handleConnect(connector)}
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 p-4 hover:border-green-500 hover:bg-green-50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      {connector.name === 'MetaMask' && <span>🦊</span>}
                      {connector.name === 'WalletConnect' && <span>🔗</span>}
                      {connector.name === 'Injected' && <span>💻</span>}
                    </div>
                    <span className="font-medium text-gray-800">{connector.name}</span>
                  </div>
                  
                  {isPending ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-500"></div>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
