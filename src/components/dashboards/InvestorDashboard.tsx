'use client';

import React, { useState } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { livestockManagerContract } from '@/lib/contracts';
import toast from 'react-hot-toast';

interface InvestorDashboardProps {
  onExit: () => void;
  onRoleSwitch: (role: 'farmer' | 'investor' | 'admin') => void;
}

export default function InvestorDashboard({ onExit, onRoleSwitch }: InvestorDashboardProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [activePanel, setActivePanel] = useState('marketplace');
  
  // REAL METAMASK INTEGRATION
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // INVESTMENT FORM STATE
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // REAL METAMASK TRANSACTION - INVEST IN ASSET
  const handleInvest = async (assetId: number, shares: number, pricePerShare: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Preparing investment transaction...');
      
      // THIS TRIGGERS REAL METAMASK POPUP
      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: livestockManagerContract.abi,
        functionName: 'invest',
        args: [
          BigInt(assetId),
          BigInt(shares),
          parseUnits(pricePerShare, 6) // Max price per share
        ],
      });
      
      toast.dismiss();
      toast.success('🔄 Investment transaction sent to MetaMask!');
    } catch (error: any) {
      toast.dismiss();
      if (error.message?.includes('User rejected')) {
        toast.error('Investment cancelled by user');
      } else {
        toast.error(`Investment failed: ${error.message}`);
      }
    }
  };

  // REAL METAMASK TRANSACTION - WITHDRAW INVESTMENT
  const handleWithdrawInvestment = async (investmentId: number, shares: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.loading('Preparing withdrawal...');
      
      // THIS TRIGGERS REAL METAMASK POPUP
      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
        abi: livestockManagerContract.abi,
        functionName: 'withdrawInvestment',
        args: [
          BigInt(investmentId),
          BigInt(shares)
        ],
      });
      
      toast.dismiss();
      toast.success('💰 Withdrawal transaction sent to MetaMask!');
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Withdrawal failed: ${error.message}`);
    }
  };

  // Monitor transaction success
  React.useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`✅ Transaction confirmed! Hash: ${hash.slice(0, 10)}...`);
    }
  }, [isSuccess, hash]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Connect Wallet for Investor Access</h2>
          <w3m-button />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Investor Sidebar */}
      <div className="w-80 bg-slate-800 text-white flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-slate-700/50">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl">📈</div>
            <div>
              <div className="text-2xl font-bold">LivestocX</div>
              <div className="text-xs text-gray-400">INVESTOR DASHBOARD</div>
            </div>
          </div>

          <nav className="space-y-3 mb-8">
            {[
              { id: 'marketplace', icon: '🏪', label: 'Marketplace', badge: '89 Assets' },
              { id: 'portfolio', icon: '💼', label: 'My Portfolio', badge: '$23,500' },
              { id: 'analytics', icon: '📊', label: 'Analytics', badge: '+12.5%' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activePanel === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                </div>
                <span className="px-2 py-1 text-xs bg-blue-500 rounded-full">{item.badge}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-700 pt-6">
            <div className="text-xs text-gray-400 uppercase mb-4">Switch View</div>
            <div className="space-y-2">
              <button onClick={() => onRoleSwitch('farmer')} className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-gray-300 hover:bg-slate-700">
                <span>🌾</span> Farmer View
              </button>
              <button onClick={() => onRoleSwitch('admin')} className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-gray-300 hover:bg-slate-700">
                <span>⚙️</span> Admin View
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-700">
          <div className="mb-4 p-4 bg-slate-700 rounded-xl">
            <div className="text-xs text-gray-400 mb-2">Investor Wallet</div>
            <div className="text-sm font-medium text-white mb-2">{address?.slice(0, 8)}...{address?.slice(-6)}</div>
            <div className="text-xs text-gray-400">Balance: {balance ? Number(balance.formatted).toFixed(4) : '0.0000'} BDAG</div>
          </div>
          <button onClick={onExit} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-300 hover:bg-slate-700 rounded-xl">
            <span>←</span> Back to Landing
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-8">
          {/* Marketplace Panel */}
          {activePanel === 'marketplace' && (
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Investment Marketplace</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { 
                    id: 1, 
                    name: 'Highland Cattle Farm', 
                    farmer: '0x1234...5678', 
                    totalValue: 75000, 
                    pricePerShare: 150.00, 
                    available: 300, 
                    total: 500,
                    roi: '+15.2%',
                    risk: 'Low',
                    category: 'Livestock'
                  },
                  { 
                    id: 2, 
                    name: 'Organic Wheat Fields', 
                    farmer: '0x8765...4321', 
                    totalValue: 45000, 
                    pricePerShare: 75.50, 
                    available: 800, 
                    total: 2000,
                    roi: '+22.8%',
                    risk: 'Medium',
                    category: 'Crop'
                  },
                  { 
                    id: 3, 
                    name: 'Solar Farm Equipment', 
                    farmer: '0x9876...1234', 
                    totalValue: 120000, 
                    pricePerShare: 500.00, 
                    available: 150, 
                    total: 240,
                    roi: '+8.5%',
                    risk: 'Low',
                    category: 'Equipment'
                  },
                  { 
                    id: 4, 
                    name: 'Free Range Poultry', 
                    farmer: '0x5432...8765', 
                    totalValue: 28000, 
                    pricePerShare: 45.25, 
                    available: 600, 
                    total: 1500,
                    roi: '+31.2%',
                    risk: 'High',
                    category: 'Livestock'
                  },
                  { 
                    id: 5, 
                    name: 'Hydroponic Greenhouse', 
                    farmer: '0x6789...2468', 
                    totalValue: 95000, 
                    pricePerShare: 320.00, 
                    available: 200, 
                    total: 300,
                    roi: '+18.7%',
                    risk: 'Medium',
                    category: 'Equipment'
                  },
                  { 
                    id: 6, 
                    name: 'Organic Vineyard', 
                    farmer: '0x1357...9753', 
                    totalValue: 200000, 
                    pricePerShare: 800.00, 
                    available: 50, 
                    total: 250,
                    roi: '+12.3%',
                    risk: 'Low',
                    category: 'Crop'
                  }
                ].map(asset => {
                  const fundedPercentage = ((asset.total - asset.available) / asset.total) * 100;
                  
                  return (
                    <div key={asset.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl">
                          {asset.category === 'Livestock' ? '🐄' : 
                           asset.category === 'Crop' ? '🌾' : '🚜'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{asset.name}</h3>
                          <p className="text-sm text-gray-500">by {asset.farmer}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Price/Share:</span>
                          <span className="font-bold text-green-600">${asset.pricePerShare}</span>
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
                          <span className={`font-bold ${
                            asset.risk === 'Low' ? 'text-green-600' : 
                            asset.risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {asset.risk}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Funding Progress</span>
                          <span>{fundedPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${fundedPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Shares"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                        />
                        <button
                          onClick={() => handleInvest(asset.id, parseInt(investmentAmount) || 1, asset.pricePerShare.toString())}
                          disabled={isPending || isConfirming}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-1"
                        >
                          {isPending || isConfirming ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '🚀'
                          )}
                          Invest
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⚡</span>
                  <h4 className="text-lg font-bold text-blue-800">Real MetaMask Investment</h4>
                </div>
                <p className="text-blue-700">
                  Click "Invest" on any asset to trigger a REAL MetaMask popup for blockchain investment!
                </p>
              </div>
            </div>
          )}

          {/* Portfolio Panel */}
          {activePanel === 'portfolio' && (
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-8">My Investment Portfolio</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6">
                  <div className="text-3xl font-bold mb-2">$23,500</div>
                  <div className="text-blue-100">Portfolio Value</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6">
                  <div className="text-3xl font-bold mb-2">+$2,850</div>
                  <div className="text-green-100">Unrealized P&L</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6">
                  <div className="text-3xl font-bold mb-2">+12.5%</div>
                  <div className="text-purple-100">Total Return</div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6">
                  <div className="text-3xl font-bold mb-2">8</div>
                  <div className="text-orange-100">Active Investments</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Holdings</h2>
                
                <div className="space-y-4">
                  {[
                    { id: 1, name: 'Highland Cattle Farm', shares: 150, value: '$22,500', pnl: '+$3,375', change: '+15.2%' },
                    { id: 2, name: 'Organic Wheat Fields', shares: 200, value: '$15,100', pnl: '+$2,100', change: '+16.1%' },
                    { id: 3, name: 'Solar Farm Equipment', shares: 50, value: '$25,000', pnl: '+$2,125', change: '+9.3%' },
                    { id: 4, name: 'Free Range Poultry', shares: 300, value: '$13,575', pnl: '+$4,237', change: '+45.2%' },
                  ].map(holding => (
                    <div key={holding.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📈</div>
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
                        onClick={() => handleWithdrawInvestment(holding.id, holding.shares)}
                        disabled={isPending || isConfirming}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        {isPending || isConfirming ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          '💰'
                        )}
                        Withdraw
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">⚡</span>
                    <h4 className="text-lg font-bold text-green-800">Real MetaMask Withdrawal</h4>
                  </div>
                  <p className="text-green-700">
                    Click "Withdraw" on any investment to trigger a REAL MetaMask popup for blockchain withdrawal!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Panel */}
          {activePanel === 'analytics' && (
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Investment Analytics</h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Portfolio Performance</h2>
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📊</div>
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
                      { category: 'Land', percentage: 5, value: '$1,175', color: 'bg-orange-500' }
                    ].map(item => (
                      <div key={item.category} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          {item.category === 'Livestock' ? '🐄' : 
                           item.category === 'Crops' ? '🌾' : 
                           item.category === 'Equipment' ? '🚜' : '🏞️'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-gray-800">{item.category}</span>
                            <span className="text-gray-600">{item.value}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${item.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="font-bold text-gray-800">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Investment Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 mb-2">23.4%</div>
                    <div className="text-green-800 font-semibold">Best Performing Asset</div>
                    <div className="text-sm text-gray-600">Free Range Poultry</div>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 mb-2">8.2</div>
                    <div className="text-blue-800 font-semibold">Diversification Score</div>
                    <div className="text-sm text-gray-600">Well diversified</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600 mb-2">$2,850</div>
                    <div className="text-purple-800 font-semibold">Monthly Earnings</div>
                    <div className="text-sm text-gray-600">Average return</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
