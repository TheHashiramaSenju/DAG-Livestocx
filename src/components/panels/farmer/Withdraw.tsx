'use client';

import React, { useEffect } from 'react';
import { useFundsManagement, useStablecoin } from '@/hooks/useContract';
import toast from 'react-hot-toast';

export default function Withdraw() {
  const { pendingWithdrawals, claimFunds, isLoading } = useFundsManagement();
  const { balance: stablecoinBalance } = useStablecoin();

  const handleClaimFunds = async () => {
    if (Number(pendingWithdrawals) === 0) {
      toast.error('No funds available to claim');
      return;
    }

    try {
      const result = await claimFunds();
      if (result.success) {
        toast.success('💰 Funds successfully claimed!');
      }
    } catch (error: any) {
      toast.error(`Failed to claim funds: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">💰</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Withdraw Funds</h2>
          <p className="text-gray-600">Claim your earnings from asset investments</p>
        </div>
      </div>
      
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 rounded-2xl p-6">
          <h3 className="text-sm text-gray-600 mb-1">Available to Claim</h3>
          <div className="text-3xl font-bold text-green-600">{pendingWithdrawals} TUSDC</div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="text-sm text-gray-600 mb-1">Current Balance</h3>
          <div className="text-3xl font-bold text-blue-600">{stablecoinBalance} TUSDC</div>
        </div>
        
        <div className="bg-purple-50 rounded-2xl p-6">
          <h3 className="text-sm text-gray-600 mb-1">Total Earnings</h3>
          <div className="text-3xl font-bold text-purple-600">
            {(Number(stablecoinBalance) + Number(pendingWithdrawals)).toFixed(2)} TUSDC
          </div>
        </div>
      </div>

      {/* Claim Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center">
        {Number(pendingWithdrawals) > 0 ? (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Funds Ready for Withdrawal</h3>
            <p className="text-gray-600 mb-8">
              You have {pendingWithdrawals} TUSDC available to claim from your asset investments.
            </p>
            <button
              onClick={handleClaimFunds}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              {isLoading ? 'Processing...' : `Claim ${pendingWithdrawals} TUSDC`}
            </button>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No Funds Available</h3>
            <p className="text-gray-600">
              Your earnings will appear here as investors purchase shares of your assets.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
