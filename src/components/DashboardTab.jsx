import React from 'react';
import Overview from './Overview';

export default function DashboardTab() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Dashboard Overview</h2>
      {/* KPI Overview component */}
      <Overview />
    </div>
  );
}
