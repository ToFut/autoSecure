import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store/index';
import { setMode, addNotification } from './store/slices/uiSlice';
import { toggle3D, toggleHeatmap } from './store/slices/mapSlice';
import MapContainer from './components/MapContainer';
import SimulationEngine from './components/SimulationEngine';
import FloatingControls from './components/FloatingControls';
import ThreatAssessment from './components/ThreatAssessment';
import ResourcesPanel from './components/ResourcesPanel';
import EventStatistics from './components/EventStatistics';
import AISuggestedPlans from './components/AISuggestedPlans';
import Sidebar from './components/Sidebar';
import ExportManager from './components/ExportManager';
import toast from 'react-hot-toast';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [voiceActive, setVoiceActive] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'analysis' | 'plans' | 'resources' | 'timeline'>('analysis');

  // Redux state
  const { mode } = useSelector((state: RootState) => state.ui);
  const { currentPlan, analysisStatus } = useSelector((state: RootState) => state.security);
  
  // Calculate total deployed resources
  const totalDeployed = currentPlan?.resources?.reduce((sum, resource) => sum + resource.deployed, 0) || 0;
  
  // Auto-switch to Plans tab when analysis completes
  useEffect(() => {
    if (analysisStatus === 'complete' && (currentPlan?.perimeter?.length || 0) >= 3) {
      setRightPanelTab('plans');
    }
  }, [analysisStatus, currentPlan?.perimeter?.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handler functions
  const handleModeChange = (newMode: 'planning' | 'simulation' | 'operations') => {
    dispatch(setMode(newMode));
    dispatch(addNotification({ 
      type: 'info', 
      title: 'Mode Changed',
      message: `Switched to ${newMode} mode` 
    }));
  };

  const handleEmergencyCommand = (command: string) => {
    dispatch(addNotification({ 
      type: 'warning', 
      title: 'Emergency Command',
      message: `Emergency command activated: ${command}` 
    }));
    toast.success(`Emergency protocol: ${command} activated`);
  };

  const handleResourceDeploy = (resourceType: string) => {
    console.log('handleResourceDeploy called with:', resourceType);
    setSelectedResource(resourceType);
    
    // Send message to MapContainer to start deployment mode
    const message = {
      type: 'DEPLOY_RESOURCE',
      resourceType: resourceType
    };
    console.log('Sending message:', message);
    window.postMessage(message, '*');
    
    dispatch(addNotification({ 
      type: 'info', 
      title: 'Resource Deployment',
      message: `Click on the map to deploy ${resourceType.toUpperCase()} unit` 
    }));
  };

  const handleAICommand = (command: string) => {
    console.log('AI Command received:', command);
    
    if (command === 'Auto-Deploy Resources') {
      // Auto-deploy logic - deploy inside the polygon
      const resourceTypes = ['guard', 'camera', 'sensor', 'k9', 'drone'];
      let deployCount = 0;
      
      // Request polygon bounds from MapContainer to deploy inside perimeter
      window.postMessage({ type: 'REQUEST_POLYGON_BOUNDS' }, '*');
      
      // Deploy resources automatically inside polygon
      const autoDeployInterval = setInterval(() => {
        if (deployCount >= 5) {
          clearInterval(autoDeployInterval);
          dispatch(addNotification({
            type: 'success',
            title: 'Auto-Deploy Complete',
            message: `Successfully deployed ${deployCount} security resources inside perimeter`
          }));
          return;
        }
        
        const resourceType = resourceTypes[deployCount];
        
        // Send deployment message to MapContainer
        window.postMessage({
          type: 'DEPLOY_RESOURCE',
          resourceType: resourceType
        }, '*');
        
        // Request deployment inside polygon bounds
        setTimeout(() => {
          // Trigger deployment inside polygon
          window.postMessage({
            type: 'AUTO_DEPLOY_IN_POLYGON',
            resourceType: resourceType,
            deploymentIndex: deployCount,
            // Fallback to Times Square if no polygon exists
            fallbackPosition: {
              lat: 40.758 + (Math.random() - 0.5) * 0.01,
              lng: -73.985 + (Math.random() - 0.5) * 0.01
            }
          }, '*');
        }, 100);
        
        deployCount++;
        
        dispatch(addNotification({
          type: 'info',
          title: 'Auto-Deploying',
          message: `Deploying ${resourceType.toUpperCase()} inside perimeter (${deployCount}/5)`
        }));
        
      }, 1000); // Deploy one resource per second
      
      dispatch(addNotification({ 
        type: 'info', 
        title: 'Auto-Deploy Started',
        message: 'AI is automatically deploying security resources...' 
      }));
      toast.success('Auto-deploy sequence initiated');
      
    } else if (command === 'Create 4-Pin Perimeter' || command.toLowerCase().includes('perimeter')) {
      // Start 4-pin perimeter mode
      window.postMessage({ type: 'START_PERIMETER_MODE' }, '*');
      dispatch(addNotification({ 
        type: 'info', 
        title: '4-Pin Perimeter Mode',
        message: 'Click 4 points on the map to create security perimeter' 
      }));
      toast.success('4-Pin perimeter mode activated');
      
    } else {
      // Handle other AI commands
      dispatch(addNotification({ 
        type: 'info', 
        title: 'AI Command',
        message: `AI Command: ${command}` 
      }));
      toast.success(`AI processing: ${command}`);
    }
  };

  const handleVoiceToggle = () => {
    setVoiceActive(!voiceActive);
    dispatch(addNotification({ 
      type: voiceActive ? 'warning' : 'success', 
      title: 'Voice Commands',
      message: voiceActive ? 'Voice commands disabled' : 'Voice commands enabled' 
    }));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="neural-bg"></div>
      
      {/* Intelligent Header Bar */}
      <header className="smart-panel h-16 flex items-center justify-between px-6 flex-shrink-0" style={{ position: 'relative', zIndex: 50 }}>
        <div className="flex items-center gap-6">
          {/* Logo with Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center">
                <i className="fas fa-shield-alt text-black text-lg"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AutoSecure Pro</h1>
              <p className="text-xs text-gray-400">AI-Powered Security Command Center</p>
            </div>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <button 
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                mode === 'planning' 
                  ? 'bg-gradient-to-r from-green-400 to-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => handleModeChange('planning')}
            >
              <i className="fas fa-brain mr-1"></i> AI Assist
            </button>
            <button 
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                mode === 'simulation' 
                  ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => handleModeChange('simulation')}
            >
              <i className="fas fa-users mr-1"></i> Simulation
            </button>
            <button 
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                mode === 'operations' 
                  ? 'bg-gradient-to-r from-red-400 to-orange-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => handleModeChange('operations')}
            >
              <i className="fas fa-broadcast-tower mr-1"></i> Live Ops
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{currentPlan?.area?.toLocaleString() || 0}</div>
              <div className="text-xs text-gray-400">Area (m²)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{currentPlan?.capacity || 0}</div>
              <div className="text-xs text-gray-400">Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{currentPlan?.risks?.length || 0}</div>
              <div className="text-xs text-gray-400">Risks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{currentPlan?.resources?.length || 0}</div>
              <div className="text-xs text-gray-400">Resources</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{totalDeployed}</div>
              <div className="text-xs text-gray-400">Deployed</div>
            </div>
          </div>
          
          {/* Event Statistics Dropdown */}
          <div>
            <EventStatistics />
          </div>
          
          {/* Voice Control */}
          <button 
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              voiceActive 
                ? 'bg-green-400 text-black' 
                : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
            onClick={handleVoiceToggle}
          >
            <i className={`fas ${voiceActive ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
          </button>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Use the actual Sidebar component */}
        <div className="w-96 h-full overflow-y-auto">
          <Sidebar />
        </div>
        
        {/* Main Map Area with AR Overlay */}
        <main className="flex-1 relative bg-gray-950">
          <div className="ar-overlay"></div>
          
          {/* Map Container */}
          <div className="absolute inset-0" style={{ zIndex: 10 }}>
            <MapContainer />
          </div>
          
          {/* Simulation Engine - Only show in simulation mode */}
          {mode === 'simulation' && (
            <div className="absolute inset-0" style={{ zIndex: 30 }}>
              <SimulationEngine />
            </div>
          )}
          
          {/* Floating Controls */}
          <div className="absolute top-4 right-4 z-40">
            <FloatingControls />
          </div>

        </main>
        
        {/* Smart Right Panel - Adaptive Content */}
        <aside className="w-96 smart-panel flex flex-col h-full overflow-hidden">
          {/* Tabbed Interface */}
          <div className="flex border-b border-gray-800">
            <button 
              onClick={() => setRightPanelTab('analysis')}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'analysis' 
                  ? 'text-green-400 border-b-2 border-green-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-brain mr-1"></i>Analysis
            </button>
            <button 
              onClick={() => setRightPanelTab('plans')}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'plans' 
                  ? 'text-green-400 border-b-2 border-green-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-chess mr-1"></i>Plans
            </button>
            <button 
              onClick={() => setRightPanelTab('resources')}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'resources' 
                  ? 'text-green-400 border-b-2 border-green-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-users mr-1"></i>Resources
            </button>
            <button 
              onClick={() => setRightPanelTab('timeline')}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'timeline' 
                  ? 'text-green-400 border-b-2 border-green-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-clock mr-1"></i>Timeline
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {rightPanelTab === 'analysis' && (
              <>
                <ThreatAssessment />
                {currentPlan?.risks && currentPlan.risks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fas fa-shield-alt text-4xl mb-3 opacity-50"></i>
                    <p>Complete perimeter analysis to view threat assessment</p>
                  </div>
                )}
              </>
            )}
            
            {rightPanelTab === 'plans' && (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    <i className="fas fa-chess mr-2 text-primary-500"></i>
                    Deployment Plans
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    AI-generated security deployment strategies. Select a plan to update resources and timeline.
                  </p>
                </div>
                <AISuggestedPlans />
              </>
            )}
            
            {rightPanelTab === 'resources' && (
              <>
                <ResourcesPanel resources={currentPlan?.resources || []} />
                {(!currentPlan?.resources || currentPlan.resources.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fas fa-users-cog text-4xl mb-3 opacity-50"></i>
                    <p>No resources allocated yet</p>
                    <p className="text-sm mt-2">Complete AI analysis to generate resource allocation</p>
                  </div>
                )}
              </>
            )}
            
            {rightPanelTab === 'timeline' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  <i className="fas fa-clock mr-2 text-primary-500"></i>
                  Event Timeline
                </h3>
                <div className="space-y-3">
                  {/* Timeline entries */}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">T-24:00</div>
                      <div className="text-xs text-gray-400">Initial site survey and setup begins</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">T-12:00</div>
                      <div className="text-xs text-gray-400">Security briefing and resource deployment</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">T-06:00</div>
                      <div className="text-xs text-gray-400">Final sweep and system checks</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">T-01:00</div>
                      <div className="text-xs text-gray-400">Gates open, crowd management begins</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">T-00:00</div>
                      <div className="text-xs text-gray-400">Event starts - Active monitoring</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      
      {/* Intelligent Footer Bar */}
      <footer className="smart-panel h-12 flex items-center justify-between px-6 flex-shrink-0" style={{ position: 'relative', zIndex: 50 }}>
        <div className="flex items-center gap-4">
          {/* Mode Indicators */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-green-400/20 text-green-400 rounded">
              <i className="fas fa-shield-alt mr-1"></i> Protected
            </span>
            <span className="px-2 py-1 bg-blue-400/20 text-blue-400 rounded">
              <i className="fas fa-wifi mr-1"></i> Connected
            </span>
            <span className="px-2 py-1 bg-purple-400/20 text-purple-400 rounded">
              <i className="fas fa-brain mr-1"></i> AI Active
            </span>
          </div>
        </div>
        
        {/* Resource Deployment */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-2">Deploy:</span>
          <button 
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              selectedResource === 'guard' ? 'bg-green-400 text-black' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => handleResourceDeploy('guard')}
          >
            <i className="fas fa-user-shield text-green-400"></i>
            <span>Guard</span>
          </button>
          <button 
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              selectedResource === 'camera' ? 'bg-blue-400 text-black' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => handleResourceDeploy('camera')}
          >
            <i className="fas fa-video text-blue-400"></i>
            <span>Camera</span>
          </button>
          <button 
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              selectedResource === 'sensor' ? 'bg-purple-400 text-black' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => handleResourceDeploy('sensor')}
          >
            <i className="fas fa-broadcast-tower text-purple-400"></i>
            <span>Sensor</span>
          </button>
          <button 
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              selectedResource === 'k9' ? 'bg-yellow-400 text-black' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => handleResourceDeploy('k9')}
          >
            <i className="fas fa-dog text-yellow-400"></i>
            <span>K9</span>
          </button>
          <button 
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              selectedResource === 'drone' ? 'bg-cyan-400 text-black' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => handleResourceDeploy('drone')}
          >
            <i className="fas fa-helicopter text-cyan-400"></i>
            <span>Aerial</span>
          </button>
        </div>
        
        {/* Quick Command Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-2">Commands:</span>
          <button 
            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-xs text-red-400 transition-colors"
            onClick={() => handleEmergencyCommand('Lockdown')}
          >
            <i className="fas fa-lock mr-1"></i> Lockdown
          </button>
          <button 
            className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded text-xs text-orange-400 transition-colors"
            onClick={() => handleEmergencyCommand('Evacuate')}
          >
            <i className="fas fa-exclamation-triangle mr-1"></i> Evacuate
          </button>
          <button 
            className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-xs text-blue-400 transition-colors"
            onClick={() => handleEmergencyCommand('Code Blue')}
          >
            <i className="fas fa-ambulance mr-1"></i> Code Blue
          </button>
        </div>
        
        {/* Time and Status */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-gray-400">
            <i className="fas fa-clock mr-1"></i>
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-green-400">
            <i className="fas fa-circle mr-1 animate-pulse"></i>
            System Online
          </div>
        </div>
      </footer>
      
      {/* Export Manager */}
      <ExportManager mapInstance={null} />
      
      {/* Floating AI Assistant */}
      <div className="fixed bottom-20 right-6 z-50">
        <div className="relative">
          <button 
            className="w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
            onClick={() => setShowAIAssistant(!showAIAssistant)}
          >
            <i className="fas fa-robot text-black text-xl"></i>
          </button>
          {showAIAssistant && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full right-0 mb-2 w-64 smart-panel rounded-xl p-4"
            >
              <h4 className="text-sm font-semibold mb-2">AI Assistant</h4>
              <div className="space-y-2">
                <button 
                  className="w-full text-left text-xs bg-black/30 rounded p-2 hover:bg-black/50"
                  onClick={() => handleAICommand('Analyze crowd patterns')}
                >
                  "Analyze crowd patterns"
                </button>
                <button 
                  className="w-full text-left text-xs bg-black/30 rounded p-2 hover:bg-black/50"
                  onClick={() => handleAICommand('Optimize guard positions')}
                >
                  "Optimize guard positions"
                </button>
                <button 
                  className="w-full text-left text-xs bg-black/30 rounded p-2 hover:bg-black/50"
                  onClick={() => handleAICommand('Predict next 2 hours')}
                >
                  "Predict next 2 hours"
                </button>
                <button 
                  className="w-full text-left text-xs bg-black/30 rounded p-2 hover:bg-black/50"
                  onClick={() => handleAICommand('Emergency evacuation plan')}
                >
                  "Emergency evacuation plan"
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;