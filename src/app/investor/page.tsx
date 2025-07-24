'use client';

import InvestorDashboard from '@/components/dashboards/InvestorDashboard';
import { useRouter } from 'next/navigation';

export default function InvestorPage() {
  const router = useRouter();

  const handleExit = () => {
    router.push('/');
  };

  const handleRoleSwitch = (role: 'farmer' | 'investor' | 'admin') => {
    router.push(`/${role}`);
  };

  return (
    <InvestorDashboard 
      onExit={handleExit}
      onRoleSwitch={handleRoleSwitch}
    />
  );
}
