import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store/index';
import { closeModal } from '../store/slices/uiSlice';
import { setSelectedStep } from '../store/slices/uiSlice';

const ModalManager: React.FC = () => {
  const dispatch = useDispatch();
  const { modals } = useSelector((state: RootState) => state.ui);
  const { currentPlan } = useSelector((state: RootState) => state.security);

  const handleCloseModal = (id: string) => {
    dispatch(closeModal(id));
  };

  const handleAcceptAnalysis = () => {
    dispatch(setSelectedStep(3));
    handleCloseModal('analysis-modal');
  };

  return (
    <AnimatePresence>
      {modals.map((modal) => (
        <motion.div
          key={modal.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => handleCloseModal(modal.id)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-gradient-to-b from-dark-800/98 to-dark-900/98 border border-primary-500/30 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.type === 'analysis' && (
              <div>
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-brain text-xl text-black"></i>
                  </div>
                  <h2 className="text-2xl font-bold gradient-text">AI Security Analysis Complete</h2>
                </div>

                <div className="space-y-4 mb-6">
                  {currentPlan?.risks.map((risk) => (
                    <motion.div
                      key={risk.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-primary-500/5 hover:border-primary-500/20 transition-all duration-300"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        risk.level === 'high' ? 'bg-red-500/20 text-red-400' :
                        risk.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        <i className="fas fa-exclamation-triangle"></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{risk.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            risk.level === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            risk.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {risk.level}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mb-2">{risk.description}</p>
                        <div className="text-xs text-primary-500">
                          <strong>Recommendations:</strong> {risk.recommendations.join(', ')}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleAcceptAnalysis}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <i className="fas fa-check"></i>
                  Accept & Deploy Resources
                </button>
              </div>
            )}

            {modal.type === 'resources' && (
              <div>
                <h2 className="text-2xl font-bold gradient-text mb-6">Deployed Resources</h2>
                <div className="space-y-4">
                  {currentPlan?.resources.map((resource) => (
                    <div key={resource.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-lg flex items-center justify-center text-primary-500">
                        <i className="fas fa-shield-alt text-xl"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{resource.type}</h3>
                        <p className="text-sm text-white/60">{resource.count} units deployed</p>
                      </div>
                      <span className="px-3 py-1 bg-primary-500/20 text-primary-500 border border-primary-500/30 rounded-full text-xs font-semibold uppercase">
                        {resource.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default ModalManager;

