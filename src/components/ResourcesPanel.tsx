import React from 'react';
import { motion } from 'framer-motion';
import { SecurityResource } from '../store/slices/securitySlice';

interface ResourcesPanelProps {
  resources: SecurityResource[];
}

const ResourcesPanel: React.FC<ResourcesPanelProps> = ({ resources }) => {
  const handleDeployResource = (resourceType: string) => {
    console.log('Deploying individual resource:', resourceType);
    window.postMessage({ 
      type: 'DEPLOY_SINGLE_RESOURCE', 
      resourceType: resourceType 
    }, '*');
  };
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guard':
        return 'fas fa-user-shield';
      case 'camera':
        return 'fas fa-video';
      case 'barrier':
        return 'fas fa-shield-alt';
      case 'metal-detector':
        return 'fas fa-search';
      case 'medical':
        return 'fas fa-medkit';
      case 'radio':
        return 'fas fa-walkie-talkie';
      case 'k9':
        return 'fas fa-dog';
      case 'sensor':
        return 'fas fa-radar';
      case 'drone':
        return 'fas fa-drone';
      default:
        return 'fas fa-cog';
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'guard':
        return 'text-blue-400';
      case 'camera':
        return 'text-green-400';
      case 'barrier':
        return 'text-yellow-400';
      case 'metal-detector':
        return 'text-purple-400';
      case 'medical':
        return 'text-red-400';
      case 'radio':
        return 'text-cyan-400';
      case 'k9':
        return 'text-orange-400';
      case 'sensor':
        return 'text-pink-400';
      case 'drone':
        return 'text-indigo-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'text-green-400';
      case 'ready':
        return 'text-blue-400';
      case 'standby':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (resources.length === 0) {
    return (
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-primary-500">
          <i className="fas fa-users-cog mr-2"></i>
          Allocated Resources
        </h3>
        <p className="text-white/60 text-sm">
          No resources have been allocated yet. Complete the planning steps to deploy security resources.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 text-primary-500">
        <i className="fas fa-users-cog mr-2"></i>
        Allocated Resources
      </h3>
      <div className="space-y-3">
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${getResourceColor(resource.type)}`}>
                  <i className={`${getResourceIcon(resource.type)} text-lg`}></i>
                </div>
                <div>
                  <h4 className="font-semibold text-white capitalize">
                    {resource.type.replace('-', ' ')}
                  </h4>
                  <p className="text-sm text-white/60">
                    {resource.deployed}/{resource.count} deployed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {resource.deployed < resource.count && (
                  <button
                    onClick={() => handleDeployResource(resource.type)}
                    className="px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-black text-xs font-semibold rounded hover:shadow-lg transition-all"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Deploy
                  </button>
                )}
                <div className="text-right">
                  <div className={`text-sm font-semibold ${getStatusColor(resource.status)}`}>
                    {resource.status}
                  </div>
                  <div className="text-xs text-white/40">
                    {resource.deployed > 0 ? 'Active' : 'Standby'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">Total Deployed</span>
          <span className="text-primary-500 font-bold">
            {resources.reduce((sum, r) => sum + r.deployed, 0)} units
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPanel;


