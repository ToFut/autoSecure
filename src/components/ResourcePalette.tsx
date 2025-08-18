import React from 'react';

const ResourcePalette: React.FC = () => {
  return (
    <div className="w-20 bg-dark-800/95 border-r border-white/10 flex flex-col items-center py-4">
      <div className="text-center text-white/60 text-xs mb-4">Resources</div>
      <div className="space-y-2">
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white/40">
          <i className="fas fa-user-shield"></i>
        </div>
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white/40">
          <i className="fas fa-video"></i>
        </div>
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white/40">
          <i className="fas fa-shield-alt"></i>
        </div>
      </div>
    </div>
  );
};

export default ResourcePalette;