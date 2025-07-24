'use client';

import FarmerDashboard from '@/components/dashboards/FarmerDashboard';
import { useRouter } from 'next/navigation';

export default function FarmerPage() {
  const router = useRouter();

  const handleExit = () => {
    router.push('/');
  };

  const handleRoleSwitch = (role: 'farmer' | 'investor' | 'admin') => {
    router.push(`/${role}`);
  };

  return (
    <FarmerDashboard 
      onExit={handleExit}
      onRoleSwitch={handleRoleSwitch}
    />
  );
}
