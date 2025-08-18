import React from 'react';
import { motion } from 'framer-motion';

interface SecurityPlan {
  id: string;
  name: string;
  description: string;
  color: string;
  resources: {
    guards: number;
    cameras: number;
    barriers: number;
    drones: number;
    k9Units: number;
    commandCenter: boolean;
  };
  coverage: number;
  cost: number;
  responseTime: string;
}

interface SecurityDeploymentProps {
  plans: SecurityPlan[];
  onSelectPlan: (planId: 'standard' | 'enhanced' | 'maximum') => void;
  isDeploying: boolean;
  selectedPlan: string | null;
  onClearDeployment: () => void;
}

const SecurityDeployment: React.FC<SecurityDeploymentProps> = ({
  plans,
  onSelectPlan,
  isDeploying,
  selectedPlan,
  onClearDeployment
}) => {
  return (
    <>
      {/* Security Plan Selection */}
      {!selectedPlan && plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-6 z-50 min-w-[800px]"
        >
          <h3 className="text-xl font-bold text-white mb-4 text-center">AI Security Deployment Analysis</h3>
          <p className="text-sm text-slate-400 text-center mb-6">Select optimal security configuration based on threat assessment</p>
          
          <div className="grid grid-cols-3 gap-4">
            {plans.map((plan, index) => (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectPlan(plan.id as 'standard' | 'enhanced' | 'maximum')}
                className={`relative bg-gradient-to-br from-slate-800 to-slate-900 border rounded-xl p-5 hover:shadow-2xl transition-all duration-300 ${
                  plan.id === 'enhanced' ? 'border-purple-500 shadow-purple-500/20' : 'border-slate-600'
                }`}
                disabled={isDeploying}
              >
                {plan.id === 'enhanced' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    RECOMMENDED
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-white">{plan.name}</div>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: plan.color }}></div>
                </div>
                
                <div className="text-xs text-slate-400 mb-4 h-8">{plan.description}</div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Security Officers</span>
                    <span className="text-white font-semibold">{plan.resources.guards}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">CCTV Cameras</span>
                    <span className="text-white font-semibold">{plan.resources.cameras}</span>
                  </div>
                  {plan.resources.drones > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Drone Units</span>
                      <span className="text-white font-semibold">{plan.resources.drones}</span>
                    </div>
                  )}
                  {plan.resources.k9Units > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">K9 Units</span>
                      <span className="text-white font-semibold">{plan.resources.k9Units}</span>
                    </div>
                  )}
                  {plan.resources.commandCenter && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Command Center</span>
                      <span className="text-green-400 font-semibold">✓</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-slate-700 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Coverage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${plan.coverage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: plan.color }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: plan.color }}>{plan.coverage}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Response Time</span>
                    <span className="text-xs text-yellow-400 font-semibold">{plan.responseTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Investment</span>
                    <span className="text-sm font-bold text-green-400">${plan.cost.toLocaleString()}</span>
                  </div>
                </div>
                
                <motion.div
                  className="mt-4 pt-3 border-t border-slate-700"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center gap-2 text-white">
                    <span className="text-sm font-semibold">Deploy Plan</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.div>
                  </div>
                </motion.div>
              </motion.button>
            ))}
          </div>
          
          {isDeploying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <div className="inline-flex items-center gap-3 bg-blue-500/20 border border-blue-500/50 rounded-lg px-4 py-2">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-400 font-medium">Deploying security resources...</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
      
      {/* Active Plan Indicator */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-20 left-4 bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-xl border border-slate-700 rounded-xl p-4 z-40 min-w-[250px]"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-slate-400 mb-1">ACTIVE DEPLOYMENT</div>
              <div className="text-lg font-bold text-white">
                {selectedPlan === 'standard' ? 'Standard' : selectedPlan === 'enhanced' ? 'Enhanced' : 'Maximum'} Security
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              selectedPlan === 'standard' ? 'bg-blue-500' : 
              selectedPlan === 'enhanced' ? 'bg-purple-500' : 
              'bg-red-500'
            }`}></div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All units operational</span>
          </div>
          
          <button
            onClick={onClearDeployment}
            className="w-full text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg py-2 transition-all duration-200"
          >
            Clear Deployment
          </button>
        </motion.div>
      )}
    </>
  );
};

export default SecurityDeployment;