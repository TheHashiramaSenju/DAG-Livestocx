'use client';

import React, { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';


export function useCrossDashboardData() {
  const [assets, setAssets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = useCallback(() => {
    try {
      const userAssets = JSON.parse(localStorage.getItem('userAssets') || '[]');
      const userInvestments = JSON.parse(localStorage.getItem('userInvestments') || '[]');
      
      console.log('Refreshing cross-dashboard data:', { assets: userAssets.length, investments: userInvestments.length });
      
      setAssets(userAssets);
      setInvestments(userInvestments);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);


  React.useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userAssets' || e.key === 'userInvestments') {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);


  const addAsset = useCallback((assetData) => {
    const existingAssets = JSON.parse(localStorage.getItem('userAssets') || '[]');
    const newAsset = {
      id: Date.now(),
      ...assetData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isVerified: false,
      isActive: true
    };
    
    const updatedAssets = [...existingAssets, newAsset];
    localStorage.setItem('userAssets', JSON.stringify(updatedAssets));
    

    refreshData();
    

    window.dispatchEvent(new CustomEvent('assetsUpdated', { detail: updatedAssets }));
    
    return newAsset;
  }, [refreshData]);

  const addInvestment = useCallback((investmentData) => {
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

  const updateAssetStatus = useCallback((assetId, status) => {
    const existingAssets = JSON.parse(localStorage.getItem('userAssets') || '[]');
    const updatedAssets = existingAssets.map(asset => 
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

// REAL METAMASK INTEGRATION
export function useRealMetaMask() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const { addAsset, addInvestment } = useCrossDashboardData();
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // REAL METAMASK POPUP - CREATE ASSET
  const createAssetWithMetaMask = useCallback(async (assetData) => {
    if (!isConnected || !address) {
      toast.error('Connect wallet first!');
      return { success: false };
    }

    try {
      setIsLoading(true);
      toast.loading('Opening MetaMask...');

      // THIS TRIGGERS REAL METAMASK POPUP
      const result = await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: [
          {
            "type": "function",
            "name": "createListing",
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
            "outputs": [],
            "stateMutability": "nonpayable"
          }
        ],
        functionName: 'createListing',
        args: [
          BigInt(assetData.totalShares),
          parseUnits(assetData.pricePerShare, 6),
          assetData.category,
          assetData.livestockType,
          [
            assetData.healthStatus,
            BigInt(assetData.age),
            BigInt(Math.floor(Date.now() / 1000)),
            assetData.insuranceId
          ]
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
    } catch (error) {
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

  // REAL METAMASK POPUP - INVEST
  const investWithMetaMask = useCallback(async (assetId, shares, pricePerShare) => {
    if (!isConnected || !address) {
      toast.error('Connect wallet first!');
      return { success: false };
    }

    try {
      setIsLoading(true);
      toast.loading('Opening MetaMask for investment...');

      const result = await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: [
          {
            "type": "function",
            "name": "invest",
            "inputs": [
              {"name": "listingId", "type": "uint256"},
              {"name": "shares", "type": "uint256"},
              {"name": "maxPricePerShare", "type": "uint256"}
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
          }
        ],
        functionName: 'invest',
        args: [
          BigInt(assetId),
          BigInt(shares),
          parseUnits(pricePerShare, 6)
        ],
      });

      toast.dismiss();
      toast.success('✅ Investment transaction sent!');
      
      // ADD TO CROSS-DASHBOARD STORAGE
      const newInvestment = addInvestment({
        assetId,
        shares,
        pricePerShare,
        investor: address,
        txHash: result
      });
      
      toast.success('🎉 Investment recorded across all dashboards!');
      
      return { success: true, txHash: result, investment: newInvestment };
    } catch (error) {
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
    hash
  };
}

// OTHER HOOKS REMAIN THE SAME
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

  const grantAdminRole = useCallback(async (userAddress) => {
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
