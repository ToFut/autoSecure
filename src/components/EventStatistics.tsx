import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store/index';

const EventStatistics: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { currentPlan } = useSelector((state: RootState) => state.security);
  const { analysisStatus } = useSelector((state: RootState) => state.security);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate statistics
  const getArea = () => {
    return currentPlan?.area || 0;
  };

  const getCapacity = () => {
    return currentPlan?.capacity || 0;
  };

  const getGuards = () => {
    return currentPlan?.resources?.filter(r => r.type === 'guard').length || 0;
  };

  const getRisks = () => {
    return currentPlan?.risks?.length || 0;
  };

  const getPerimeterStatus = () => {
    if (!currentPlan?.perimeter || currentPlan.perimeter.length === 0) {
      return 'Incomplete';
    }
    if (currentPlan.perimeter.length < 3) {
      return 'Incomplete';
    }
    return 'Complete';
  };

  const getAnalysisStatus = () => {
    switch (analysisStatus) {
      case 'analyzing':
        return 'Analyzing';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  const getResourcesDeployed = () => {
    return currentPlan?.resources?.filter(r => r.status === 'deployed').length || 0;
  };

  const getLastUpdated = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'text-green-400';
      case 'analyzing':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-black/30 rounded-lg border border-white/20 hover:bg-black/50 transition-colors"
      >
        <i className="fas fa-chart-bar text-blue-400 text-sm"></i>
        <span className="text-white font-medium text-xs">Stats</span>
        <motion.i
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="fas fa-chevron-down text-gray-400 text-xs"
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed w-80 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl"
            style={{ 
              position: 'fixed',
              zIndex: 99999,
              top: dropdownRef.current?.getBoundingClientRect()?.bottom ? dropdownRef.current.getBoundingClientRect().bottom + 8 : 0,
              right: dropdownRef.current?.getBoundingClientRect()?.right ? window.innerWidth - dropdownRef.current.getBoundingClientRect().right : window.innerWidth
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium text-sm">Event Statistics</h3>
                <span className="text-xs text-gray-500">Last updated: {getLastUpdated()}</span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-xs text-gray-400 mb-1">Area</div>
                  <div className="text-white font-bold">{getArea()} m²</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-xs text-gray-400 mb-1">Capacity</div>
                  <div className="text-white font-bold">{getCapacity()}</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-xs text-gray-400 mb-1">Guards</div>
                  <div className="text-white font-bold">{getGuards()}</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-xs text-gray-400 mb-1">Risks</div>
                  <div className="text-white font-bold">{getRisks()}</div>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Perimeter Status</span>
                  <span className={`text-xs font-medium ${getStatusColor(getPerimeterStatus())}`}>
                    {getPerimeterStatus()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Analysis Status</span>
                  <span className={`text-xs font-medium ${getStatusColor(getAnalysisStatus())}`}>
                    {getAnalysisStatus()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Resources Deployed</span>
                  <span className="text-xs font-medium text-blue-400">
                    {getResourcesDeployed()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventStatistics;
