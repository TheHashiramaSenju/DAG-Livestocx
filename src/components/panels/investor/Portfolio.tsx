'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useInvestments, useStablecoin } from '@/hooks/useContract';
import { formatTokenAmount, getCategoryIcon } from '@/lib/contracts';
import { livestockManagerContract } from '@/lib/contracts';
import toast from 'react-hot-toast';

// Define proper TypeScript interface for investments
interface Investment {
  id: number;
  listingId: number;
  shares: number;
  totalPaid: string;
  pricePerShare?: string;
  timestamp?: string;
  category?: string;
  livestockType?: string;
}

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  
  // Safe hook usage with type assertion and fallbacks
  const investmentsHook = useInvestments();
  const hookInvestments = (investmentsHook?.investments || []) as Investment[];
  const portfolioValue = investmentsHook?.portfolioValue || '0';
  const totalInvested = investmentsHook?.totalInvested || '0';
  const hookIsLoading = investmentsHook?.isLoading || false;
  const refreshInvestments = investmentsHook?.refreshInvestments || (() => {});
  
  const stablecoinHook = useStablecoin();
  const stablecoinBalance = stablecoinHook?.balance || '0';
  
  // Wagmi hooks for withdrawal functionality
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Local state for investments with proper typing
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawShares, setWithdrawShares] = useState<string>('');

  // Safe utility functions with fallbacks
  const safeCategoryIcon = (category: string = 'Livestock') => {
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

  // Load investments from multiple sources
  const loadInvestments = async () => {
    setIsLoading(true);
    try {
      let investmentsData: Investment[] = [];

      // Try to get from hook first
      if (hookInvestments && hookInvestments.length > 0) {
        investmentsData = hookInvestments;
      } 
      // Fallback to localStorage
      else if (isConnected && address) {
        const storedInvestments = localStorage.getItem('userInvestments');
        if (storedInvestments) {
          const allInvestments: Investment[] = JSON.parse(storedInvestments);
          investmentsData = allInvestments.filter(inv => 
            inv && typeof inv === 'object' && inv.listingId
          );
        }
      }

      setInvestments(investmentsData);
    } catch (error) {
      console.error('Error loading investments:', error);
      toast.error('Failed to load your investments');
      setInvestments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, [hookInvestments, address, isConnected]);

  // Handle successful withdrawal transaction
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`✅ Withdrawal confirmed! Hash: ${hash.slice(0, 10)}...`);
      setShowWithdrawModal(false);
      setWithdrawShares('');
      setSelectedInvestment(null);
      refreshInvestments();
      loadInvestments();
    }
  }, [isSuccess, hash, refreshInvestments]);

  // Implement withdrawInvestment using wagmi
  const handleWithdraw = async () => {
    if (!selectedInvestment || !withdrawShares || !isConnected || !address) {
      toast.error('Please connect your wallet and enter valid details');
      return;
    }

    const sharesToWithdraw = parseInt(withdrawShares);
    const availableShares = Number(selectedInvestment.shares) || 0;
    
    if (sharesToWithdraw <= 0 || sharesToWithdraw > availableShares) {
      toast.error('Invalid withdrawal amount');
      return;
    }

    try {
      toast.loading('Preparing withdrawal transaction...');

      // Call the withdrawInvestment function on the contract
      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747', // Your contract address
        abi: livestockManagerContract.abi,
        functionName: 'withdrawInvestment',
        args: [
          BigInt(selectedInvestment.listingId),
          BigInt(sharesToWithdraw)
        ],
      });

      toast.dismiss();
      toast.success('🔄 Withdrawal transaction sent to MetaMask!');

    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Withdrawal failed: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  const calculateTotalReturns = () => {
    if (!investments || investments.length === 0) return 0;
    return parseFloat(portfolioValue || '0') - parseFloat(totalInvested || '0');
  };

  const calculateROI = () => {
    const totalInvestedNum = parseFloat(totalInvested || '0');
    if (totalInvestedNum === 0) return 0;
    return (calculateTotalReturns() / totalInvestedNum) * 100;
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Wallet to View Portfolio</h2>
        <p className="text-gray-600">Please connect your wallet to view your investment portfolio</p>
      </div>
    );
  }

  if (isLoading || hookIsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Portfolio</h2>
      <p className="text-gray-600 mb-6">Track your agricultural investments and returns with MetaMask integration</p>
      
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
            // Safe property access with fallbacks
            const safeShares = Number(investment?.shares) || 0;
            const safeTotalPaid = parseFloat(safeFormatTokenAmount(investment?.totalPaid, 6)) || 0;
            const safeListingId = investment?.listingId || 0;
            
            const currentValue = safeShares * 110; // Mock current price
            const gain = currentValue - safeTotalPaid;
            const gainPercentage = safeTotalPaid > 0 ? (gain / safeTotalPaid) * 100 : 0;

            return (
              <div key={investment?.id || index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{safeCategoryIcon(investment?.category)}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {investment?.livestockType || `Asset #${safeListingId}`}
                      </h4>
                      <p className="text-sm text-gray-500">{safeShares} shares</p>
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
                    <div className="font-semibold">{safeTotalPaid.toFixed(2)} TUSDC</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Shares Owned</div>
                    <div className="font-semibold">{safeShares}</div>
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
                      setSelectedInvestment(investment);
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
          <button 
            onClick={() => toast('Navigate to Marketplace to start investing')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
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
                <span className="font-semibold">{selectedInvestment.shares || 0}</span>
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
                max={selectedInvestment.shares || 0}
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
                disabled={isPending || isConfirming}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isPending || isConfirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isPending ? 'Confirm in MetaMask...' : 'Processing...'}
                  </>
                ) : (
                  'Confirm Withdrawal'
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
              All withdrawals trigger REAL MetaMask popups for blockchain transactions on BlockDAG testnet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
