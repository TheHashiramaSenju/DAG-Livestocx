'use client';

import React, { useState, useEffect } from 'react';
import {
  useAccount,
  useBalance,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits } from 'viem';
import { livestockManagerContract } from '@/lib/contracts';
import toast from 'react-hot-toast';

interface InvestorDashboardProps {
  onExit: () => void;
  onRoleSwitch: (role: 'farmer' | 'investor' | 'admin') => void;
}

interface AssetItem {
  id: number;
  name: string;
  farmer: string;
  totalValue: number;
  pricePerShare: number;
  available: number;
  total: number;
  roi: string;
  risk: 'Low' | 'Medium' | 'High' | string;
  category: 'Livestock' | 'Crop' | 'Equipment' | string;
}

interface Holding {
  id: number;
  name: string;
  shares: number;
  value: string;
  pnl: string;
  change: string;
}

export default function InvestorDashboard({ onExit, onRoleSwitch }: InvestorDashboardProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { connect, connectors } = useConnect();
  const [activePanel, setActivePanel] = useState<'marketplace' | 'portfolio' | 'analytics'>('marketplace');

  // Wagmi hooks for contract interactions - FIXED: isPending instead of isLoading
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Investment input state
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  // Sample Marketplace assets (hard-coded for demo, replace with live data)
  const marketplaceAssets: AssetItem[] = [
    { id: 1, name: 'Highland Cattle Farm', farmer: '0x1234...5678', totalValue: 75000, pricePerShare: 150.00, available: 300, total: 500, roi: '+15.2%', risk: 'Low', category: 'Livestock' },
    { id: 2, name: 'Organic Wheat Fields', farmer: '0x8765...4321', totalValue: 45000, pricePerShare: 75.50, available: 800, total: 2000, roi: '+22.8%', risk: 'Medium', category: 'Crop' },
    { id: 3, name: 'Solar Farm Equipment', farmer: '0x9876...1234', totalValue: 120000, pricePerShare: 500.00, available: 150, total: 240, roi: '+8.5%', risk: 'Low', category: 'Equipment' },
    { id: 4, name: 'Free Range Poultry', farmer: '0x5432...8765', totalValue: 28000, pricePerShare: 45.25, available: 600, total: 1500, roi: '+31.2%', risk: 'High', category: 'Livestock' },
    { id: 5, name: 'Hydroponic Greenhouse', farmer: '0x6789...2468', totalValue: 95000, pricePerShare: 320.00, available: 200, total: 300, roi: '+18.7%', risk: 'Medium', category: 'Equipment' },
    { id: 6, name: 'Organic Vineyard', farmer: '0x1357...9753', totalValue: 200000, pricePerShare: 800.00, available: 50, total: 250, roi: '+12.3%', risk: 'Low', category: 'Crop' },
  ];

  // Sample portfolio holdings (replace with real data)
  const portfolioHoldings: Holding[] = [
    { id: 1, name: 'Highland Cattle Farm', shares: 150, value: '$22,500', pnl: '+$3,375', change: '+15.2%' },
    { id: 2, name: 'Organic Wheat Fields', shares: 200, value: '$15,100', pnl: '+$2,100', change: '+16.1%' },
    { id: 3, name: 'Solar Farm Equipment', shares: 50, value: '$25,000', pnl: '+$2,125', change: '+9.3%' },
    { id: 4, name: 'Free Range Poultry', shares: 300, value: '$13,575', pnl: '+$4,237', change: '+45.2%' },
  ];

  // Handle investment transaction via MetaMask popup
  const handleInvest = async (assetId: number, shares: number, pricePerShare: number) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Preparing investment transaction...');

      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: livestockManagerContract.abi,
        functionName: 'invest',
        args: [
          BigInt(assetId),
          BigInt(shares),
          parseUnits(pricePerShare.toString(), 6), // 6 decimals assumed
        ],
      });

      toast.dismiss();
      toast.success('🔄 Investment transaction sent to MetaMask!');
    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Investment cancelled by user');
      } else {
        toast.error(`Investment failed: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  // Handle withdrawal of investment via MetaMask popup
  const handleWithdrawInvestment = async (investmentId: number, shares: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.loading('Preparing withdrawal...');

      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: livestockManagerContract.abi,
        functionName: 'withdrawInvestment',
        args: [
          BigInt(investmentId),
          BigInt(shares),
        ],
      });

      toast.dismiss();
      toast.success('💰 Withdrawal transaction sent to MetaMask!');
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Withdrawal failed: ${error?.message ?? 'Unknown error'}`);
    }
  };

  // Show success toast on confirmed transaction
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`✅ Transaction confirmed! Hash: ${hash.slice(0, 10)}...`);
    }
  }, [isSuccess, hash]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Connect Wallet for Investor Access</h2>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl mx-2 transition-colors"
                type="button"
              >
                Connect with {connector.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-800 text-white flex flex-col shadow-2xl" aria-label="Investor dashboard navigation">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-slate-700/50">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl select-none" aria-hidden="true">📈</div>
            <div>
              <h1 className="text-2xl font-bold">LivestocX</h1>
              <p className="text-xs text-gray-400">INVESTOR DASHBOARD</p>
            </div>
          </div>

          <nav className="space-y-3 mb-8" role="navigation" aria-label="Investor panels navigation">
            {[
              { id: 'marketplace', icon: '🏪', label: 'Marketplace', badge: '89 Assets' },
              { id: 'portfolio', icon: '💼', label: 'My Portfolio', badge: '$23,500' },
              { id: 'analytics', icon: '📊', label: 'Analytics', badge: '+12.5%' },
            ].map(({ id, icon, label, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivePanel(id as typeof activePanel)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activePanel === id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
                }`}
                aria-current={activePanel === id ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl select-none" aria-hidden="true">{icon}</span>
                  <span className="font-semibold">{label}</span>
                </div>
                <span className="px-2 py-1 text-xs bg-blue-500 rounded-full select-none" aria-label={`${badge} notifications`}>
                  {badge}
                </span>
              </button>
            ))}
          </nav>

          <section className="border-t border-slate-700 pt-6" aria-label="Switch user roles">
            <p className="text-xs text-gray-400 uppercase mb-4 font-semibold">Switch View</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onRoleSwitch('farmer')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-gray-300 hover:bg-slate-700"
              >
                <span role="img" aria-label="Farmer">🌾</span> Farmer View
              </button>
              <button
                type="button"
                onClick={() => onRoleSwitch('admin')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-gray-300 hover:bg-slate-700"
              >
                <span role="img" aria-label="Admin">⚙️</span> Admin View
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-auto p-6 border-t border-slate-700">
          <div className="mb-4 p-4 bg-slate-700 rounded-xl select-text">
            <p className="text-xs text-gray-400 mb-2">Investor Wallet</p>
            <p className="text-sm font-medium text-white mb-2" title={address ?? undefined}>
              {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'N/A'}
            </p>
            <p className="text-xs text-gray-400" aria-live="polite">
              Balance: {balance ? Number(balance.formatted).toFixed(4) : '0.0000'} BDAG
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-300 hover:bg-slate-700 rounded-xl"
            aria-label="Back to Landing Page"
          >
            <span aria-hidden="true">←</span> Back to Landing
          </button>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto" role="main">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Marketplace Panel */}
          {activePanel === 'marketplace' && (
            <section aria-label="Investment Marketplace">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Investment Marketplace</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceAssets.map((asset) => {
                  const fundedPercentage = ((asset.total - asset.available) / asset.total) * 100;

                  return (
                    <article
                      key={asset.id}
                      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
                      tabIndex={0}
                      aria-label={`${asset.name} by ${asset.farmer}, ${fundedPercentage.toFixed(1)}% funded`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl select-none" aria-hidden="true">
                          {asset.category === 'Livestock' ? '🐄' : asset.category === 'Crop' ? '🌾' : '🚜'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{asset.name}</h3>
                          <p className="text-sm text-gray-500">by {asset.farmer}</p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Price/Share:</span>
                          <span className="font-bold text-green-600">${asset.pricePerShare.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Available:</span>
                          <span className="font-bold">{asset.available.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Expected ROI:</span>
                          <span className="font-bold text-blue-600">{asset.roi}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Risk Level:</span>
                          <span
                            className={`font-bold ${
                              asset.risk === 'Low' ? 'text-green-600' : asset.risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                            }`}
                          >
                            {asset.risk}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Funding Progress</span>
                          <span>{fundedPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3" aria-hidden="true">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${fundedPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Shares"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          value={selectedAsset?.id === asset.id ? investmentAmount : ''}
                          onChange={(e) => {
                            setSelectedAsset(asset);
                            setInvestmentAmount(e.target.value);
                          }}
                          aria-label={`Enter number of shares to invest in ${asset.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleInvest(asset.id, parseInt(investmentAmount) || 1, asset.pricePerShare)}
                          disabled={isPending || isConfirming}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-1"
                          aria-disabled={isPending || isConfirming}
                        >
                          {isPending || isConfirming ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" /> : '🚀'}
                          Invest
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl" aria-hidden="true">⚡</span>
                  <h4 className="text-lg font-bold text-blue-800">Real MetaMask Investment</h4>
                </div>
                <p className="text-blue-700">
                  Click "Invest" on any asset to trigger a REAL MetaMask popup for blockchain investment!
                </p>
              </div>
            </section>
          )}

          {/* Portfolio Panel */}
          {activePanel === 'portfolio' && (
            <section aria-label="My Investment Portfolio">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">My Investment Portfolio</h1>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <article className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6" tabIndex={0} role="region" aria-label="Portfolio Value">
                  <div className="text-3xl font-bold mb-2">$23,500</div>
                  <div>Portfolio Value</div>
                </article>
                <article className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6" tabIndex={0} role="region" aria-label="Unrealized P&L">
                  <div className="text-3xl font-bold mb-2">+$2,850</div>
                  <div>Unrealized P&amp;L</div>
                </article>
                <article className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6" tabIndex={0} role="region" aria-label="Total Return">
                  <div className="text-3xl font-bold mb-2">+12.5%</div>
                  <div>Total Return</div>
                </article>
                <article className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6" tabIndex={0} role="region" aria-label="Active Investments">
                  <div className="text-3xl font-bold mb-2">8</div>
                  <div>Active Investments</div>
                </article>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Holdings</h2>

                <div className="space-y-4">
                  {portfolioHoldings.map((holding) => (
                    <article
                      key={holding.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      tabIndex={0}
                      aria-label={`${holding.name} holding with ${holding.shares} shares valued at ${holding.value}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl select-none" aria-hidden="true">📈</div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{holding.name}</h3>
                          <p className="text-sm text-gray-500">{holding.shares} shares</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-gray-800">{holding.value}</div>
                        <div className="text-sm text-green-600">{holding.pnl} ({holding.change})</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleWithdrawInvestment(holding.id, holding.shares)}
                        disabled={isPending || isConfirming}
                        aria-disabled={isPending || isConfirming}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        {isPending || isConfirming ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        ) : (
                          '💰'
                        )}
                        Withdraw
                      </button>
                    </article>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl" aria-hidden="true">⚡</span>
                    <h4 className="text-lg font-bold text-green-800">Real MetaMask Withdrawal</h4>
                  </div>
                  <p className="text-green-700">
                    Click "Withdraw" on any investment to trigger a REAL MetaMask popup for blockchain withdrawal!
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Analytics Panel */}
          {activePanel === 'analytics' && (
            <section aria-label="Investment Analytics">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Investment Analytics</h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Portfolio Performance</h2>
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4" aria-hidden="true">📊</div>
                      <p className="text-gray-600">Portfolio Chart</p>
                      <p className="text-sm text-gray-500">Last 30 days: +12.5% growth</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Asset Allocation</h2>
                  <div className="space-y-4">
                    {[
                      { category: 'Livestock', percentage: 45, value: '$10,575', color: 'bg-green-500' },
                      { category: 'Crops', percentage: 30, value: '$7,050', color: 'bg-blue-500' },
                      { category: 'Equipment', percentage: 20, value: '$4,700', color: 'bg-purple-500' },
                      { category: 'Land', percentage: 5, value: '$1,175', color: 'bg-orange-500' },
                    ].map(({ category, percentage, value, color }) => (
                      <div key={category} className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center select-none ${color}`} aria-hidden="true">
                          {category === 'Livestock' ? '🐄' : category === 'Crops' ? '🌾' : category === 'Equipment' ? '🚜' : '🏞️'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{category}</p>
                          <div className="h-2 bg-gray-200 rounded-full relative">
                            <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                        <div className="text-gray-600 font-semibold w-20 text-right">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
