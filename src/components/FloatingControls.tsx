import React from 'react';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/index';
import { toggle3D, toggleHeatmap } from '../store/slices/mapSlice';
import { addNotification } from '../store/slices/uiSlice';

const FloatingControls: React.FC = () => {
  const dispatch = useDispatch();
  const { show3D, showHeatmap } = useSelector((state: RootState) => state.map);

  const controls = [
    {
      id: '3d',
      icon: 'fas fa-cube',
      title: 'Toggle 3D View',
      action: () => {
        dispatch(toggle3D());
        dispatch(addNotification({
          type: 'info',
          title: '3D View',
          message: show3D ? 'Switched to 2D view' : 'Switched to 3D view'
        }));
      },
      active: show3D
    },
    {
      id: 'heatmap',
      icon: 'fas fa-fire',
      title: 'Risk Heatmap',
      action: () => {
        dispatch(toggleHeatmap());
        dispatch(addNotification({
          type: 'info',
          title: 'Heatmap',
          message: showHeatmap ? 'Heatmap hidden' : 'Heatmap visible'
        }));
      },
      active: showHeatmap
    },
    {
      id: 'simulation',
      icon: 'fas fa-play',
      title: 'Run Simulation',
      action: () => {
        dispatch(addNotification({
          type: 'info',
          title: 'Simulation',
          message: 'Starting crowd simulation...'
        }));
      }
    },
    {
      id: 'reset',
      icon: 'fas fa-redo',
      title: 'Reset Map',
      action: () => {
        dispatch(addNotification({
          type: 'warning',
          title: 'Reset',
          message: 'Map has been reset'
        }));
      }
    }
  ];

  return (
    <div className="absolute top-4 right-4 z-30">
      <div className="flex flex-col gap-2">
        {controls.map((control, index) => (
          <motion.button
            key={control.id}
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={control.action}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg transition-all duration-200 ${
              control.active
                ? 'bg-primary-500 border-primary-400 text-black shadow-lg shadow-primary-500/50'
                : 'bg-dark-800/90 border-white/20 text-white/80 hover:bg-dark-700 hover:border-white/40 hover:text-white backdrop-blur-sm'
            }`}
            title={control.title}
          >
            <i className={control.icon}></i>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FloatingControls;

