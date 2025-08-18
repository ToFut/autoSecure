import React from 'react';
import { motion } from 'framer-motion';

interface PlanningStepsProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  analysisStatus: 'idle' | 'analyzing' | 'complete' | 'error';
  perimeterPins: number;
}

const PlanningSteps: React.FC<PlanningStepsProps> = ({
  currentStep,
  onStepClick,
  analysisStatus,
  perimeterPins,
}) => {
  console.log('PlanningSteps render:', {
    currentStep,
    analysisStatus,
    perimeterPins,
    showButton: currentStep === 1 && perimeterPins >= 4 && analysisStatus === 'idle'
  });
  const steps = [
    {
      id: 1,
      title: 'Define Perimeter',
      description: 'Click on the map to drop pins and create your event boundary',
      icon: 'fas fa-map-pin',
      status: perimeterPins >= 4 ? 'completed' : currentStep === 1 ? 'active' : 'pending',
      enabled: true
    },
    {
      id: 2,
      title: 'AI Analysis',
      description: 'Automatic risk assessment and topology analysis',
      icon: 'fas fa-brain',
      status: analysisStatus === 'complete' ? 'completed' : analysisStatus === 'analyzing' ? 'active' : 'pending',
      enabled: perimeterPins >= 4
    },
    {
      id: 3,
      title: 'Resource Allocation',
      description: 'AI-optimized deployment of personnel and equipment',
      icon: 'fas fa-users-cog',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending',
      enabled: analysisStatus === 'complete'
    },
    {
      id: 4,
      title: 'Operations Order',
      description: 'Generate comprehensive security documentation',
      icon: 'fas fa-file-alt',
      status: currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : 'pending',
      enabled: currentStep >= 3
    }
  ];

  const getStepStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary-500/10 border-primary-500/30 transform translate-x-1';
      case 'completed':
        return 'border-primary-500/50';
      default:
        return 'border-white/10';
    }
  };

  const getStepNumberClass = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-gradient-to-br from-primary-500 to-secondary-500 text-black';
      default:
        return 'bg-white/10 border-primary-500/50 text-white/60';
    }
  };

  const getProgressWidth = () => {
    if (currentStep === 1) return (perimeterPins / 4) * 25;
    if (currentStep === 2) return 25 + (analysisStatus === 'complete' ? 25 : 0);
    if (currentStep === 3) return 50 + 25;
    if (currentStep === 4) return 75 + 25;
    return 0;
  };

  const handleCompleteStep1 = () => {
    if (perimeterPins >= 4) {
      // Dispatch event to trigger cinematic focus
      window.dispatchEvent(new CustomEvent('completePerimeter', {
        detail: { triggerCinematic: true }
      }));
      onStepClick(2); // Move to next step
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 1 Completion Button */}
      {currentStep === 1 && perimeterPins >= 4 && analysisStatus === 'idle' && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCompleteStep1}
          className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-black font-bold rounded-lg shadow-lg hover:shadow-primary-500/50 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center">
            <i className="fas fa-check-circle mr-2"></i>
            Complete Perimeter & Begin Analysis
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-none"></div>
        </motion.button>
      )}
      
      {/* Step 3 Resource Allocation Actions */}
      {currentStep === 3 && analysisStatus === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 space-y-2"
        >
          <button
            onClick={() => {
              console.log('Auto-deploy button clicked!');
              window.postMessage({ type: 'AUTO_DEPLOY_RESOURCES' }, '*');
              setTimeout(() => onStepClick(4), 3000); // Move to step 4 after deployment completes
            }}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all relative z-50"
            style={{ position: 'relative', zIndex: 100 }}
          >
            <i className="fas fa-magic mr-2"></i>
            Auto-Deploy All Resources
          </button>
          <button
            onClick={() => {
              console.log('Manual deploy button clicked!');
              window.postMessage({ type: 'MANUAL_DEPLOY_MODE' }, '*');
            }}
            className="w-full px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all relative z-50"
            style={{ position: 'relative', zIndex: 100 }}
          >
            <i className="fas fa-hand-pointer mr-2"></i>
            Manual Deployment
          </button>
        </motion.div>
      )}
      
      {/* Step 4 Operations Order Actions */}
      {currentStep === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 space-y-2"
        >
          <button
            onClick={() => {
              // Generate operations order
              window.dispatchEvent(new CustomEvent('generateOperationsOrder'));
            }}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            <i className="fas fa-file-download mr-2"></i>
            Generate Security Plan PDF
          </button>
          <button
            className="w-full px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all"
          >
            <i className="fas fa-share-alt mr-2"></i>
            Share with Team
          </button>
        </motion.div>
      )}

      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`card transition-all duration-300 ${
            step.enabled ? 'cursor-pointer hover:bg-white/10' : 'cursor-not-allowed opacity-50'
          } ${getStepStatusClass(step.status)}`}
          onClick={() => step.enabled && onStepClick(step.id)}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold ${getStepNumberClass(step.status)}`}>
              {step.status === 'completed' ? (
                <i className="fas fa-check text-sm"></i>
              ) : (
                step.id
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-white/60">{step.description}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              step.status === 'active' ? 'bg-primary-500/20 text-primary-500 border border-primary-500/30' :
              step.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              'bg-white/10 text-white/40 border border-white/20'
            }`}>
              {step.status === 'active' ? 'Active' :
               step.status === 'completed' ? 'Complete' : 'Pending'}
            </div>
          </div>

          {/* Progress bar for step 1 */}
          {step.id === 1 && (
            <div className="mt-3 bg-black/30 rounded-lg p-1">
              <div className="bg-white/10 rounded-lg h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressWidth()}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Analysis progress for step 2 */}
          {step.id === 2 && analysisStatus === 'analyzing' && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm text-primary-500">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Analyzing location...</span>
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {/* Overall Progress */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Overall Progress</span>
          <span className="text-sm text-primary-500">{Math.round(getProgressWidth())}%</span>
        </div>
        <div className="bg-black/30 rounded-lg p-1">
          <div className="bg-white/10 rounded-lg h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressWidth()}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningSteps;


