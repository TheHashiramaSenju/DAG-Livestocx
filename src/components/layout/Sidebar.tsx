'use client';

import React, { ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
  logo?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  children, 
  logo, 
  footer, 
  className = '' 
}) => {
  return (
    <div className={`bg-slate-800 text-white flex flex-col shadow-2xl border-r border-slate-700 ${className}`}>
      {logo && (
        <div className="p-8 border-b border-slate-700">
          {logo}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-slate-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
