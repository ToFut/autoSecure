import React from 'react';

const ProfessionalToolbar: React.FC = () => {
  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 bg-dark-800/95 backdrop-blur-md rounded-lg border border-white/10 p-2">
      <div className="space-y-2">
        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-white/40">
          <i className="fas fa-tools"></i>
        </div>
        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-white/40">
          <i className="fas fa-cog"></i>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalToolbar;