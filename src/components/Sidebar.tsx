import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../store/index';
import { setMode, addNotification } from '../store/slices/uiSlice';
import { setSelectedStep } from '../store/slices/uiSlice';
import { setAnalysisStatus } from '../store/slices/securitySlice';
import { AppMode } from '../store/slices/uiSlice';
import ModeSelector from './ModeSelector';
import PlanningSteps from './PlanningSteps';
import ResourcesPanel from './ResourcesPanel';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { mode, selectedStep } = useSelector((state: RootState) => state.ui);
  const { currentPlan, analysisStatus } = useSelector((state: RootState) => state.security);

  const handleModeChange = (newMode: AppMode) => {
    dispatch(setMode(newMode));
  };

  const handleStepClick = (step: number) => {
    console.log('Sidebar handleStepClick:', step);
    console.log('Current analysis status:', analysisStatus);
    console.log('Current perimeter length:', currentPlan?.perimeter?.length);
    
    dispatch(setSelectedStep(step));
    
    // Start AI analysis when moving to step 2
    if (step === 2 && analysisStatus === 'idle' && (currentPlan?.perimeter?.length ?? 0) >= 4) {
      console.log('Starting AI analysis from sidebar');
      dispatch(setAnalysisStatus('analyzing'));
      
      // Simulate AI analysis
      setTimeout(() => {
        console.log('AI analysis complete from sidebar');
        dispatch(setAnalysisStatus('complete'));
      }, 3000);
    }
    
    // Handle Resource Allocation (Step 3)
    if (step === 3 && analysisStatus === 'complete') {
      dispatch(addNotification({
        type: 'info',
        title: 'Resource Allocation',
        message: 'Click on the map to deploy resources or use auto-deploy'
      }));
    }
    
    // Handle Operations Order (Step 4)
    if (step === 4 && selectedStep >= 3) {
      dispatch(addNotification({
        type: 'info',
        title: 'Operations Order',
        message: 'Generating security documentation...'
      }));
      // TODO: Generate operations order document
    }
  };

  return (
    <motion.aside
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="h-full bg-gradient-to-b from-dark-800/98 to-dark-900/98 border-r border-white/5 overflow-y-auto"
    >
      <div className="p-6">
        {/* Mode Selector */}
        <ModeSelector currentMode={mode} onModeChange={handleModeChange} />

        {/* Content based on mode */}
        {mode === 'planning' && (
          <>
            <PlanningSteps
              currentStep={selectedStep}
              onStepClick={handleStepClick}
              analysisStatus={analysisStatus}
              perimeterPins={currentPlan?.perimeter?.length || 0}
            />
            
            {/* Plans moved to right panel - show notification */}
            {(currentPlan?.perimeter?.length || 0) >= 3 && analysisStatus === 'complete' && (
              <div className="mt-6 p-4 bg-blue-500/20 border-2 border-blue-500 rounded-lg">
                <div className="text-blue-400 font-bold text-center mb-2">
                  📋 Deployment Plans Ready!
                </div>
                <div className="text-sm text-gray-300 text-center">
                  Check the <strong>Plans tab</strong> in the right panel to select your security deployment strategy.
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'simulation' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-primary-500">
              <i className="fas fa-chart-line mr-2"></i>
              Simulation Controls
            </h3>
            <div className="space-y-3">
              <button className="w-full btn-primary">
                <i className="fas fa-play mr-2"></i>
                Run Crowd Simulation
              </button>
              <button className="w-full btn-secondary">
                <i className="fas fa-fire mr-2"></i>
                Risk Heatmap
              </button>
              <button className="w-full btn-secondary">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Emergency Scenarios
              </button>
            </div>
          </div>
        )}

        {mode === 'operations' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-primary-500">
              <i className="fas fa-satellite-dish mr-2"></i>
              Live Operations
            </h3>
            <div className="space-y-3">
              <div className="card">
                <div className="flex items-center justify-between">
                  <span>Active Guards</span>
                  <span className="text-primary-500 font-semibold">12</span>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <span>Live Cameras</span>
                  <span className="text-primary-500 font-semibold">8</span>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <span>Crowd Count</span>
                  <span className="text-primary-500 font-semibold">2,847</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources Panel - Show when plan is complete */}
        {currentPlan?.status === 'complete' && (
          <ResourcesPanel resources={currentPlan.resources} />
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;

