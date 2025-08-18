import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader } from '@googlemaps/js-api-loader';
import { useMapContext } from '../contexts/MapContext';
import { addNotification, setSelectedStep } from '../store/slices/uiSlice';
import { setMap } from '../store/slices/mapSlice';
import { 
  addSecurityResource, 
  updatePlanArea, 
  addPerimeterPin, 
  setCurrentPlan, 
  setAnalysisStatus,
  addRiskAssessment,
  setPlanStatus,
  clearRisks,
  incrementResourceDeployed
} from '../store/slices/securitySlice';
import { RootState } from '../store';

const MapContainer: React.FC = () => {
  // Removed console.log to prevent re-render spam
  const dispatch = useDispatch();
  const { setMapInstance, setPerimeterPolygon } = useMapContext();
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [map, setMapState] = useState<google.maps.Map | null>(null);
  const [, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [selectedArea, setSelectedArea] = useState<google.maps.Polygon | null>(null);
  
  // Redux state
  const { view } = useSelector((state: RootState) => state.map);
  const { currentPlan } = useSelector((state: RootState) => state.security);
  
  // Resource deployment state
  const [deploymentMode, setDeploymentMode] = useState<string | null>(null);
  const [deployedResources, setDeployedResources] = useState<{
    id: string;
    type: string;
    position: google.maps.LatLng;
    marker: google.maps.Marker;
  }[]>([]);
  const [, setIsDemoMode] = useState(false);
  const [, setDemoArea] = useState<{ width: number; height: number } | null>(null);
  
  // Perimeter creation state
  const [perimeterMode, setPerimeterMode] = useState(false);
  const [perimeterPins, setPerimeterPins] = useState<google.maps.LatLng[]>([]);
  const [perimeterMarkers, setPerimeterMarkers] = useState<google.maps.Marker[]>([]);
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Use refs to avoid closure issues
  const perimeterModeRef = useRef(perimeterMode);
  const deploymentModeRef = useRef(deploymentMode);
  const handlePerimeterPinPlacementRef = useRef<((position: google.maps.LatLng) => void) | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    perimeterModeRef.current = perimeterMode;
  }, [perimeterMode]);
  
  useEffect(() => {
    deploymentModeRef.current = deploymentMode;
  }, [deploymentMode]);

  const createDemoMap = () => {
    if (!mapRef.current) return;
    
    setIsDemoMode(true);
    setIsMapLoaded(true);
    
    // Create interactive demo map
    const mapElement = mapRef.current;
    mapElement.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)';
    mapElement.style.position = 'relative';
    mapElement.style.overflow = 'hidden';
    
    // Add grid pattern
    const grid = document.createElement('div');
    grid.style.position = 'absolute';
    grid.style.inset = '0';
    grid.style.backgroundImage = 'linear-gradient(rgba(0,255,136,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.1) 1px, transparent 1px)';
    grid.style.backgroundSize = '40px 40px';
    grid.style.opacity = '0.3';
    mapElement.appendChild(grid);
    
    // Add demo buildings
    const buildings = [
      { x: 20, y: 20, w: 80, h: 60, label: 'Main Building' },
      { x: 120, y: 30, w: 60, h: 40, label: 'Security Office' },
      { x: 200, y: 15, w: 70, h: 50, label: 'Parking' },
      { x: 30, y: 100, w: 90, h: 45, label: 'Event Hall' },
    ];
    
    buildings.forEach(building => {
      const buildingEl = document.createElement('div');
      buildingEl.style.position = 'absolute';
      buildingEl.style.left = building.x + 'px';
      buildingEl.style.top = building.y + 'px';
      buildingEl.style.width = building.w + 'px';
      buildingEl.style.height = building.h + 'px';
      buildingEl.style.background = 'rgba(255, 255, 255, 0.1)';
      buildingEl.style.border = '2px solid rgba(0, 212, 255, 0.5)';
      buildingEl.style.borderRadius = '4px';
      buildingEl.style.display = 'flex';
      buildingEl.style.alignItems = 'center';
      buildingEl.style.justifyContent = 'center';
      buildingEl.style.color = 'rgba(255, 255, 255, 0.7)';
      buildingEl.style.fontSize = '12px';
      buildingEl.style.fontWeight = 'bold';
      buildingEl.style.cursor = 'pointer';
      buildingEl.textContent = building.label;
      
      buildingEl.addEventListener('click', () => {
        dispatch(addNotification({
          type: 'info',
          title: 'Building Selected',
          message: `Selected: ${building.label}`
        }));
      });
      
      mapElement.appendChild(buildingEl);
    });
    
    // Add area selection capability
    let isDrawing = false;
    let drawingRect: HTMLDivElement | null = null;
    let startX = 0, startY = 0;
    
    // Add area selection instructions
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.left = '10px';
    instructions.style.background = 'rgba(0, 255, 136, 0.1)';
    instructions.style.border = '1px solid rgba(0, 255, 136, 0.3)';
    instructions.style.borderRadius = '8px';
    instructions.style.padding = '8px 12px';
    instructions.style.color = '#00ff88';
    instructions.style.fontSize = '12px';
    instructions.style.fontWeight = 'bold';
    instructions.innerHTML = `
      <div>📐 Hold SHIFT + Drag to select area</div>
      <div>🎯 Click resource buttons, then click map to deploy</div>
    `;
    mapElement.appendChild(instructions);
    
    // Mouse handlers for area selection
    mapElement.addEventListener('mousedown', (e) => {
      if (e.shiftKey && !deploymentMode) {
        isDrawing = true;
        startX = e.clientX - mapElement.getBoundingClientRect().left;
        startY = e.clientY - mapElement.getBoundingClientRect().top;
        
        drawingRect = document.createElement('div');
        drawingRect.style.position = 'absolute';
        drawingRect.style.left = startX + 'px';
        drawingRect.style.top = startY + 'px';
        drawingRect.style.width = '0px';
        drawingRect.style.height = '0px';
        drawingRect.style.border = '2px dashed #00ff88';
        drawingRect.style.background = 'rgba(0, 255, 136, 0.1)';
        drawingRect.style.pointerEvents = 'none';
        drawingRect.style.zIndex = '100';
        mapElement.appendChild(drawingRect);
        
        e.preventDefault();
      } else if (deploymentMode) {
        const rect = mapElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        deployDemoResource(deploymentMode, x, y);
      }
    });
    
    mapElement.addEventListener('mousemove', (e) => {
      if (isDrawing && drawingRect) {
        const currentX = e.clientX - mapElement.getBoundingClientRect().left;
        const currentY = e.clientY - mapElement.getBoundingClientRect().top;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);
        
        drawingRect.style.left = left + 'px';
        drawingRect.style.top = top + 'px';
        drawingRect.style.width = width + 'px';
        drawingRect.style.height = height + 'px';
      }
    });
    
    mapElement.addEventListener('mouseup', (e) => {
      if (isDrawing && drawingRect) {
        isDrawing = false;
        
        const width = parseInt(drawingRect.style.width);
        const height = parseInt(drawingRect.style.height);
        
        if (width > 20 && height > 20) {
          // Calculate area (simplified - treating pixels as meters for demo)
          const area = width * height * 4; // Scale factor for demo
          dispatch(updatePlanArea(area));
          setDemoArea({ width, height });
          
          // Add permanent area overlay
          drawingRect.style.border = '2px solid #00ff88';
          drawingRect.style.background = 'rgba(0, 255, 136, 0.15)';
          drawingRect.innerHTML = `
            <div style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.8); color: #00ff88; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
              ${area.toLocaleString()} m² | ${Math.floor(area/2).toLocaleString()} people
            </div>
            <button onclick="this.parentElement.remove(); window.dispatchEvent(new CustomEvent('clearArea'))" 
                    style="position: absolute; top: 5px; right: 5px; background: #ff3b30; color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;">
              ✕
            </button>
          `;
          
          dispatch(addNotification({
            type: 'success',
            title: 'Area Selected',
            message: `Selected area: ${area.toLocaleString()} m² | Capacity: ${Math.floor(area/2).toLocaleString()} people`
          }));
        } else {
          drawingRect.remove();
        }
        
        drawingRect = null;
      }
    });
    
    // Listen for area clearing
    window.addEventListener('clearArea', () => {
      dispatch(updatePlanArea(0));
      setDemoArea(null);
    });
    
    dispatch(addNotification({
      type: 'success',
      title: 'Demo Map Ready',
      message: 'Interactive demo map loaded - Click buildings or deploy resources!'
    }));
  };
  
  const deployDemoResource = (resourceType: string, x: number, y: number) => {
    if (!mapRef.current) return;
    
    const icons: { [key: string]: { icon: string; color: string } } = {
      guard: { icon: '🛡️', color: '#00ff88' },
      camera: { icon: '📹', color: '#00d4ff' },
      sensor: { icon: '📡', color: '#8b5cf6' },
      k9: { icon: '🐕', color: '#fbbf24' },
      drone: { icon: '🚁', color: '#06b6d4' }
    };
    
    const resourceIcon = icons[resourceType] || { icon: '📍', color: '#ff3b30' };
    
    const marker = document.createElement('div');
    marker.style.position = 'absolute';
    marker.style.left = (x - 20) + 'px';
    marker.style.top = (y - 20) + 'px';
    marker.style.width = '40px';
    marker.style.height = '40px';
    marker.style.background = resourceIcon.color;
    marker.style.borderRadius = '50%';
    marker.style.display = 'flex';
    marker.style.alignItems = 'center';
    marker.style.justifyContent = 'center';
    marker.style.fontSize = '20px';
    marker.style.cursor = 'pointer';
    marker.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    marker.style.border = '2px solid rgba(255,255,255,0.3)';
    marker.style.animation = 'bounceIn 0.5s ease-out';
    marker.textContent = resourceIcon.icon;
    marker.title = `${resourceType.toUpperCase()} Unit`;
    
    marker.addEventListener('click', () => {
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.left = '50px';
      info.style.top = '-30px';
      info.style.background = 'rgba(0, 0, 0, 0.9)';
      info.style.color = 'white';
      info.style.padding = '8px 12px';
      info.style.borderRadius = '8px';
      info.style.fontSize = '12px';
      info.style.whiteSpace = 'nowrap';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <div>${resourceType.toUpperCase()} Unit</div>
        <div style="color: #00ff88;">Status: Active</div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #ff3b30; color: white; border: none; padding: 2px 6px; border-radius: 4px; margin-top: 4px; cursor: pointer;">
          Remove
        </button>
      `;
      marker.appendChild(info);
      
      setTimeout(() => {
        if (info.parentElement) info.remove();
      }, 3000);
    });
    
    mapRef.current.appendChild(marker);
    
    // Update Redux store
    dispatch(addSecurityResource({
      id: `demo-${resourceType}-${Date.now()}`,
      type: resourceType as any,
      count: 1,
      deployed: 1,
      status: 'deployed',
      location: { lat: y, lng: x }
    }));
    
    dispatch(addNotification({
      type: 'success',
      title: 'Resource Deployed',
      message: `${resourceType.toUpperCase()} unit deployed successfully`
    }));
    
    setDeploymentMode(null);
  };

  const initializeMap = async () => {
    if (!mapRef.current) return;
    
    try {
      const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
      
      if (!API_KEY) {
        console.warn('No Google Maps API key found, using demo mode');
        createDemoMap();
        return;
      }
      
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded, initializing map directly');
        initializeGoogleMap();
        return;
      }
      
      // Check if a loader is already in progress
      if ((window as any).__GOOGLE_MAPS_LOADING__) {
        console.log('Google Maps already loading, waiting...');
        await (window as any).__GOOGLE_MAPS_LOADING__;
        initializeGoogleMap();
        return;
      }
      
      // Use a consistent loader ID
      const loaderId = 'google-maps-loader-main';
      
      const loader = new Loader({
        apiKey: API_KEY,
        version: 'weekly',
        libraries: ['drawing', 'geometry'],
        id: loaderId,
        region: 'US',
        language: 'en'
      });
      
      console.log('Loading Google Maps with API key:', API_KEY.substring(0, 10) + '...');
      
      // Set global loading flag
      const loadPromise = loader.load();
      (window as any).__GOOGLE_MAPS_LOADING__ = loadPromise;
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Google Maps load timeout')), 10000)
      );
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      // Clear loading flag
      delete (window as any).__GOOGLE_MAPS_LOADING__;
      
      console.log('Google Maps loaded successfully');
      
      // Verify Google Maps is actually available
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps failed to load properly');
      }
      
      initializeGoogleMap();

    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      // Clear loading flag on error
      delete (window as any).__GOOGLE_MAPS_LOADING__;
      console.warn('Falling back to demo mode due to API error');
      createDemoMap();
    }
  };
  
  const initializeGoogleMap = () => {
    if (!mapRef.current) return;
    
    try {
      // Verify Google Maps API is properly loaded
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        console.error('Google Maps API not properly loaded');
        createDemoMap();
        return;
      }
      
      
      // Initialize map
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: view.center,
        zoom: view.zoom,
        mapTypeId: view.mapType as any,
        tilt: view.tilt,
        styles: [
          {
            elementType: 'geometry',
            stylers: [{ color: '#212121' }]
          },
          {
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: '#757575' }]
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#212121' }]
          },
          {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{ color: '#757575' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.fill',
            stylers: [{ color: '#2c2c2c' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#000000' }]
          }
        ]
      });
      
      setMapState(mapInstance);
      dispatch(setMap(mapInstance));
      setMapInstance(mapInstance);
      
      // Initialize drawing manager
      const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            window.google.maps.drawing.OverlayType.POLYGON,
            window.google.maps.drawing.OverlayType.RECTANGLE,
            window.google.maps.drawing.OverlayType.CIRCLE
          ]
        },
        polygonOptions: {
          fillColor: '#00ff88',
          fillOpacity: 0.2,
          strokeWeight: 2,
          strokeColor: '#00ff88',
          clickable: true,
          editable: true,
          zIndex: 1
        },
        rectangleOptions: {
          fillColor: '#00ff88',
          fillOpacity: 0.2,
          strokeWeight: 2,
          strokeColor: '#00ff88',
          clickable: true,
          editable: true,
          zIndex: 1
        },
        circleOptions: {
          fillColor: '#00ff88',
          fillOpacity: 0.2,
          strokeWeight: 2,
          strokeColor: '#00ff88',
          clickable: true,
          editable: true,
          zIndex: 1
        }
      });
      
      drawingManagerInstance.setMap(mapInstance);
      setDrawingManager(drawingManagerInstance);
      
      // Handle area selection
      drawingManagerInstance.addListener('overlaycomplete', (event: any) => {
        // Clear previous selection
        if (selectedArea) {
          selectedArea.setMap(null);
        }
        
        const newShape = event.overlay;
        setSelectedArea(newShape);
        
        // Calculate area
        let area = 0;
        if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
          area = window.google.maps.geometry.spherical.computeArea(newShape.getPath());
        } else if (event.type === window.google.maps.drawing.OverlayType.RECTANGLE) {
          const bounds = newShape.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const nw = new window.google.maps.LatLng(ne.lat(), sw.lng());
          const se = new window.google.maps.LatLng(sw.lat(), ne.lng());
          area = window.google.maps.geometry.spherical.computeArea([ne, se, sw, nw]);
        } else if (event.type === window.google.maps.drawing.OverlayType.CIRCLE) {
          const radius = newShape.getRadius();
          area = Math.PI * radius * radius;
        }
        
        dispatch(updatePlanArea(Math.round(area)));
        
        // Create a security plan for this area
        const polygonPath = [];
        if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
          const path = newShape.getPath();
          for (let i = 0; i < path.getLength(); i++) {
            polygonPath.push({
              id: `pin-${Date.now()}-${i}`,
              lat: path.getAt(i).lat(),
              lng: path.getAt(i).lng(),
              type: 'perimeter' as const,
              label: `Point ${i + 1}`
            });
          }
        } else if (event.type === window.google.maps.drawing.OverlayType.RECTANGLE) {
          const bounds = newShape.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          // Create 4 corner points for rectangle
          polygonPath.push(
            { id: `pin-${Date.now()}-1`, lat: ne.lat(), lng: ne.lng(), type: 'perimeter' as const, label: 'NE' },
            { id: `pin-${Date.now()}-2`, lat: ne.lat(), lng: sw.lng(), type: 'perimeter' as const, label: 'NW' },
            { id: `pin-${Date.now()}-3`, lat: sw.lat(), lng: sw.lng(), type: 'perimeter' as const, label: 'SW' },
            { id: `pin-${Date.now()}-4`, lat: sw.lat(), lng: ne.lng(), type: 'perimeter' as const, label: 'SE' }
          );
        } else if (event.type === window.google.maps.drawing.OverlayType.CIRCLE) {
          // Create 8 points around circle
          const center = newShape.getCenter();
          const radius = newShape.getRadius();
          for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const point = google.maps.geometry.spherical.computeOffset(center, radius, angle * 180 / Math.PI);
            polygonPath.push({
              id: `pin-${Date.now()}-${i}`,
              lat: point.lat(),
              lng: point.lng(),
              type: 'perimeter' as const,
              label: `Point ${i + 1}`
            });
          }
        }
        
        // Update Redux with the perimeter
        if (polygonPath.length > 0) {
          dispatch(setCurrentPlan({
            id: currentPlan?.id || `plan-${Date.now()}`,
            name: currentPlan?.name || 'Security Plan',
            perimeter: polygonPath,
            resources: currentPlan?.resources || [],
            risks: currentPlan?.risks || [],
            area: Math.round(area),
            capacity: Math.floor(area / 2),
            status: 'draft',
            createdAt: currentPlan?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          // Show the complete button
          setShowCompleteButton(true);
        }
        
        // Focus on selected area
        focusOnArea(newShape);
        
        // Show area info
        dispatch(addNotification({
          type: 'success',
          title: 'Area Selected',
          message: `Selected area: ${Math.round(area)} m² | Capacity: ${Math.floor(area / 2)} people. Click COMPLETE button to begin analysis!`
        }));
        
        // Stop drawing mode
        drawingManagerInstance.setDrawingMode(null);
      });
      
      // Handle map clicks for resource deployment or perimeter creation
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        console.log('Map clicked! Deployment mode:', deploymentModeRef.current, 'Perimeter mode:', perimeterModeRef.current, 'Event:', event);
        
        if (perimeterModeRef.current && event.latLng) {
          // Handle perimeter pin placement
          console.log('Placing perimeter pin at:', event.latLng.toString());
          // Call the function through ref since it might not be in scope
          if (handlePerimeterPinPlacementRef.current) {
            handlePerimeterPinPlacementRef.current(event.latLng);
          } else {
            console.error('handlePerimeterPinPlacement not available!');
          }
        } else if (deploymentModeRef.current && event.latLng) {
          console.log('Deploying resource:', deploymentModeRef.current, 'at position:', event.latLng.toString());
          deployResource(deploymentModeRef.current, event.latLng);
        } else {
          console.log('No deployment or perimeter mode active or no position');
        }
      });
      
      setIsMapLoaded(true);
      
      dispatch(addNotification({
        type: 'success',
        title: 'Map Ready',
        message: 'Interactive security map loaded successfully'
      }));

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      createDemoMap();
    }
  };
  
  const focusOnArea = (shape: google.maps.Polygon | google.maps.Rectangle | google.maps.Circle) => {
    if (!map) return;
    
    let bounds = new google.maps.LatLngBounds();
    
    if (shape instanceof google.maps.Polygon) {
      const polygon = shape as google.maps.Polygon;
      polygon.getPath().forEach((point: google.maps.LatLng) => {
        bounds.extend(point);
      });
    } else if (shape instanceof google.maps.Rectangle) {
      const rectangle = shape as google.maps.Rectangle;
      const rectBounds = rectangle.getBounds();
      if (rectBounds) bounds = rectBounds;
    } else if (shape instanceof google.maps.Circle) {
      const circle = shape as google.maps.Circle;
      const center = circle.getCenter();
      const radius = circle.getRadius();
      if (center) {
        const ne = google.maps.geometry.spherical.computeOffset(center, radius, 45);
        const sw = google.maps.geometry.spherical.computeOffset(center, radius, 225);
        bounds.extend(ne);
        bounds.extend(sw);
      }
    }
    
    map.fitBounds(bounds);
    
    // Add some padding and zoom out slightly for better view
    setTimeout(() => {
      const currentZoom = map.getZoom();
      map.setZoom(Math.max(currentZoom! - 1, 16));
    }, 100);
  };
  
  const deployResource = (resourceType: string, position: google.maps.LatLng) => {
    console.log('deployResource called with:', resourceType, position.toString());
    if (!map) {
      console.error('No map instance available');
      return;
    }
    
    // Enhanced icons with better visibility and shadow effects
    const icons: { [key: string]: { url: string; scaledSize: any; anchor: any } } = {
      guard: { 
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
              </filter>
            </defs>
            <circle cx="24" cy="24" r="20" fill="#00ff88" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
            <circle cx="24" cy="24" r="16" fill="#00cc66" stroke="#000" stroke-width="1"/>
            <text x="24" y="32" font-size="20" text-anchor="middle" fill="#000">👮</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(42, 42),
        anchor: new google.maps.Point(21, 21)
      },
      camera: { 
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
              </filter>
            </defs>
            <circle cx="24" cy="24" r="20" fill="#00d4ff" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
            <circle cx="24" cy="24" r="16" fill="#00aacc" stroke="#000" stroke-width="1"/>
            <text x="24" y="32" font-size="20" text-anchor="middle" fill="#000">📹</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(42, 42),
        anchor: new google.maps.Point(21, 21)
      },
      sensor: { 
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
              </filter>
            </defs>
            <circle cx="24" cy="24" r="20" fill="#8b5cf6" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
            <circle cx="24" cy="24" r="16" fill="#6d28d9" stroke="#000" stroke-width="1"/>
            <text x="24" y="32" font-size="20" text-anchor="middle" fill="#fff">📡</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(42, 42),
        anchor: new google.maps.Point(21, 21)
      },
      k9: { 
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
              </filter>
            </defs>
            <circle cx="24" cy="24" r="20" fill="#fbbf24" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
            <circle cx="24" cy="24" r="16" fill="#d97706" stroke="#000" stroke-width="1"/>
            <text x="24" y="32" font-size="20" text-anchor="middle" fill="#000">🐕</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(42, 42),
        anchor: new google.maps.Point(21, 21)
      },
      drone: { 
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
              </filter>
            </defs>
            <circle cx="24" cy="24" r="20" fill="#06b6d4" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
            <circle cx="24" cy="24" r="16" fill="#0891b2" stroke="#000" stroke-width="1"/>
            <text x="24" y="32" font-size="20" text-anchor="middle" fill="#fff">🚁</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(42, 42),
        anchor: new google.maps.Point(21, 21)
      },
      medical: { 
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
              </filter>
            </defs>
            <circle cx="24" cy="24" r="20" fill="#ff3b30" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
            <circle cx="24" cy="24" r="16" fill="#dc2626" stroke="#000" stroke-width="1"/>
            <text x="24" y="32" font-size="20" text-anchor="middle" fill="#fff">➕</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(42, 42),
        anchor: new google.maps.Point(21, 21)
      },
      barrier: { 
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
              </filter>
            </defs>
            <rect x="4" y="4" width="40" height="40" rx="8" fill="#ff9500" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
            <rect x="8" y="8" width="32" height="32" rx="6" fill="#ea580c" stroke="#000" stroke-width="1"/>
            <text x="24" y="32" font-size="20" text-anchor="middle" fill="#000">🚧</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(42, 42),
        anchor: new google.maps.Point(21, 21)
      }
    };
    
    const resourceIcon = icons[resourceType] || icons.guard;
    console.log('Using icon for:', resourceType);
    
    try {
      // Get z-index based on resource type priority
      const getResourceZIndex = (type: string): number => {
        const zIndexMap: { [key: string]: number } = {
          'drone': 1000,    // Highest priority (aerial)
          'camera': 900,    // High visibility priority
          'sensor': 800,    // Detection equipment
          'guard': 700,     // Personnel
          'medical': 600,   // Support
          'k9': 500,        // Mobile units
          'barrier': 400    // Static obstacles (lowest)
        };
        return zIndexMap[type] || 500;
      };
      
      // Create marker with custom icon, draggable, and proper z-index
      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: `${resourceType.toUpperCase()} Unit`,
        icon: resourceIcon,
        animation: window.google.maps.Animation.DROP,
        draggable: true,
        zIndex: getResourceZIndex(resourceType)
      });
      
      console.log('Marker created successfully:', marker);
      
      // Add click listener for resource details
      marker.addListener('click', () => {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color: #000; font-family: sans-serif;">
              <h3>${resourceType.toUpperCase()} Unit</h3>
              <p>Status: Active</p>
              <p>Position: ${position.lat().toFixed(6)}, ${position.lng().toFixed(6)}</p>
              <p style="color: #666; font-size: 12px;">💡 Drag to reposition</p>
              <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                      style="background: #ff3b30; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                Remove
              </button>
            </div>
          `
        });
        infoWindow.open(map, marker);
      });
      
      // Add drag listener to prevent overlaps
      marker.addListener('dragend', () => {
        const newPosition = marker.getPosition();
        if (newPosition) {
          // Check for overlaps with other resources
          let hasOverlap = false;
          deployedResources.forEach(resource => {
            if (resource.marker !== marker) {
              const otherPos = resource.marker.getPosition();
              if (otherPos) {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                  newPosition, otherPos
                );
                // If within 20 meters, it's too close
                if (distance < 20) {
                  hasOverlap = true;
                }
              }
            }
          });
          
          if (hasOverlap) {
            // Revert to previous position
            marker.setPosition(position);
            dispatch(addNotification({
              type: 'warning',
              title: 'Deployment Conflict',
              message: 'Resources must be at least 20 meters apart'
            }));
          } else {
            // Update position in our state
            setDeployedResources(prev => 
              prev.map(resource => 
                resource.marker === marker 
                  ? { ...resource, position: newPosition }
                  : resource
              )
            );
            dispatch(addNotification({
              type: 'success',
              title: 'Resource Repositioned',
              message: `${resourceType.toUpperCase()} moved to new position`
            }));
          }
        }
      });
      
      // Store deployed resource
      const newResource = {
        id: `${resourceType}-${Date.now()}`,
        type: resourceType,
        position: position,
        marker: marker
      };
      
      setDeployedResources(prev => [...prev, newResource]);
      
      // Update Redux store - increment deployed count
      dispatch(incrementResourceDeployed(resourceType));
      
      
      dispatch(addNotification({
        type: 'success',
        title: 'Resource Deployed',
        message: `${resourceType.toUpperCase()} unit deployed successfully`
      }));
      
      // Clear deployment mode
      setDeploymentMode(null);
      
    } catch (error) {
      console.error('Error creating marker:', error);
    }
  };
  
  const handlePerimeterPinPlacement = (position: google.maps.LatLng) => {
    console.log('handlePerimeterPinPlacement called with position:', position.toString());
    if (!map) {
      console.error('No map instance available!');
      return;
    }
    
    // Create pin marker - make it VERY visible
    const pinNumber = perimeterPins.length + 1;
    console.log('Creating pin number:', pinNumber);
    
    try {
      // Try a simpler marker first
      const pinMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: `Perimeter Pin ${pinNumber}/4`,
        label: {
          text: `${pinNumber}`,
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold'
        },
        // Use default red marker instead of custom icon
        animation: google.maps.Animation.DROP,
        zIndex: 1000  // Make sure it's on top
      });
      
      console.log('Pin marker created successfully:', pinMarker);
      
      // Add pin to Redux for sidebar visibility
      const pinData = {
        id: `pin-${Date.now()}`,
        lat: position.lat(),
        lng: position.lng(),
        type: 'perimeter' as const,
        label: `Pin ${perimeterPins.length + 1}`
      };
      
      // Initialize plan if needed
      if (!currentPlan) {
        console.log('Creating new plan with first pin');
        // Create plan with first pin included
        dispatch(setCurrentPlan({
          id: `plan-${Date.now()}`,
          name: 'Security Plan',
          perimeter: [pinData], // Include first pin directly
          resources: [],
          risks: [],
          area: 0,
          capacity: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      } else {
        // Add to existing plan
        console.log('Adding pin to existing plan:', pinData);
        console.log('Current plan has', currentPlan.perimeter.length, 'pins');
        dispatch(addPerimeterPin(pinData));
      }
      console.log('Pin processing complete');
      
      // Add to local state
      const newPins = [...perimeterPins, position];
      const newMarkers = [...perimeterMarkers, pinMarker];
    
      setPerimeterPins(newPins);
      setPerimeterMarkers(newMarkers);
      
      dispatch(addNotification({
        type: 'info',
        title: 'Perimeter Pin Placed',
        message: `Pin ${newPins.length}/4 placed at (${position.lat().toFixed(4)}, ${position.lng().toFixed(4)}). ${4 - newPins.length} pins remaining.`
      }));
      
      // If we have 4 pins, create the perimeter polygon
      if (newPins.length === 4) {
        createPerimeterPolygon(newPins);
        setPerimeterMode(false);
        
        // Force update the plan with all 4 pins
        const allPins = [];
        for (let i = 0; i < newPins.length; i++) {
          allPins.push({
            id: `pin-${Date.now()}-${i}`,
            lat: newPins[i].lat(),
            lng: newPins[i].lng(),
            type: 'perimeter' as const,
            label: `Pin ${i + 1}`
          });
        }
        
        // Update the entire plan with all pins
        dispatch(setCurrentPlan({
          id: currentPlan?.id || `plan-${Date.now()}`,
          name: currentPlan?.name || 'Security Plan',
          perimeter: allPins,
          resources: currentPlan?.resources || [],
          risks: currentPlan?.risks || [],
          area: currentPlan?.area || 0,
          capacity: currentPlan?.capacity || 0,
          status: 'draft',
          createdAt: currentPlan?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        dispatch(addNotification({
          type: 'success',
          title: 'Perimeter Created',
          message: 'Security perimeter established with 4 pins! Check LEFT SIDEBAR for Complete button.'
        }));
        
        // Show the complete button
        setShowCompleteButton(true);
        
        // Also force the UI to update by setting analysis status
        dispatch(setAnalysisStatus('idle'));
      }
    } catch (error) {
      console.error('Error creating pin marker:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Pin Creation Failed',
        message: 'Failed to place pin on map. Please try again.'
      }));
    }
  };
  
  // Store the function in ref so it's accessible in map click handler
  useEffect(() => {
    handlePerimeterPinPlacementRef.current = handlePerimeterPinPlacement;
  }, [perimeterPins, perimeterMarkers, currentPlan]);
  
  const createPerimeterPolygon = (pins: google.maps.LatLng[]) => {
    if (!map || pins.length !== 4) return;
    
    // Clear previous area selection
    if (selectedArea) {
      selectedArea.setMap(null);
    }
    
    // Create polygon from 4 pins - make it very visible
    const polygon = new google.maps.Polygon({
      paths: pins,
      fillColor: '#00ff88',  // Bright green
      fillOpacity: 0.4,  // More visible
      strokeWeight: 4,  // Thicker border
      strokeColor: '#00ff00',  // Bright green border
      clickable: true,
      editable: true,
      zIndex: 100
    });
    
    polygon.setMap(map);
    setSelectedArea(polygon);
    setPerimeterPolygon(polygon);
    
    // Calculate area
    const area = google.maps.geometry.spherical.computeArea(pins);
    dispatch(updatePlanArea(Math.round(area)));
    
    // Focus on the area
    focusOnArea(polygon);
    
    // Add click listener for polygon info
    polygon.addListener('click', () => {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #000; font-family: sans-serif;">
            <h3>Security Perimeter</h3>
            <p>Area: ${Math.round(area)} m²</p>
            <p>Capacity: ${Math.floor(area / 2)} people</p>
            <button onclick="window.clearPerimeter()" 
                    style="background: #ff3b30; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
              Clear Perimeter
            </button>
          </div>
        `,
        position: pins[0]
      });
      infoWindow.open(map);
    });
  };
  
  const startPerimeterMode = () => {
    console.log('startPerimeterMode called, current state:', perimeterMode);
    // Clear any existing perimeter
    clearPerimeter();
    // Set perimeter mode AFTER clearing
    setPerimeterMode(true);
    setDeploymentMode(null); // Disable resource deployment
    console.log('Perimeter mode set to true');
    
    // Force update of ref immediately
    perimeterModeRef.current = true;
    
    dispatch(addNotification({
      type: 'info',
      title: 'Perimeter Mode Active',
      message: 'Click 4 points on the map to create security perimeter'
    }));
  };
  
  const clearPerimeter = () => {
    // Clear existing polygon
    if (selectedArea) {
      selectedArea.setMap(null);
      setSelectedArea(null);
      setPerimeterPolygon(null);
    }
    
    // Clear pins
    perimeterMarkers.forEach(marker => marker.setMap(null));
    setPerimeterMarkers([]);
    setPerimeterPins([]);
    // Don't reset perimeter mode here if we're starting a new perimeter
    
    // Clear Redux perimeter
    if (currentPlan) {
      dispatch(setCurrentPlan({
        ...currentPlan,
        perimeter: [],
        area: 0
      }));
    }
    
    dispatch(updatePlanArea(0));
  };
  
  // Global function for clearing perimeter from info window
  useEffect(() => {
    (window as any).clearPerimeter = clearPerimeter;
    return () => {
      delete (window as any).clearPerimeter;
    };
  }, []);

  useEffect(() => {
    // Set map as loaded immediately for demo
    setIsMapLoaded(true);
    initializeMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Generate threat assessments and resources after analysis
  const generateAnalysisResults = () => {
    console.log('Generating analysis results...');
    
    // Clear existing risks first
    dispatch(clearRisks());
    
    // Generate threat assessments based on perimeter
    const threats = [
      {
        id: `threat-${Date.now()}-1`,
        level: 'high' as const,
        category: 'Crowd Control',
        title: 'Main Entry Bottleneck',
        description: 'High crowd density expected at main entrance. Risk of stampede during peak hours.',
        location: { lat: 40.758, lng: -73.985 },
        recommendations: ['Deploy 4 additional guards', 'Install barriers', 'Set up queue management system']
      },
      {
        id: `threat-${Date.now()}-2`,
        level: 'medium' as const,
        category: 'Perimeter Security',
        title: 'Blind Spot - Northwest Corner',
        description: 'Limited visibility area due to building obstruction. Potential unauthorized access point.',
        location: { lat: 40.759, lng: -73.986 },
        recommendations: ['Install CCTV camera', 'Deploy motion sensor', 'Assign roving patrol']
      },
      {
        id: `threat-${Date.now()}-3`,
        level: 'medium' as const,
        category: 'Emergency Response',
        title: 'Limited Emergency Access',
        description: 'Emergency vehicle access restricted on east side. Could delay response time.',
        location: { lat: 40.757, lng: -73.984 },
        recommendations: ['Establish emergency lane', 'Position medical team nearby', 'Create alternate evacuation route']
      },
      {
        id: `threat-${Date.now()}-4`,
        level: 'low' as const,
        category: 'Infrastructure',
        title: 'Power Supply Vulnerability',
        description: 'Single power source for lighting and security systems. Backup needed.',
        location: { lat: 40.756, lng: -73.985 },
        recommendations: ['Install backup generator', 'Deploy battery-powered lights', 'Test emergency systems']
      }
    ];
    
    threats.forEach(threat => {
      dispatch(addRiskAssessment(threat));
    });
    
    // Generate security resources
    const resources = [
      { id: `res-${Date.now()}-1`, type: 'guard' as const, count: 12, deployed: 0, status: 'ready' as const },
      { id: `res-${Date.now()}-2`, type: 'camera' as const, count: 8, deployed: 0, status: 'ready' as const },
      { id: `res-${Date.now()}-3`, type: 'barrier' as const, count: 20, deployed: 0, status: 'ready' as const },
      { id: `res-${Date.now()}-4`, type: 'medical' as const, count: 2, deployed: 0, status: 'ready' as const },
      { id: `res-${Date.now()}-5`, type: 'k9' as const, count: 3, deployed: 0, status: 'ready' as const },
      { id: `res-${Date.now()}-6`, type: 'drone' as const, count: 2, deployed: 0, status: 'ready' as const },
      { id: `res-${Date.now()}-7`, type: 'sensor' as const, count: 10, deployed: 0, status: 'ready' as const },
      { id: `res-${Date.now()}-8`, type: 'radio' as const, count: 15, deployed: 0, status: 'ready' as const }
    ];
    
    resources.forEach(resource => {
      dispatch(addSecurityResource(resource));
    });
    
    // Update plan status
    dispatch(setPlanStatus('complete'));
    
    // Notify user
    dispatch(addNotification({
      type: 'success',
      title: 'AI Analysis Complete',
      message: `Identified ${threats.length} risk areas and allocated ${resources.length} resource types`
    }));
    
    // Auto-progress to Step 3 (Resource Allocation)
    dispatch(setSelectedStep(3));
  };

  // Listen for resource deployment from parent
  useEffect(() => {
    // Listen for completePerimeter event from PlanningSteps
    const handleCompletePerimeter = (event: CustomEvent) => {
      console.log('MapContainer received completePerimeter event');
      if (perimeterPins.length >= 4 && !isAnalyzing) {
        setShowCompleteButton(false);
        setIsAnalyzing(true);
        
        // Move to step 2
        dispatch(setSelectedStep(2));
        // Start analysis
        dispatch(setAnalysisStatus('analyzing'));
        
        // Show analyzing for 3 seconds
        let timeElapsed = 0;
        const analysisInterval = setInterval(() => {
          timeElapsed += 1;
          console.log(`Analysis progress: ${timeElapsed}s / 3s`);
          if (timeElapsed >= 3) {
            clearInterval(analysisInterval);
            console.log('Analysis complete!');
            dispatch(setAnalysisStatus('complete'));
            setIsAnalyzing(false);
            // Generate actual analysis results
            generateAnalysisResults();
          }
        }, 1000);
      }
    };
    
    window.addEventListener('completePerimeter', handleCompletePerimeter as EventListener);
    
    const handleMessage = (event: MessageEvent) => {
      console.log('MapContainer received message:', event.data);
      if (event.data.type === 'DEPLOY_RESOURCE') {
        console.log('Setting deployment mode to:', event.data.resourceType);
        setDeploymentMode(event.data.resourceType);
        setPerimeterMode(false); // Disable perimeter mode
        dispatch(addNotification({
          type: 'info',
          title: 'Deployment Mode',
          message: `Click on the map to deploy ${event.data.resourceType.toUpperCase()} unit`
        }));
      } else if (event.data.type === 'START_PERIMETER_MODE') {
        console.log('Starting perimeter mode');
        startPerimeterMode();
      } else if (event.data.type === 'CLEAR_PERIMETER') {
        console.log('Clearing perimeter');
        clearPerimeter();
        setPerimeterMode(false); // Reset mode when explicitly clearing
      } else if (event.data.type === 'AUTO_DEPLOY_CLICK') {
        console.log('Auto-deploy click received:', event.data);
        // Handle auto-deployment for both Google Maps and demo mode
        if (map && event.data.position) {
          // For Google Maps - create LatLng from position
          const latLng = new google.maps.LatLng(event.data.position.lat, event.data.position.lng);
          deployResource(event.data.resourceType, latLng);
        } else if (mapRef.current) {
          // For demo mode - convert lat/lng to pixel coordinates
          const rect = mapRef.current.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          // Add some randomness around center
          const x = centerX + (Math.random() - 0.5) * 200;
          const y = centerY + (Math.random() - 0.5) * 200;
          deployDemoResource(event.data.resourceType, x, y);
        }
      } else if (event.data.type === 'AUTO_DEPLOY_RESOURCES') {
        console.log('Auto-deploying all resources with smart placement');
        
        // Smart deployment strategy based on resource type
        const deploymentStrategy = [
          // Guards - at entrances and corners
          { type: 'guard', count: 4, placement: 'corners' },
          { type: 'guard', count: 4, placement: 'midpoints' },
          
          // Cameras - high vantage points and blind spots
          { type: 'camera', count: 4, placement: 'corners' },
          { type: 'camera', count: 2, placement: 'center' },
          
          // Sensors - perimeter coverage
          { type: 'sensor', count: 6, placement: 'perimeter' },
          
          // Medical - strategic central locations
          { type: 'medical', count: 2, placement: 'center' },
          
          // Drones - aerial coverage
          { type: 'drone', count: 2, placement: 'patrol' },
          
          // K9 units - mobile patrols
          { type: 'k9', count: 2, placement: 'midpoints' },
          
          // Barriers - entry points
          { type: 'barrier', count: 4, placement: 'entrances' }
        ];
        
        let deployIndex = 0;
        
        const getStrategicPosition = (strategy: any, index: number) => {
          if (!selectedArea && perimeterPins.length === 0) return null;
          
          // Check if position conflicts with existing resources
          const checkForConflicts = (proposedPosition: google.maps.LatLng, minDistance: number = 30) => {
            for (const resource of deployedResources) {
              const existingPos = resource.position;
              const distance = google.maps.geometry.spherical.computeDistanceBetween(
                proposedPosition, existingPos
              );
              if (distance < minDistance) {
                return true; // Conflict found
              }
            }
            return false; // No conflicts
          };
          
          // Generate position with conflict avoidance
          const generatePosition = (basePosition: google.maps.LatLng, attempts: number = 0): google.maps.LatLng => {
            if (attempts > 10) return basePosition; // Give up after 10 attempts
            
            let position = basePosition;
            
            // Add spacing offset based on attempt number
            if (attempts > 0) {
              const offsetDistance = 0.0003 * attempts; // Increase distance with each attempt
              const offsetAngle = (attempts * 137.5) * (Math.PI / 180); // Golden angle for distribution
              
              position = new google.maps.LatLng(
                basePosition.lat() + Math.cos(offsetAngle) * offsetDistance,
                basePosition.lng() + Math.sin(offsetAngle) * offsetDistance
              );
            }
            
            if (checkForConflicts(position)) {
              return generatePosition(basePosition, attempts + 1);
            }
            
            return position;
          };
          
          if (selectedArea && map) {
            const path = selectedArea.getPath();
            const points: google.maps.LatLng[] = [];
            path.forEach((point: google.maps.LatLng) => {
              points.push(point);
            });
            
            let basePosition: google.maps.LatLng;
            
            switch (strategy.placement) {
              case 'corners':
                // Place at polygon corners with offset for multiple resources
                const cornerPoint = points[index % points.length];
                const cornerOffset = Math.floor(index / points.length) * 0.0004;
                const cornerAngle = (index / points.length) * Math.PI * 2;
                basePosition = new google.maps.LatLng(
                  cornerPoint.lat() + Math.cos(cornerAngle) * cornerOffset,
                  cornerPoint.lng() + Math.sin(cornerAngle) * cornerOffset
                );
                break;
                
              case 'midpoints':
                // Place at midpoints between corners with spacing
                const p1 = points[index % points.length];
                const p2 = points[(index + 1) % points.length];
                const midOffset = (Math.floor(index / points.length) - 0.5) * 0.0003;
                basePosition = new google.maps.LatLng(
                  (p1.lat() + p2.lat()) / 2 + midOffset,
                  (p1.lng() + p2.lng()) / 2 + midOffset
                );
                break;
                
              case 'center':
                // Place near center with radial distribution
                const bounds = new google.maps.LatLngBounds();
                points.forEach(p => bounds.extend(p));
                const center = bounds.getCenter();
                const radius = index * 0.0002;
                const angle = (index * 137.5) * (Math.PI / 180); // Golden angle
                basePosition = new google.maps.LatLng(
                  center.lat() + Math.cos(angle) * radius,
                  center.lng() + Math.sin(angle) * radius
                );
                break;
                
              case 'perimeter':
                // Distribute evenly along perimeter with spacing
                const totalPerimeter = points.length;
                const segmentSize = totalPerimeter / strategy.count;
                const segmentIndex = Math.floor(index * segmentSize) % totalPerimeter;
                const p3 = points[segmentIndex];
                const p4 = points[(segmentIndex + 1) % totalPerimeter];
                const ratio = (index * segmentSize - Math.floor(index * segmentSize));
                const perimOffset = (index % 3 - 1) * 0.0002; // Small offset for multiple resources
                basePosition = new google.maps.LatLng(
                  p3.lat() + (p4.lat() - p3.lat()) * ratio + perimOffset,
                  p3.lng() + (p4.lng() - p3.lng()) * ratio + perimOffset
                );
                break;
                
              case 'patrol':
                // Elevated positions for drones with spacing
                const bounds2 = new google.maps.LatLngBounds();
                points.forEach(p => bounds2.extend(p));
                const ne = bounds2.getNorthEast();
                const sw = bounds2.getSouthWest();
                const patrolOffset = index * 0.0003;
                basePosition = new google.maps.LatLng(
                  (index % 2 === 0 ? ne.lat() : sw.lat()) + patrolOffset,
                  (index % 2 === 0 ? ne.lng() : sw.lng()) + patrolOffset
                );
                break;
                
              case 'entrances':
                // Place at entry points with spacing
                const entryIndex = Math.floor(index * points.length / strategy.count) % points.length;
                const entryPoint = points[entryIndex];
                const entryOffset = (index % 2 - 0.5) * 0.0004;
                basePosition = new google.maps.LatLng(
                  entryPoint.lat() + entryOffset,
                  entryPoint.lng() + entryOffset
                );
                break;
                
              default:
                // Random placement within polygon with better distribution
                const bounds3 = new google.maps.LatLngBounds();
                points.forEach(p => bounds3.extend(p));
                const ne3 = bounds3.getNorthEast();
                const sw3 = bounds3.getSouthWest();
                basePosition = new google.maps.LatLng(
                  sw3.lat() + (index / strategy.count + Math.random() * 0.3) * (ne3.lat() - sw3.lat()),
                  sw3.lng() + (index / strategy.count + Math.random() * 0.3) * (ne3.lng() - sw3.lng())
                );
            }
            
            return generatePosition(basePosition);
            
          } else if (perimeterPins.length > 0) {
            // Fallback to perimeter pins with better spacing
            const pinIndex = index % perimeterPins.length;
            const pin = perimeterPins[pinIndex];
            const angle = ((index * 137.5) % 360) * (Math.PI / 180); // Golden angle distribution
            const radius = 0.0005 + (Math.floor(index / perimeterPins.length) * 0.0003);
            const basePosition = new google.maps.LatLng(
              pin.lat() + Math.cos(angle) * radius,
              pin.lng() + Math.sin(angle) * radius
            );
            
            return generatePosition(basePosition);
          }
          
          return null;
        };
        
        const deployInterval = setInterval(() => {
          if (deployIndex >= deploymentStrategy.length) {
            clearInterval(deployInterval);
            dispatch(addNotification({
              type: 'success',
              title: '✅ Smart Deployment Complete',
              message: 'All resources strategically positioned'
            }));
            return;
          }
          
          const strategy = deploymentStrategy[deployIndex];
          
          // Deploy multiple resources of this type
          for (let i = 0; i < strategy.count; i++) {
            setTimeout(() => {
              const position = getStrategicPosition(strategy, i);
              if (position) {
                deployResource(strategy.type, position);
              }
            }, i * 200); // Stagger deployment for visual effect
          }
          
          deployIndex++;
        }, 1000); // Deploy one resource type per second
      } else if (event.data.type === 'DEPLOY_SINGLE_RESOURCE') {
        console.log('Deploying single resource:', event.data.resourceType);
        
        // Smart placement for single resource
        if (selectedArea && map) {
          const path = selectedArea.getPath();
          const bounds = new google.maps.LatLngBounds();
          path.forEach((point: google.maps.LatLng) => {
            bounds.extend(point);
          });
          
          // Deploy at strategic position based on type
          let position: google.maps.LatLng;
          switch (event.data.resourceType) {
            case 'guard':
              // Deploy at entrance/corner
              position = path.getAt(0);
              break;
            case 'camera':
              // Deploy at high vantage point
              const ne = bounds.getNorthEast();
              position = ne;
              break;
            case 'medical':
              // Deploy at center
              position = bounds.getCenter();
              break;
            case 'drone':
              // Deploy at elevated position
              const ne2 = bounds.getNorthEast();
              position = new google.maps.LatLng(ne2.lat() + 0.0002, ne2.lng());
              break;
            default:
              // Random position within bounds
              const ne3 = bounds.getNorthEast();
              const sw3 = bounds.getSouthWest();
              position = new google.maps.LatLng(
                sw3.lat() + Math.random() * (ne3.lat() - sw3.lat()),
                sw3.lng() + Math.random() * (ne3.lng() - sw3.lng())
              );
          }
          
          // Deploy with animation
          setTimeout(() => {
            deployResource(event.data.resourceType, position);
          }, 100);
          
        } else if (perimeterPins.length > 0) {
          // Deploy near a random perimeter pin
          const randomPin = perimeterPins[Math.floor(Math.random() * perimeterPins.length)];
          const offset = 0.0005;
          const position = new google.maps.LatLng(
            randomPin.lat() + (Math.random() - 0.5) * offset,
            randomPin.lng() + (Math.random() - 0.5) * offset
          );
          
          setTimeout(() => {
            deployResource(event.data.resourceType, position);
          }, 100);
        }
      } else if (event.data.type === 'MANUAL_DEPLOY_MODE') {
        console.log('Manual deployment mode activated');
        dispatch(addNotification({
          type: 'info',
          title: 'Manual Deployment Mode',
          message: 'Click on the map to manually place resources. Use the footer buttons to select resource type.'
        }));
      } else if (event.data.type === 'CLEAR_DEPLOYED_RESOURCES') {
        console.log('Clearing all deployed resources from map');
        // Remove all deployed resource markers from map
        deployedResources.forEach(resource => {
          if (resource.marker) {
            resource.marker.setMap(null);
          }
        });
        // Clear the deployed resources array
        setDeployedResources([]);
        
        dispatch(addNotification({
          type: 'info',
          title: 'Resources Cleared',
          message: 'All deployed resources removed from map'
        }));
      } else if (event.data.type === 'AUTO_DEPLOY_IN_POLYGON') {
        console.log('Auto-deploy in polygon:', event.data);
        // Deploy resources inside the polygon bounds
        if (selectedArea && map) {
          // Get polygon bounds
          const bounds = new google.maps.LatLngBounds();
          const path = selectedArea.getPath();
          path.forEach((point: google.maps.LatLng) => {
            bounds.extend(point);
          });
          
          // Generate random position inside bounds
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          
          // Create positions distributed across the polygon
          const positions = [
            // Top-left quadrant
            { lat: ne.lat() - (ne.lat() - sw.lat()) * 0.25, lng: sw.lng() + (ne.lng() - sw.lng()) * 0.25 },
            // Top-right quadrant  
            { lat: ne.lat() - (ne.lat() - sw.lat()) * 0.25, lng: sw.lng() + (ne.lng() - sw.lng()) * 0.75 },
            // Center
            { lat: (ne.lat() + sw.lat()) / 2, lng: (ne.lng() + sw.lng()) / 2 },
            // Bottom-left quadrant
            { lat: ne.lat() - (ne.lat() - sw.lat()) * 0.75, lng: sw.lng() + (ne.lng() - sw.lng()) * 0.25 },
            // Bottom-right quadrant
            { lat: ne.lat() - (ne.lat() - sw.lat()) * 0.75, lng: sw.lng() + (ne.lng() - sw.lng()) * 0.75 }
          ];
          
          // Use deployment index to distribute resources
          const posIndex = event.data.deploymentIndex % positions.length;
          const position = positions[posIndex];
          
          // Add slight randomization
          const randomLat = position.lat + (Math.random() - 0.5) * 0.0005;
          const randomLng = position.lng + (Math.random() - 0.5) * 0.0005;
          
          const latLng = new google.maps.LatLng(randomLat, randomLng);
          
          // Check if point is inside polygon
          if (google.maps.geometry.poly.containsLocation(latLng, selectedArea)) {
            deployResource(event.data.resourceType, latLng);
          } else {
            // If not inside, use center of bounds
            const centerLat = (ne.lat() + sw.lat()) / 2;
            const centerLng = (ne.lng() + sw.lng()) / 2;
            const centerLatLng = new google.maps.LatLng(centerLat, centerLng);
            deployResource(event.data.resourceType, centerLatLng);
          }
        } else if (event.data.fallbackPosition) {
          // No polygon, use fallback position
          const latLng = new google.maps.LatLng(event.data.fallbackPosition.lat, event.data.fallbackPosition.lng);
          deployResource(event.data.resourceType, latLng);
        }
      } else if (event.data.type === 'REQUEST_POLYGON_BOUNDS') {
        // Send back polygon bounds if available
        if (selectedArea) {
          const bounds = new google.maps.LatLngBounds();
          const path = selectedArea.getPath();
          path.forEach((point: google.maps.LatLng) => {
            bounds.extend(point);
          });
          
          window.postMessage({
            type: 'POLYGON_BOUNDS_RESPONSE',
            hasBounds: true,
            bounds: {
              north: bounds.getNorthEast().lat(),
              south: bounds.getSouthWest().lat(),
              east: bounds.getNorthEast().lng(),
              west: bounds.getSouthWest().lng()
            }
          }, '*');
        } else {
          window.postMessage({
            type: 'POLYGON_BOUNDS_RESPONSE',
            hasBounds: false
          }, '*');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('completePerimeter', handleCompletePerimeter as EventListener);
    };
  }, [dispatch, map, perimeterPins.length, isAnalyzing]);

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Test - MapContainer is rendering */}
      <div className="absolute top-2 left-2 bg-green-500 text-white p-1 text-xs z-50">
        MAP RENDERING
      </div>


      {/* Google Maps Container */}
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }}>
        {/* Map will be rendered here */}
      </div>
      
      {/* Map Overlay UI */}
      <>
        {/* BIG COMPLETE BUTTON - Shows after 4 pins */}
        {showCompleteButton && !isAnalyzing && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <button
              onClick={() => {
                console.log('Complete button clicked!');
                setShowCompleteButton(false);
                setIsAnalyzing(true);
                
                // Dispatch the complete perimeter event
                window.dispatchEvent(new CustomEvent('completePerimeter', {
                  detail: { triggerCinematic: true }
                }));
                // Move to step 2
                dispatch(setSelectedStep(2));
                // Start analysis
                dispatch(setAnalysisStatus('analyzing'));
                
                // Show analyzing for 3 seconds
                let timeElapsed = 0;
                const analysisInterval = setInterval(() => {
                  timeElapsed += 1000;
                  console.log(`Analysis progress: ${timeElapsed/1000}s / 3s`);
                  
                  if (timeElapsed >= 3000) {
                    clearInterval(analysisInterval);
                    console.log('Analysis complete!');
                    dispatch(setAnalysisStatus('complete'));
                    setIsAnalyzing(false);
                    // Generate actual analysis results
                    generateAnalysisResults();
                    
                    // Show big notification about deployment options
                    dispatch(addNotification({
                      type: 'success',
                      title: '✅ AI Analysis Complete!',
                      message: 'Check the LEFT SIDEBAR for 3 deployment options!'
                    }));
                    
                    // Removed alert popup - user will see the notification instead
                  }
                }, 1000);
              }}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl font-bold rounded-lg shadow-2xl hover:scale-110 transition-all animate-pulse"
            >
              ✅ COMPLETE PERIMETER & BEGIN AI ANALYSIS
            </button>
          </div>
        )}
        
        {/* Analysis Progress Indicator */}
        {isAnalyzing && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 p-8 rounded-lg">
            <div className="text-white text-center">
              <div className="text-2xl font-bold mb-4">🤖 AI ANALYZING...</div>
              <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse"></div>
              </div>
              <div className="mt-4 text-sm">Analyzing threats and generating deployment plans...</div>
            </div>
          </div>
        )}
        
        {/* Area Info Panel */}
        {selectedArea && currentPlan?.area && (
            <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm rounded-xl p-4 text-white shadow-2xl border border-green-400/30">
              <h3 className="text-sm font-bold text-green-400 mb-2">
                <i className="fas fa-map-marked-alt mr-2"></i>Selected Area
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Area:</span>
                  <span className="font-medium">{currentPlan.area.toLocaleString()} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Capacity:</span>
                  <span className="font-medium">{currentPlan.capacity?.toLocaleString()} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resources:</span>
                  <span className="font-medium text-cyan-400">{deployedResources.length} deployed</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (selectedArea) {
                    selectedArea.setMap(null);
                    setSelectedArea(null);
                    setPerimeterPolygon(null);
                    dispatch(updatePlanArea(0));
                  }
                }}
                className="mt-3 w-full px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-xs text-red-400 transition-colors"
              >
                <i className="fas fa-trash mr-1"></i> Clear Area
              </button>
            </div>
          )}
          
          {/* Deployment Mode Indicator */}
          {deploymentMode && (
            <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 text-white shadow-2xl border border-yellow-400/30 animate-pulse">
              <h3 className="text-sm font-bold text-yellow-400 mb-1">
                <i className="fas fa-crosshairs mr-2"></i>Deployment Mode
              </h3>
              <p className="text-xs text-gray-300">
                Click on map to deploy <span className="font-medium text-yellow-400">{deploymentMode.toUpperCase()}</span>
              </p>
              <button
                onClick={() => setDeploymentMode(null)}
                className="mt-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          
          {/* Perimeter Mode Indicator */}
          {perimeterMode && (
            <div className="absolute top-4 right-4 bg-red-500/20 backdrop-blur-sm rounded-xl p-4 text-white shadow-2xl border border-red-400/30 animate-pulse">
              <h3 className="text-sm font-bold text-red-400 mb-1">
                <i className="fas fa-map-pin mr-2"></i>Perimeter Mode
              </h3>
              <p className="text-xs text-gray-300">
                Click 4 points to create perimeter ({perimeterPins.length}/4)
              </p>
              <button
                onClick={() => clearPerimeter()}
                className="mt-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          
          {/* Smart Tool Palette - Bottom of Map */}
          <div className="absolute bottom-4 left-4 right-4 smart-panel rounded-xl p-4 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Perimeter Tools */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 mr-2">Perimeter:</span>
                  <button 
                    className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all hover:scale-105 ${
                      perimeterMode ? 'bg-red-400 text-black animate-pulse' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      console.log('4-Pin Mode button clicked');
                      window.postMessage({ type: 'START_PERIMETER_MODE' }, '*');
                    }}
                    title="4-Pin Perimeter Mode - Click 4 points to create security perimeter"
                  >
                    <i className={`fas fa-map-pin ${perimeterMode ? 'text-white' : 'text-red-400'}`}></i>
                    <span>4-Pin Mode {perimeterMode ? '(Active)' : ''}</span>
                  </button>
                  <button 
                    className="px-2 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs flex items-center gap-1 transition-all hover:scale-105"
                    title="Clear Current Perimeter"
                    onClick={() => window.postMessage({ type: 'CLEAR_PERIMETER' }, '*')}
                  >
                    <i className="fas fa-eraser text-gray-400"></i>
                    <span>Clear</span>
                  </button>
                </div>
                
                <div className="h-8 w-px bg-gray-700"></div>
                
                {/* Tool Categories */}
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center group hover:scale-110 transition-transform">
                    <i className="fas fa-ruler-combined text-black"></i>
                  </button>
                  <button className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center group hover:scale-110 transition-transform">
                    <i className="fas fa-draw-polygon text-gray-400 group-hover:text-white"></i>
                  </button>
                  <button className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center group hover:scale-110 transition-transform">
                    <i className="fas fa-route text-gray-400 group-hover:text-white"></i>
                  </button>
                  <button className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center group hover:scale-110 transition-transform">
                    <i className="fas fa-layer-group text-gray-400 group-hover:text-white"></i>
                  </button>
                </div>
                
                <div className="h-8 w-px bg-gray-700"></div>
                
                {/* Resource Palette */}
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-400 mr-2">Deploy:</div>
                  <button 
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs flex items-center gap-1 transition-all hover:scale-105"
                    onClick={() => setDeploymentMode('guard')}
                  >
                    <i className="fas fa-user-shield text-green-400"></i>
                    <span>Guard</span>
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs flex items-center gap-1 transition-all hover:scale-105"
                    onClick={() => setDeploymentMode('camera')}
                  >
                    <i className="fas fa-video text-blue-400"></i>
                    <span>Camera</span>
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs flex items-center gap-1 transition-all hover:scale-105"
                    onClick={() => setDeploymentMode('sensor')}
                  >
                    <i className="fas fa-broadcast-tower text-purple-400"></i>
                    <span>Sensor</span>
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs flex items-center gap-1 transition-all hover:scale-105"
                    onClick={() => setDeploymentMode('k9')}
                  >
                    <i className="fas fa-dog text-yellow-400"></i>
                    <span>K9</span>
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs flex items-center gap-1 transition-all hover:scale-105"
                    onClick={() => setDeploymentMode('drone')}
                  >
                    <i className="fas fa-helicopter text-cyan-400"></i>
                    <span>Aerial</span>
                  </button>
                </div>
              </div>
              
              {/* View Controls */}
              <div className="flex items-center gap-2">
                <button className="text-xs text-gray-400 hover:text-white">
                  <i className="fas fa-layer-group mr-1"></i> Layers
                </button>
                <button className="text-xs text-gray-400 hover:text-white">
                  <i className="fas fa-th mr-1"></i> Grid
                </button>
                <button className="text-xs text-gray-400 hover:text-white">
                  <i className="fas fa-vr-cardboard mr-1"></i> 3D
                </button>
              </div>
            </div>
          </div>
        </>
      
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-green-400 font-medium">Loading Interactive Map...</p>
            <p className="text-gray-400 text-sm mt-2">Initializing Security Command Center</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;