import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/uiSlice';

const AIAssistant: React.FC = () => {
  const dispatch = useDispatch();
  const [showAssistant, setShowAssistant] = useState(false);

  const handleCommand = (command: string) => {
    dispatch(addNotification({
      type: 'info',
      title: 'AI Assistant',
      message: `Processing: "${command}"`,
    }));
    
    // Simulate AI processing
    setTimeout(() => {
      dispatch(addNotification({
        type: 'success',
        title: 'AI Analysis Complete',
        message: 'Recommendations applied to security plan',
      }));
    }, 1500);
    
    setShowAssistant(false);
  };

  const quickCommands = [
    { text: 'Analyze crowd patterns', icon: 'fa-users' },
    { text: 'Optimize guard positions', icon: 'fa-user-shield' },
    { text: 'Predict next 2 hours', icon: 'fa-clock' },
    { text: 'Emergency evacuation plan', icon: 'fa-running' },
  ];

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <div className="relative">
        {/* AI Assistant Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAssistant(!showAssistant)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 flex items-center justify-center shadow-2xl"
        >
          <i className="fas fa-robot text-black text-xl"></i>
        </motion.button>

        {/* Assistant Panel */}
        <AnimatePresence>
          {showAssistant && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-2 w-64 smart-panel rounded-xl p-4"
            >
              <h4 className="text-sm font-semibold mb-3 text-white">AI Assistant</h4>
              
              {/* Quick Commands */}
              <div className="space-y-2">
                {quickCommands.map((cmd, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ x: 5 }}
                    onClick={() => handleCommand(cmd.text)}
                    className="w-full text-left text-xs bg-black/30 rounded p-2 hover:bg-black/50 transition-colors flex items-center gap-2"
                  >
                    <i className={`fas ${cmd.icon} text-cyan-400`}></i>
                    <span className="text-white/90">{cmd.text}</span>
                  </motion.button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Ask AI anything..."
                  className="w-full text-xs bg-black/50 border border-gray-700 rounded px-2 py-1.5 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCommand((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing Ring Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 opacity-30 animate-ping"></div>
      </div>
    </div>
  );
};

export default AIAssistant;