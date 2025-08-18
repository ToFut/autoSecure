import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/index';
import { addNotification } from '../store/slices/uiSlice';
import { setAnalysisStatus } from '../store/slices/securitySlice';

interface AICommand {
  id: string;
  text: string;
  category: 'deploy' | 'analyze' | 'optimize' | 'emergency';
  action: () => void;
}

interface VoiceCommand {
  transcript: string;
  confidence: number;
  timestamp: Date;
}

const CommandCenter: React.FC = () => {
  const dispatch = useDispatch();
  const { currentPlan, analysisStatus } = useSelector((state: RootState) => state.security);
  const { mode } = useSelector((state: RootState) => state.ui);
  
  const [commandInput, setCommandInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [suggestions, setSuggestions] = useState<AICommand[]>([]);
  const [metrics, setMetrics] = useState({
    responseTime: 28,
    coverage: 94,
    riskScore: 3.2,
    estimatedCost: 42000
  });
  
  const recognitionRef = useRef<any>(null);

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
        processVoiceCommand(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  // Process voice commands
  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('deploy')) {
      if (lowerCommand.includes('guards') || lowerCommand.includes('security')) {
        executeCommand('deploy-guards');
      } else if (lowerCommand.includes('cameras')) {
        executeCommand('deploy-cameras');
      }
    } else if (lowerCommand.includes('analyze')) {
      executeCommand('analyze-threats');
    } else if (lowerCommand.includes('emergency') || lowerCommand.includes('lockdown')) {
      executeCommand('emergency-protocol');
    } else if (lowerCommand.includes('optimize')) {
      executeCommand('optimize-deployment');
    }
  };

  // Execute AI commands
  const executeCommand = (commandId: string) => {
    switch (commandId) {
      case 'deploy-guards':
        dispatch(addNotification({
          type: 'success',
          title: 'Guards Deployed',
          message: 'Optimal guard positions calculated and applied'
        }));
        break;
      case 'deploy-cameras':
        dispatch(addNotification({
          type: 'success',
          title: 'Cameras Positioned',
          message: 'Strategic camera placement completed'
        }));
        break;
      case 'analyze-threats':
        dispatch(setAnalysisStatus('analyzing'));
        setTimeout(() => {
          dispatch(setAnalysisStatus('complete'));
          dispatch(addNotification({
            type: 'info',
            title: 'Analysis Complete',
            message: '3 potential threats identified'
          }));
        }, 2000);
        break;
      case 'emergency-protocol':
        dispatch(addNotification({
          type: 'warning',
          title: 'Emergency Protocol Activated',
          message: 'All units notified, lockdown initiated'
        }));
        break;
      case 'optimize-deployment':
        dispatch(addNotification({
          type: 'success',
          title: 'Optimization Complete',
          message: 'Resource efficiency improved by 23%'
        }));
        updateMetrics();
        break;
    }
  };

  // Update metrics with simulated real-time data
  const updateMetrics = () => {
    setMetrics(prev => ({
      responseTime: Math.max(15, prev.responseTime - Math.floor(Math.random() * 5)),
      coverage: Math.min(100, prev.coverage + Math.floor(Math.random() * 3)),
      riskScore: Math.max(1, prev.riskScore - 0.3),
      estimatedCost: prev.estimatedCost + Math.floor(Math.random() * 2000)
    }));
  };

  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      dispatch(addNotification({
        type: 'info',
        title: 'Voice Control Active',
        message: 'Listening for commands...'
      }));
    }
  };

  // Generate AI suggestions based on context
  useEffect(() => {
    const generateSuggestions = () => {
      const contextualSuggestions: AICommand[] = [];
      
      if (!currentPlan || currentPlan.perimeter.length < 4) {
        contextualSuggestions.push({
          id: 'define-perimeter',
          text: 'Define security perimeter',
          category: 'deploy',
          action: () => executeCommand('define-perimeter')
        });
      } else if (analysisStatus === 'idle') {
        contextualSuggestions.push({
          id: 'analyze-threats',
          text: 'Analyze threat landscape',
          category: 'analyze',
          action: () => executeCommand('analyze-threats')
        });
      } else if (analysisStatus === 'complete') {
        contextualSuggestions.push(
          {
            id: 'optimize-deployment',
            text: 'Optimize resource deployment',
            category: 'optimize',
            action: () => executeCommand('optimize-deployment')
          },
          {
            id: 'simulate-scenario',
            text: 'Run crowd simulation',
            category: 'analyze',
            action: () => executeCommand('simulate-scenario')
          }
        );
      }
      
      setSuggestions(contextualSuggestions);
    };
    
    generateSuggestions();
  }, [currentPlan, analysisStatus]);

  // Real-time metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        updateMetrics();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCommandSubmit = () => {
    if (commandInput.trim()) {
      processVoiceCommand(commandInput);
      setCommandInput('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-4 z-40 w-96"
    >
      <div className="bg-dark-900/95 backdrop-blur-2xl border border-primary-500/20 rounded-2xl p-5 shadow-2xl">
        {/* Neural Network Background Effect */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary-500 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-500 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Command Center</h2>
            <p className="text-xs text-gray-400">AI-Powered Control</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleVoiceRecognition}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 animate-pulse' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <i className={`fas fa-microphone ${isListening ? 'text-black' : 'text-gray-400'}`}></i>
            </motion.button>
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
          </div>
        </div>
        
        {/* AI Command Input */}
        <div className="relative mb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCommandSubmit()}
              placeholder={isListening ? voiceTranscript || "Listening..." : "Ask AI or type command..."}
              className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCommandSubmit}
              className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center hover:shadow-lg hover:shadow-primary-500/25 transition-all"
            >
              <i className="fas fa-paper-plane text-black text-sm"></i>
            </motion.button>
          </div>
          
          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-dark-800/95 backdrop-blur-xl border border-gray-700 rounded-lg p-2 z-50">
              <p className="text-xs text-gray-400 mb-2">AI Suggestions:</p>
              {suggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={suggestion.action}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-primary-500/10 hover:text-primary-400 rounded transition-colors"
                >
                  <i className={`fas fa-${
                    suggestion.category === 'deploy' ? 'map-marker-alt' :
                    suggestion.category === 'analyze' ? 'chart-line' :
                    suggestion.category === 'optimize' ? 'cogs' :
                    'exclamation-triangle'
                  } mr-2 text-xs`}></i>
                  {suggestion.text}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Response</span>
              <i className="fas fa-clock text-xs text-primary-400"></i>
            </div>
            <div className="text-xl font-bold text-primary-400">{metrics.responseTime}s</div>
            <div className="text-xs text-gray-500">Target: &lt;30s</div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Coverage</span>
              <i className="fas fa-shield-alt text-xs text-secondary-400"></i>
            </div>
            <div className="text-xl font-bold text-secondary-400">{metrics.coverage}%</div>
            <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
              <div 
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${metrics.coverage}%` }}
              />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Risk Level</span>
              <i className="fas fa-exclamation-triangle text-xs text-yellow-400"></i>
            </div>
            <div className="text-xl font-bold text-yellow-400">{metrics.riskScore.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Acceptable: &lt;5.0</div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Est. Cost</span>
              <i className="fas fa-dollar-sign text-xs text-green-400"></i>
            </div>
            <div className="text-xl font-bold text-white">${(metrics.estimatedCost / 1000).toFixed(0)}k</div>
            <div className="text-xs text-gray-500">Budget: $50k</div>
          </motion.div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => executeCommand('deploy-guards')}
            className="bg-gray-800/50 hover:bg-primary-500/20 border border-gray-700 hover:border-primary-500/50 rounded-lg p-2 transition-all"
          >
            <i className="fas fa-user-shield text-primary-400"></i>
            <p className="text-xs text-gray-400 mt-1">Deploy</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => executeCommand('analyze-threats')}
            className="bg-gray-800/50 hover:bg-secondary-500/20 border border-gray-700 hover:border-secondary-500/50 rounded-lg p-2 transition-all"
          >
            <i className="fas fa-brain text-secondary-400"></i>
            <p className="text-xs text-gray-400 mt-1">Analyze</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => executeCommand('optimize-deployment')}
            className="bg-gray-800/50 hover:bg-yellow-500/20 border border-gray-700 hover:border-yellow-500/50 rounded-lg p-2 transition-all"
          >
            <i className="fas fa-magic text-yellow-400"></i>
            <p className="text-xs text-gray-400 mt-1">Optimize</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => executeCommand('emergency-protocol')}
            className="bg-gray-800/50 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 rounded-lg p-2 transition-all"
          >
            <i className="fas fa-exclamation-circle text-red-400"></i>
            <p className="text-xs text-gray-400 mt-1">Emergency</p>
          </motion.button>
        </div>
        
        {/* Status Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">AI Systems Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Confidence:</span>
              <span className="text-xs font-bold text-primary-400">92%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommandCenter;