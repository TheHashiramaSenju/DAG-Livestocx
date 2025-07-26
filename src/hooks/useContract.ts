'use client';

import React, { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';

// This custom hook manages data shared across different dashboards using localStorage.
export function useCrossDashboardData() {
  const [assets, setAssets] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to read from localStorage and update the state.
  const refreshData = useCallback(() => {
    try {
      const userAssets = JSON.parse(localStorage.getItem('userAssets') || '[]');
      const userInvestments = JSON.parse(localStorage.getItem('userInvestments') || '[]');
      setAssets(userAssets);
      setInvestments(userInvestments);
    } catch (error) {
      console.error('Error refreshing data from localStorage:', error);
    }
  }, []);

  // Effect to refresh data periodically and on component mount.
  React.useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000); // Poll for changes
    return () => clearInterval(interval);
  }, [refreshData]);

  // Effect to listen for storage events from other tabs/windows.
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userAssets' || e.key === 'userInvestments') {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  // Adds a new asset to localStorage.
  const addAsset = useCallback((assetData: any) => {
    const existingAssets = JSON.parse(localStorage.getItem('userAssets') || '[]');
    const newAsset = {
      id: Date.now(),
      ...assetData,
      createdAt: new Date().toISOString(),
      status: 'pending', // Initial status
      isVerified: false,
      isActive: true
    };
    const updatedAssets = [...existingAssets, newAsset];
    localStorage.setItem('userAssets', JSON.stringify(updatedAssets));
    refreshData();
    window.dispatchEvent(new CustomEvent('assetsUpdated', { detail: updatedAssets }));
    return newAsset;
  }, [refreshData]);

  // Adds a new investment to localStorage.
  const addInvestment = useCallback((investmentData: any) => {
    const existingInvestments = JSON.parse(localStorage.getItem('userInvestments') || '[]');
    const newInvestment = {
      id: Date.now(),
      ...investmentData,
      timestamp: new Date().toISOString()
    };
    const updatedInvestments = [...existingInvestments, newInvestment];
    localStorage.setItem('userInvestments', JSON.stringify(updatedInvestments));
    refreshData();
    window.dispatchEvent(new CustomEvent('investmentsUpdated', { detail: updatedInvestments }));
    return newInvestment;
  }, [refreshData]);

  // Updates the status of an existing asset.
  const updateAssetStatus = useCallback((assetId: number, status: string) => {
    const existingAssets = JSON.parse(localStorage.getItem('userAssets') || '[]');
    const updatedAssets = existingAssets.map((asset: any) =>
      asset.id === assetId ? { ...asset, status, isVerified: status === 'verified' } : asset
    );
    localStorage.setItem('userAssets', JSON.stringify(updatedAssets));
    refreshData();
    return updatedAssets;
  }, [refreshData]);

  return {
    assets,
    investments,
    isLoading,
    refreshData,
    addAsset,
    addInvestment,
    updateAssetStatus
  };
}

// This hook handles direct interactions with MetaMask and smart contracts.
export function useRealMetaMask() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const { addAsset, addInvestment } = useCrossDashboardData();

  // The `error` object comes from `useWriteContract`, not the parent hook.
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Function to create a new asset by calling the smart contract.
  const createAssetWithMetaMask = useCallback(async (assetData: any) => {
    if (!isConnected || !address) {
      toast.error('Connect wallet first!');
      return { success: false };
    }

    try {
      setIsLoading(true);
      toast.loading('Opening MetaMask...');

      // Call the smart contract to create a listing.
      const result = await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747', // Contract address
        abi: [
            {
                "type": "function", "name": "createListing",
                "inputs": [
                    {"name": "totalShares", "type": "uint256"},
                    {"name": "pricePerShare", "type": "uint256"},
                    {"name": "category", "type": "string"},
                    {"name": "livestockType", "type": "string"},
                    {"name": "details", "type": "tuple", "components": [
                        {"name": "healthStatus", "type": "string"},
                        {"name": "age", "type": "uint256"},
                        {"name": "lastVaccinationDate", "type": "uint256"},
                        {"name": "insuranceId", "type": "string"}
                    ]}
                ],
                "outputs": [], "stateMutability": "nonpayable"
            }
        ],
        functionName: 'createListing',
        args: [
          BigInt(assetData.totalShares),
          parseUnits(assetData.pricePerShare, 6), // Assuming 6 decimals
          assetData.category,
          assetData.livestockType,
          // ✅ FIX: The contract's ABI expects a tuple as an OBJECT, not an array.
          {
            healthStatus: assetData.healthStatus,
            age: BigInt(assetData.age),
            lastVaccinationDate: BigInt(Math.floor(Date.now() / 1000)), // Current timestamp
            insuranceId: assetData.insuranceId
          }
        ],
      });

      toast.dismiss();
      toast.success('✅ MetaMask transaction sent!');

      const newAsset = addAsset({
        ...assetData,
        txHash: result,
        farmer: address
      });

      toast.success('🎉 Asset created and visible across all dashboards!');

      return { success: true, txHash: result, asset: newAsset };
    } catch (error: any) {
      toast.dismiss();
      if (error.message?.includes('User rejected')) {
        toast.error('❌ Transaction rejected in MetaMask');
      } else {
        toast.error(`❌ Transaction failed: ${error.shortMessage || error.message}`);
      }
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, writeContract, addAsset]);

  // Function to invest in an asset by calling the smart contract.
  const investWithMetaMask = useCallback(async (assetId: number, shares: number, pricePerShare: string) => {
    if (!isConnected || !address) {
      toast.error('Connect wallet first!');
      return { success: false };
    }

    try {
      setIsLoading(true);
      toast.loading('Opening MetaMask for investment...');

      const result = await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747', // Contract address
        abi: [
            {
                "type": "function", "name": "invest",
                "inputs": [
                    {"name": "listingId", "type": "uint256"},
                    {"name": "shares", "type": "uint256"},
                    {"name": "maxPricePerShare", "type": "uint256"}
                ],
                "outputs": [], "stateMutability": "nonpayable"
            }
        ],
        functionName: 'invest',
        args: [
          BigInt(assetId),
          BigInt(shares),
          parseUnits(pricePerShare, 6) // Assuming 6 decimals
        ],
      });

      toast.dismiss();
      toast.success('✅ Investment transaction sent!');

      const newInvestment = addInvestment({
        assetId,
        shares,
        pricePerShare,
        investor: address,
        txHash: result
      });

      toast.success('🎉 Investment recorded across all dashboards!');

      return { success: true, txHash: result, investment: newInvestment };
    } catch (error: any) {
      toast.dismiss();
      if (error.message?.includes('User rejected')) {
        toast.error('❌ Investment rejected in MetaMask');
      } else {
        toast.error(`❌ Investment failed: ${error.shortMessage || error.message}`);
      }
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, writeContract, addInvestment]);

  return {
    createAssetWithMetaMask,
    investWithMetaMask,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// Mocked hooks for other dashboard functionalities.
export function useRoleManagement() {
  const { address, isConnected } = useAccount();
  const [userRoles, setUserRoles] = useState({
    isFarmer: true,
    isInvestor: true,
    isAdmin: true,
    isAuditor: false,
  });

  const checkUserRoles = useCallback(async () => {
    setUserRoles({
      isFarmer: true,
      isInvestor: true,
      isAdmin: true,
      isAuditor: false,
    });
  }, []);

  const grantAdminRole = useCallback(async (userAddress: string) => {
    toast.success('🛡️ Admin role granted!');
    return { success: true, txHash: '0x123...' };
  }, []);

  return {
    userRoles,
    isLoading: false,
    checkUserRoles,
    grantAdminRole,
  };
}

export function useListings() {
  const { assets } = useCrossDashboardData();

  return {
    listings: assets,
    myListings: assets,
    isLoading: false,
    refreshListings: () => {},
    listingCounter: assets.length,
  };
}

export function useInvestments() {
  const { investments } = useCrossDashboardData();

  return {
    investments,
    portfolioValue: '23500',
    totalInvested: '20650',
    isLoading: false,
    refreshInvestments: () => {},
  };
}

export function useStablecoin() {
  return {
    balance: '10000.00',
    isLoading: false,
    mint: async () => ({ success: true }),
    approve: async () => ({ success: true }),
    refreshBalances: () => {},
  };
}

export function useFundsManagement() {
  return {
    pendingWithdrawals: '2450.75',
    isLoading: false,
    claimFunds: async () => ({ success: true }),
    refreshPendingWithdrawals: () => {},
  };
}
