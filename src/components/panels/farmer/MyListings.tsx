'use client';

import React, { useEffect } from 'react';
import { useListings } from '@/hooks/useContract';
import { formatTokenAmount, getCategoryIcon, getStatusBadge } from '@/lib/contracts';
import toast from 'react-hot-toast';

export default function MyListings() {
  const { myListings, isLoading, refreshListings } = useListings();

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  if (isLoading) {
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

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">📋</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Asset Listings</h2>
          <p className="text-gray-600">Manage your tokenized agricultural assets</p>
        </div>
      </div>

      {myListings && myListings.length > 0 ? (
        <div className="space-y-6">
          {myListings.map((listing, index) => {
            const statusBadge = getStatusBadge(listing);

            return (
              <div key={index} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{getCategoryIcon(listing.category)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{listing.livestockType}</h3>
                      <span className="text-sm text-gray-500">{listing.category}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.bgColor} ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-800">{listing.totalShares.toString()}</div>
                    <div className="text-xs text-gray-500">Total Shares</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{listing.availableShares.toString()}</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">{formatTokenAmount(listing.pricePerShare, 6)}</div>
                    <div className="text-xs text-gray-500">Price/Share</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {(Number(listing.totalShares) * parseFloat(formatTokenAmount(listing.pricePerShare, 6))).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Total Value</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">No Assets Listed Yet</h3>
          <p className="text-gray-600 mb-8">Start by creating your first asset listing</p>
          <button 
            onClick={() => toast.info('Switch to Create Listing panel')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl"
          >
            Create First Listing
          </button>
        </div>
      )}
    </div>
  );
}
