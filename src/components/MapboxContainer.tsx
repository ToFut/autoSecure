import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { RootState } from '../store/index';
import { addPerimeterPin, setAnalysisStatus, setAnalysisProgress, setAnalysisMessage, updatePlanArea } from '../store/slices/securitySlice';
import { addNotification } from '../store/slices/uiSlice';
import { SecurityPin } from '../store/slices/securitySlice';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYXV0b3NlY3VyZSIsImEiOiJjbTRqamRyeWowMzYyMmtzNjJqcGdvamRpIn0.cF5R5TcbKXLg7JFrbokfHA';

const MapboxContainer: React.FC = () => {
  const dispatch = useDispatch();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [is3D, setIs3D] = useState(false);
  const [perimeterCoordinates, setPerimeterCoordinates] = useState<[number, number][]>([]);

  const { currentPlan, analysisProgress, analysisMessage } = useSelector((state: RootState) => state.security);

  // Initialize Mapbox
  useEffect(() => {
    if (!mapRef.current || map) return;

    const mapInstance = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [34.7818, 32.0853], // Tel Aviv
      zoom: 16,
      pitch: 0,
      bearing: 0,
      antialias: true
    });

    mapInstance.on('load', () => {
      // Add 3D buildings
      mapInstance.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });

      mapInstance.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Add 3D building layer
      mapInstance.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });

      // Add empty perimeter source
      mapInstance.addSource('perimeter', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[]]
          }
        }
      });

      // Add perimeter fill layer
      mapInstance.addLayer({
        id: 'perimeter-fill',
        type: 'fill',
        source: 'perimeter',
        paint: {
          'fill-color': '#00ff88',
          'fill-opacity': 0.2
        }
      });

      // Add perimeter outline layer
      mapInstance.addLayer({
        id: 'perimeter-outline',
        type: 'line',
        source: 'perimeter',
        paint: {
          'line-color': '#00ff88',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      dispatch(addNotification({
        type: 'info',
        title: 'Security Planning Mode',
        message: 'Click on the map to define your security perimeter (minimum 4 points)'
      }));
    });

    // Add click handler
    mapInstance.on('click', (e) => {
      if (currentPlan && currentPlan.perimeter.length < 8) {
        addPin(e.lngLat.lng, e.lngLat.lat);
      }
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [dispatch]);

  // Add pin to map
  const addPin = useCallback((lng: number, lat: number) => {
    if (!map || !currentPlan) return;

    const pinId = `pin-${Date.now()}`;
    const pinIndex = currentPlan.perimeter.length + 1;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#00ff88';
    el.style.border = '3px solid white';
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontWeight = 'bold';
    el.style.color = 'black';
    el.innerHTML = pinIndex.toString();

    // Create marker
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map);

    // Handle drag
    marker.on('dragend', () => {
      updatePerimeter();
    });

    // Add to state
    const securityPin: SecurityPin = {
      id: pinId,
      lat: lat,
      lng: lng,
      type: 'perimeter',
      label: `Pin ${pinIndex}`
    };

    dispatch(addPerimeterPin(securityPin));
    setMarkers(prev => [...prev, marker]);

    // Update coordinates
    const newCoords: [number, number][] = [...perimeterCoordinates, [lng, lat] as [number, number]];
    setPerimeterCoordinates(newCoords);
    
    // Update perimeter
    updatePerimeter(newCoords);

    // Auto-focus when 4 points
    if (newCoords.length === 4) {
      setTimeout(() => focusOnPerimeter(newCoords), 500);
    }
  }, [map, currentPlan, perimeterCoordinates, dispatch]);

  // Update perimeter polygon
  const updatePerimeter = useCallback((coords?: [number, number][]) => {
    if (!map) return;

    const coordinates = coords || markers.map(m => {
      const lngLat = m.getLngLat();
      return [lngLat.lng, lngLat.lat] as [number, number];
    });

    if (coordinates.length >= 3) {
      // Close the polygon
      const closedCoords = [...coordinates, coordinates[0]];

      // Update the source
      const source = map.getSource('perimeter') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [closedCoords]
          }
        });
      }

      // Calculate area (simplified)
      const area = calculatePolygonArea(coordinates);
      dispatch(updatePlanArea(area));
    }
  }, [map, markers, dispatch]);

  // Calculate polygon area
  const calculatePolygonArea = (coords: [number, number][]): number => {
    if (coords.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
    }
    
    // Convert to square meters (approximation)
    return Math.abs(area / 2) * 111000 * 111000;
  };

  // Focus on perimeter with 3D view
  const focusOnPerimeter = useCallback((coords: [number, number][]) => {
    if (!map || coords.length < 3) return;

    // Calculate bounds
    const bounds = new mapboxgl.LngLatBounds();
    coords.forEach(coord => bounds.extend(coord as [number, number]));

    // Fit to bounds
    map.fitBounds(bounds, {
      padding: 100,
      duration: 1500
    });

    // Enable 3D view
    setTimeout(() => {
      map.easeTo({
        pitch: 60,
        bearing: -20,
        duration: 2000
      });
      setIs3D(true);

      // Start AI analysis
      startAIAnalysis();
    }, 1500);
  }, [map]);

  // Start AI analysis
  const startAIAnalysis = useCallback(() => {
    dispatch(setAnalysisStatus('analyzing'));
    dispatch(addNotification({
      type: 'info',
      title: 'AI Analysis Started',
      message: 'Analyzing location for security threats...'
    }));

    const steps = [
      'Analyzing satellite imagery...',
      'Processing street view data...',
      'Mapping topology...',
      'Detecting infrastructure...',
      'Assessing risks...',
      'Reviewing historical data...',
      'Analyzing weather patterns...',
      'Calculating traffic flow...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        dispatch(setAnalysisStatus('complete'));
        dispatch(addNotification({
          type: 'success',
          title: 'Analysis Complete',
          message: 'Security plan generated. Review recommendations in the threat assessment panel.'
        }));
        
        // Add risk zones
        addRiskZones();
      } else {
        dispatch(setAnalysisMessage(steps[currentStep]));
        dispatch(setAnalysisProgress((currentStep / steps.length) * 100));
        currentStep++;
      }
    }, 1000);
  }, [dispatch]);

  // Add risk zones visualization
  const addRiskZones = useCallback(() => {
    if (!map || perimeterCoordinates.length < 3) return;

    // Calculate center
    const centerLng = perimeterCoordinates.reduce((sum, coord) => sum + coord[0], 0) / perimeterCoordinates.length;
    const centerLat = perimeterCoordinates.reduce((sum, coord) => sum + coord[1], 0) / perimeterCoordinates.length;

    // Add risk zone sources
    const riskZones = [
      { id: 'high-risk', center: [centerLng + 0.001, centerLat], color: '#ff0000', radius: 50 },
      { id: 'medium-risk', center: [centerLng - 0.001, centerLat + 0.001], color: '#ff9500', radius: 40 },
      { id: 'low-risk', center: [centerLng, centerLat - 0.001], color: '#ffcc00', radius: 30 }
    ];

    riskZones.forEach(zone => {
      // Add source
      map.addSource(zone.id, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: zone.center
          }
        }
      });

      // Add circle layer
      map.addLayer({
        id: `${zone.id}-circle`,
        type: 'circle',
        source: zone.id,
        paint: {
          'circle-radius': zone.radius,
          'circle-color': zone.color,
          'circle-opacity': 0.3,
          'circle-blur': 0.5
        }
      });
    });

    // Deploy security resources
    setTimeout(() => deploySecurityResources(), 2000);
  }, [map, perimeterCoordinates]);

  // Deploy security resources
  const deploySecurityResources = useCallback(() => {
    if (!map || perimeterCoordinates.length < 3) return;

    // Add guard positions
    const guardsNeeded = Math.max(4, perimeterCoordinates.length);
    
    perimeterCoordinates.forEach((coord, index) => {
      // Create guard marker
      const el = document.createElement('div');
      el.className = 'guard-marker';
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#0080ff';
      el.style.border = '2px solid white';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontWeight = 'bold';
      el.innerHTML = 'G';

      new mapboxgl.Marker({ element: el })
        .setLngLat(coord)
        .addTo(map);
    });

    dispatch(addNotification({
      type: 'success',
      title: 'Deployment Complete',
      message: `${guardsNeeded} security positions established`
    }));
  }, [map, perimeterCoordinates, dispatch]);

  // Toggle 3D view
  const toggle3DView = useCallback(() => {
    if (!map) return;

    if (is3D) {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
      setIs3D(false);
    } else {
      map.easeTo({
        pitch: 60,
        bearing: -20,
        duration: 1000
      });
      setIs3D(true);
    }
  }, [map, is3D]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* 3D View Toggle */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle3DView}
        className="absolute top-4 left-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors z-10"
      >
        <i className={`fas fa-${is3D ? 'map' : 'cube'} mr-2`}></i>
        {is3D ? '2D View' : '3D View'}
      </motion.button>

      {/* Perimeter Status */}
      {currentPlan && currentPlan.perimeter.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg border border-slate-700 z-10"
        >
          <div className="text-sm">
            <span className="text-slate-400">Perimeter Points:</span>
            <span className="ml-2 font-bold text-green-400">{currentPlan.perimeter.length}</span>
            {currentPlan.perimeter.length < 4 && (
              <span className="ml-2 text-yellow-400">(Need {4 - currentPlan.perimeter.length} more)</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Analysis Progress */}
      {currentPlan && analysisProgress > 0 && analysisProgress < 100 && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-20 right-4 bg-slate-900 text-white p-4 rounded-lg shadow-lg border border-slate-700 z-10 min-w-[300px]"
        >
          <div className="text-sm font-semibold mb-2">AI Analysis</div>
          <div className="text-xs text-slate-400 mb-2">{analysisMessage}</div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MapboxContainer;