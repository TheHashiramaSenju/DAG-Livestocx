import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { livestockManagerContract } from "@/lib/contracts";

export function useFarmerDashboardStats() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [listings, setListings] = useState<number>(0);
  const [pending, setPending] = useState<number>(0);

  // ✅ FIX: The 'watch' property is removed as it's no longer a valid option
  // for the useReadContract hook in recent wagmi versions.
  const { data: listingCount, refetch } = useReadContract({
    address: livestockManagerContract.address(chainId),
    abi: livestockManagerContract.abi,
    functionName: "listingCounter",
  });

  useEffect(() => {
    // This effect updates the state whenever the fetched listingCount changes.
    if (typeof listingCount === "bigint") {
      setListings(Number(listingCount));
      // Placeholder for your logic to calculate pending listings
      setPending(0); 
    }
  }, [listingCount]);

  // ✅ FIX: To replace the 'watch' functionality, we now use an interval
  // to periodically call the `refetch` function provided by the hook.
  useEffect(() => {
    // Set up an interval to re-fetch the data every 5 seconds (5000 milliseconds)
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    // Clean up the interval when the component unmounts to prevent memory leaks
    return () => clearInterval(interval);
  }, [refetch]);

  return {
    totalListings: listings,
    pendingVerify: pending,
  };
}
