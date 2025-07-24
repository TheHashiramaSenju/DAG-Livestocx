'use client';

import React, { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  sidebar, 
  className = '' 
}) => {
  return (
    <div className={`flex min-h-screen bg-slate-900 ${className}`}>
      <aside className="w-80 shrink-0">
        {sidebar}
      </aside>
      <main className="flex-1 bg-gray-50 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
