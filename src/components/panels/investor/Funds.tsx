'use client';

import React, { useState, useEffect } from 'react';
import { useStablecoin } from '@/hooks/useContract';
import toast from 'react-hot-toast';

export default function Funds() {
  const { balance, mint, transfer, approve, refreshBalances } = useStablecoin();
  const [mintAmount, setMintAmount] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  const handleMint = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const result = await mint('0x' + '0'.repeat(40), mintAmount); // Mock address
      if (result.success) {
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
          txHash: result.txHash
        }, ...prev]);
      }
    } catch (error: any) {
      toast.error(`Mint failed: ${error.message}`);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferTo || parseFloat(transferAmount) <= 0) {
      toast.error('Please enter valid transfer details');
      return;
    }

    if (parseFloat(transferAmount) > parseFloat(balance || '0')) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const result = await transfer(transferTo, transferAmount);
      if (result.success) {
        toast.success(`💸 ${transferAmount} TUSDC transferred successfully!`);
        setTransferAmount('');
        setTransferTo('');
        refreshBalances();
        
        // Add to transaction history
        setTransactions(prev => [{
          id: Date.now(),
          type: 'transfer',
          amount: transferAmount,
          to: transferTo,
          date: new Date().toISOString(),
          status: 'completed',
          txHash: result.txHash
        }, ...prev]);
      }
    } catch (error: any) {
      toast.error(`Transfer failed: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Funds</h2>
      <p className="text-gray-600 mb-6">Manage your TUSDC balance and transactions</p>
      
      {/* Current Balance */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Balance</h3>
          <div className="text-4xl font-bold text-blue-600 mb-2">{balance} TUSDC</div>
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
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Mint TUSDC
          </button>
        </div>
      </div>

      {/* Transfer Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transfer TUSDC</h3>
        <p className="text-sm text-gray-600 mb-4">Send TUSDC to another wallet address</p>
        
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Transfer
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
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
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
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          ✅ Real TUSDC token contract integration on BlockDAG testnet
        </p>
      </div>
    </div>
  );
}
