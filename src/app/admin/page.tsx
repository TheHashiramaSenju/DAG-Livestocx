'use client';

import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  const handleExit = () => {
    router.push('/');
  };

  const handleRoleSwitch = (role: 'farmer' | 'investor' | 'admin') => {
    router.push(`/${role}`);
  };

  return (
    <AdminDashboard 
      onExit={handleExit}
      onRoleSwitch={handleRoleSwitch}
    />
  );
}
