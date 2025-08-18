import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store/index';
import { addNotification, removeNotification, clearNotifications, setMode } from '../store/slices/uiSlice';
import { openModal } from '../store/slices/uiSlice';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { currentPlan } = useSelector((state: RootState) => state.security);
  const { notifications, mode } = useSelector((state: RootState) => state.ui);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [voiceActive, setVoiceActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'fas fa-check';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-white';
    }
  };

  const handleAIStatus = () => {
    dispatch(addNotification({
      type: 'info',
      title: 'AI Status',
      message: 'Neural networks online - 12 models active',
    }));
  };

  const handleSimulation = () => {
    dispatch(addNotification({
      type: 'info',
      title: 'Simulation Mode',
      message: 'Crowd simulation activated',
    }));
  };

  const handleExportPlan = () => {
    if (!currentPlan || currentPlan.perimeter.length < 4) {
      dispatch(addNotification({
        type: 'warning',
        title: 'Incomplete Plan',
        message: 'Please complete your security perimeter first',
      }));
      return;
    }

    dispatch(addNotification({
      type: 'success',
      title: 'Export Started',
      message: 'Generating operations order document...',
    }));

    // Simulate export process
    setTimeout(() => {
      dispatch(addNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'SecPlan_2024.pdf ready for download',
      }));
    }, 2000);
  };

  const handleVoiceCommand = () => {
    setVoiceActive(!voiceActive);
    dispatch(addNotification({
      type: 'info',
      title: voiceActive ? 'Voice Command Deactivated' : 'Voice Command Active',
      message: voiceActive ? 'Microphone turned off' : 'Say "AutoSecure" to start command',
    }));
  };

  const getSystemStatus = () => {
    return currentPlan?.resources && currentPlan.resources.length > 0 ? 100 : 0;
  };

  const getThreatCount = () => {
    return currentPlan?.risks?.length || 0;
  };

  const getActiveUnits = () => {
    return currentPlan?.resources?.filter(r => r.type === 'guard').length || 0;
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="smart-panel h-16 fixed top-0 left-0 right-0 z-50"
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Logo and Mode Switcher */}
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
              <h1 className="text-lg font-bold holographic">AutoSecure Pro</h1>
              <p className="text-xs text-gray-500">Command Center Active</p>
            </div>
          </div>
          
          {/* Smart Mode Switcher */}
          <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1">
            <button 
              onClick={() => dispatch(setMode('planning'))}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                mode === 'planning' 
                  ? 'bg-gradient-to-r from-green-400 to-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-brain mr-1"></i> AI Assist
            </button>
            <button 
              onClick={() => dispatch(setMode('operations'))}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                mode === 'operations' 
                  ? 'bg-gradient-to-r from-green-400 to-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Manual
            </button>
            <button 
              onClick={() => dispatch(setMode('simulation'))}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                mode === 'simulation' 
                  ? 'bg-gradient-to-r from-green-400 to-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Training
            </button>
          </div>
        </div>

        {/* Right Section - Status Bar */}
        <div className="flex items-center gap-4">
          {/* Voice Command */}
          <button 
            onClick={handleVoiceCommand}
            className={`voice-indicator ${voiceActive ? 'active' : ''}`}
          >
            <i className="fas fa-microphone text-black text-sm"></i>
          </button>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${getSystemStatus() === 100 ? 'bg-green-400' : 'bg-red-400'} rounded-full`}></div>
              <span className="text-gray-400">Systems</span>
              <span className={`font-bold ${getSystemStatus() === 100 ? 'text-green-400' : 'text-red-400'}`}>
                {getSystemStatus()}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${getThreatCount() > 0 ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'} rounded-full`}></div>
              <span className="text-gray-400">Threats</span>
              <span className={`font-bold ${getThreatCount() > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {getThreatCount()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-400">Units</span>
              <span className="text-blue-400 font-bold">{getActiveUnits()}/24</span>
            </div>
          </div>
          
          {/* Time & Weather */}
          <div className="text-right">
            <div className="text-sm font-medium">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-xs text-gray-500">Clear • 22°C • Wind 5km/h</div>
          </div>
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2"
            >
              <i className="fas fa-bell text-gray-400 hover:text-white transition-colors"></i>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-96 bg-dark-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => dispatch(clearNotifications())}
                            className="text-xs text-white/60 hover:text-white/80 transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      {/* Event Statistics Box */}
                      <div className="mb-4 p-3 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-lg border border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium text-sm">
                            <i className="fas fa-chart-bar mr-2 text-green-400"></i>
                            Event Statistics
                          </h4>
                          <span className="text-xs text-white/60">
                            {currentTime.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-white/60">Area:</span>
                            <span className="text-white font-medium">{currentPlan?.area || 0} m²</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Capacity:</span>
                            <span className="text-white font-medium">{currentPlan?.capacity || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Guards:</span>
                            <span className="text-white font-medium">
                              {currentPlan?.resources?.filter(r => r.type === 'guard').reduce((sum, r) => sum + r.deployed, 0) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Risks:</span>
                            <span className="text-white font-medium">{currentPlan?.risks?.length || 0}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-xs">Perimeter:</span>
                            <span className={`text-xs font-medium ${
                              (currentPlan?.perimeter?.length || 0) >= 4 ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {(currentPlan?.perimeter?.length || 0) >= 4 ? 'Complete' : 'Incomplete'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-xs">Analysis:</span>
                            <span className={`text-xs font-medium ${
                              currentPlan?.status === 'complete' ? 'text-green-400' : 
                              currentPlan?.status === 'analyzing' ? 'text-blue-400' : 'text-gray-400'
                            }`}>
                              {currentPlan?.status === 'complete' ? 'Complete' :
                               currentPlan?.status === 'analyzing' ? 'Analyzing' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-xs">Resources:</span>
                            <span className="text-xs font-medium text-cyan-400">
                              {currentPlan?.resources?.reduce((sum, r) => sum + r.deployed, 0) || 0} deployed
                            </span>
                          </div>
                        </div>
                      </div>

                      
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <div className="text-center py-8 text-white/50">
                            <i className="fas fa-bell-slash text-2xl mb-2"></i>
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                                  <i className={`${getNotificationIcon(notification.type)} text-xs`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium text-sm">{notification.title}</p>
                                  <p className="text-white/70 text-xs mt-1">{notification.message}</p>
                                </div>
                                <button
                                  onClick={() => dispatch(removeNotification(notification.id))}
                                  className="text-white/40 hover:text-white/80 transition-colors"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;

