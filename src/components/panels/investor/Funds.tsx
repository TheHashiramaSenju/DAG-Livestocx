'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useStablecoin } from '@/hooks/useContract';
import { livestockManagerContract } from '@/lib/contracts';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  type: 'mint' | 'transfer';
  amount: string;
  to?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
}

export default function Funds() {
  const { address, isConnected } = useAccount();
  
  // Safe destructuring from useStablecoin hook (no transfer function)
  const stablecoinHook = useStablecoin();
  const balance = stablecoinHook?.balance || '0';
  const mint = stablecoinHook?.mint || (async () => ({ success: false }));
  const approve = stablecoinHook?.approve || (async () => ({ success: false }));
  const refreshBalances = stablecoinHook?.refreshBalances || (() => {});
  const isHookLoading = stablecoinHook?.isLoading || false;
  
  // Wagmi hooks for transfer functionality
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  const [mintAmount, setMintAmount] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  // Handle successful transactions
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`✅ Transfer confirmed! Hash: ${hash.slice(0, 10)}...`);
      refreshBalances();
      
      // Add successful transfer to transaction history
      setTransactions(prev => [{
        id: Date.now(),
        type: 'transfer',
        amount: transferAmount,
        to: transferTo,
        date: new Date().toISOString(),
        status: 'completed',
        txHash: hash,
      }, ...prev]);
      
      // Reset transfer form
      setTransferAmount('');
      setTransferTo('');
    }
  }, [isSuccess, hash, transferAmount, transferTo]);

  const handleMint = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Minting TUSDC...');
      const result = await mint();
      
      if (result.success) {
        toast.dismiss();
        toast.success(`🪙 ${mintAmount} TUSDC minted successfully!`);
        setMintAmount('');
        refreshBalances();
        
        // Add to transaction history
        setTransactions(prev => [{
          id: Date.now(),
          type: 'mint',
          amount: mintAmount,
          date: new Date().toISOString(),
          status: 'completed',
        }, ...prev]);
      } else {
        toast.dismiss();
        toast.error('Mint failed');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Mint failed: ${error?.message ?? 'Unknown error'}`);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferTo || parseFloat(transferAmount) <= 0) {
      toast.error('Please enter valid transfer details');
      return;
    }

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (parseFloat(transferAmount) > parseFloat(balance || '0')) {
      toast.error('Insufficient balance');
      return;
    }

    // Basic address validation
    if (!transferTo.startsWith('0x') || transferTo.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    try {
      toast.loading('Preparing transfer transaction...');

      // Use wagmi to call the TUSDC transfer function
      await writeContract({
        address: '0x724550c719e4296B8B75C8143Ab6228141bC7747', // Your TUSDC contract address
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'transfer',
        args: [
          transferTo as `0x${string}`,
          parseUnits(transferAmount, 6) // Assuming TUSDC has 6 decimals
        ],
      });

      toast.dismiss();
      toast.success('🔄 Transfer transaction sent to MetaMask!');

    } catch (error: any) {
      toast.dismiss();
      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Transfer failed: ${error?.message ?? 'Unknown error'}`);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Wallet to Manage Funds</h2>
        <p className="text-gray-600">Please connect your wallet to manage your TUSDC balance</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Funds</h2>
      <p className="text-gray-600 mb-6">Manage your TUSDC balance and transactions with MetaMask</p>
      
      {/* Current Balance */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Balance</h3>
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {isHookLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              `${balance} TUSDC`
            )}
          </div>
          <p className="text-gray-600">Available for investment</p>
        </div>
      </div>

      {/* Mint TUSDC Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Mint Test TUSDC</h3>
        <p className="text-sm text-gray-600 mb-4">Get test TUSDC tokens for investment testing</p>
        
        <div className="flex gap-4">
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="Amount to mint"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            step="0.01"
            min="0"
          />
          <button
            onClick={handleMint}
            disabled={isHookLoading || !mintAmount}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            {isHookLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              '🪙'
            )}
            Mint TUSDC
          </button>
        </div>
      </div>

      {/* Transfer Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transfer TUSDC</h3>
        <p className="text-sm text-gray-600 mb-4">Send TUSDC to another wallet address via MetaMask</p>
        
        <div className="space-y-4">
          <input
            type="text"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            placeholder="Recipient address (0x...)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <div className="flex gap-4">
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Amount to transfer"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0"
              max={balance}
            />
            <button
              onClick={handleTransfer}
              disabled={isPending || isConfirming || !transferAmount || !transferTo}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              {isPending || isConfirming ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                '💸'
              )}
              {isPending ? 'Confirm in MetaMask...' : isConfirming ? 'Processing...' : 'Transfer'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setMintAmount('100')}
          className="p-4 bg-green-100 hover:bg-green-200 rounded-lg text-green-800 font-semibold transition-colors"
        >
          Mint 100 TUSDC
        </button>
        <button
          onClick={() => setMintAmount('500')}
          className="p-4 bg-green-100 hover:bg-green-200 rounded-lg text-green-800 font-semibold transition-colors"
        >
          Mint 500 TUSDC
        </button>
        <button
          onClick={() => setMintAmount('1000')}
          className="p-4 bg-green-100 hover:bg-green-200 rounded-lg text-green-800 font-semibold transition-colors"
        >
          Mint 1000 TUSDC
        </button>
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    tx.type === 'mint' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {tx.type === 'mint' ? 'Minted' : 'Transferred'} {tx.amount} TUSDC
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(tx.date).toLocaleString()}
                      {tx.to && ` → ${tx.to.slice(0, 8)}...${tx.to.slice(-6)}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                  {tx.txHash && (
                    <button 
                      onClick={() => window.open(`https://explorer.blockdag.network/tx/${tx.txHash}`, '_blank')}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
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
              All transfers trigger REAL MetaMask popups for blockchain transactions on BlockDAG testnet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
