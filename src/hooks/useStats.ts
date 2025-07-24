import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { livestockManagerContract } from "@/lib/contracts";

export function useFarmerDashboardStats() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [listings, setListings] = useState<number>(0);
  const [pending, setPending] = useState<number>(0);

  const { data: listingCount, refetch } = useReadContract({
    address: livestockManagerContract.address(chainId),
    abi: livestockManagerContract.abi,
    functionName: "listingCounter",
    watch: true,
  });

  useEffect(() => {
    
    if (typeof listingCount === "bigint") {
      setListings(Number(listingCount));
      setPending(0); 
    }
  }, [listingCount]);

  return {
    totalListings: listings,
    pendingVerify: pending,
    
  };
}
