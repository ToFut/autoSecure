import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store/index';
import { addNotification } from '../store/slices/uiSlice';

interface MapVisualizationProps {
  mapInstance: google.maps.Map | null;
}

interface DeployedResource {
  id: string;
  type: 'guard' | 'camera' | 'barrier' | 'medical' | 'k9' | 'drone';
  position: google.maps.LatLng;
  marker?: google.maps.Marker;
  coverage?: google.maps.Circle;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ mapInstance }) => {
  const dispatch = useDispatch();
  const { currentPlan } = useSelector((state: RootState) => state.security);
  const [perimeterLine, setPerimeterLine] = useState<google.maps.Polyline | null>(null);
  const [deployedResources, setDeployedResources] = useState<DeployedResource[]>([]);
  const [riskZones, setRiskZones] = useState<google.maps.Circle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  // Draw perimeter lines with animation
  useEffect(() => {
    if (!mapInstance || !currentPlan || currentPlan.perimeter.length < 2) return;

    // Clear existing perimeter
    if (perimeterLine) {
      perimeterLine.setMap(null);
    }

    // Create animated perimeter line
    const path = currentPlan.perimeter.map(pin => ({
      lat: pin.lat,
      lng: pin.lng
    }));

    // Close the perimeter if we have at least 3 points
    if (path.length >= 3) {
      path.push(path[0]);
    }

    const line = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#00ff88',
      strokeOpacity: 0,
      strokeWeight: 3,
      map: mapInstance,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 3
        },
        offset: '0',
        repeat: '20px'
      }]
    });

    // Animate the line drawing
    let count = 0;
    const animate = () => {
      count = (count + 1) % 200;
      const icons = line.get('icons');
      icons[0].offset = (count / 2) + '%';
      line.set('icons', icons);
      line.setOptions({ strokeOpacity: Math.min(count / 100, 0.8) });
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    setPerimeterLine(line);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mapInstance, currentPlan?.perimeter]);

  // Deploy resources on the map
  useEffect(() => {
    if (!mapInstance || !currentPlan || currentPlan.perimeter.length < 4) return;

    // Clear existing resources
    deployedResources.forEach(resource => {
      if (resource.marker) resource.marker.setMap(null);
      if (resource.coverage) resource.coverage.setMap(null);
    });

    const newResources: DeployedResource[] = [];
    const bounds = new google.maps.LatLngBounds();
    currentPlan.perimeter.forEach(pin => {
      bounds.extend(new google.maps.LatLng(pin.lat, pin.lng));
    });
    const center = bounds.getCenter();

    // Deploy guards at perimeter corners
    currentPlan.perimeter.forEach((pin, index) => {
      if (index % 2 === 0) { // Place guard at every other corner
        const guardMarker = new google.maps.Marker({
          position: new google.maps.LatLng(pin.lat, pin.lng),
          map: mapInstance,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4ade80',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: `Guard Post ${index / 2 + 1}`,
          animation: google.maps.Animation.DROP
        });

        // Add coverage circle for guard
        const coverage = new google.maps.Circle({
          center: new google.maps.LatLng(pin.lat, pin.lng),
          radius: 30,
          fillColor: '#4ade80',
          fillOpacity: 0.15,
          strokeColor: '#4ade80',
          strokeOpacity: 0.3,
          strokeWeight: 1,
          map: mapInstance
        });

        newResources.push({
          id: `guard-${index}`,
          type: 'guard',
          position: new google.maps.LatLng(pin.lat, pin.lng),
          marker: guardMarker,
          coverage: coverage
        });
      }
    });

    // Deploy cameras with animated scanning
    const cameraPositions = calculateOptimalCameraPositions(currentPlan.perimeter);
    cameraPositions.forEach((pos, index) => {
      const cameraMarker = new google.maps.Marker({
        position: pos,
        map: mapInstance,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#00d4ff" opacity="0.9"/>
              <path d="M12 7 L8 11 L16 11 Z" fill="white"/>
              <circle cx="12" cy="14" r="2" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        },
        title: `Camera ${index + 1}`,
        animation: google.maps.Animation.DROP
      });

      // Animated scanning range
      const scanRange = new google.maps.Circle({
        center: pos,
        radius: 50,
        fillColor: '#00d4ff',
        fillOpacity: 0.1,
        strokeColor: '#00d4ff',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        map: mapInstance
      });

      // Animate scanning effect
      let scanRadius = 30;
      let expanding = true;
      setInterval(() => {
        if (expanding) {
          scanRadius += 1;
          if (scanRadius >= 50) expanding = false;
        } else {
          scanRadius -= 1;
          if (scanRadius <= 30) expanding = true;
        }
        scanRange.setRadius(scanRadius);
      }, 100);

      newResources.push({
        id: `camera-${index}`,
        type: 'camera',
        position: pos,
        marker: cameraMarker,
        coverage: scanRange
      });
    });

    // Deploy barriers along perimeter
    for (let i = 0; i < currentPlan.perimeter.length; i++) {
      const start = currentPlan.perimeter[i];
      const end = currentPlan.perimeter[(i + 1) % currentPlan.perimeter.length];
      
      // Create barrier line
      const barrierLine = new google.maps.Polyline({
        path: [
          { lat: start.lat, lng: start.lng },
          { lat: end.lat, lng: end.lng }
        ],
        strokeColor: '#fb923c',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: mapInstance,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            strokeWeight: 2,
            scale: 4
          },
          repeat: '10px'
        }]
      });
    }

    setDeployedResources(newResources);

    // Show deployment notification
    dispatch(addNotification({
      type: 'success',
      title: 'Resources Deployed',
      message: `Deployed ${newResources.filter(r => r.type === 'guard').length} guards and ${newResources.filter(r => r.type === 'camera').length} cameras`
    }));
  }, [mapInstance, currentPlan?.perimeter, currentPlan?.status]);

  // Add risk zone visualizations
  useEffect(() => {
    if (!mapInstance || !currentPlan?.risks) return;

    // Clear existing risk zones
    riskZones.forEach(zone => zone.setMap(null));

    const newRiskZones: google.maps.Circle[] = [];

    currentPlan.risks.forEach(risk => {
      if (risk.location) {
        const riskCircle = new google.maps.Circle({
          center: risk.location,
          radius: risk.level === 'high' ? 40 : risk.level === 'medium' ? 30 : 20,
          fillColor: risk.level === 'high' ? '#ef4444' : risk.level === 'medium' ? '#f59e0b' : '#eab308',
          fillOpacity: 0.3,
          strokeColor: risk.level === 'high' ? '#ef4444' : risk.level === 'medium' ? '#f59e0b' : '#eab308',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          map: mapInstance
        });

        // Pulsing animation for high-risk zones
        if (risk.level === 'high') {
          let pulseRadius = 40;
          let pulsing = true;
          setInterval(() => {
            if (pulsing) {
              pulseRadius += 0.5;
              if (pulseRadius >= 50) pulsing = false;
            } else {
              pulseRadius -= 0.5;
              if (pulseRadius <= 40) pulsing = true;
            }
            riskCircle.setRadius(pulseRadius);
          }, 50);
        }

        newRiskZones.push(riskCircle);
      }
    });

    setRiskZones(newRiskZones);
  }, [mapInstance, currentPlan?.risks]);

  // Calculate optimal camera positions
  const calculateOptimalCameraPositions = (perimeter: any[]): google.maps.LatLng[] => {
    if (perimeter.length < 3) return [];

    const positions: google.maps.LatLng[] = [];
    const bounds = new google.maps.LatLngBounds();
    
    perimeter.forEach(pin => {
      bounds.extend(new google.maps.LatLng(pin.lat, pin.lng));
    });
    
    const center = bounds.getCenter();
    
    // Place cameras at strategic points
    const numCameras = Math.min(4, Math.max(2, Math.floor(perimeter.length / 2)));
    for (let i = 0; i < numCameras; i++) {
      const angle = (360 / numCameras) * i;
      const distance = 0.0003; // Approximately 30 meters
      const lat = center.lat() + distance * Math.cos(angle * Math.PI / 180);
      const lng = center.lng() + distance * Math.sin(angle * Math.PI / 180);
      positions.push(new google.maps.LatLng(lat, lng));
    }

    return positions;
  };

  return null; // This component only manages map overlays
};

export default MapVisualization;