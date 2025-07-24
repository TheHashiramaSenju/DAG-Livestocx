'use client';

import React from 'react';

export default function LiveStatsDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800">Total Assets</h3>
        <p className="text-3xl font-bold text-green-600">2,847</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800">Total Investment</h3>
        <p className="text-3xl font-bold text-blue-600">$15.4M</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800">Active Users</h3>
        <p className="text-3xl font-bold text-purple-600">12,847</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800">Platform TVL</h3>
        <p className="text-3xl font-bold text-orange-600">$45.6M</p>
      </div>
    </div>
  );
}
