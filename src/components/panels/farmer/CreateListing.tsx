'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useListings, useStablecoin } from '@/hooks/useContract';
import { livestockManagerContract } from '@/lib/contracts';
import toast from 'react-hot-toast';

export default function CreateListing() {
  const { address, isConnected } = useAccount();
  
  // Wagmi hooks for contract interaction
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Safe destructuring with fallbacks for existing hooks
  const listingsHook = useListings();
  const refreshListings = listingsHook?.refreshListings || (() => {});
  
  const stablecoinHook = useStablecoin();
  const stablecoinBalance = stablecoinHook?.balance || '0';
  
  const [formData, setFormData] = useState({
    livestockType: '',
    category: 'Livestock',
    totalShares: 1000,
    pricePerShare: '100',
    healthStatus: 'Excellent',
    age: 24,
    lastVaccinationDate: '',
    insuranceId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!formData.lastVaccinationDate) {
      toast.error('Please select a vaccination date');
      return;
    }

    try {
      toast.loading('Preparing MetaMask transaction...');

      // Create livestock details array as expected by contract
      const livestockDetails = [
        formData.healthStatus,
        BigInt(formData.age),
        BigInt(Math.floor(new Date(formData.lastVaccinationDate).getTime() / 1000)),
        formData.insuranceId,
      ];

      // Call contract directly using wagmi
      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747', // Your contract address
        abi: livestockManagerContract.abi,
        functionName: 'createListing',
        args: [
          BigInt(formData.totalShares),
          parseUnits(formData.pricePerShare, 6), // Assuming TUSDC has 6 decimals
          formData.category,
          formData.livestockType,
          livestockDetails,
        ],
      });

      toast.dismiss();
      toast.success('🔄 Transaction submitted! Check MetaMask...');

      // Save to localStorage for immediate UI update
      const existingAssets = JSON.parse(localStorage.getItem('userAssets') || '[]');
      const newAsset = {
        id: Date.now(),
        tokenId: 0,
        farmer: address,
        livestockType: formData.livestockType,
        totalShares: formData.totalShares,
        availableShares: formData.totalShares,
        pricePerShare: formData.pricePerShare,
        category: formData.category,
        healthStatus: formData.healthStatus,
        age: formData.age,
        insuranceId: formData.insuranceId,
        status: 'pending',
        isVerified: false,
        createdAt: new Date().toISOString(),
        ...(hash && { txHash: hash }),
      };
      localStorage.setItem('userAssets', JSON.stringify([...existingAssets, newAsset]));

    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Transaction failed: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`✅ Asset successfully tokenized! Hash: ${hash.slice(0, 10)}...`);
      
      // Reset form
      setFormData({
        livestockType: '',
        category: 'Livestock',
        totalShares: 1000,
        pricePerShare: '100',
        healthStatus: 'Excellent',
        age: 24,
        lastVaccinationDate: '',
        insuranceId: '',
      });
      
      // Refresh listings
      refreshListings();
    }
  }, [isSuccess, hash, refreshListings]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Wallet to Create Listing</h2>
        <p className="text-gray-600">Please connect your wallet to create agricultural asset listings</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">🌾</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Create Asset Listing</h2>
          <p className="text-gray-600">Tokenize your agricultural assets for global investment</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Livestock Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Livestock Type *</label>
            <input
              type="text"
              value={formData.livestockType}
              onChange={(e) => setFormData(prev => ({ ...prev, livestockType: e.target.value }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              placeholder="e.g., Angus Cattle, Holstein Dairy Cow"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
            >
              <option value="Livestock">🐄 Livestock</option>
              <option value="Crop">🌾 Crop</option>
              <option value="Equipment">🚜 Equipment</option>
              <option value="Land">🏞️ Land</option>
            </select>
          </div>

          {/* Total Shares */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Total Shares *</label>
            <input
              type="number"
              value={formData.totalShares}
              onChange={(e) => setFormData(prev => ({ ...prev, totalShares: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              min="1"
              max="1000000"
              required
            />
          </div>

          {/* Price per Share */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Price per Share (TUSDC) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.pricePerShare}
              onChange={(e) => setFormData(prev => ({ ...prev, pricePerShare: e.target.value }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              min="0.01"
              required
            />
          </div>

          {/* Health Status */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Health Status *</label>
            <select
              value={formData.healthStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, healthStatus: e.target.value }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
            >
              <option value="Excellent">🟢 Excellent</option>
              <option value="Good">🟡 Good</option>
              <option value="Fair">🟠 Fair</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Age (months) *</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              min="0"
              max="300"
              required
            />
          </div>

          {/* Vaccination Date */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Last Vaccination Date *</label>
            <input
              type="date"
              value={formData.lastVaccinationDate}
              onChange={(e) => setFormData(prev => ({ ...prev, lastVaccinationDate: e.target.value }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              required
            />
          </div>

          {/* Insurance ID */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Insurance ID *</label>
            <input
              type="text"
              value={formData.insuranceId}
              onChange={(e) => setFormData(prev => ({ ...prev, insuranceId: e.target.value }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              placeholder="e.g., INS-2025-001"
              required
            />
          </div>
        </div>

        {/* Asset Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
          <h4 className="text-xl font-bold text-gray-800 mb-4">Asset Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${(formData.totalShares * parseFloat(formData.pricePerShare || '0')).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Value (TUSDC)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{formData.totalShares.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Shares</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">${formData.pricePerShare}</div>
              <div className="text-sm text-gray-600">Price/Share</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{formData.category}</div>
              <div className="text-sm text-gray-600">Category</div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-xl hover:shadow-2xl disabled:cursor-not-allowed flex items-center gap-3"
          >
            {isPending || isConfirming ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                {isPending ? 'Confirm in MetaMask...' : 'Processing...'}
              </>
            ) : (
              <>
                <span className="text-xl">🚀</span>
                Create Asset Listing
              </>
            )}
          </button>
        </div>
      </form>

      {/* MetaMask Integration Notice */}
      <div className="mt-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⚡</span>
          <h4 className="text-lg font-bold text-green-800">Real MetaMask Integration</h4>
        </div>
        <p className="text-green-700">
          This will trigger a REAL MetaMask popup to create your asset on the BlockDAG blockchain!
        </p>
      </div>
    </div>
  );
}
