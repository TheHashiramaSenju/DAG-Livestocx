'use client';

import { useCallback, useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  // This is the hook that contains the logic to call the smart contracts
  useRealMetaMask, 
} from './useContract'; // Assuming useContract.ts is the file name
import { LivestockDetails, ContractInteractionResult } from '@/types'; // Assuming you have this types file
import toast from 'react-hot-toast';

// Defines the shape for tracking the state of a contract operation
export interface ContractOperation {
  type: 'createListing' | 'invest' | 'approve' | 'claimFunds' | 'requestRole' | 'mint';
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: `0x${string}`;
  error?: string;
}

export function useContractInteraction() {
  const { isConnected } = useAccount();
  
  const [operation, setOperation] = useState<ContractOperation>({
    type: 'createListing',
    status: 'idle',
  });

  // Import the functions and state from the correct hook (useRealMetaMask)
  // that handles writing to the contract.
  const { 
    createAssetWithMetaMask, 
    investWithMetaMask,
    isLoading,
    isSuccess,
    hash,
    error,
  } = useRealMetaMask();
  
  // Create listing wrapper function
  const handleCreateListing = useCallback(async (
    totalShares: number,
    pricePerShare: string,
    category: string,
    livestockType: string,
    details: LivestockDetails
  ): Promise<ContractInteractionResult> => {
    setOperation({ type: 'createListing', status: 'pending' });
    
    const assetData = { totalShares, pricePerShare, category, livestockType, ...details };
    
    try {
      const result = await createAssetWithMetaMask(assetData);
      
      if (result.success) {
        const txHash = result.txHash as unknown as `0x${string}`;
        setOperation({ 
          type: 'createListing', 
          status: 'success', 
          txHash: txHash
        });
        // ✅ FIX: Manually construct the return object to match the promised type.
        return { success: true, txHash };
      } else {
        const errorMsg = result.error as string;
        setOperation({ 
          type: 'createListing', 
          status: 'error', 
          error: errorMsg
        });
        // ✅ FIX: Manually construct the return object to match the promised type.
        return { success: false, error: errorMsg };
      }
    } catch (e: any) {
      setOperation({ 
        type: 'createListing', 
        status: 'error', 
        error: e.message 
      });
      toast.error(`Transaction failed: ${e.message}`);
      return { success: false, error: e.message };
    }
  }, [createAssetWithMetaMask]);

  // Invest wrapper function
  const handleInvest = useCallback(async (
    listingId: number,
    shares: number,
    maxPricePerShare: string
  ): Promise<ContractInteractionResult> => {
    setOperation({ type: 'invest', status: 'pending' });
    
    try {
      const result = await investWithMetaMask(listingId, shares, maxPricePerShare);
      
      if (result.success) {
        const txHash = result.txHash as unknown as `0x${string}`;
        setOperation({ 
          type: 'invest', 
          status: 'success', 
          txHash: txHash
        });
        // ✅ FIX: Manually construct the return object here as well.
        return { success: true, txHash };
      } else {
        const errorMsg = result.error as string;
        setOperation({ 
          type: 'invest', 
          status: 'error', 
          error: errorMsg
        });
        // ✅ FIX: Manually construct the return object here as well.
        return { success: false, error: errorMsg };
      }
    } catch (e: any) {
      setOperation({ 
        type: 'invest', 
        status: 'error', 
        error: e.message 
      });
      toast.error(`Investment failed: ${e.message}`);
      return { success: false, error: e.message };
    }
  }, [investWithMetaMask]);

  return {
    operation,
    isConnected,
    
    // Expose the wrapped contract operations with consistent naming
    createListing: handleCreateListing,
    invest: handleInvest,
    
    // Expose the transaction state from the underlying useRealMetaMask hook
    isPending: isLoading,
    isConfirmed: isSuccess,
    txHash: hash,
    error: error?.message,
  };
}
