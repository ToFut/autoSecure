import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../store/index';

const ThreatAssessment: React.FC = () => {
  const { currentPlan } = useSelector((state: RootState) => state.security);

  const risks = currentPlan?.risks || [];

  return (
    <div className="h-full bg-dark-800/95 backdrop-blur-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          <i className="fas fa-exclamation-triangle mr-2 text-danger-500"></i>
          Threat Assessment
        </h3>
        <div className="text-sm text-white/60">
          {risks.length} risks identified
        </div>
      </div>

      {risks.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-shield-alt text-4xl text-white/20 mb-4"></i>
          <p className="text-white/60">No threats identified yet</p>
          <p className="text-sm text-white/40 mt-2">Complete perimeter analysis to identify risks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {risks.map((risk, index) => (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-white">{risk.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  risk.level === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  risk.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {risk.level.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-white/60 mb-3">{risk.description}</p>
              <div className="space-y-2">
                {risk.recommendations.map((rec, recIndex) => (
                  <div key={recIndex} className="flex items-start gap-2 text-sm">
                    <i className="fas fa-check-circle text-primary-500 mt-0.5"></i>
                    <span className="text-white/80">{rec}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreatAssessment;