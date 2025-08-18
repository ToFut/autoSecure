import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Loader } from '@googlemaps/js-api-loader';
import { RootState } from '../store/index';
import { setMap } from '../store/slices/mapSlice';
import { 
  setAnalysisStatus, 
  setAnalysisProgress, 
  setAnalysisMessage, 
  addRiskAssessment, 
  addSecurityResource, 
  setPlanStatus,
  addPerimeterPin,
  updatePlanArea,
  clearPerimeter
} from '../store/slices/securitySlice';
import { addNotification, setSelectedStep } from '../store/slices/uiSlice';
import { SecurityPin, RiskAssessment, SecurityResource } from '../store/slices/securitySlice';
import SmartDeployment from './SmartDeployment';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBIwzALxUPNbatRBj3Xi1Uhp0fFzwWNBkE';

interface Marker {
  marker: google.maps.Marker;
  id: string;
  type: string;
}

const EnhancedMapContainer = React.forwardRef<{
  startDrawingPerimeter: () => void;
  clearMap: () => void;
  startCrowdSimulation: () => void;
  generateHeatMap: () => void;
  placeResource: (latLng: google.maps.LatLng) => void;
}, {}>((props, ref) => {
  const dispatch = useDispatch();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<google.maps.Polygon | null>(null);
  const [perimeterMarkers, setPerimeterMarkers] = useState<Marker[]>([]);
  const [resourceMarkers, setResourceMarkers] = useState<Marker[]>([]);
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [crowdSimulation, setCrowdSimulation] = useState<google.maps.Marker[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const { currentPlan, analysisStatus } = useSelector((state: RootState) => state.security);
  const { mode, selectedStep } = useSelector((state: RootState) => state.ui);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || isMapLoaded) return;

    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['geometry', 'drawing', 'places', 'visualization'],
        });

        await loader.load();

        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7580, lng: -73.9855 }, // Times Square, NYC
          zoom: 17,
          mapTypeId: 'satellite',
          tilt: 45,
          heading: 0,
          styles: [
            {
              featureType: "all",
              elementType: "labels",
              stylers: [{ visibility: "on" }]
            },
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            mapTypeIds: ['satellite', 'hybrid', 'terrain', 'roadmap']
          },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
          },
          gestureHandling: 'greedy'
        });

        // Initialize Drawing Manager
        const drawingMgr = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          polygonOptions: {
            fillColor: '#00ff88',
            fillOpacity: 0.2,
            strokeWeight: 3,
            strokeColor: '#00ff88',
            clickable: true,
            editable: true,
            draggable: false
          },
          circleOptions: {
            fillColor: '#ff0000',
            fillOpacity: 0.1,
            strokeWeight: 2,
            strokeColor: '#ff0000',
            clickable: true,
            editable: true
          }
        });

        drawingMgr.setMap(map);
        setDrawingManager(drawingMgr);

        // Add custom controls
        addCustomControls(map);

        // Set up event listeners
        setupMapListeners(map, drawingMgr);

        setMapInstance(map);
        setIsMapLoaded(true);
        dispatch(setMap(map));

        dispatch(addNotification({
          type: 'success',
          title: 'System Ready',
          message: 'Advanced security planning system initialized'
        }));

      } catch (error) {
        console.error('Error loading Google Maps:', error);
        dispatch(addNotification({
          type: 'error',
          title: 'Initialization Error',
          message: 'Failed to load mapping system'
        }));
      }
    };

    initializeMap();
  }, [dispatch, isMapLoaded]);

  // Add custom map controls
  const addCustomControls = (map: google.maps.Map) => {
    // Perimeter Drawing Control
    const perimeterControl = document.createElement('div');
    perimeterControl.className = 'custom-map-control';
    perimeterControl.innerHTML = `
      <button id="draw-perimeter" class="map-control-btn">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M3 3h18v18H3z" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="3" cy="3" r="2" fill="currentColor"/>
          <circle cx="21" cy="3" r="2" fill="currentColor"/>
          <circle cx="21" cy="21" r="2" fill="currentColor"/>
          <circle cx="3" cy="21" r="2" fill="currentColor"/>
        </svg>
        Draw Perimeter
      </button>
    `;
    
    // Clear Control
    const clearControl = document.createElement('div');
    clearControl.className = 'custom-map-control';
    clearControl.innerHTML = `
      <button id="clear-map" class="map-control-btn danger">
        Clear All
      </button>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .custom-map-control {
        margin: 10px;
      }
      .map-control-btn {
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #00ff88;
        color: #00ff88;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
      }
      .map-control-btn:hover {
        background: #00ff88;
        color: black;
        transform: scale(1.05);
      }
      .map-control-btn.danger {
        border-color: #ff4444;
        color: #ff4444;
      }
      .map-control-btn.danger:hover {
        background: #ff4444;
        color: white;
      }
    `;
    document.head.appendChild(style);

    map.controls[google.maps.ControlPosition.TOP_CENTER].push(perimeterControl);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(clearControl);

    // Add event listeners
    document.getElementById('draw-perimeter')?.addEventListener('click', () => startDrawingPerimeter());
    document.getElementById('clear-map')?.addEventListener('click', () => clearMap());
  };

  // Set up map event listeners
  const setupMapListeners = (map: google.maps.Map, drawingMgr: google.maps.drawing.DrawingManager) => {
    // Polygon complete event
    google.maps.event.addListener(drawingMgr, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      handlePolygonComplete(polygon);
    });

    // Circle complete event (for threat zones)
    google.maps.event.addListener(drawingMgr, 'circlecomplete', (circle: google.maps.Circle) => {
      handleCircleComplete(circle);
    });

    // Map click event for placing resources
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (mode === 'operations' && event.latLng) {
        placeResource(event.latLng);
      }
    });

    // Right-click context menu
    map.addListener('rightclick', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        showContextMenu(event.latLng);
      }
    });
  };

  // Start drawing perimeter
  const startDrawingPerimeter = () => {
    if (!drawingManager) return;
    
    // Clear existing perimeter
    if (currentPolygon) {
      currentPolygon.setMap(null);
    }
    
    drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    
    dispatch(addNotification({
      type: 'info',
      title: 'Drawing Mode',
      message: 'Click on the map to define security perimeter'
    }));
  };

  // Handle polygon completion
  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    if (!mapInstance || !drawingManager) return;

    setCurrentPolygon(polygon);
    drawingManager.setDrawingMode(null);

    const path = polygon.getPath();
    const coordinates: SecurityPin[] = [];

    // Extract coordinates
    for (let i = 0; i < path.getLength(); i++) {
      const latLng = path.getAt(i);
      const pin: SecurityPin = {
        id: `pin-${Date.now()}-${i}`,
        lat: latLng.lat(),
        lng: latLng.lng(),
        type: 'perimeter',
        label: `Point ${i + 1}`
      };
      coordinates.push(pin);
      
      // Add marker at each vertex
      const marker = new google.maps.Marker({
        position: latLng,
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#00ff88',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        draggable: true,
        title: pin.label
      });

      // Update polygon when marker is dragged
      marker.addListener('dragend', () => {
        const newPos = marker.getPosition();
        if (newPos) {
          path.setAt(i, newPos);
          updatePerimeterAnalysis();
        }
      });

      setPerimeterMarkers(prev => [...prev, { marker, id: pin.id, type: 'perimeter' }]);
      dispatch(addPerimeterPin(pin));
    }

    // Calculate area
    const area = google.maps.geometry.spherical.computeArea(path);
    dispatch(updatePlanArea(Math.round(area)));

    // Start analysis
    performThreatAnalysis(polygon);

    dispatch(addNotification({
      type: 'success',
      title: 'Perimeter Defined',
      message: `Area: ${Math.round(area).toLocaleString()} m² • ${coordinates.length} points`
    }));
  };

  // Handle circle completion (threat zones)
  const handleCircleComplete = (circle: google.maps.Circle) => {
    const center = circle.getCenter();
    if (!center) return;

    const threat: RiskAssessment = {
      id: `threat-${Date.now()}`,
      level: 'high',
      category: 'custom',
      title: 'User-Defined Threat Zone',
      description: `High-risk area with ${Math.round(circle.getRadius())}m radius`,
      location: { lat: center.lat(), lng: center.lng() },
      recommendations: ['Increase surveillance', 'Deploy additional guards', 'Set up checkpoint']
    };

    dispatch(addRiskAssessment(threat));
  };

  // Perform AI threat analysis
  const performThreatAnalysis = async (polygon: google.maps.Polygon) => {
    dispatch(setAnalysisStatus('analyzing'));
    dispatch(setSelectedStep(2));

    const path = polygon.getPath();
    const bounds = new google.maps.LatLngBounds();
    
    for (let i = 0; i < path.getLength(); i++) {
      bounds.extend(path.getAt(i));
    }

    // Simulate AI analysis with realistic steps
    const analysisSteps = [
      { message: 'Scanning satellite imagery...', progress: 10, delay: 800 },
      { message: 'Identifying access points...', progress: 20, delay: 1000 },
      { message: 'Analyzing crowd flow patterns...', progress: 35, delay: 1200 },
      { message: 'Detecting structural vulnerabilities...', progress: 50, delay: 1000 },
      { message: 'Calculating optimal guard positions...', progress: 65, delay: 1500 },
      { message: 'Assessing line-of-sight coverage...', progress: 80, delay: 1000 },
      { message: 'Generating threat matrix...', progress: 95, delay: 800 },
      { message: 'Finalizing security plan...', progress: 100, delay: 500 }
    ];

    for (const step of analysisSteps) {
      dispatch(setAnalysisMessage(step.message));
      dispatch(setAnalysisProgress(step.progress));
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    // Generate realistic threats based on area
    generateThreats(bounds);
    
    // Deploy initial resources
    deployOptimalResources(polygon);

    dispatch(setAnalysisStatus('complete'));
    dispatch(setPlanStatus('complete'));
    
    dispatch(addNotification({
      type: 'success',
      title: 'Analysis Complete',
      message: 'Security vulnerabilities identified and resources deployed'
    }));
  };

  // Generate realistic threat assessments
  const generateThreats = (bounds: google.maps.LatLngBounds) => {
    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const threats: RiskAssessment[] = [
      {
        id: 'threat-vehicle',
        level: 'high',
        category: 'vehicle',
        title: 'Vehicle Ram Attack Vector',
        description: 'Unprotected road access on north perimeter',
        location: { lat: ne.lat() - 0.0001, lng: center.lng() },
        recommendations: ['Deploy concrete barriers', 'Install bollards', 'Position security checkpoint']
      },
      {
        id: 'threat-crowd',
        level: 'medium',
        category: 'crowd',
        title: 'Crowd Bottleneck',
        description: 'Potential crushing hazard at main entrance',
        location: { lat: center.lat(), lng: sw.lng() + 0.0001 },
        recommendations: ['Widen entrance area', 'Add flow control barriers', 'Station crowd control team']
      },
      {
        id: 'threat-elevation',
        level: 'high',
        category: 'sniper',
        title: 'Elevated Threat Position',
        description: 'Adjacent building provides vantage point',
        location: { lat: ne.lat(), lng: ne.lng() },
        recommendations: ['Deploy counter-sniper team', 'Secure rooftop access', 'Install screening']
      },
      {
        id: 'threat-infiltration',
        level: 'medium',
        category: 'perimeter',
        title: 'Weak Perimeter Section',
        description: 'Inadequate lighting and surveillance coverage',
        location: { lat: sw.lat() + 0.0002, lng: sw.lng() + 0.0002 },
        recommendations: ['Install motion sensors', 'Add lighting', 'Increase patrol frequency']
      }
    ];

    threats.forEach(threat => {
      dispatch(addRiskAssessment(threat));
      
      // Place threat marker on map
      if (mapInstance) {
        const marker = new google.maps.Marker({
          position: threat.location,
          map: mapInstance,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0 L30 30 L0 30 Z" fill="${threat.level === 'high' ? '#ff0000' : '#ffaa00'}" opacity="0.8"/>
                <text x="15" y="22" font-size="16" fill="white" text-anchor="middle">!</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(30, 30),
            anchor: new google.maps.Point(15, 30)
          },
          title: threat.title,
          animation: google.maps.Animation.BOUNCE
        });

        // Stop bouncing after 3 seconds
        setTimeout(() => marker.setAnimation(null), 3000);

        // Add click listener for threat details
        marker.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="color: black; padding: 10px;">
                <h3 style="margin: 0 0 10px 0; color: ${threat.level === 'high' ? 'red' : 'orange'};">
                  ${threat.title}
                </h3>
                <p style="margin: 5px 0;">${threat.description}</p>
                <h4 style="margin: 10px 0 5px 0;">Recommendations:</h4>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${threat.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
              </div>
            `
          });
          infoWindow.open(mapInstance, marker);
        });
      }
    });
  };

  // Deploy optimal resources
  const deployOptimalResources = (polygon: google.maps.Polygon) => {
    if (!mapInstance) return;

    const path = polygon.getPath();
    const area = google.maps.geometry.spherical.computeArea(path);
    
    // Calculate resource requirements
    const resources = {
      guards: Math.max(8, Math.ceil(area / 3000)),
      cameras: Math.max(6, Math.ceil(path.getLength() * 2)),
      barriers: path.getLength() * 4,
      medical: Math.max(2, Math.floor(area / 10000)),
      k9: Math.max(2, Math.floor(area / 8000)),
      drones: area > 15000 ? 2 : 1
    };

    // Deploy guards at strategic points
    for (let i = 0; i < resources.guards && i < path.getLength(); i++) {
      const position = path.getAt(i);
      placeSecurityAsset('guard', position);
    }

    // Deploy cameras with overlapping coverage
    const bounds = new google.maps.LatLngBounds();
    for (let i = 0; i < path.getLength(); i++) {
      bounds.extend(path.getAt(i));
    }
    const center = bounds.getCenter();
    
    for (let i = 0; i < resources.cameras; i++) {
      const angle = (360 / resources.cameras) * i;
      const distance = 0.0003;
      const lat = center.lat() + distance * Math.cos(angle * Math.PI / 180);
      const lng = center.lng() + distance * Math.sin(angle * Math.PI / 180);
      placeSecurityAsset('camera', new google.maps.LatLng(lat, lng));
    }

    // Update Redux with resources
    dispatch(addSecurityResource({
      id: 'guards-deployment',
      type: 'guard',
      count: resources.guards,
      deployed: resources.guards,
      status: 'deployed'
    }));

    dispatch(addSecurityResource({
      id: 'cameras-deployment',
      type: 'camera',
      count: resources.cameras,
      deployed: resources.cameras,
      status: 'deployed'
    }));
  };

  // Place security asset on map
  const placeSecurityAsset = (type: string, position: google.maps.LatLng) => {
    if (!mapInstance) return;

    const icons: { [key: string]: any } = {
      guard: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#4ade80" opacity="0.9"/>
            <path d="M15 8 C12 8 10 10 10 13 L10 18 L20 18 L20 13 C20 10 18 8 15 8 Z" fill="white"/>
            <circle cx="15" cy="13" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30)
      },
      camera: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="10" width="14" height="10" fill="#00d4ff" opacity="0.9" rx="2"/>
            <circle cx="18" cy="15" r="3" fill="white"/>
            <rect x="5" y="14" width="3" height="2" fill="#00d4ff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30)
      }
    };

    const marker = new google.maps.Marker({
      position,
      map: mapInstance,
      icon: icons[type] || icons.guard,
      draggable: true,
      animation: google.maps.Animation.DROP,
      title: type.charAt(0).toUpperCase() + type.slice(1)
    });

    // Add coverage visualization
    if (type === 'camera') {
      const coverage = new google.maps.Circle({
        center: position,
        radius: 50,
        fillColor: '#00d4ff',
        fillOpacity: 0.1,
        strokeColor: '#00d4ff',
        strokeWeight: 1,
        map: mapInstance
      });

      marker.addListener('drag', () => {
        const pos = marker.getPosition();
        if (pos) coverage.setCenter(pos);
      });
    }

    setResourceMarkers(prev => [...prev, { 
      marker, 
      id: `${type}-${Date.now()}`, 
      type 
    }]);
  };

  // Place resource at click location
  const placeResource = (latLng: google.maps.LatLng) => {
    // This would be connected to the resource palette selection
    placeSecurityAsset('guard', latLng);
  };

  // Show context menu
  const showContextMenu = (latLng: google.maps.LatLng) => {
    if (!mapInstance) return;

    const contextMenu = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px;">
          <button onclick="alert('Place Guard')">Place Guard</button>
          <button onclick="alert('Place Camera')">Place Camera</button>
          <button onclick="alert('Mark Threat')">Mark Threat</button>
        </div>
      `,
      position: latLng
    });

    contextMenu.open(mapInstance);
    setTimeout(() => contextMenu.close(), 5000);
  };

  // Update perimeter analysis
  const updatePerimeterAnalysis = () => {
    if (!currentPolygon) return;
    
    const path = currentPolygon.getPath();
    const area = google.maps.geometry.spherical.computeArea(path);
    dispatch(updatePlanArea(Math.round(area)));
  };

  // Clear everything from map
  const clearMap = () => {
    // Clear polygon
    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
    }

    // Clear markers
    perimeterMarkers.forEach(({ marker }) => marker.setMap(null));
    resourceMarkers.forEach(({ marker }) => marker.setMap(null));
    setPerimeterMarkers([]);
    setResourceMarkers([]);

    // Clear heatmap
    if (heatmap) {
      heatmap.setMap(null);
      setHeatmap(null);
    }

    // Clear crowd simulation
    crowdSimulation.forEach(marker => marker.setMap(null));
    setCrowdSimulation([]);

    // Clear Redux state
    dispatch(clearPerimeter());
    
    dispatch(addNotification({
      type: 'info',
      title: 'Map Cleared',
      message: 'All elements removed from map'
    }));
  };

  // Start crowd simulation
  const startCrowdSimulation = useCallback(() => {
    if (!mapInstance || !currentPolygon || isSimulating) return;

    setIsSimulating(true);
    const path = currentPolygon.getPath();
    const bounds = new google.maps.LatLngBounds();
    
    for (let i = 0; i < path.getLength(); i++) {
      bounds.extend(path.getAt(i));
    }

    const center = bounds.getCenter();
    const crowdMarkers: google.maps.Marker[] = [];

    // Create crowd agents
    for (let i = 0; i < 50; i++) {
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(
          center.lat() + (Math.random() - 0.5) * 0.002,
          center.lng() + (Math.random() - 0.5) * 0.002
        ),
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3,
          fillColor: '#ffff00',
          fillOpacity: 0.8,
          strokeWeight: 0
        }
      });
      crowdMarkers.push(marker);
    }

    setCrowdSimulation(crowdMarkers);

    // Animate crowd movement
    const animateInterval = setInterval(() => {
      crowdMarkers.forEach(marker => {
        const pos = marker.getPosition();
        if (pos) {
          marker.setPosition(new google.maps.LatLng(
            pos.lat() + (Math.random() - 0.5) * 0.0001,
            pos.lng() + (Math.random() - 0.5) * 0.0001
          ));
        }
      });
    }, 500);

    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(animateInterval);
      setIsSimulating(false);
    }, 30000);

    dispatch(addNotification({
      type: 'info',
      title: 'Crowd Simulation Active',
      message: 'Analyzing crowd flow patterns for 30 seconds'
    }));
  }, [mapInstance, currentPolygon, isSimulating, dispatch]);

  // Generate heat map
  const generateHeatMap = useCallback(() => {
    if (!mapInstance || !currentPolygon) return;

    const path = currentPolygon.getPath();
    const heatmapData: google.maps.LatLng[] = [];

    // Generate heat points based on threat areas
    for (let i = 0; i < 100; i++) {
      const vertex = path.getAt(Math.floor(Math.random() * path.getLength()));
      heatmapData.push(new google.maps.LatLng(
        vertex.lat() + (Math.random() - 0.5) * 0.001,
        vertex.lng() + (Math.random() - 0.5) * 0.001
      ));
    }

    const newHeatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      radius: 30,
      opacity: 0.6,
      gradient: [
        'rgba(0, 255, 0, 0)',
        'rgba(255, 255, 0, 0.5)',
        'rgba(255, 128, 0, 0.7)',
        'rgba(255, 0, 0, 1)'
      ]
    });

    if (heatmap) {
      heatmap.setMap(null);
    }

    newHeatmap.setMap(mapInstance);
    setHeatmap(newHeatmap);

    dispatch(addNotification({
      type: 'success',
      title: 'Heat Map Generated',
      message: 'Risk density visualization active'
    }));
  }, [mapInstance, currentPolygon, heatmap, dispatch]);

  // Public methods exposed via ref
  React.useImperativeHandle(ref, () => ({
    startDrawingPerimeter,
    clearMap,
    startCrowdSimulation,
    generateHeatMap,
    placeResource
  }));

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Smart Deployment System */}
      <SmartDeployment mapInstance={mapInstance} />

      {/* Loading State */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-dark-900/95 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
            <p className="text-white/80">Initializing Security System...</p>
          </div>
        </div>
      )}

      {/* Simulation Status */}
      {isSimulating && (
        <div className="absolute top-20 right-4 bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 text-sm font-medium">Crowd Simulation Active</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default EnhancedMapContainer;