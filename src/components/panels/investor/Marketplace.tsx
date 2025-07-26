'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useListings, useInvestments, useStablecoin } from '@/hooks/useContract';
import { formatTokenAmount, getCategoryIcon } from '@/lib/contracts';
import { livestockManagerContract } from '@/lib/contracts';
import toast from 'react-hot-toast';

// Define proper TypeScript interface for listings
interface Listing {
  id: number;
  tokenId?: number;
  farmer: string;
  livestockType: string;
  totalShares: number;
  availableShares: number;
  pricePerShare: string;
  category: string;
  healthStatus?: string;
  age?: number;
  insuranceId?: string;
  status?: 'pending' | 'verified' | string;
  isVerified?: boolean;
  createdAt?: string;
  details?: {
    healthStatus: string;
    age?: number;
    insuranceId?: string;
  };
}

export default function Marketplace() {
  const { address, isConnected } = useAccount();
  
  // Safe hook usage with type assertion and fallbacks
  const listingsHook = useListings();
  const hookListings = (listingsHook?.listings || []) as Listing[];
  const hookIsLoading = listingsHook?.isLoading || false;
  const hookRefreshListings = listingsHook?.refreshListings || (() => {});
  
  // Safe destructuring - investInListing doesn't exist in useInvestments
  const investmentsHook = useInvestments();
  const refreshInvestments = investmentsHook?.refreshInvestments || (() => {});
  
  const stablecoinHook = useStablecoin();
  const stablecoinBalance = stablecoinHook?.balance || '0';
  const approve = stablecoinHook?.approve || (async () => ({ success: false }));
  
  // Wagmi hooks for investment functionality
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Local state for listings with proper typing
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);

  // Safe utility functions with fallbacks
  const safeCategoryIcon = (category: string = 'Unknown') => {
    try {
      return getCategoryIcon(category);
    } catch {
      return '📦';
    }
  };

  const safeFormatTokenAmount = (amount: any, decimals: number = 6) => {
    try {
      return formatTokenAmount(amount, decimals);
    } catch {
      return '0.00';
    }
  };

  // Load listings from multiple sources
  const loadListings = async () => {
    setIsLoading(true);
    try {
      let listingsData: Listing[] = [];

      // Try to get from hook first
      if (hookListings && hookListings.length > 0) {
        listingsData = hookListings;
      } 
      // Fallback to localStorage
      else {
        const storedAssets = localStorage.getItem('userAssets');
        if (storedAssets) {
          const allAssets: Listing[] = JSON.parse(storedAssets);
          listingsData = allAssets.filter(asset => asset?.status === 'verified');
        }
      }

      setListings(listingsData);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load marketplace listings');
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh function
  const refreshListings = async () => {
    try {
      await hookRefreshListings();
      await loadListings();
    } catch (error) {
      console.error('Error refreshing listings:', error);
      await loadListings(); // Fallback to local load
    }
  };

  useEffect(() => {
    loadListings();
  }, [hookListings]);

  // Handle successful investment transaction
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`✅ Investment confirmed! Hash: ${hash.slice(0, 10)}...`);
      setShowInvestModal(false);
      setInvestmentAmount('');
      setSelectedListing(null);
      refreshListings();
      refreshInvestments();
    }
  }, [isSuccess, hash, refreshInvestments]);

  // Safe filtering with type safety
  const filteredListings = listings.filter(listing => {
    const safeCategory = listing?.category || 'Unknown';
    return selectedCategory === 'All' || safeCategory === selectedCategory;
  });

  // Implement investInListing using wagmi
  const handleInvest = async () => {
    if (!selectedListing || !investmentAmount || !isConnected || !address) {
      toast.error('Please connect your wallet and enter valid details');
      return;
    }

    const safePricePerShare = safeFormatTokenAmount(selectedListing.pricePerShare, 6);
    const shares = Math.floor(parseFloat(investmentAmount) / parseFloat(safePricePerShare));
    
    if (shares <= 0) {
      toast.error('Invalid investment amount');
      return;
    }

    const safeAvailableShares = Number(selectedListing.availableShares) || 0;
    if (shares > safeAvailableShares) {
      toast.error('Not enough shares available');
      return;
    }

    try {
      toast.loading('Preparing investment transaction...');

      // Call the invest function on the contract
      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747', // Your contract address
        abi: livestockManagerContract.abi,
        functionName: 'invest',
        args: [
          BigInt(selectedListing.tokenId || selectedListing.id),
          BigInt(shares),
          parseUnits(safePricePerShare, 6)
        ],
      });

      toast.dismiss();
      toast.success('🔄 Investment transaction sent to MetaMask!');

    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Investment failed: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  if (isLoading || hookIsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Wallet to Access Marketplace</h2>
        <p className="text-gray-600">Please connect your wallet to view and invest in agricultural assets</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Marketplace</h2>
      <p className="text-gray-600 mb-6">Discover agricultural investment opportunities with MetaMask integration</p>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Livestock', 'Crop', 'Equipment', 'Land'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing, index) => {
            // Safe property access with fallbacks
            const safeLivestockType = listing?.livestockType || 'Unknown Asset';
            const safeCategory = listing?.category || 'Unknown';
            const safeTotalShares = Number(listing?.totalShares) || 0;
            const safeAvailableShares = Number(listing?.availableShares) || 0;
            const safePricePerShare = listing?.pricePerShare || '0';
            const safeHealthStatus = listing?.details?.healthStatus || listing?.healthStatus || 'Good';
            
            const fundedPercentage = safeTotalShares > 0 ? ((safeTotalShares - safeAvailableShares) / safeTotalShares) * 100 : 0;
            const formattedPrice = safeFormatTokenAmount(safePricePerShare, 6);
            
            return (
              <div key={listing?.id || index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{safeCategoryIcon(safeCategory)}</div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{safeLivestockType}</h3>
                      <p className="text-sm text-gray-500">{safeCategory}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Price per Share:</span>
                      <span className="font-semibold">{formattedPrice} TUSDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available Shares:</span>
                      <span className="font-semibold">{safeAvailableShares.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Health Status:</span>
                      <span className="font-semibold text-green-600">{safeHealthStatus}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Funding Progress</span>
                      <span>{fundedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${fundedPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedListing(listing);
                      setShowInvestModal(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Invest Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Investments Available</h3>
          <p className="text-gray-600">Check back later for new investment opportunities or create assets in Farmer Dashboard.</p>
        </div>
      )}

      {/* Investment Modal */}
      {showInvestModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Invest in {selectedListing.livestockType || 'Asset'}</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Price per Share:</span>
                <span className="font-semibold">{safeFormatTokenAmount(selectedListing.pricePerShare, 6)} TUSDC</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Available Shares:</span>
                <span className="font-semibold">{(selectedListing.availableShares || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Your Balance:</span>
                <span className="font-semibold">{stablecoinBalance} TUSDC</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (TUSDC)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
              />
              {investmentAmount && (
                <div className="mt-2 text-sm text-gray-600">
                  Shares: {Math.floor(parseFloat(investmentAmount) / parseFloat(safeFormatTokenAmount(selectedListing.pricePerShare, 6)))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowInvestModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={isPending || isConfirming}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isPending || isConfirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isPending ? 'Confirm in MetaMask...' : 'Processing...'}
                  </>
                ) : (
                  'Confirm Investment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MetaMask Integration Notice */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="font-bold text-blue-800">Real MetaMask Integration</h4>
            <p className="text-sm text-blue-700">
              All investments trigger REAL MetaMask popups for blockchain transactions on BlockDAG testnet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
