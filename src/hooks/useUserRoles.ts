import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';

// Assuming your ContractService is for reading data and doesn't have write methods
import { contractService } from '@/services/ContractService'; 
import { ROLES } from '@/lib/contracts'; // Assuming this contains your role definitions

export function useRoleManagement() {
  const { address } = useAccount();
  const [isLoading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ [k: string]: boolean }>({});

  // ✅ FIX: Use wagmi's writeContract hook for transactions, just like in your other hooks.
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const svc = contractService;

  // This useEffect fetches the user's current roles (read-only operation)
  useEffect(() => {
    const checkRoles = async () => {
      if (!address) {
        setRoles({});
        return;
      }
      setLoading(true);
      try {
        const isFarmer = await svc.hasRole('farmer', address);
        const isInvestor = await svc.hasRole('investor', address);
        const isAdmin = await svc.hasRole('admin', address);
        setRoles({ isFarmer, isInvestor, isAdmin });
      } catch (error) {
        console.error("Failed to check user roles:", error);
        setRoles({});
      } finally {
        setLoading(false);
      }
    };
    checkRoles();
  }, [address, svc]);

  // ✅ FIX: This function now contains the logic to call the smart contract.
  const requestRole = useCallback(async (role: 'farmer' | 'investor') => {
    if (!address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    const toastId = toast.loading(`Requesting ${role} role...`);
    setLoading(true);

    try {
      // This calls the smart contract and triggers a MetaMask popup.
      await writeContractAsync({
        // Replace with your actual contract address and ABI
        address: '0xYOUR_ROLE_CONTRACT_ADDRESS', 
        abi: [
            {
                "type": "function",
                "name": "requestRole",
                "inputs": [{"name": "role", "type": "string"}],
                "outputs": [],
                "stateMutability": "nonpayable"
            }
        ],
        functionName: 'requestRole',
        args: [role],
      });

      toast.success(`Role request sent successfully!`, { id: toastId });

      // Optionally, you can add a delay and then re-fetch roles
      setTimeout(() => {
         // This logic would re-trigger the useEffect above to update the UI
      }, 5000);

    } catch (error: any) {
      console.error(`Failed to request role ${role}:`, error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction rejected.', { id: toastId });
      } else {
        toast.error(`Error: ${error.shortMessage || error.message}`, { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  }, [address, writeContractAsync]);

  return { 
    roles, 
    requestRole, 
    // The overall loading state is a combination of checking roles and pending transactions
    isLoading: isLoading || isPending || isConfirming 
  };
}
