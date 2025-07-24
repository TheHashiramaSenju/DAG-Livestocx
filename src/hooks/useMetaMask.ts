'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import toast from 'react-hot-toast';

export interface MetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  balance: string | null;
  error: string | null;
}

export interface TransactionState {
  isLoading: boolean;
  hash: string | null;
  error: string | null;
  receipt: any | null;
}

export function useMetaMask() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [metaMaskState, setMetaMaskState] = useState<MetaMaskState>({
    isInstalled: false,
    isConnected: false,
    isConnecting: false,
    account: null,
    chainId: null,
    balance: null,
    error: null,
  });

  const [transactionState, setTransactionState] = useState<TransactionState>({
    isLoading: false,
    hash: null,
    error: null,
    receipt: null,
  });

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
  }, []);

  // Initialize MetaMask state
  useEffect(() => {
    setMetaMaskState(prev => ({
      ...prev,
      isInstalled: isMetaMaskInstalled(),
      isConnected,
      isConnecting: isPending,
      account: address || null,
      chainId: chain?.id || null,
    }));
  }, [isMetaMaskInstalled, isConnected, isPending, address, chain]);

  // Connect to MetaMask
  const connectMetaMask = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to continue');
      window.open('https://metamask.io/download/', '_blank');
      return false;
    }

    try {
      setMetaMaskState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      const injectedConnector = connectors.find(
        connector => connector.id === 'injected' || connector.name.toLowerCase().includes('metamask')
      );
      
      if (injectedConnector) {
        await connect({ connector: injectedConnector });
        toast.success('MetaMask connected successfully!');
        return true;
      } else {
        throw new Error('MetaMask connector not found');
      }
    } catch (error: any) {
      setMetaMaskState(prev => ({ ...prev, error: error.message }));
      toast.error(`Connection failed: ${error.message}`);
      return false;
    } finally {
      setMetaMaskState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [isMetaMaskInstalled, connectors, connect]);

  // Disconnect from MetaMask
  const disconnectMetaMask = useCallback(() => {
    disconnect();
    setMetaMaskState(prev => ({
      ...prev,
      isConnected: false,
      account: null,
      error: null,
    }));
    toast.info('MetaMask disconnected');
  }, [disconnect]);

  // Switch to BlockDAG network
  const switchToBlockDAG = useCallback(async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: 1043 }); // BlockDAG chain ID
        toast.success('Switched to BlockDAG network!');
        return true;
      } else {
        // Fallback to manual network switch
        if (typeof window !== 'undefined' && window.ethereum) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x413' }], // 1043 in hex
            });
            return true;
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Network not added, try to add it
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x413',
                  chainName: 'Primordial Testnet',
                  nativeCurrency: {
                    name: 'BDAG',
                    symbol: 'BDAG',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc.primordial.bdagscan.com'],
                  blockExplorerUrls: ['https://explorer.blockdag.network'],
                }],
              });
              toast.success('BlockDAG network added to MetaMask!');
              return true;
            }
            throw switchError;
          }
        }
        return false;
      }
    } catch (error: any) {
      toast.error(`Failed to switch network: ${error.message}`);
      return false;
    }
  }, [switchChain]);

  // Execute transaction with MetaMask popup
  const executeTransaction = useCallback(async (transaction: {
    to: string;
    data?: string;
    value?: string;
    gasLimit?: string;
  }) => {
    if (!walletClient) {
      toast.error('Please connect MetaMask first');
      return null;
    }

    setTransactionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const txHash = await walletClient.sendTransaction({
        to: transaction.to as `0x${string}`,
        data: transaction.data as `0x${string}`,
        value: transaction.value ? BigInt(transaction.value) : undefined,
        gas: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
      });

      setTransactionState(prev => ({ ...prev, hash: txHash }));
      toast.success('Transaction sent! Check MetaMask for confirmation.');
      
      return txHash;
    } catch (error: any) {
      const errorMessage = error.message || 'Transaction failed';
      setTransactionState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      
      if (error.code === 4001) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Transaction failed: ${errorMessage}`);
      }
      return null;
    }
  }, [walletClient]);

  // Approve token spending (triggers MetaMask popup)
  const approveToken = useCallback(async (tokenAddress: string, spenderAddress: string, amount: string): Promise<boolean> => {
    if (!walletClient) {
      toast.error('Please connect MetaMask first');
      return false;
    }

    try {
      setTransactionState(prev => ({ ...prev, isLoading: true }));
      
      // ERC20 approve function signature
      const approveData = `0x095ea7b3${spenderAddress.slice(2).padStart(64, '0')}${BigInt(amount).toString(16).padStart(64, '0')}`;
      
      const txHash = await executeTransaction({
        to: tokenAddress,
        data: approveData,
        gasLimit: '100000', // 100k gas limit
      });

      if (txHash) {
        toast.success('Token approval successful!');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message}`);
      return false;
    } finally {
      setTransactionState(prev => ({ ...prev, isLoading: false }));
    }
  }, [walletClient, executeTransaction]);

 
  const addTokenToWallet = useCallback(async (tokenData: {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
  }) => {
    if (typeof window === 'undefined' || !window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: tokenData,
        },
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    // State
    metaMask: metaMaskState,
    transaction: transactionState,
    
    // Actions
    connectMetaMask,
    disconnectMetaMask,
    switchToBlockDAG,
    executeTransaction,
    approveToken,
    addTokenToWallet,
    
    // Utilities
    isCorrectNetwork: chain?.id === 1043,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
