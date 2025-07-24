'use client';

import { useCallback, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { 
  useListings, 
  useInvestments, 
  useStablecoin, 
  useRoleManagement, 
  useFundsManagement 
} from './useContract';
import { LivestockDetails, ContractInteractionResult } from '@/types';
import toast from 'react-hot-toast';

export interface ContractOperation {
  type: 'createListing' | 'invest' | 'approve' | 'claimFunds' | 'requestRole' | 'mint';
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
}

export function useContractInteraction() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const [operation, setOperation] = useState<ContractOperation>({
    type: 'createListing',
    status: 'idle',
  });

  // Import all contract hooks
  const { createListing, verifyListing } = useListings();
  const { investInListing, withdrawInvestment } = useInvestments();
  const { approve, mint, transfer } = useStablecoin();
  const { requestRole, approveRole } = useRoleManagement();
  const { claimFunds } = useFundsManagement();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Create listing wrapper
  const handleCreateListing = useCallback(async (
    totalShares: number,
    pricePerShare: string,
    category: string,
    livestockType: string,
    details: LivestockDetails
  ): Promise<ContractInteractionResult> => {
    setOperation({ type: 'createListing', status: 'pending' });
    
    try {
      const result = await createListing(totalShares, pricePerShare, category, livestockType, details);
      
      if (result.success) {
        setOperation({ 
          type: 'createListing', 
          status: 'success', 
          txHash: result.txHash 
        });
        toast.success('🌾 Asset listing created successfully!');
      } else {
        setOperation({ 
          type: 'createListing', 
          status: 'error', 
          error: result.error 
        });
        toast.error(`Failed to create listing: ${result.error}`);
      }
      
      return result;
    } catch (error: any) {
      setOperation({ 
        type: 'createListing', 
        status: 'error', 
        error: error.message 
      });
      toast.error(`Transaction failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [createListing]);

  // Invest wrapper
  const handleInvest = useCallback(async (
    listingId: number,
    shares: number,
    maxPricePerShare: string
  ): Promise<ContractInteractionResult> => {
    setOperation({ type: 'invest', status: 'pending' });
    
    try {
      const result = await investInListing(listingId, shares, maxPricePerShare);
      
      if (result.success) {
        setOperation({ 
          type: 'invest', 
          status: 'success', 
          txHash: result.txHash 
        });
        toast.success('💰 Investment successful!');
      } else {
        setOperation({ 
          type: 'invest', 
          status: 'error', 
          error: result.error 
        });
        toast.error(`Investment failed: ${result.error}`);
      }
      
      return result;
    } catch (error: any) {
      setOperation({ 
        type: 'invest', 
        status: 'error', 
        error: error.message 
      });
      toast.error(`Investment failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [investInListing]);

  return {
    operation,
    isConnected,
    
    // Contract operations
    createListing: handleCreateListing,
    invest: handleInvest,
    
    // Transaction state
    isPending: isPending || isConfirming,
    isConfirmed,
    txHash: hash,
    error: error?.message,
  };
}
