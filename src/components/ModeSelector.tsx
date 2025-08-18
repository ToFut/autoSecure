import React from 'react';
import { motion } from 'framer-motion';
import { AppMode } from '../store/slices/uiSlice';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const modes: { id: AppMode; name: string; icon: string; color: string }[] = [
    { id: 'planning', name: 'Planning', icon: 'fas fa-map-marked-alt', color: 'bg-primary-500' },
    { id: 'simulation', name: 'Simulation', icon: 'fas fa-users', color: 'bg-secondary-500' },
    { id: 'operations', name: 'Live Ops', icon: 'fas fa-broadcast-tower', color: 'bg-warning-500' }
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white/70 mb-3">Application Mode</h3>
      {modes.map((modeOption) => (
        <motion.button
          key={modeOption.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onModeChange(modeOption.id)}
          className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
            currentMode === modeOption.id
              ? `${modeOption.color} text-black border-transparent shadow-lg`
              : 'bg-dark-700 text-white/80 border-dark-600 hover:bg-dark-600 hover:text-white'
          }`}
        >
          <i className={`${modeOption.icon} text-lg`}></i>
          <span className="font-medium">{modeOption.name}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default ModeSelector;


