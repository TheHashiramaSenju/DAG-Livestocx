'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import toast from 'react-hot-toast';

// Defines the shape of the MetaMask state object
export interface MetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  balance: string | null;
  error: string | null;
}

// Defines the shape of the transaction state object
export interface TransactionState {
  isLoading: boolean;
  hash: string | null;
  error: string | null;
  receipt: any | null;
}

// Main hook to manage MetaMask interactions
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

  // Utility function to check if MetaMask extension is installed
  const isMetaMaskInstalled = useCallback(() => {
    // The `window as any` cast is used here to bypass potential TypeScript errors
    // if multiple libraries declare the `ethereum` property differently.
    return typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask;
  }, []);

  // Effect to synchronize the hook's state with wagmi's state
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

  // Function to initiate a connection to MetaMask
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

  // Function to disconnect the wallet
  const disconnectMetaMask = useCallback(() => {
    disconnect();
    setMetaMaskState(prev => ({
      ...prev,
      isConnected: false,
      account: null,
      error: null,
    }));
    toast('MetaMask disconnected');
  }, [disconnect]);

  // Function to switch to the custom BlockDAG network
  const switchToBlockDAG = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
        toast.error("MetaMask is not available.");
        return false;
    }

    try {
      if (switchChain) {
        await switchChain({ chainId: 1043 }); // BlockDAG chain ID
        toast.success('Switched to BlockDAG network!');
        return true;
      } else {
        // Fallback for older wallets: manual network switch
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x413' }], // 1043 in hexadecimal
            });
            return true;
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // If the network is not added, prompt the user to add it
              await ethereum.request({
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
    } catch (error: any) {
      toast.error(`Failed to switch network: ${error.message}`);
      return false;
    }
  }, [switchChain]);

  // A generic function to execute any transaction, showing a MetaMask popup
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
      
      if ((error as any).code === 4001) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Transaction failed: ${errorMessage}`);
      }
      return null;
    }
  }, [walletClient]);

  // A specific implementation of executeTransaction for approving tokens
  const approveToken = useCallback(async (tokenAddress: string, spenderAddress: string, amount: string): Promise<boolean> => {
    if (!walletClient) {
      toast.error('Please connect MetaMask first');
      return false;
    }

    try {
      setTransactionState(prev => ({ ...prev, isLoading: true }));
      
      // Manually encode the 'approve' function call data
      const approveData = `0x095ea7b3${spenderAddress.slice(2).padStart(64, '0')}${BigInt(amount).toString(16).padStart(64, '0')}`;
      
      const txHash = await executeTransaction({
        to: tokenAddress,
        data: approveData,
        gasLimit: '100000', // Set a reasonable gas limit for an approval
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

  // Function to prompt the user to add a new token to their wallet
  const addTokenToWallet = useCallback(async (tokenData: {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
  }) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;
    
    try {
      await ethereum.request({
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
    // State objects
    metaMask: metaMaskState,
    transaction: transactionState,
    
    // Action functions
    connectMetaMask,
    disconnectMetaMask,
    switchToBlockDAG,
    executeTransaction,
    approveToken,
    addTokenToWallet,
    
    // Derived boolean utilities
    isCorrectNetwork: chain?.id === 1043,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
}

// ✅ FIX: The conflicting `declare global` block has been removed.
// The types from the wagmi/viem libraries are sufficient.
