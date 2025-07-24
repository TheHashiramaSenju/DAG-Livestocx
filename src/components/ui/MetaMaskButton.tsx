'use client';

import React, { useState, useEffect } from 'react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useAccount, useBalance } from 'wagmi';
import toast from 'react-hot-toast';

interface MetaMaskButtonProps {
  className?: string;
  onConnectionChange?: (connected: boolean) => void;
  showBalance?: boolean;
  showNetwork?: boolean;
}

export const MetaMaskButton: React.FC<MetaMaskButtonProps> = ({
  className = '',
  onConnectionChange,
  showBalance = true,
  showNetwork = true,
}) => {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const {
    metaMask,
    connectMetaMask,
    disconnectMetaMask,
    switchToBlockDAG,
    isCorrectNetwork,
    isMetaMaskInstalled,
  } = useMetaMask();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Notify parent of connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(isConnected);
    }
  }, [isConnected, onConnectionChange]);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      toast.error('MetaMask not detected!');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    const success = await connectMetaMask();
    if (success) {
      toast.success('MetaMask connected successfully!');
    }
  };

  const handleDisconnect = () => {
    disconnectMetaMask();
    setIsDropdownOpen(false);
  };

  const handleSwitchNetwork = async () => {
    const success = await switchToBlockDAG();
    if (success) {
      toast.success('Switched to BlockDAG network!');
    }
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard!');
      setIsDropdownOpen(false);
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={metaMask.isConnecting}
        className={`
          relative overflow-hidden
          bg-gradient-to-r from-orange-500 to-orange-600
          hover:from-orange-600 hover:to-orange-700
          text-white font-semibold py-3 px-6 rounded-lg
          transition-all duration-300
          transform hover:scale-105
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {metaMask.isConnecting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Connecting...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
            Connect MetaMask
          </div>
        )}
      </button>
    );
  }

  // Connected state
  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-lg
          font-semibold transition-all duration-200
          ${isCorrectNetwork 
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
            : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
          }
          ${className}
        `}
      >
        <div className={`w-3 h-3 rounded-full animate-pulse ${
          isCorrectNetwork ? 'bg-green-300' : 'bg-red-300'
        }`}></div>
        
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          {showNetwork && (
            <span className="text-xs opacity-80">
              {isCorrectNetwork ? 'BlockDAG' : 'Wrong Network'}
            </span>
          )}
        </div>
        
        <svg 
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">MetaMask Connected</h3>
                  <p className="text-sm text-white/80">
                    {address?.slice(0, 8)}...{address?.slice(-6)}
                  </p>
                </div>
              </div>
            </div>

            {/* Wrong network warning */}
            {!isCorrectNetwork && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-red-800">Wrong Network</h4>
                    <p className="text-sm text-red-600">Please switch to BlockDAG</p>
                  </div>
                  <button
                    onClick={handleSwitchNetwork}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Switch
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Balance */}
              {showBalance && balance && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">BDAG Balance</span>
                  <span className="font-bold text-gray-800">{Number(balance.formatted).toFixed(4)}</span>
                </div>
              )}

              {/* Network */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Network</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium text-gray-800">
                    {chain?.name || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 space-y-2">
                <button
                  onClick={copyAddress}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Address
                </button>
                
                <button
                  onClick={() => window.open(`https://explorer.blockdag.network/address/${address}`, '_blank')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on Explorer
                </button>
              </div>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Disconnect MetaMask
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
