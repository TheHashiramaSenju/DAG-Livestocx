import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getContractService } from '@/services/ContractService';
import { ROLES } from '@/lib/contracts';

export function useRoleManagement() {
  const { address } = useAccount();
  const [isLoading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ [k: string]: boolean }>({});

  const svc = getContractService();

  useEffect(() => {
    (async () => {
      if (!address) return;
      const isFarmer = await svc.hasRole('farmer', address);
      const isInvestor = await svc.hasRole('investor', address);
      const isAdmin = await svc.hasRole('admin', address);
      setRoles({ isFarmer, isInvestor, isAdmin });
    })();
  }, [address]);

  const requestRole = async (role: 'farmer' | 'investor') => {
    setLoading(true);
    await svc.requestRole(role);
    setLoading(false);
  };

  return { roles, requestRole, isLoading };
}
