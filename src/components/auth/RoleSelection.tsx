'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRoleManagement } from '@/hooks/useContract';
import toast from 'react-hot-toast';

export type AppRole = 'farmer' | 'investor' | 'admin';

interface RoleSelectionProps {
  onRoleSelect: (role: AppRole) => void;
  onClose: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect, onClose }) => {
  const { address, isConnected } = useAccount();
  const { userRoles, requestRole, checkUserRoles, isLoading } = useRoleManagement();
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      checkUserRoles();
   
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [isConnected, address, checkUserRoles]);

  const handleRoleSelect = async (role: AppRole) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSelectedRole(role);

    const hasRole = {
      farmer: userRoles.isFarmer,
      investor: userRoles.isInvestor,
      admin: userRoles.isAdmin,
    }[role];

    if (hasRole) {

      onRoleSelect(role);
      handleClose();
      toast.success(`Welcome to ${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard!`);
    } else {

      const roleMap = {
        farmer: 'FARMER_ROLE',
        investor: 'INVESTOR_ROLE',
        admin: 'DEFAULT_ADMIN_ROLE',
      } as const;

      try {
        const result = await requestRole(roleMap[role]);
        
        if (result.success) {
          toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} role requested! Please wait for admin approval.`);

          onRoleSelect(role);
          handleClose();
        } else {
          toast.error(`Failed to request ${role} role: ${result.error}`);
        }
      } catch (error: any) {
        toast.error(`Error requesting role: ${error.message}`);
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); 
  };

  if (!isConnected) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Choose Your Role</h2>
          <p className="text-xl text-white/90">Select how you'd like to use the LivestocX platform</p>
          <div className="mt-4 text-sm text-white/80">
            Connected: {address?.slice(0, 8)}...{address?.slice(-6)}
          </div>
        </div>

        {/* Role Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Farmer Role */}
            <div
              onClick={() => handleRoleSelect('farmer')}
              className={`role-card group cursor-pointer bg-white border-2 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                userRoles.isFarmer 
                  ? 'border-green-500 bg-green-50 shadow-lg' 
                  : 'border-gray-200 hover:border-green-400'
              }`}
            >
              <div className="text-8xl mb-6 group-hover:scale-110 transition-transform duration-300">🌾</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Farmer</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Tokenize your agricultural assets and access global funding through blockchain technology
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Create asset tokens
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Access global funding
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Manage livestock portfolio
                </div>
              </div>

              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                userRoles.isFarmer 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {userRoles.isFarmer ? '✓ Access Granted' : 'Request Access'}
              </div>
            </div>

            {/* Investor Role */}
            <div
              onClick={() => handleRoleSelect('investor')}
              className={`role-card group cursor-pointer bg-white border-2 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                userRoles.isInvestor 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 hover:border-blue-400'
              }`}
            >
              <div className="text-8xl mb-6 group-hover:scale-110 transition-transform duration-300">📈</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Investor</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Invest in agricultural assets and earn returns through diversified portfolio management
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Browse investment opportunities
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Track portfolio performance
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Earn competitive returns
                </div>
              </div>

              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                userRoles.isInvestor 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {userRoles.isInvestor ? '✓ Access Granted' : 'Request Access'}
              </div>
            </div>

            {/* Admin Role */}
            <div
              onClick={() => handleRoleSelect('admin')}
              className={`role-card group cursor-pointer bg-white border-2 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                userRoles.isAdmin 
                  ? 'border-purple-500 bg-purple-50 shadow-lg' 
                  : 'border-gray-200 hover:border-purple-400'
              }`}
            >
              <div className="text-8xl mb-6 group-hover:scale-110 transition-transform duration-300">⚙️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Admin</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage platform operations, verify assets, and oversee the LivestocX ecosystem
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Verify asset listings
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Approve user roles
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Platform analytics
                </div>
              </div>

              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                userRoles.isAdmin 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {userRoles.isAdmin ? '✓ Access Granted' : 'Admin Only'}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 bg-blue-50 text-blue-800 px-6 py-3 rounded-lg">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Processing role request...</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Role requests are processed on the blockchain and may require admin approval</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
