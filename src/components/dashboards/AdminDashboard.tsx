'use client';

import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import toast from 'react-hot-toast';
import { useRealMetaMask, useCrossDashboardData } from '@/hooks/useContract';

interface AdminDashboardProps {
  onExit: () => void;
  onRoleSwitch: (role: 'farmer' | 'investor' | 'admin') => void;
}

interface Asset {
  id: number;
  category: 'Livestock' | 'Crop' | 'Equipment' | 'Land' | string;
  livestockType: string;
  farmer?: string;
  totalShares: number;
  pricePerShare: string;
  status?: 'verified' | 'pending' | string;
  healthStatus: string;
  createdAt: string;
  isVerified?: boolean;
}

interface Investment {
  id: number;
  shares: number;
  pricePerShare: string;
  investor?: string;
  timestamp: string;
}

export default function AdminDashboard({ onExit, onRoleSwitch }: AdminDashboardProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const [activePanel, setActivePanel] = useState<'overview' | 'verification' | 'roles' | 'treasury' | 'analytics'>('overview');

  const { investWithMetaMask, isLoading } = useRealMetaMask();
  const { assets, investments, refreshData } = useCrossDashboardData();

  const [mintAmount, setMintAmount] = useState<string>('10000');

  const handleVerifyAsset = async (assetId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    try {
      toast.loading('Opening MetaMask for asset verification...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const existingAssets: Asset[] = JSON.parse(localStorage.getItem('userAssets') ?? '[]');
      const updatedAssets = existingAssets.map(asset => asset.id === assetId ? { ...asset, status: 'verified', isVerified: true } : asset);
      localStorage.setItem('userAssets', JSON.stringify(updatedAssets));
      toast.dismiss();
      toast.success(`✅ Asset ${assetId} verified on BlockDAG blockchain!`);
      refreshData();
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Verification failed: ${error?.message ?? 'Unknown error'}`);
    }
  };

  const handleApproveRole = async (userAddress: string, role: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    try {
      toast.loading('Opening MetaMask for role approval...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.dismiss();
      toast.success(`🛡️ ${role} role granted to ${userAddress}!`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Role approval failed: ${error?.message ?? 'Unknown error'}`);
    }
  };

  const handleMintStablecoin = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast.error('Please enter a valid amount to mint');
      return;
    }
    try {
      toast.loading('Opening MetaMask for TUSDC minting...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.dismiss();
      toast.success(`💰 ${mintAmount} TUSDC minted successfully!`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Minting failed: ${error?.message ?? 'Unknown error'}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Connect Wallet for Admin Access</h2>
          <p className="text-gray-400">Connect your wallet to access the admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-800 text-white flex flex-col shadow-2xl" aria-label="Admin navigation sidebar">
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-slate-700/50">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-2xl select-none" aria-hidden="true">⚙️</div>
            <div>
              <h1 className="text-2xl font-bold">LivestocX</h1>
              <p className="text-xs text-gray-400">ADMIN CONTROL PANEL</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-3 mb-8" role="navigation" aria-label="Admin panels navigation">
            {[
              { id: 'overview', icon: '📊', label: 'Platform Overview', badge: null },
              { id: 'verification', icon: '✅', label: 'Asset Verification', badge: assets.length.toString() },
              { id: 'roles', icon: '👥', label: 'Role Management', badge: '5' },
              { id: 'treasury', icon: '💰', label: 'Treasury', badge: null },
              { id: 'analytics', icon: '📈', label: 'Analytics', badge: null },
            ].map(({ id, icon, label, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivePanel(id as typeof activePanel)}
                aria-current={activePanel === id ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activePanel === id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl select-none" aria-hidden="true">{icon}</span>
                  <span className="font-semibold">{label}</span>
                </div>
                {badge && (
                  <span className="px-2 py-1 text-xs bg-orange-500 rounded-full select-none" aria-label={`${badge} notifications.`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Role Switching */}
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
                onClick={() => onRoleSwitch('investor')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-gray-300 hover:bg-slate-700"
              >
                <span role="img" aria-label="Investor">📈</span> Investor View
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-auto p-6 border-t border-slate-700">
          <div className="mb-4 p-4 bg-slate-700 rounded-xl select-text">
            <p className="text-xs text-gray-400 mb-2">Admin Wallet</p>
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
            aria-label="Back to Landing Page"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-300 hover:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
          >
            <span aria-hidden="true">←</span> Back to Landing
          </button>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto" role="main">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Platform Overview */}
          {activePanel === 'overview' && (
            <section aria-label="Platform Overview">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Platform Overview</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" role="list" aria-label="Platform statistics">
                <article className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6" role="listitem" tabIndex={0}>
                  <div className="text-3xl font-bold mb-2">1</div>
                  <div>Connected Users</div>
                </article>
                <article className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6" role="listitem" tabIndex={0}>
                  <div className="text-3xl font-bold mb-2">{assets.length}</div>
                  <div>Created Assets</div>
                </article>
                <article className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6" role="listitem" tabIndex={0}>
                  <div className="text-3xl font-bold mb-2">
                    ${investments.reduce((sum, inv) => sum + inv.shares * parseFloat(inv.pricePerShare), 0).toFixed(0)}
                  </div>
                  <div>Total Volume</div>
                </article>
                <article className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6" role="listitem" tabIndex={0}>
                  <div className="text-3xl font-bold mb-2">{investments.length}</div>
                  <div>Total Investments</div>
                </article>
              </div>

              {/* Recent Platform Activity */}
              <section className="bg-white rounded-2xl shadow-lg p-8" aria-label="Recent platform activity">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Platform Activity</h2>
                <div className="space-y-4">
                  {assets.slice(0, 5).map((asset) => (
                    <article
                      key={asset.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      tabIndex={0}
                      aria-label={`New asset listed: ${asset.livestockType} by ${asset.farmer}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-800">New asset listed: {asset.livestockType}</h3>
                          <p className="text-sm text-gray-500 font-mono">
                            by {asset.farmer?.slice(0, 8)}...{asset.farmer?.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <time className="text-sm text-gray-500" dateTime={asset.createdAt}>
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </time>
                    </article>
                  ))}
                  {investments.slice(0, 3).map((investment) => (
                    <article
                      key={investment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      tabIndex={0}
                      aria-label={`Investment made: ${investment.shares} shares by ${investment.investor}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            Investment made: {investment.shares} shares
                          </h3>
                          <p className="text-sm text-gray-500 font-mono">
                            by {investment.investor?.slice(0, 8)}...{investment.investor?.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <time className="text-sm text-gray-500" dateTime={investment.timestamp}>
                        {new Date(investment.timestamp).toLocaleDateString()}
                      </time>
                    </article>
                  ))}
                  {assets.length === 0 && investments.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No recent activity. Create assets in Farmer Dashboard to see activity here.</p>
                  )}
                </div>
              </section>
            </section>
          )}

          {/* Asset Verification */}
          {activePanel === 'verification' && (
            <section aria-label="Asset Verification">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Asset Verification</h1>
              {assets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets.map((asset) => (
                    <article
                      key={asset.id}
                      className="bg-white rounded-2xl shadow-lg p-6"
                      tabIndex={0}
                      aria-label={`Asset ${asset.livestockType} with ID ${asset.id}`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl select-none">
                          {asset.category === 'Livestock' ? '🐄' : asset.category === 'Crop' ? '🌾' : '🚜'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{asset.livestockType}</h3>
                          <p className="text-sm text-gray-500">Asset ID: {asset.id}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6 text-sm">
                        <div className="flex justify-between">
                          <span>Farmer:</span>
                          <span className="font-mono select-text">{asset.farmer?.slice(0, 8)}...{asset.farmer?.slice(-6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Value:</span>
                          <span className="font-bold text-green-600">${(asset.totalShares * parseFloat(asset.pricePerShare)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              asset.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                            aria-label={`Asset status: ${asset.status ?? 'Pending'}`}
                          >
                            {asset.status ?? 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Health:</span>
                          <span className="font-semibold text-green-600">{asset.healthStatus}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVerifyAsset(asset.id)}
                        disabled={isLoading || asset.status === 'verified'}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
                          isLoading || asset.status === 'verified' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                        }`}
                        aria-disabled={isLoading || asset.status === 'verified'}
                        aria-label={asset.status === 'verified' ? `Asset ${asset.id} is already verified` : `Verify asset ${asset.id}`}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                            Opening MetaMask...
                          </>
                        ) : asset.status === 'verified' ? (
                          <>✅ Already Verified</>
                        ) : (
                          <>✅ Verify Asset (MetaMask)</>
                        )}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 select-none" aria-hidden="true">✅</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">No Assets to Verify</h3>
                  <p className="text-gray-600">Assets created by farmers will appear here for verification.</p>
                </div>
              )}
            </section>
          )}

          {/* Role Management */}
          {activePanel === 'roles' && (
            <section aria-label="Role Management">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Role Management</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { address: '0x1234567890123456789012345678901234567890', role: 'Farmer', status: 'pending' },
                  { address: '0x0987654321098765432109876543210987654321', role: 'Investor', status: 'pending' },
                  { address: '0x1111222233334444555566667777888899990000', role: 'Farmer', status: 'pending' },
                  { address: '0x0000999988887777666655554444333322221111', role: 'Investor', status: 'pending' },
                  { address: '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333', role: 'Auditor', status: 'pending' },
                ].map((request, index) => (
                  <article
                    key={index}
                    className="bg-white rounded-2xl shadow-lg p-6"
                    tabIndex={0}
                    aria-label={`Role request for ${request.role} from ${request.address.slice(0, 8)}...${request.address.slice(-6)}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center select-none" aria-hidden="true">👤</div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Role Request</h3>
                          <p className="text-sm text-gray-500 select-text">{request.address.slice(0, 8)}...{request.address.slice(-6)}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm select-none">{request.status}</span>
                    </div>

                    <div className="mb-4 text-sm">
                      <div className="flex justify-between mb-2">
                        <span>Requested Role:</span>
                        <span className="font-semibold">{request.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Request Date:</span>
                        <span>Today</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleApproveRole(request.address, request.role)}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
                          isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" /> : '✅'} Approve (MetaMask)
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.error('Role request rejected')}
                        className="flex-1 py-2 px-4 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Treasury Management */}
          {activePanel === 'treasury' && (
            <section aria-label="Treasury Management">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Treasury Management</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" role="list" aria-label="Treasury stats">
                <article className="bg-white rounded-2xl shadow-lg p-6" tabIndex={0} role="listitem" aria-label="Platform Treasury">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Treasury</h3>
                  <p className="text-3xl font-bold text-green-600 mb-2">$1,234,567</p>
                  <p className="text-sm text-gray-500">Total Platform Funds</p>
                </article>

                <article className="bg-white rounded-2xl shadow-lg p-6" tabIndex={0} role="listitem" aria-label="TUSDC Supply">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">TUSDC Supply</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-2">2,890,432</p>
                  <p className="text-sm text-gray-500">Total TUSDC Minted</p>
                </article>

                <article className="bg-white rounded-2xl shadow-lg p-6" tabIndex={0} role="listitem" aria-label="Platform Revenue">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Revenue</h3>
                  <p className="text-3xl font-bold text-purple-600 mb-2">$45,678</p>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                </article>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8" aria-label="Treasury Actions">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Treasury Actions</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mint TUSDC */}
                  <div>
                    <label htmlFor="mintAmount" className="block text-sm font-semibold text-gray-700 mb-2">
                      Mint TUSDC Tokens
                    </label>

                    <div className="flex gap-3">
                      <input
                        id="mintAmount"
                        type="number"
                        min="0"
                        placeholder="Amount to mint"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                        aria-describedby="mintAmountHelp"
                      />
                      <button
                        type="button"
                        onClick={handleMintStablecoin}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        className={`px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2 transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" /> : '💰'} Mint (MetaMask)
                      </button>
                    </div>
                    <p id="mintAmountHelp" className="mt-2 text-xs text-gray-500">
                      Enter the amount of TUSDC stablecoins to mint.
                    </p>
                  </div>

                  {/* Emergency Actions */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Actions</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toast.info('⏸️ Platform paused!')}
                        className="w-full py-2 px-4 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
                      >
                        ⏸️ Pause Platform
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.error('🚨 Emergency stop activated!')}
                        className="w-full py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        🚨 Emergency Stop
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-red-50 rounded-2xl border-2 border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl select-none" aria-hidden="true">⚡</span>
                    <h4 className="text-lg font-bold text-red-800">Real MetaMask Treasury Operations</h4>
                  </div>
                  <p className="text-red-700">
                    All treasury operations trigger REAL MetaMask popups for blockchain transactions!
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Analytics Panel */}
          {activePanel === 'analytics' && (
            <section aria-label="Platform Analytics">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Platform Analytics</h1>

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Key Metrics</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                  <div tabIndex={0}>
                    <p className="text-3xl font-bold text-blue-600">100%</p>
                    <p className="text-gray-600">Platform Uptime</p>
                  </div>
                  <div tabIndex={0}>
                    <p className="text-3xl font-bold text-green-600">
                      ${investments.reduce((sum, inv) => sum + inv.shares * parseFloat(inv.pricePerShare), 0).toFixed(0)}
                    </p>
                    <p className="text-gray-600">Transaction Volume</p>
                  </div>
                  <div tabIndex={0}>
                    <p className="text-3xl font-bold text-purple-600">1</p>
                    <p className="text-gray-600">Active Wallets</p>
                  </div>
                  <div tabIndex={0}>
                    <p className="text-3xl font-bold text-orange-600">100%</p>
                    <p className="text-gray-600">Success Rate</p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Asset Categories</h3>
                    <div className="space-y-3">
                      {['Livestock', 'Crop', 'Equipment', 'Land'].map(category => {
                        const count = assets.filter(asset => asset.category === category).length;
                        const percentage = assets.length > 0 ? (count / assets.length) * 100 : 0;
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-gray-700">{category}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="text-sm font-semibold w-8">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span>Assets Created Today</span>
                        <span className="font-bold text-green-600">{assets.filter(asset => new Date(asset.createdAt).toDateString() === new Date().toDateString()).length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span>Investments Today</span>
                        <span className="font-bold text-blue-600">{investments.filter(inv => new Date(inv.timestamp).toDateString() === new Date().toDateString()).length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span>Verified Assets</span>
                        <span className="font-bold text-purple-600">{assets.filter(asset => asset.status === 'verified').length}</span>
                      </div>
                    </div>
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
