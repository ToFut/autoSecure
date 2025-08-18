import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/index';
import { addSecurityResource, updateResourceDeployment } from '../store/slices/securitySlice';
import { addNotification } from '../store/slices/uiSlice';

interface DeploymentConfig {
  guards: { count: number; positions: google.maps.LatLng[] };
  cameras: { count: number; positions: google.maps.LatLng[] };
  barriers: { count: number; positions: google.maps.LatLng[] };
  k9Units: { count: number; positions: google.maps.LatLng[] };
  drones: { count: number; positions: google.maps.LatLng[] };
  medical: { count: number; positions: google.maps.LatLng[] };
}

interface SmartDeploymentProps {
  mapInstance: google.maps.Map | null;
  onDeploymentComplete?: () => void;
}

const SmartDeployment: React.FC<SmartDeploymentProps> = ({ mapInstance, onDeploymentComplete }) => {
  const dispatch = useDispatch();
  const { currentPlan } = useSelector((state: RootState) => state.security);
  const [deployedMarkers, setDeployedMarkers] = useState<google.maps.Marker[]>([]);
  const [coverageOverlays, setCoverageOverlays] = useState<google.maps.Circle[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  // Calculate optimal deployment based on perimeter
  const calculateOptimalDeployment = (): DeploymentConfig | null => {
    if (!currentPlan || !currentPlan.perimeter || currentPlan.perimeter.length < 4) return null;

    const bounds = new google.maps.LatLngBounds();
    currentPlan.perimeter.forEach(pin => {
      bounds.extend(new google.maps.LatLng(pin.lat, pin.lng));
    });

    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Calculate area and perimeter length
    const area = google.maps.geometry.spherical.computeArea(
      currentPlan.perimeter.map(p => new google.maps.LatLng(p.lat, p.lng))
    );
    const perimeterLength = currentPlan.perimeter.length;

    // Smart deployment algorithm
    const deployment: DeploymentConfig = {
      guards: {
        count: Math.max(8, Math.ceil(area / 5000)), // 1 guard per 5000 sq meters
        positions: []
      },
      cameras: {
        count: Math.max(6, Math.ceil(perimeterLength * 1.5)),
        positions: []
      },
      barriers: {
        count: Math.max(12, perimeterLength * 3),
        positions: []
      },
      k9Units: {
        count: Math.max(2, Math.floor(area / 10000)),
        positions: []
      },
      drones: {
        count: area > 20000 ? 2 : 1,
        positions: []
      },
      medical: {
        count: Math.max(2, Math.floor(area / 15000)),
        positions: []
      }
    };

    // Calculate guard positions (corners and midpoints)
    currentPlan.perimeter.forEach((pin, index) => {
      deployment.guards.positions.push(new google.maps.LatLng(pin.lat, pin.lng));
      
      // Add midpoint guards for long edges
      const nextPin = currentPlan.perimeter[(index + 1) % currentPlan.perimeter.length];
      const midLat = (pin.lat + nextPin.lat) / 2;
      const midLng = (pin.lng + nextPin.lng) / 2;
      
      if (index % 2 === 0 && deployment.guards.positions.length < deployment.guards.count) {
        deployment.guards.positions.push(new google.maps.LatLng(midLat, midLng));
      }
    });

    // Calculate camera positions (elevated, strategic coverage)
    const cameraRadius = Math.sqrt(area / Math.PI) / 4;
    for (let i = 0; i < deployment.cameras.count; i++) {
      const angle = (360 / deployment.cameras.count) * i;
      const lat = center.lat() + (cameraRadius / 111111) * Math.cos(angle * Math.PI / 180);
      const lng = center.lng() + (cameraRadius / (111111 * Math.cos(center.lat() * Math.PI / 180))) * Math.sin(angle * Math.PI / 180);
      deployment.cameras.positions.push(new google.maps.LatLng(lat, lng));
    }

    // K9 patrol routes (mobile units)
    deployment.k9Units.positions.push(
      new google.maps.LatLng(center.lat() + 0.0002, center.lng()),
      new google.maps.LatLng(center.lat() - 0.0002, center.lng())
    );

    // Drone positions (aerial coverage)
    deployment.drones.positions.push(center);
    if (deployment.drones.count > 1) {
      deployment.drones.positions.push(
        new google.maps.LatLng(center.lat() + 0.0005, center.lng() + 0.0005)
      );
    }

    // Medical stations (strategic placement)
    deployment.medical.positions.push(
      new google.maps.LatLng(ne.lat() - 0.0001, ne.lng() - 0.0001),
      new google.maps.LatLng(sw.lat() + 0.0001, sw.lng() + 0.0001)
    );

    return deployment;
  };

  // Deploy resources on map with animations
  const deployResources = async (config: DeploymentConfig) => {
    if (!mapInstance) return;

    setIsDeploying(true);

    // Clear existing deployments
    deployedMarkers.forEach(marker => marker.setMap(null));
    coverageOverlays.forEach(overlay => overlay.setMap(null));
    
    const newMarkers: google.maps.Marker[] = [];
    const newOverlays: google.maps.Circle[] = [];

    // Deploy guards with animation
    for (let i = 0; i < config.guards.positions.length && i < config.guards.count; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const marker = new google.maps.Marker({
        position: config.guards.positions[i],
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4ade80',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Guard Unit ${i + 1}`,
        animation: google.maps.Animation.DROP,
        draggable: true
      });

      // Add coverage area
      const coverage = new google.maps.Circle({
        center: config.guards.positions[i],
        radius: 50,
        fillColor: '#4ade80',
        fillOpacity: 0.1,
        strokeColor: '#4ade80',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        map: mapInstance
      });

      newMarkers.push(marker);
      newOverlays.push(coverage);

      // Make draggable and update position
      marker.addListener('dragend', () => {
        const newPos = marker.getPosition();
        if (newPos) {
          coverage.setCenter(newPos);
          dispatch(addNotification({
            type: 'info',
            title: 'Position Updated',
            message: `Guard Unit ${i + 1} repositioned`
          }));
        }
      });
    }

    // Deploy cameras with scanning animation
    for (let i = 0; i < config.cameras.positions.length && i < config.cameras.count; i++) {
      await new Promise(resolve => setTimeout(resolve, 80));
      
      const marker = new google.maps.Marker({
        position: config.cameras.positions[i],
        map: mapInstance,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="12" fill="#00d4ff" opacity="0.9"/>
              <path d="M15 8 L10 13 L20 13 Z" fill="white"/>
              <circle cx="15" cy="17" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15)
        },
        title: `Camera ${i + 1}`,
        animation: google.maps.Animation.DROP
      });

      // Animated scanning range
      const scanRange = new google.maps.Circle({
        center: config.cameras.positions[i],
        radius: 75,
        fillColor: '#00d4ff',
        fillOpacity: 0.05,
        strokeColor: '#00d4ff',
        strokeOpacity: 0.3,
        strokeWeight: 2,
        map: mapInstance
      });

      // Scanning animation
      let radius = 50;
      let expanding = true;
      const scanInterval = setInterval(() => {
        if (expanding) {
          radius += 2;
          if (radius >= 75) expanding = false;
        } else {
          radius -= 2;
          if (radius <= 50) expanding = true;
        }
        scanRange.setRadius(radius);
      }, 100);

      newMarkers.push(marker);
      newOverlays.push(scanRange);
    }

    // Deploy K9 units with patrol animation
    for (let i = 0; i < config.k9Units.positions.length && i < config.k9Units.count; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const marker = new google.maps.Marker({
        position: config.k9Units.positions[i],
        map: mapInstance,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="12" fill="#facc15" opacity="0.9"/>
              <text x="15" y="20" font-size="16" fill="black" text-anchor="middle">K9</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15)
        },
        title: `K9 Unit ${i + 1}`,
        animation: google.maps.Animation.DROP
      });

      // Patrol animation
      const patrolPath = [
        config.k9Units.positions[i],
        new google.maps.LatLng(
          config.k9Units.positions[i].lat() + 0.0002,
          config.k9Units.positions[i].lng() + 0.0002
        ),
        new google.maps.LatLng(
          config.k9Units.positions[i].lat() + 0.0002,
          config.k9Units.positions[i].lng() - 0.0002
        ),
        new google.maps.LatLng(
          config.k9Units.positions[i].lat() - 0.0002,
          config.k9Units.positions[i].lng() - 0.0002
        ),
        new google.maps.LatLng(
          config.k9Units.positions[i].lat() - 0.0002,
          config.k9Units.positions[i].lng() + 0.0002
        ),
        config.k9Units.positions[i]
      ];

      let pathIndex = 0;
      setInterval(() => {
        pathIndex = (pathIndex + 1) % patrolPath.length;
        marker.setPosition(patrolPath[pathIndex]);
      }, 3000);

      newMarkers.push(marker);
    }

    // Deploy drones with hovering animation
    for (let i = 0; i < config.drones.positions.length && i < config.drones.count; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const marker = new google.maps.Marker({
        position: config.drones.positions[i],
        map: mapInstance,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="15" fill="#06b6d4" opacity="0.8"/>
              <path d="M20 10 L15 20 L20 18 L25 20 Z" fill="white"/>
              <circle cx="20" cy="20" r="2" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        },
        title: `Drone ${i + 1}`,
        animation: google.maps.Animation.DROP
      });

      // Drone coverage area
      const droneCoverage = new google.maps.Circle({
        center: config.drones.positions[i],
        radius: 150,
        fillColor: '#06b6d4',
        fillOpacity: 0.05,
        strokeColor: '#06b6d4',
        strokeOpacity: 0.2,
        strokeWeight: 1,
        map: mapInstance
      });

      // Hovering animation
      const basePos = config.drones.positions[i];
      setInterval(() => {
        const offset = (Math.sin(Date.now() / 1000) * 0.0001);
        marker.setPosition(new google.maps.LatLng(
          basePos.lat() + offset,
          basePos.lng() + offset / 2
        ));
      }, 50);

      newMarkers.push(marker);
      newOverlays.push(droneCoverage);
    }

    // Deploy medical stations
    for (let i = 0; i < config.medical.positions.length && i < config.medical.count; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const marker = new google.maps.Marker({
        position: config.medical.positions[i],
        map: mapInstance,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="20" height="20" fill="#ef4444" opacity="0.9" rx="3"/>
              <rect x="13" y="9" width="4" height="12" fill="white"/>
              <rect x="9" y="13" width="12" height="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15)
        },
        title: `Medical Station ${i + 1}`,
        animation: google.maps.Animation.DROP
      });

      newMarkers.push(marker);
    }

    setDeployedMarkers(newMarkers);
    setCoverageOverlays(newOverlays);

    // Update Redux state with deployed resources
    dispatch(addSecurityResource({
      id: `deployment-${Date.now()}`,
      type: 'guard',
      count: config.guards.count,
      deployed: config.guards.positions.length,
      status: 'deployed'
    }));

    dispatch(addSecurityResource({
      id: `cameras-${Date.now()}`,
      type: 'camera',
      count: config.cameras.count,
      deployed: config.cameras.positions.length,
      status: 'deployed'
    }));

    setIsDeploying(false);

    dispatch(addNotification({
      type: 'success',
      title: 'Deployment Complete',
      message: `Deployed ${config.guards.count} guards, ${config.cameras.count} cameras, ${config.k9Units.count} K9 units, ${config.drones.count} drones`
    }));

    if (onDeploymentComplete) {
      onDeploymentComplete();
    }
  };

  // Auto-deploy when perimeter is complete
  useEffect(() => {
    if (currentPlan?.status === 'complete' && mapInstance) {
      const config = calculateOptimalDeployment();
      if (config && deployedMarkers.length === 0) {
        deployResources(config);
      }
    }
  }, [currentPlan?.status, mapInstance]);

  // Public method to trigger deployment
  const triggerDeployment = () => {
    const config = calculateOptimalDeployment();
    if (config && mapInstance) {
      deployResources(config);
    }
  };

  return null; // This component manages map overlays only
};

export default SmartDeployment;