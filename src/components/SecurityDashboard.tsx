import React from 'react';

const SecurityDashboard: React.FC = () => {
  return (
    <div className="absolute top-4 left-4 z-20 w-64 bg-dark-800/95 backdrop-blur-md rounded-lg border border-white/10 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Security Dashboard</h3>
      <div className="space-y-2 text-xs text-white/60">
        <div>Active Guards: 12</div>
        <div>Live Cameras: 8</div>
        <div>Crowd Count: 2,847</div>
      </div>
    </div>
  );
};

export default SecurityDashboard;