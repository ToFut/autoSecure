import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../store/index';

const LoadingOverlay: React.FC = () => {
  const { loading, loadingMessage } = useSelector((state: RootState) => state.ui);
  const { analysisStatus, analysisProgress, analysisMessage } = useSelector((state: RootState) => state.security);

  if (!loading && analysisStatus !== 'analyzing') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center z-50"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 border-4 border-primary-500/20 border-t-primary-500 rounded-full mb-8"
        />

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-4 gradient-text"
        >
          {analysisStatus === 'analyzing' ? 'Analyzing Location' : 'Processing...'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/60 mb-8 max-w-md"
        >
          {analysisMessage || loadingMessage || 'Please wait while we process your request...'}
        </motion.p>

        {analysisStatus === 'analyzing' && (
          <div className="w-80 bg-white/10 rounded-full h-1 mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${analysisProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        )}

        {analysisStatus === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-primary-500 font-semibold"
          >
            {Math.round(analysisProgress)}%
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LoadingOverlay;
