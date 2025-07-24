'use client';

import React, { useEffect, useState } from 'react';
import { useListings, useInvestments, useStablecoin } from '@/hooks/useContract';
import { formatTokenAmount, getCategoryIcon } from '@/lib/contracts';
import toast from 'react-hot-toast';

export default function Marketplace() {
  const { listings, isLoading, refreshListings } = useListings();
  const { investInListing } = useInvestments();
  const { balance: stablecoinBalance, approve } = useStablecoin();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  const filteredListings = listings?.filter(listing => 
    selectedCategory === 'All' || listing.category === selectedCategory
  ) || [];

  const handleInvest = async () => {
    if (!selectedListing || !investmentAmount) return;

    const shares = Math.floor(parseFloat(investmentAmount) / parseFloat(formatTokenAmount(selectedListing.pricePerShare, 6)));
    
    if (shares <= 0) {
      toast.error('Invalid investment amount');
      return;
    }

    if (shares > Number(selectedListing.availableShares)) {
      toast.error('Not enough shares available');
      return;
    }

    try {
      // First approve spending
      await approve(selectedListing.farmer, investmentAmount);
      
      // Then invest
      const result = await investInListing(
        Number(selectedListing.tokenId),
        shares,
        formatTokenAmount(selectedListing.pricePerShare, 6)
      );

      if (result.success) {
        toast.success('🎉 Investment successful!');
        setShowInvestModal(false);
        setInvestmentAmount('');
        setSelectedListing(null);
        refreshListings();
      }
    } catch (error: any) {
      toast.error(`Investment failed: ${error.message}`);
    }
  };

  if (isLoading) {
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Marketplace</h2>
      <p className="text-gray-600 mb-6">Discover agricultural investment opportunities</p>
      
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
            const fundedPercentage = ((Number(listing.totalShares) - Number(listing.availableShares)) / Number(listing.totalShares)) * 100;
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{getCategoryIcon(listing.category)}</div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{listing.livestockType}</h3>
                      <p className="text-sm text-gray-500">{listing.category}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Price per Share:</span>
                      <span className="font-semibold">{formatTokenAmount(listing.pricePerShare, 6)} TUSDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available Shares:</span>
                      <span className="font-semibold">{listing.availableShares.toString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Health Status:</span>
                      <span className="font-semibold text-green-600">{listing.details.healthStatus}</span>
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
          <p className="text-gray-600">Check back later for new investment opportunities.</p>
        </div>
      )}

      {/* Investment Modal */}
      {showInvestModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Invest in {selectedListing.livestockType}</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Price per Share:</span>
                <span className="font-semibold">{formatTokenAmount(selectedListing.pricePerShare, 6)} TUSDC</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Available Shares:</span>
                <span className="font-semibold">{selectedListing.availableShares.toString()}</span>
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
                  Shares: {Math.floor(parseFloat(investmentAmount) / parseFloat(formatTokenAmount(selectedListing.pricePerShare, 6)))}
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Confirm Investment
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          ✅ Live marketplace data from BlockDAG blockchain
        </p>
      </div>
    </div>
  );
}
