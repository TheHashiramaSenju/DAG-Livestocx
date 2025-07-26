'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useListings } from '@/hooks/useContract';
import { formatTokenAmount, getCategoryIcon, getStatusBadge } from '@/lib/contracts';
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
  healthStatus: string;
  age: number;
  insuranceId: string;
  status: 'pending' | 'verified' | string;
  isVerified: boolean;
  createdAt: string;
  txHash?: string;
}

export default function MyListings() {
  const { address, isConnected } = useAccount();
  
  // MetaMask contract interaction hooks
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Safe hook usage with type assertion and fallbacks
  const listingsHook = useListings();
  const hookListings = (listingsHook?.myListings || []) as Listing[];
  const hookIsLoading = listingsHook?.isLoading || false;
  const hookRefreshListings = listingsHook?.refreshListings || (() => {});
  
  // Local state for listings with proper typing
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingListing, setEditingListing] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');

  // Safe utility functions with fallbacks
  const safeCategoryIcon = (category: string = 'Unknown') => {
    try {
      return getCategoryIcon(category);
    } catch {
      return '📦';
    }
  };

  const safeStatusBadge = (listing: any) => {
    try {
      return getStatusBadge(listing);
    } catch {
      return {
        text: 'Unknown',
        bgColor: 'bg-gray-100',
        color: 'text-gray-800'
      };
    }
  };

  const safeFormatTokenAmount = (amount: any, decimals: number = 6) => {
    try {
      return formatTokenAmount(amount, decimals);
    } catch {
      return '0.00';
    }
  };

  // MetaMask Functions - UPDATE LISTING PRICE
  const handleUpdatePrice = async (listingId: number, newPricePerShare: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Updating listing price via MetaMask...');

      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: livestockManagerContract.abi,
        functionName: 'updateListingPrice',
        args: [
          BigInt(listingId),
          parseUnits(newPricePerShare, 6) // TUSDC has 6 decimals
        ],
      });

      toast.dismiss();
      toast.success('🔄 Price update transaction sent to MetaMask!');
      setEditingListing(null);
      setNewPrice('');

    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Price update failed: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  // MetaMask Functions - PAUSE/UNPAUSE LISTING
  const handleToggleListing = async (listingId: number, currentStatus: boolean) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const action = currentStatus ? 'pausing' : 'activating';
      toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)} listing via MetaMask...`);

      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: livestockManagerContract.abi,
        functionName: currentStatus ? 'pauseListing' : 'activateListing',
        args: [BigInt(listingId)],
      });

      toast.dismiss();
      toast.success(`🔄 Listing ${action} transaction sent to MetaMask!`);

    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Failed to ${currentStatus ? 'pause' : 'activate'} listing: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  // MetaMask Functions - WITHDRAW EARNINGS
  const handleWithdrawEarnings = async (listingId: number) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Withdrawing earnings via MetaMask...');

      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: livestockManagerContract.abi,
        functionName: 'withdrawEarnings',
        args: [BigInt(listingId)],
      });

      toast.dismiss();
      toast.success('💰 Withdrawal transaction sent to MetaMask!');

    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Withdrawal failed: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  // Load listings from multiple sources
  const loadListings = async () => {
    setIsLoading(true);
    try {
      let listings: Listing[] = [];

      if (hookListings && hookListings.length > 0) {
        listings = hookListings;
      } else if (isConnected && address) {
        const storedAssets = localStorage.getItem('userAssets');
        if (storedAssets) {
          const allAssets: Listing[] = JSON.parse(storedAssets);
          listings = allAssets.filter(asset => 
            asset.farmer && address && asset.farmer.toLowerCase() === address.toLowerCase()
          );
        }
      }

      setMyListings(listings);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load your listings');
      setMyListings([]);
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
      await loadListings();
    }
  };

  // Handle successful MetaMask transactions
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`✅ Transaction confirmed! Hash: ${hash.slice(0, 10)}...`);
      refreshListings(); // Refresh listings after successful transaction
    }
  }, [isSuccess, hash]);

  useEffect(() => {
    loadListings();
  }, [hookListings, address, isConnected]);

  // Loading state
  if (isLoading || hookIsLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Wallet to View Listings</h2>
        <p className="text-gray-600">Please connect your wallet to view and manage your asset listings</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">📋</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">My Asset Listings</h2>
            <p className="text-gray-600">Manage your tokenized agricultural assets with MetaMask</p>
          </div>
        </div>
        <button
          onClick={refreshListings}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {myListings && myListings.length > 0 ? (
        <div className="space-y-6">
          {myListings.map((listing, index) => {
            const safeListockType = listing?.livestockType || 'Unknown Asset';
            const safeCategory = listing?.category || 'Unknown';
            const safeTotalShares = Number(listing?.totalShares) || 0;
            const safeAvailableShares = Number(listing?.availableShares) || 0;
            const safePricePerShare = listing?.pricePerShare || '0';
            
            const statusBadge = safeStatusBadge(listing);
            const formattedPrice = safeFormatTokenAmount(safePricePerShare, 6);
            const isEditing = editingListing === listing?.id;

            return (
              <div key={listing?.id || index} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{safeCategoryIcon(safeCategory)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{safeListockType}</h3>
                      <span className="text-sm text-gray-500">{safeCategory}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.bgColor} ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-800">{safeTotalShares.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Shares</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{safeAvailableShares.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full text-center text-lg font-bold text-green-600 bg-transparent border-0 focus:outline-none"
                        placeholder={formattedPrice}
                      />
                    ) : (
                      <div className="text-lg font-bold text-green-600">${formattedPrice}</div>
                    )}
                    <div className="text-xs text-gray-500">Price/Share</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-600">
                      ${(safeTotalShares * parseFloat(formattedPrice || '0')).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Total Value</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Funding Progress</span>
                    <span className="font-semibold">
                      {safeTotalShares > 0 ? (((safeTotalShares - safeAvailableShares) / safeTotalShares) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: safeTotalShares > 0 ? `${((safeTotalShares - safeAvailableShares) / safeTotalShares) * 100}%` : '0%'
                      }}
                    />
                  </div>
                </div>

                {/* MetaMask Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleUpdatePrice(listing?.id || 0, newPrice)}
                        disabled={isPending || isConfirming || !newPrice}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        {isPending || isConfirming ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          '💰'
                        )}
                        Update Price (MetaMask)
                      </button>
                      <button
                        onClick={() => {
                          setEditingListing(null);
                          setNewPrice('');
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingListing(listing?.id || 0);
                          setNewPrice(formattedPrice);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors"
                      >
                        ✏️ Edit Price
                      </button>
                      <button
                        onClick={() => handleToggleListing(listing?.id || 0, listing?.status === 'active')}
                        disabled={isPending || isConfirming}
                        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        {isPending || isConfirming ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          listing?.status === 'active' ? '⏸️' : '▶️'
                        )}
                        {listing?.status === 'active' ? 'Pause' : 'Activate'} (MetaMask)
                      </button>
                      <button
                        onClick={() => handleWithdrawEarnings(listing?.id || 0)}
                        disabled={isPending || isConfirming}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        {isPending || isConfirming ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          '💰'
                        )}
                        Withdraw Earnings (MetaMask)
                      </button>
                    </>
                  )}
                </div>

                {/* Additional listing info */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Health:</span>
                      <span className="ml-2 font-semibold text-green-600">{listing?.healthStatus || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Age:</span>
                      <span className="ml-2 font-semibold">{listing?.age || 'Unknown'} months</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Insurance:</span>
                      <span className="ml-2 font-semibold">{listing?.insuranceId || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-semibold">
                        {listing?.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Portfolio Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Portfolio Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{myListings.length}</div>
                <div className="text-sm text-gray-600">Total Listings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {myListings.filter(l => l?.status === 'verified').length}
                </div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ${myListings.reduce((sum, listing) => {
                    const shares = Number(listing?.totalShares) || 0;
                    const price = parseFloat(safeFormatTokenAmount(listing?.pricePerShare, 6)) || 0;
                    return sum + (shares * price);
                  }, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {myListings.reduce((sum, listing) => sum + (Number(listing?.totalShares) || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Shares</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">No Assets Listed Yet</h3>
          <p className="text-gray-600 mb-8">Start by creating your first asset listing with MetaMask integration</p>
          <button 
            onClick={() => toast('Switch to Create Listing panel to get started with MetaMask')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            Create First Listing
          </button>
        </div>
      )}

      {/* MetaMask Integration Notice */}
      <div className="mt-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⚡</span>
          <h4 className="text-lg font-bold text-green-800">Full MetaMask Integration Active</h4>
        </div>
        <p className="text-green-700">
          All listing management actions (price updates, pause/activate, withdraw earnings) trigger REAL MetaMask popups for blockchain transactions!
        </p>
      </div>
    </div>
  );
}
