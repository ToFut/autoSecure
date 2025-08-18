import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../store/index';

const InfoPanel: React.FC = () => {
  const { currentPlan } = useSelector((state: RootState) => state.security);

  const stats = [
    {
      icon: 'fas fa-vector-square',
      color: 'text-primary-500',
      label: 'Area',
      value: `${currentPlan?.area || 0} m²`
    },
    {
      icon: 'fas fa-users',
      color: 'text-secondary-500',
      label: 'Capacity',
      value: currentPlan?.capacity || 0
    },
    {
      icon: 'fas fa-user-shield',
      color: 'text-warning-500',
      label: 'Guards',
      value: currentPlan?.resources.filter(r => r.type === 'guard').reduce((sum, r) => sum + r.deployed, 0) || 0
    },
    {
      icon: 'fas fa-exclamation-triangle',
      color: 'text-danger-500',
      label: 'Risks',
      value: currentPlan?.risks.length || 0
    }
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-dark-800/95 backdrop-blur-md border-t border-white/10 p-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            <i className="fas fa-chart-bar mr-2 text-primary-500"></i>
            Event Statistics
          </h3>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <i className="fas fa-clock"></i>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${stat.color}`}>
                  <i className={`${stat.icon} text-lg`}></i>
                </div>
                <div>
                  <div className="text-sm text-white/60 font-medium">{stat.label}</div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Perimeter Status</span>
              <span className={`text-sm font-semibold ${
                (currentPlan?.perimeter?.length || 0) >= 4 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {(currentPlan?.perimeter?.length || 0) >= 4 ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Analysis Status</span>
              <span className={`text-sm font-semibold ${
                currentPlan?.status === 'complete' ? 'text-green-400' : 
                currentPlan?.status === 'analyzing' ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {currentPlan?.status === 'complete' ? 'Complete' :
                 currentPlan?.status === 'analyzing' ? 'Analyzing' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Resources Deployed</span>
              <span className="text-sm font-semibold text-primary-500">
                {currentPlan?.resources.reduce((sum, r) => sum + r.deployed, 0) || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InfoPanel;

