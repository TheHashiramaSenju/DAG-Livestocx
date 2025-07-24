'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import LandingPage from '@/components/visuals/LandingPage';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import FarmerDashboard from '@/components/dashboards/FarmerDashboard';
import InvestorDashboard from '@/components/dashboards/InvestorDashboard';
import { useRoleManagement } from '@/hooks/useContract';
import { isNetworkSupported } from '@/lib/contracts';
import toast from 'react-hot-toast';

type AppRole = 'farmer' | 'investor' | 'admin';
type ViewState = 'landing' | AppRole;

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { userRoles, checkUserRoles, grantAdminRole } = useRoleManagement();

  // Error - fixed : Used refs to prevent re-initialization loops @pravin
  const hasInitialized = useRef(false);
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isReady, setIsReady] = useState(false);

  
  const initializeApp = useCallback(async () => {
    if (hasInitialized.current || !isConnected || !address) return;

    try {
      hasInitialized.current = true;
      
      // Grant admin role 
      await grantAdminRole(address);
      await checkUserRoles();
      
      setIsReady(true);
      toast.success('🛡️ Admin access granted!');
    } catch (error) {
      console.error('Initialization failed:', error);
      setIsReady(true); // Still show UI even if init fails
    }
  }, [isConnected, address, grantAdminRole, checkUserRoles]);


  useEffect(() => {
    if (isConnected && address && isNetworkSupported(chainId || 0)) {
      initializeApp();
    } else if (!isConnected) {
      // Reset when wallet disconnects
      hasInitialized.current = false;
      setCurrentView('landing');
      setIsReady(true);
    }
  }, [isConnected, address, chainId, initializeApp]);

  // Handle role selection
  const handleRoleSelect = useCallback((role: AppRole) => {
    setCurrentView(role);
    localStorage.setItem('selectedRole', role);
    toast.success(`Switched to ${role} dashboard`);
  }, []);

  const handleExit = useCallback(() => {
    setCurrentView('landing');
    localStorage.removeItem('selectedRole');
  }, []);

  // Show loading until initialized
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading LivestocX</h2>
          <p className="text-gray-400 mt-2">Initializing blockchain connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Emergency access buttons */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={() => handleRoleSelect('admin')} className="bg-red-600 text-white px-3 py-2 rounded font-bold">
          🛡️ ADMIN
        </button>
        <button onClick={() => handleRoleSelect('farmer')} className="bg-green-600 text-white px-3 py-2 rounded font-bold">
          🌾 FARMER
        </button>
        <button onClick={() => handleRoleSelect('investor')} className="bg-blue-600 text-white px-3 py-2 rounded font-bold">
          📈 INVESTOR
        </button>
      </div>

      {/* Render current view */}
      {currentView === 'landing' && <LandingPage onRoleSelect={() => handleRoleSelect('admin')} />}
      {currentView === 'admin' && <AdminDashboard onExit={handleExit} onRoleSwitch={handleRoleSelect} />}
      {currentView === 'farmer' && <FarmerDashboard onExit={handleExit} onRoleSwitch={handleRoleSelect} />}
      {currentView === 'investor' && <InvestorDashboard onExit={handleExit} onRoleSwitch={handleRoleSelect} />}
    </div>
  );
}
