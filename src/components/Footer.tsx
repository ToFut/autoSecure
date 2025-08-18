import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../store/index';
import { addNotification } from '../store/slices/uiSlice';

const Footer: React.FC = () => {
  const dispatch = useDispatch();
  const { currentPlan } = useSelector((state: RootState) => state.security);

  const handleEmergency = () => {
    dispatch(addNotification({
      type: 'error',
      title: 'Emergency Protocol Activated',
      message: 'All units alerted - Response teams deployed',
    }));
  };

  const handleLockdown = () => {
    dispatch(addNotification({
      type: 'warning',
      title: 'Lockdown Initiated',
      message: 'All access points secured - Perimeter sealed',
    }));
  };

  const handleAllClear = () => {
    dispatch(addNotification({
      type: 'success',
      title: 'All Clear Signal',
      message: 'Threat neutralized - Normal operations resumed',
    }));
  };

  const handleBroadcast = () => {
    dispatch(addNotification({
      type: 'info',
      title: 'Broadcast System Active',
      message: 'Voice announcement system ready',
    }));
  };

  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="smart-panel h-12 fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6"
    >
      {/* Mode Indicators */}
      <div className="flex items-center gap-4">
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
      
      {/* Quick Command Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 mr-2">Quick Commands:</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEmergency}
          className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
        >
          <i className="fas fa-exclamation-triangle mr-1"></i> Emergency
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLockdown}
          className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
        >
          <i className="fas fa-lock mr-1"></i> Lockdown
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAllClear}
          className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
        >
          <i className="fas fa-check-circle mr-1"></i> All Clear
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBroadcast}
          className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
        >
          <i className="fas fa-bullhorn mr-1"></i> Broadcast
        </motion.button>
      </div>
      
      {/* Session Info */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-gray-400">Operator:</span>
        <span className="text-white font-medium">Cmd. Johnson</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-400">Session:</span>
        <span className="text-white font-medium">02:34:18</span>
      </div>
    </motion.footer>
  );
};

export default Footer;