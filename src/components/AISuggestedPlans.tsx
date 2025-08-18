import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store/index';
import { addNotification } from '../store/slices/uiSlice';
import { setCurrentPlan, addSecurityResource, clearRisks, setPlanStatus } from '../store/slices/securitySlice';

interface SuggestedPlan {
  id: string;
  name: string;
  confidence: number;
  totalResources: number;
  estimatedCost: number;
  riskScore: number;
  resources: {
    guards: number;
    cameras: number;
    barriers: number;
    k9Units: number;
    drones: number;
    medical: number;
    sensors: number;
    radios: number;
  };
  humanResources: {
    total: number;
    supervisors: number;
    operators: number;
    specialists: number;
  };
  equipment: {
    communications: string[];
    monitoring: string[];
    barriers: string[];
    emergency: string[];
  };
  coordination: {
    commandStructure: string;
    responseTime: string;
    coverage: string;
  };
  keyFeatures: string[];
  pros: string[];
  cons: string[];
}

const AISuggestedPlans: React.FC = () => {
  const dispatch = useDispatch();
  const { currentPlan, analysisStatus } = useSelector((state: RootState) => state.security);
  const [suggestedPlans, setSuggestedPlans] = useState<SuggestedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Generate plans as soon as we have a perimeter, don't wait for analysis
    if (currentPlan?.perimeter && currentPlan.perimeter.length >= 3 && suggestedPlans.length === 0) {
      generatePlans();
    }
  }, [currentPlan, suggestedPlans.length]);

  const generatePlans = () => {
    setIsGenerating(true);
    
    // Simulate AI plan generation
    setTimeout(() => {
      const area = currentPlan?.area || 10000;
      const perimeterLength = currentPlan?.perimeter.length || 4;
      
      const plans: SuggestedPlan[] = [
        {
          id: 'plan-optimal',
          name: 'Optimal Security - Maximum Protection',
          confidence: 94,
          totalResources: 45,
          estimatedCost: 45000,
          riskScore: 2.1,
          resources: {
            guards: 12,
            cameras: 8,
            barriers: 20,
            k9Units: 2,
            drones: 2,
            medical: 2,
            sensors: 10,
            radios: 15
          },
          humanResources: {
            total: 16,
            supervisors: 2,
            operators: 12,
            specialists: 2
          },
          equipment: {
            communications: ['Digital radio network', 'Command center', 'Mobile app integration'],
            monitoring: ['AI-powered CCTV', 'Thermal imaging', 'Drone surveillance'],
            barriers: ['Steel barriers', 'Crowd control gates', 'VIP cordons'],
            emergency: ['Medical station', 'Evacuation routes', 'Fire suppression']
          },
          coordination: {
            commandStructure: 'Centralized with redundancy',
            responseTime: '< 30 seconds',
            coverage: '100% with overlap zones'
          },
          keyFeatures: [
            'Full perimeter coverage',
            'Redundant surveillance',
            'Quick response capability',
            'Medical support on-site'
          ],
          pros: [
            'Maximum security coverage',
            'Lowest risk score',
            'Includes aerial surveillance',
            'Comprehensive threat detection'
          ],
          cons: [
            'Higher operational cost',
            'Requires more personnel',
            'Complex coordination needed'
          ]
        },
        {
          id: 'plan-balanced',
          name: 'Balanced Approach - Smart Coverage',
          confidence: 88,
          totalResources: 32,
          estimatedCost: 32000,
          riskScore: 3.5,
          resources: {
            guards: 8,
            cameras: 6,
            barriers: 16,
            k9Units: 1,
            drones: 1,
            medical: 1,
            sensors: 6,
            radios: 10
          },
          humanResources: {
            total: 10,
            supervisors: 1,
            operators: 8,
            specialists: 1
          },
          equipment: {
            communications: ['Standard radio system', 'Mobile coordination'],
            monitoring: ['CCTV network', 'Motion sensors'],
            barriers: ['Portable barriers', 'Access control points'],
            emergency: ['First aid stations', 'Emergency exits']
          },
          coordination: {
            commandStructure: 'Distributed command posts',
            responseTime: '< 1 minute',
            coverage: '95% primary zones'
          },
          keyFeatures: [
            'Cost-effective solution',
            'Good coverage balance',
            'Standard security protocols',
            'Essential medical support'
          ],
          pros: [
            'Reasonable cost',
            'Adequate coverage',
            'Easier to manage',
            'Good risk mitigation'
          ],
          cons: [
            'No aerial surveillance',
            'Limited redundancy',
            'Moderate response time'
          ]
        },
        {
          id: 'plan-minimal',
          name: 'Essential Coverage - Budget Conscious',
          confidence: 76,
          totalResources: 23,
          estimatedCost: 18000,
          riskScore: 5.2,
          resources: {
            guards: 6,
            cameras: 4,
            barriers: 12,
            k9Units: 0,
            drones: 0,
            medical: 1,
            sensors: 4,
            radios: 6
          },
          humanResources: {
            total: 7,
            supervisors: 1,
            operators: 6,
            specialists: 0
          },
          equipment: {
            communications: ['Basic radio', 'Emergency hotline'],
            monitoring: ['Fixed cameras', 'Manual patrols'],
            barriers: ['Basic barriers', 'Entry checkpoints'],
            emergency: ['First aid kit', 'Emergency contact']
          },
          coordination: {
            commandStructure: 'Single command post',
            responseTime: '< 2 minutes',
            coverage: '80% critical areas'
          },
          keyFeatures: [
            'Budget-friendly option',
            'Basic perimeter security',
            'Core threat detection',
            'Emergency medical ready'
          ],
          pros: [
            'Lowest cost',
            'Simple deployment',
            'Quick setup',
            'Minimal training needed'
          ],
          cons: [
            'Limited coverage',
            'Higher risk score',
            'No specialized units',
            'Slower threat response'
          ]
        }
      ];

      setSuggestedPlans(plans);
      setIsGenerating(false);

      dispatch(addNotification({
        type: 'success',
        title: 'AI Analysis Complete',
        message: '3 security plans generated based on your perimeter'
      }));
    }, 2000);
  };

  const applyPlan = (plan: SuggestedPlan) => {
    setSelectedPlan(plan.id);

    // Clear existing resources first
    if (currentPlan) {
      const clearedPlan = {
        ...currentPlan,
        resources: []
      };
      dispatch(setCurrentPlan(clearedPlan));
    }

    // Apply new resources from the selected plan
    const newResources: any[] = [];
    Object.entries(plan.resources).forEach(([type, count]) => {
      if (count > 0) {
        // Map resource types properly
        let resourceType = type;
        if (type === 'k9Units') resourceType = 'k9';
        if (type === 'radios') resourceType = 'radio';
        
        newResources.push({
          id: `${resourceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: resourceType as any,
          count: count,
          deployed: 0,
          status: 'ready'
        });
      }
    });

    // Add all resources at once
    newResources.forEach(resource => {
      dispatch(addSecurityResource(resource));
    });

    // Update plan status
    dispatch(setPlanStatus('complete'));

    // Send message to clear deployed resources on map
    window.postMessage({ type: 'CLEAR_DEPLOYED_RESOURCES' }, '*');

    // Trigger auto-deployment after a short delay
    setTimeout(() => {
      window.postMessage({ type: 'AUTO_DEPLOY_RESOURCES' }, '*');
    }, 1000);

    dispatch(addNotification({
      type: 'success',
      title: `${plan.name} Applied`,
      message: `Resources updated: ${plan.totalResources} units allocated. Auto-deploying on map...`
    }));

    // Update timeline based on plan
    const timelineUpdate = {
      plan: plan.name,
      resources: plan.totalResources,
      cost: plan.estimatedCost,
      riskScore: plan.riskScore,
      coordination: plan.coordination
    };
    
    dispatch(addNotification({
      type: 'info',
      title: 'Timeline Updated',
      message: `Deployment schedule updated for ${plan.name}`
    }));
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-400';
    if (score <= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 80) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  if (!currentPlan || currentPlan.perimeter.length < 3) {
    return (
      <div className="p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
          <i className="fas fa-brain text-3xl text-gray-600"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-400 mb-2">AI Plans Unavailable</h3>
        <p className="text-sm text-gray-500">Complete perimeter definition to generate security plans</p>
      </div>
    );
  }

  return (
    <div className="p-6 border-2 border-green-500 rounded-lg animate-pulse bg-green-500/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          <span className="text-green-400">✅</span> AI Suggested Plans - CLICK ONE TO DEPLOY
        </h2>
        <button
          onClick={generatePlans}
          disabled={isGenerating}
          className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors disabled:opacity-50"
        >
          <i className={`fas fa-sync-alt mr-2 ${isGenerating ? 'animate-spin' : ''}`}></i>
          Regenerate
        </button>
      </div>

      {isGenerating ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-xl p-4 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {suggestedPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gray-800/50 rounded-xl border ${
                  selectedPlan === plan.id ? 'border-primary-500' : 'border-gray-700'
                } hover:border-primary-500/50 transition-all cursor-pointer`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {plan.name}
                        {selectedPlan === plan.id && (
                          <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full">
                            Selected
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-400">
                          AI Confidence: 
                          <span className="ml-1 font-semibold text-white">{plan.confidence}%</span>
                        </span>
                        <span className="text-xs text-gray-400">
                          Risk Score: 
                          <span className={`ml-1 font-semibold ${getRiskColor(plan.riskScore)}`}>
                            {plan.riskScore}/10
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">${plan.estimatedCost.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Estimated Cost</div>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${getConfidenceColor(plan.confidence)}`}
                      style={{ width: `${plan.confidence}%` }}
                    />
                  </div>

                  {/* Resources Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(plan.resources).map(([type, count]) => (
                      count > 0 && (
                        <div key={type} className="bg-gray-900/50 rounded-lg p-2 text-center">
                          <div className="text-lg font-semibold text-white">{count}</div>
                          <div className="text-xs text-gray-400 capitalize">{type}</div>
                        </div>
                      )
                    ))}
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {selectedPlan === plan.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-700 pt-4 space-y-3">
                          {/* Key Features */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Features</h4>
                            <div className="space-y-1">
                              {plan.keyFeatures.map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                  <i className="fas fa-check text-primary-400 text-xs"></i>
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Pros and Cons */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-green-400 mb-2">Advantages</h4>
                              <div className="space-y-1">
                                {plan.pros.map((pro, i) => (
                                  <div key={i} className="text-xs text-gray-300 flex items-start gap-1">
                                    <span className="text-green-400 mt-0.5">+</span>
                                    {pro}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-red-400 mb-2">Limitations</h4>
                              <div className="space-y-1">
                                {plan.cons.map((con, i) => (
                                  <div key={i} className="text-xs text-gray-300 flex items-start gap-1">
                                    <span className="text-red-400 mt-0.5">-</span>
                                    {con}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Apply Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              applyPlan(plan);
                            }}
                            className="w-full px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all"
                          >
                            <i className="fas fa-check-circle mr-2"></i>
                            Apply This Plan
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Stats */}
      {suggestedPlans.length > 0 && !isGenerating && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl border border-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">AI Analysis Based On</p>
              <p className="text-sm font-semibold text-white">
                {currentPlan?.perimeter.length} perimeter points • {Math.round(currentPlan?.area || 0)}m² area
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Threat Level</p>
              <p className="text-sm font-semibold text-yellow-400">Medium</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestedPlans;