import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store/index';
import { useMapContext } from '../contexts/MapContext';
import { addNotification } from '../store/slices/uiSlice';
import { addRiskAssessment } from '../store/slices/securitySlice';

interface SimulationData {
  crowdSize: number;
  crowdDensity: number;
  flowRate: number;
  bottlenecks: { location: google.maps.LatLng; severity: number }[];
  evacuationTime: number;
  incidentProbability: number;
}

interface Agent {
  id: string;
  position: google.maps.LatLng;
  velocity: { lat: number; lng: number };
  destination: google.maps.LatLng;
  type: 'civilian' | 'guard' | 'threat' | 'vip';
  marker?: google.maps.Marker;
}

const SimulationEngine: React.FC = () => {
  const dispatch = useDispatch();
  const { mapInstance, perimeterPolygon: perimeter } = useMapContext();
  const { currentPlan } = useSelector((state: RootState) => state.security);
  
  const [isRunning, setIsRunning] = useState(false);
  const [simulationData, setSimulationData] = useState<SimulationData>({
    crowdSize: 0,
    crowdDensity: 0,
    flowRate: 0,
    bottlenecks: [],
    evacuationTime: 0,
    incidentProbability: 0
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [scenario, setScenario] = useState<'normal' | 'evacuation' | 'threat' | 'vip'>('normal');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const animationRef = useRef<number>();
  const agentsRef = useRef<Agent[]>([]);

  // Initialize simulation
  const initializeSimulation = () => {
    console.log('Initializing simulation with:', { mapInstance, perimeter });
    
    if (!mapInstance || !perimeter) {
      console.warn('Cannot initialize simulation: missing map or perimeter');
      dispatch(addNotification({
        type: 'error',
        title: 'Simulation Error',
        message: 'Map or perimeter not available. Create a perimeter first.'
      }));
      return;
    }

    const path = perimeter.getPath();
    const bounds = new google.maps.LatLngBounds();
    
    for (let i = 0; i < path.getLength(); i++) {
      bounds.extend(path.getAt(i));
    }

    const center = bounds.getCenter();
    const area = google.maps.geometry.spherical.computeArea(path);
    
    console.log('Simulation area:', area, 'bounds:', bounds.toJSON());
    
    // Calculate crowd size based on area (2-4 people per square meter for events)
    const crowdSize = Math.floor(area * 2.5);
    const newAgents: Agent[] = [];

    // Create civilian agents
    for (let i = 0; i < Math.min(crowdSize, 500); i++) {
      const agent: Agent = {
        id: `civilian-${i}`,
        position: generateRandomPositionInPolygon(bounds, path),
        velocity: { lat: 0, lng: 0 },
        destination: generateRandomPositionInPolygon(bounds, path),
        type: 'civilian'
      };

      // Create marker
      agent.marker = new google.maps.Marker({
        position: agent.position,
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3,
          fillColor: '#3b82f6',
          fillOpacity: 0.6,
          strokeWeight: 0
        },
        clickable: false
      });

      newAgents.push(agent);
    }

    // Add security guards from plan
    if (currentPlan?.resources) {
      const guards = currentPlan.resources.filter(r => r.type === 'guard');
      guards.forEach((guard, index) => {
        const agent: Agent = {
          id: `guard-${index}`,
          position: generateRandomPositionInPolygon(bounds, path),
          velocity: { lat: 0, lng: 0 },
          destination: generateRandomPositionInPolygon(bounds, path),
          type: 'guard'
        };

        agent.marker = new google.maps.Marker({
          position: agent.position,
          map: mapInstance,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: '#10b981',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 1
          }
        });

        newAgents.push(agent);
      });
    }

    console.log('Created agents:', newAgents.length);
    setAgents(newAgents);
    agentsRef.current = newAgents;

    // Initialize simulation data
    setSimulationData({
      crowdSize: newAgents.filter(a => a.type === 'civilian').length,
      crowdDensity: crowdSize / (area / 10000), // per 100m²
      flowRate: 0,
      bottlenecks: [],
      evacuationTime: Math.round(Math.sqrt(area) / 2), // seconds
      incidentProbability: 0
    });
  };

  // Generate random position within polygon
  const generateRandomPositionInPolygon = (
    bounds: google.maps.LatLngBounds,
    path: google.maps.MVCArray<google.maps.LatLng>
  ): google.maps.LatLng => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    let position: google.maps.LatLng;
    let attempts = 0;
    
    do {
      position = new google.maps.LatLng(
        sw.lat() + Math.random() * (ne.lat() - sw.lat()),
        sw.lng() + Math.random() * (ne.lng() - sw.lng())
      );
      attempts++;
    } while (!google.maps.geometry.poly.containsLocation(position, new google.maps.Polygon({ paths: path })) && attempts < 100);
    
    return position;
  };

  // Update agent positions
  const updateAgents = () => {
    const updatedAgents = agentsRef.current.map(agent => {
      // Calculate movement based on scenario
      let speed = 0.00001 * simulationSpeed;
      
      if (scenario === 'evacuation') {
        speed *= 3; // People move faster in evacuation
      } else if (scenario === 'threat' && agent.type === 'civilian') {
        speed *= 2; // Civilians flee from threat
      }

      // Calculate direction to destination
      const pos = agent.position;
      const dest = agent.destination;
      const deltaLat = dest.lat() - pos.lat();
      const deltaLng = dest.lng() - pos.lng();
      const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);

      if (distance < 0.0001) {
        // Reached destination, set new one
        if (perimeter) {
          const path = perimeter.getPath();
          const bounds = new google.maps.LatLngBounds();
          for (let i = 0; i < path.getLength(); i++) {
            bounds.extend(path.getAt(i));
          }
          agent.destination = generateRandomPositionInPolygon(bounds, path);
        }
      } else {
        // Move towards destination
        const normalizedLat = (deltaLat / distance) * speed;
        const normalizedLng = (deltaLng / distance) * speed;
        
        agent.position = new google.maps.LatLng(
          pos.lat() + normalizedLat,
          pos.lng() + normalizedLng
        );

        // Update marker position
        if (agent.marker) {
          agent.marker.setPosition(agent.position);
        }
      }

      // Guards patrol behavior
      if (agent.type === 'guard') {
        // Guards move slower but more deliberately
        agent.position = new google.maps.LatLng(
          pos.lat() + (Math.random() - 0.5) * speed * 0.5,
          pos.lng() + (Math.random() - 0.5) * speed * 0.5
        );
        
        if (agent.marker) {
          agent.marker.setPosition(agent.position);
        }
      }

      return agent;
    });

    agentsRef.current = updatedAgents;

    // Detect bottlenecks
    detectBottlenecks();
    
    // Calculate metrics
    calculateMetrics();
  };

  // Detect crowd bottlenecks
  const detectBottlenecks = () => {
    const gridSize = 0.0001; // Grid cell size in degrees
    const densityGrid: { [key: string]: number } = {};
    
    // Count agents in each grid cell
    agentsRef.current.forEach(agent => {
      const gridX = Math.floor(agent.position.lat() / gridSize);
      const gridY = Math.floor(agent.position.lng() / gridSize);
      const key = `${gridX},${gridY}`;
      densityGrid[key] = (densityGrid[key] || 0) + 1;
    });

    // Find high-density areas (bottlenecks)
    const bottlenecks: { location: google.maps.LatLng; severity: number }[] = [];
    Object.entries(densityGrid).forEach(([key, count]) => {
      if (count > 10) { // More than 10 agents in a cell
        const [gridX, gridY] = key.split(',').map(Number);
        bottlenecks.push({
          location: new google.maps.LatLng(gridX * gridSize, gridY * gridSize),
          severity: count / 10
        });
      }
    });

    // Update simulation data
    setSimulationData(prev => ({ ...prev, bottlenecks }));

    // Create risk assessment for severe bottlenecks
    bottlenecks.forEach(bottleneck => {
      if (bottleneck.severity > 2) {
        dispatch(addRiskAssessment({
          id: `bottleneck-${Date.now()}`,
          level: bottleneck.severity > 3 ? 'high' : 'medium',
          category: 'crowd',
          title: 'Crowd Bottleneck Detected',
          description: `High crowd density detected - ${Math.round(bottleneck.severity * 10)} people concentrated`,
          location: { 
            lat: bottleneck.location.lat(), 
            lng: bottleneck.location.lng() 
          },
          recommendations: [
            'Deploy crowd control barriers',
            'Station additional security personnel',
            'Consider alternate routing'
          ]
        }));
      }
    });
  };

  // Calculate simulation metrics
  const calculateMetrics = () => {
    const civilians = agentsRef.current.filter(a => a.type === 'civilian');
    const guards = agentsRef.current.filter(a => a.type === 'guard');
    
    // Calculate flow rate (agents moving per second)
    const movingAgents = civilians.filter(a => {
      const speed = Math.abs(a.velocity.lat) + Math.abs(a.velocity.lng);
      return speed > 0.00001;
    });
    
    const flowRate = (movingAgents.length / civilians.length) * 100;
    
    // Calculate incident probability based on density and guard coverage
    const guardCoverage = guards.length / (civilians.length / 50); // 1 guard per 50 people ideal
    const incidentProbability = Math.max(0, Math.min(100, 
      (100 - guardCoverage * 20) * (simulationData.crowdDensity / 10)
    ));

    setSimulationData(prev => ({
      ...prev,
      flowRate,
      incidentProbability
    }));
  };

  // Run simulation scenarios
  const runScenario = (type: 'normal' | 'evacuation' | 'threat' | 'vip') => {
    setScenario(type);
    
    switch (type) {
      case 'evacuation':
        // All agents move towards exits
        if (perimeter && mapInstance) {
          const path = perimeter.getPath();
          const exitPoint = path.getAt(0); // Use first point as exit
          
          agentsRef.current.forEach(agent => {
            agent.destination = exitPoint;
            if (agent.marker && agent.type === 'civilian') {
              agent.marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 3,
                fillColor: '#ef4444',
                fillOpacity: 0.8,
                strokeWeight: 0
              });
            }
          });
        }
        
        dispatch(addNotification({
          type: 'warning',
          title: 'Evacuation Simulation',
          message: 'Testing emergency evacuation procedures'
        }));
        break;
        
      case 'threat':
        // Add threat agent and make civilians flee
        if (mapInstance && perimeter) {
          const path = perimeter.getPath();
          const bounds = new google.maps.LatLngBounds();
          for (let i = 0; i < path.getLength(); i++) {
            bounds.extend(path.getAt(i));
          }
          
          const threatAgent: Agent = {
            id: 'threat-1',
            position: bounds.getCenter(),
            velocity: { lat: 0, lng: 0 },
            destination: bounds.getCenter(),
            type: 'threat'
          };
          
          threatAgent.marker = new google.maps.Marker({
            position: threatAgent.position,
            map: mapInstance,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#ff0000',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            },
            animation: google.maps.Animation.BOUNCE
          });
          
          agentsRef.current.push(threatAgent);
        }
        
        dispatch(addNotification({
          type: 'error',
          title: 'Threat Simulation',
          message: 'Testing security response to active threat'
        }));
        break;
        
      case 'vip':
        // Add VIP with security detail
        if (mapInstance && perimeter) {
          const path = perimeter.getPath();
          const bounds = new google.maps.LatLngBounds();
          for (let i = 0; i < path.getLength(); i++) {
            bounds.extend(path.getAt(i));
          }
          
          const vipAgent: Agent = {
            id: 'vip-1',
            position: bounds.getCenter(),
            velocity: { lat: 0, lng: 0 },
            destination: generateRandomPositionInPolygon(bounds, path),
            type: 'vip'
          };
          
          vipAgent.marker = new google.maps.Marker({
            position: vipAgent.position,
            map: mapInstance,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 2 L18 11 L27 11 L20 16 L23 25 L15 20 L7 25 L10 16 L3 11 L12 11 Z" fill="#ffd700" stroke="#ffffff" stroke-width="2"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(30, 30),
              anchor: new google.maps.Point(15, 15)
            }
          });
          
          agentsRef.current.push(vipAgent);
        }
        
        dispatch(addNotification({
          type: 'info',
          title: 'VIP Protection',
          message: 'Testing VIP movement and protection protocols'
        }));
        break;
    }
  };

  // Start simulation
  const startSimulation = () => {
    console.log('Start simulation clicked');
    
    if (isRunning) {
      console.warn('Simulation already running');
      return;
    }
    
    setIsRunning(true);
    initializeSimulation();
    
    // Wait a bit for agents to be created before starting animation
    setTimeout(() => {
      if (!isRunning) return; // Check if still running
      
      const animate = () => {
        if (agentsRef.current.length > 0 && isRunning) {
          updateAgents();
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animate();
      
      dispatch(addNotification({
        type: 'success',
        title: 'Simulation Started',
        message: `Running ${scenario} scenario with ${agentsRef.current.length} agents`
      }));
    }, 100);
  };

  // Stop simulation
  const stopSimulation = () => {
    setIsRunning(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Clear all agent markers
    agentsRef.current.forEach(agent => {
      if (agent.marker) {
        agent.marker.setMap(null);
      }
    });
    
    setAgents([]);
    agentsRef.current = [];
    
    dispatch(addNotification({
      type: 'info',
      title: 'Simulation Stopped',
      message: 'All agents removed from map'
    }));
  };

  // Debug context values
  useEffect(() => {
    console.log('SimulationEngine context update:', { mapInstance, perimeter });
  }, [mapInstance, perimeter]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      agentsRef.current.forEach(agent => {
        if (agent.marker) {
          agent.marker.setMap(null);
        }
      });
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-20 right-4 w-96 bg-dark-900/95 backdrop-blur-xl border border-primary-500/20 rounded-2xl shadow-2xl z-40"
    >
      <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Simulation Engine</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mapInstance ? 'bg-green-400' : 'bg-red-400'}`} title={mapInstance ? 'Map Ready' : 'Map Not Ready'}></div>
            <div className={`w-2 h-2 rounded-full ${perimeter ? 'bg-green-400' : 'bg-red-400'}`} title={perimeter ? 'Perimeter Ready' : 'Perimeter Not Ready'}></div>
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} title={isRunning ? 'Running' : 'Stopped'}></div>
          </div>
        </div>
        <motion.i
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="fas fa-chevron-up text-gray-400 hover:text-white"
        />
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-5 pb-5"
          >
            {/* Scenario Selection */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Scenario Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['normal', 'evacuation', 'threat', 'vip'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => runScenario(type)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      scenario === type
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-black'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Prerequisites Check */}
            {(!mapInstance || !perimeter) && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                  <span className="text-sm font-medium text-yellow-400">Prerequisites Required</span>
                </div>
                <p className="text-xs text-gray-400">
                  {!mapInstance && "Map not loaded. "}{!perimeter && "Create a perimeter first."}
                </p>
              </div>
            )}

            {/* Simulation Controls */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={startSimulation}
                disabled={isRunning || !mapInstance || !perimeter}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500 text-green-400 px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <i className="fas fa-play mr-2"></i>
                Start
              </button>
              <button
                onClick={stopSimulation}
                disabled={!isRunning}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <i className="fas fa-stop mr-2"></i>
                Stop
              </button>
            </div>

            {/* Speed Control */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">
                Simulation Speed: {simulationSpeed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Live Metrics */}
            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">Crowd Size</span>
                  <span className="text-sm font-bold text-white">{simulationData.crowdSize}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">Crowd Density</span>
                  <span className="text-sm font-bold text-yellow-400">
                    {simulationData.crowdDensity.toFixed(1)} p/100m²
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">Flow Rate</span>
                  <span className="text-sm font-bold text-blue-400">
                    {simulationData.flowRate.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">Evacuation Time</span>
                  <span className="text-sm font-bold text-green-400">
                    {simulationData.evacuationTime}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Incident Risk</span>
                  <span className={`text-sm font-bold ${
                    simulationData.incidentProbability > 50 ? 'text-red-400' :
                    simulationData.incidentProbability > 25 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {simulationData.incidentProbability.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Bottleneck Warnings */}
              {simulationData.bottlenecks.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-exclamation-triangle text-red-400"></i>
                    <span className="text-sm font-medium text-red-400">
                      {simulationData.bottlenecks.length} Bottlenecks Detected
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    High crowd density areas require immediate attention
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {isRunning && (
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3">
                  <p className="text-xs text-primary-400 font-medium mb-1">AI Recommendations:</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {simulationData.incidentProbability > 50 && (
                      <li>• Deploy additional security personnel</li>
                    )}
                    {simulationData.bottlenecks.length > 2 && (
                      <li>• Implement crowd flow management</li>
                    )}
                    {simulationData.evacuationTime > 120 && (
                      <li>• Add emergency exit routes</li>
                    )}
                    {simulationData.crowdDensity > 50 && (
                      <li>• Consider capacity restrictions</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SimulationEngine;