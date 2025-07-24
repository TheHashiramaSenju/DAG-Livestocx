'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { livestockManagerContract } from '@/lib/contracts';
import toast from 'react-hot-toast';
import { useCrossDashboardData } from '@/hooks/useContract';

interface FarmerDashboardProps {
  onExit: () => void;
  onRoleSwitch: (role: 'farmer' | 'investor' | 'admin') => void;
}

interface Asset {
  id: number;
  tokenId: number;
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

export default function FarmerDashboard({ onExit, onRoleSwitch }: FarmerDashboardProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Panel state can only be these values
  const [activePanel, setActivePanel] = useState<'create' | 'listings' | 'withdraw'>('create');

  // Wagmi hooks for contract interaction
  const { writeContract, data: hash, isLoading: isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Cross-dashboard data hook for assets and refresh
  const { assets, refreshData } = useCrossDashboardData();

  // Local form state for create asset
  const [assetForm, setAssetForm] = useState({
    livestockType: '',
    totalShares: 1000,
    pricePerShare: '100',
    category: 'Livestock',
    healthStatus: 'Excellent',
    age: 24,
    insuranceId: '',
  });

  // Filter assets owned by current farmer
  const myAssets = assets.filter(asset => asset.farmer.toLowerCase() === (address ?? '').toLowerCase());

  // Handler: Create asset using MetaMask transaction
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Preparing MetaMask transaction...');

      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747', // Your deployed contract address
        abi: livestockManagerContract.abi,
        functionName: 'createListing',
        args: [
          BigInt(assetForm.totalShares),
          parseUnits(assetForm.pricePerShare, 6), // Assume TUSDC decimals = 6
          assetForm.category,
          assetForm.livestockType,
          [
            assetForm.healthStatus,
            BigInt(assetForm.age),
            BigInt(Math.floor(Date.now() / 1000)),  // Current UNIX timestamp seconds
            assetForm.insuranceId,
          ],
        ],
      });

      toast.dismiss();
      toast.success('🔄 Transaction submitted! Check MetaMask...');

      // Save locally in localStorage for cross-dashboard sync
      const existingAssets: Asset[] = JSON.parse(localStorage.getItem('userAssets') ?? '[]');
      const newAsset: Asset = {
        id: Date.now(),
        tokenId: 0,
        farmer: address,
        livestockType: assetForm.livestockType,
        totalShares: assetForm.totalShares,
        availableShares: assetForm.totalShares,
        pricePerShare: assetForm.pricePerShare,
        category: assetForm.category,
        healthStatus: assetForm.healthStatus,
        age: assetForm.age,
        insuranceId: assetForm.insuranceId,
        status: 'pending',
        isVerified: false,
        createdAt: new Date().toISOString(),
        txHash: hash,
      };
      localStorage.setItem('userAssets', JSON.stringify([...existingAssets, newAsset]));
      refreshData();

      // Reset form to defaults
      setAssetForm({
        livestockType: '',
        totalShares: 1000,
        pricePerShare: '100',
        category: 'Livestock',
        healthStatus: 'Excellent',
        age: 24,
        insuranceId: '',
      });
    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Transaction failed: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  // Handler: Withdraw funds using MetaMask transaction
  const handleWithdrawFunds = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.loading('Preparing withdrawal...');

      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: livestockManagerContract.abi,
        functionName: 'claimFunds',
        args: [],
      });

      toast.dismiss();
      toast.success('💰 Withdrawal transaction sent to MetaMask!');
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Withdrawal failed: ${error?.message ?? 'Unknown error'}`);
    }
  };

  // Listen for successful transaction confirmation
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`✅ Transaction confirmed! Hash: ${hash.slice(0, 10)}...`);
      refreshData();
    }
  }, [isSuccess, hash, refreshData]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Connect Wallet for Farmer Access</h2>
          <w3m-button />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Farmer Sidebar */}
      <aside className="w-80 bg-slate-800 text-white flex flex-col shadow-2xl" aria-label="Farmer dashboard navigation">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-slate-700/50">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-2xl select-none">🌾</div>
            <div>
              <h1 className="text-2xl font-bold">LivestocX</h1>
              <p className="text-xs text-gray-400">FARMER DASHBOARD</p>
            </div>
          </div>

          <nav className="space-y-3 mb-8" role="navigation">
            {[
              { id: 'create', icon: '➕', label: 'Create Asset', badge: null },
              { id: 'listings', icon: '📋', label: 'My Listings', badge: myAssets.length.toString() },
              { id: 'withdraw', icon: '💰', label: 'Withdraw', badge: '$2,450' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePanel(item.id as typeof activePanel)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activePanel === item.id ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-slate-700'
                }`}
                aria-current={activePanel === item.id ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl select-none" aria-hidden="true">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-1 text-xs bg-orange-500 rounded-full select-none" aria-label={`${item.badge} notifications`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <section className="border-t border-slate-700 pt-6" aria-label="Switch user roles">
            <p className="text-xs text-gray-400 uppercase mb-4 font-semibold">Switch View</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onRoleSwitch('investor')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-gray-300 hover:bg-slate-700"
              >
                <span>📈</span> Investor View
              </button>
              <button
                type="button"
                onClick={() => onRoleSwitch('admin')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-gray-300 hover:bg-slate-700"
              >
                <span>⚙️</span> Admin View
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-auto p-6 border-t border-slate-700">
          <div className="mb-4 p-4 bg-slate-700 rounded-xl select-text">
            <p className="text-xs text-gray-400 mb-2">Farmer Wallet</p>
            <p className="text-sm font-medium text-white mb-2">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
            <p className="text-xs text-gray-400">Balance: {balance ? Number(balance.formatted).toFixed(4) : '0.0000'} BDAG</p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-300 hover:bg-slate-700 rounded-xl"
            aria-label="Back to Landing page"
          >
            <span aria-hidden="true">←</span> Back to Landing
          </button>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto" role="main">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Create Asset Panel */}
          {activePanel === 'create' && (
            <section aria-label="Create Asset">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Create Agricultural Asset</h1>
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <form onSubmit={handleCreateAsset} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="livestockType" className="block text-sm font-bold text-gray-700 mb-3">
                        Asset Type *
                      </label>
                      <input
                        id="livestockType"
                        type="text"
                        value={assetForm.livestockType}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, livestockType: e.target.value }))}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500"
                        placeholder="e.g., Angus Cattle, Organic Wheat"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-3">
                        Category *
                      </label>
                      <select
                        id="category"
                        value={assetForm.category}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500"
                        required
                      >
                        <option value="Livestock">🐄 Livestock</option>
                        <option value="Crop">🌾 Crop</option>
                        <option value="Equipment">🚜 Equipment</option>
                        <option value="Land">🏞️ Land</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="totalShares" className="block text-sm font-bold text-gray-700 mb-3">
                        Total Shares *
                      </label>
                      <input
                        id="totalShares"
                        type="number"
                        value={assetForm.totalShares}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, totalShares: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500"
                        min={1}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="pricePerShare" className="block text-sm font-bold text-gray-700 mb-3">
                        Price per Share (TUSDC) *
                      </label>
                      <input
                        id="pricePerShare"
                        type="number"
                        step="0.01"
                        value={assetForm.pricePerShare}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, pricePerShare: e.target.value }))}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500"
                        min={0.01}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="insuranceId" className="block text-sm font-bold text-gray-700 mb-3">
                        Insurance ID *
                      </label>
                      <input
                        id="insuranceId"
                        type="text"
                        value={assetForm.insuranceId}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, insuranceId: e.target.value }))}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500"
                        placeholder="INS-2025-001"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-bold text-gray-700 mb-3">
                        Age (months) *
                      </label>
                      <input
                        id="age"
                        type="number"
                        value={assetForm.age}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500"
                        min={0}
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">Asset Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {(assetForm.totalShares * parseFloat(assetForm.pricePerShare || '0')).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Value (TUSDC)</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{assetForm.totalShares.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Shares</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{assetForm.pricePerShare}</div>
                        <div className="text-sm text-gray-600">Price/Share</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{assetForm.category}</div>
                        <div className="text-sm text-gray-600">Category</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || isConfirming}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-xl hover:shadow-2xl disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        {isPending ? 'Confirm in MetaMask...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <span className="text-xl">🚀</span>
                        Tokenize Asset (MetaMask)
                      </>
                    )}
                  </button>
                </form>

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
            </section>
          )}

          {/* My Listings Panel */}
          {activePanel === 'listings' && (
            <section aria-label="My Asset Listings">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">My Asset Listings</h1>

              {myAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myAssets.map((asset) => (
                    <article key={asset.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow" tabIndex={0}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl select-none">
                          {asset.category === 'Livestock' ? '🐄' : asset.category === 'Crop' ? '🌾' : asset.category === 'Equipment' ? '🚜' : '🏞️'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{asset.livestockType}</h3>
                          <p className="text-sm text-gray-500">Asset ID: {asset.id}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span>Total Shares:</span>
                          <span className="font-bold">{asset.totalShares.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available:</span>
                          <span className="font-bold text-blue-600">{asset.availableShares.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price/Share:</span>
                          <span className="font-bold text-green-600">${asset.pricePerShare}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${asset.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {asset.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Health:</span>
                          <span className="font-semibold text-green-600">{asset.healthStatus}</span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                          style={{ width: `${((asset.totalShares - asset.availableShares) / asset.totalShares) * 100}%` }}
                        />
                      </div>

                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold" type="button">
                        Manage Asset
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 select-none" aria-hidden="true">
                    <span className="text-4xl">📋</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">No Assets Listed Yet</h3>
                  <p className="text-gray-600 mb-8">Start by creating your first asset listing</p>
                  <button onClick={() => setActivePanel('create')} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl" type="button">
                    Create First Listing
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Withdraw Panel */}
          {activePanel === 'withdraw' && (
            <section aria-label="Withdraw Earnings">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Withdraw Earnings</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <article className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6" tabIndex={0} role="region" aria-label="Available to Withdraw">
                  <div className="text-3xl font-bold mb-2">$2,450.75</div>
                  <div>Available to Withdraw</div>
                </article>
                <article className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6" tabIndex={0} role="region" aria-label="Total Earnings">
                  <div className="text-3xl font-bold mb-2">$18,750.00</div>
                  <div>Total Earnings</div>
                </article>
                <article className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6" tabIndex={0} role="region" aria-label="Active Assets">
                  <div className="text-3xl font-bold mb-2">{myAssets.length}</div>
                  <div>Active Assets</div>
                </article>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Withdraw</h2>
                  <p className="text-gray-600 mb-8">
                    You have $2,450.75 TUSDC available to claim from your asset sales and investments.
                  </p>

                  <button
                    type="button"
                    onClick={handleWithdrawFunds}
                    disabled={isPending || isConfirming}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-xl hover:shadow-2xl disabled:cursor-not-allowed inline-flex items-center gap-3"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        {isPending ? 'Confirm in MetaMask...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <span className="text-xl">🚀</span>
                        Withdraw $2,450.75 (MetaMask)
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t pt-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</h3>
                  <div className="space-y-3">
                    {[
                      { type: 'Withdrawal', amount: '$1,200.50', date: '2 days ago', status: 'Completed' },
                      { type: 'Asset Sale', amount: '$850.25', date: '1 week ago', status: 'Completed' },
                      { type: 'Investment Return', amount: '$400.00', date: '2 weeks ago', status: 'Completed' },
                    ].map((tx, index) => (
                      <article key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg" tabIndex={0} aria-label={`${tx.type} ${tx.status}`}>
                        <div>
                          <div className="font-semibold text-gray-800">{tx.type}</div>
                          <div className="text-sm text-gray-500">{tx.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{tx.amount}</div>
                          <div className="text-xs text-gray-500">{tx.status}</div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl select-none" aria-hidden="true">⚡</span>
                    <h4 className="text-lg font-bold text-green-800">Real MetaMask Transaction</h4>
                  </div>
                  <p className="text-green-700">This will trigger a REAL MetaMask popup to claim your funds from the smart contract!</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
