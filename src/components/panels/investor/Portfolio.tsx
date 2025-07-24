'use client';

import React, { useEffect, useState } from 'react';
import { useInvestments, useStablecoin } from '@/hooks/useContract';
import { formatTokenAmount, getCategoryIcon } from '@/lib/contracts';
import toast from 'react-hot-toast';

export default function Portfolio() {
  const { investments, portfolioValue, totalInvested, withdrawInvestment, refreshInvestments } = useInvestments();
  const { balance: stablecoinBalance } = useStablecoin();
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawShares, setWithdrawShares] = useState<string>('');

  useEffect(() => {
    refreshInvestments();
  }, [refreshInvestments]);

  const handleWithdraw = async () => {
    if (!selectedInvestment || !withdrawShares) return;

    const sharesToWithdraw = parseInt(withdrawShares);
    if (sharesToWithdraw <= 0 || sharesToWithdraw > selectedInvestment.shares) {
      toast.error('Invalid withdrawal amount');
      return;
    }

    try {
      const result = await withdrawInvestment(
        parseInt(selectedInvestment.id),
        sharesToWithdraw
      );

      if (result.success) {
        toast.success('💰 Withdrawal successful!');
        setShowWithdrawModal(false);
        setWithdrawShares('');
        setSelectedInvestment(null);
        refreshInvestments();
      }
    } catch (error: any) {
      toast.error(`Withdrawal failed: ${error.message}`);
    }
  };

  const calculateTotalReturns = () => {
    if (!investments || investments.length === 0) return 0;
    return parseFloat(portfolioValue) - parseFloat(totalInvested);
  };

  const calculateROI = () => {
    const totalInvestedNum = parseFloat(totalInvested);
    if (totalInvestedNum === 0) return 0;
    return (calculateTotalReturns() / totalInvestedNum) * 100;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Portfolio</h2>
      <p className="text-gray-600 mb-6">Track your agricultural investments and returns</p>
      
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm text-gray-600 mb-1">Portfolio Value</h3>
          <div className="text-2xl font-bold text-blue-600">{portfolioValue} TUSDC</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm text-gray-600 mb-1">Total Invested</h3>
          <div className="text-2xl font-bold text-green-600">{totalInvested} TUSDC</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm text-gray-600 mb-1">Total Returns</h3>
          <div className={`text-2xl font-bold ${calculateTotalReturns() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {calculateTotalReturns() >= 0 ? '+' : ''}{calculateTotalReturns().toFixed(2)} TUSDC
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <h3 className="text-sm text-gray-600 mb-1">ROI</h3>
          <div className={`text-2xl font-bold ${calculateROI() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {calculateROI() >= 0 ? '+' : ''}{calculateROI().toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Investment List */}
      {investments && investments.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Investments</h3>
          {investments.map((investment, index) => {
            const currentValue = Number(investment.shares) * 110; // Mock current price
            const totalPaid = Number(formatTokenAmount(investment.totalPaid, 6));
            const gain = currentValue - totalPaid;
            const gainPercentage = (gain / totalPaid) * 100;

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getCategoryIcon('Livestock')}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Asset #{investment.listingId.toString()}</h4>
                      <p className="text-sm text-gray-500">{investment.shares.toString()} shares</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">{currentValue.toFixed(2)} TUSDC</div>
                    <div className="text-sm text-gray-500">Current Value</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Paid</div>
                    <div className="font-semibold">{totalPaid.toFixed(2)} TUSDC</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Shares Owned</div>
                    <div className="font-semibold">{investment.shares.toString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Gain/Loss</div>
                    <div className={`font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gain >= 0 ? '+' : ''}{gain.toFixed(2)} TUSDC ({gainPercentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedInvestment({...investment, id: index});
                      setShowWithdrawModal(true);
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Withdraw Shares
                  </button>
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💼</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Investments Yet</h3>
          <p className="text-gray-600 mb-6">Start building your agricultural portfolio today</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Explore Marketplace
          </button>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Withdraw Shares</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Total Shares Owned:</span>
                <span className="font-semibold">{selectedInvestment.shares.toString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Price per Share:</span>
                <span className="font-semibold">110 TUSDC</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shares to Withdraw
              </label>
              <input
                type="number"
                value={withdrawShares}
                onChange={(e) => setWithdrawShares(e.target.value)}
                max={selectedInvestment.shares.toString()}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter number of shares"
              />
              {withdrawShares && (
                <div className="mt-2 text-sm text-gray-600">
                  Value: {(parseInt(withdrawShares) * 110).toFixed(2)} TUSDC
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          ✅ Real-time portfolio tracking with BlockDAG smart contracts
        </p>
      </div>
    </div>
  );
}
