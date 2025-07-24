'use client';

import React, { useState } from 'react';
import { useListings, useStablecoin } from '@/hooks/useContract';
import { validateListingData } from '@/lib/contracts';
import { LivestockDetails } from '@/types';
import toast from 'react-hot-toast';

export default function CreateListing() {
  const { createListing, isLoading } = useListings();
  const { balance: stablecoinBalance } = useStablecoin();
  
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
    
    if (!formData.lastVaccinationDate) {
      toast.error('Please select a vaccination date');
      return;
    }

    const details: LivestockDetails = {
      healthStatus: formData.healthStatus,
      age: BigInt(formData.age),
      lastVaccinationDate: BigInt(Math.floor(new Date(formData.lastVaccinationDate).getTime() / 1000)),
      insuranceId: formData.insuranceId,
    };

    console.log('Creating listing with data:', formData);
    
    // THIS WILL TRIGGER METAMASK POPUP
    const result = await createListing(
      formData.totalShares,
      formData.pricePerShare,
      formData.category,
      formData.livestockType,
      details
    );

    if (result.success) {
      toast.success('🌾 Asset successfully tokenized!');
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
    } else {
      toast.error(`Failed to create listing: ${result.error}`);
    }
  };

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

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-xl hover:shadow-2xl disabled:cursor-not-allowed flex items-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Asset...
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
    </div>
  );
}
