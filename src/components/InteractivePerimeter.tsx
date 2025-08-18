import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { addPerimeterPin, updatePlanArea } from '../store/slices/securitySlice';
import { addNotification } from '../store/slices/uiSlice';
import { SecurityPin } from '../store/slices/securitySlice';

interface InteractivePerimeterProps {
  mapInstance: google.maps.Map;
  onPerimeterComplete: () => void;
}

const InteractivePerimeter: React.FC<InteractivePerimeterProps> = ({ mapInstance, onPerimeterComplete }) => {
  const dispatch = useDispatch();
  const [isDrawing, setIsDrawing] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [currentPinNumber, setCurrentPinNumber] = useState(1);

  const addPin = useCallback((position: google.maps.LatLng) => {
    if (markers.length >= 8) return;

    const marker = new google.maps.Marker({
      position,
      map: mapInstance,
      label: {
        text: currentPinNumber.toString(),
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 'bold'
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#00ff88',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      draggable: true,
      title: `Pin ${currentPinNumber}`
    });

    // Add right-click listener to remove pin
    marker.addListener('rightclick', () => {
      removePin(marker);
    });

    // Add drag listener to update polygon
    marker.addListener('dragend', () => {
      updatePerimeter();
    });

    setMarkers(prev => [...prev, marker]);
    setCurrentPinNumber(prev => prev + 1);

    // Add to Redux store
    const securityPin: SecurityPin = {
      id: `pin-${Date.now()}`,
      lat: position.lat(),
      lng: position.lng(),
      type: 'perimeter'
    };
    dispatch(addPerimeterPin(securityPin));

    // Update perimeter
    updatePerimeter();

    // Show notification
    dispatch(addNotification({
      type: 'info',
      title: 'Pin Added',
      message: `Security pin ${currentPinNumber} placed`
    }));

    // Auto-complete if we have enough pins
    if (markers.length + 1 >= 4) {
      setTimeout(() => {
        completePerimeter();
      }, 500);
    }
  }, [markers.length, currentPinNumber, mapInstance, dispatch]);

  const removePin = (marker: google.maps.Marker) => {
    marker.setMap(null);
    setMarkers(prev => prev.filter(m => m !== marker));
    updatePerimeter();
  };

  const updatePerimeter = () => {
    if (polygon) {
      polygon.setMap(null);
    }

    if (markers.length >= 3) {
      const paths = markers.map(marker => marker.getPosition()!);
      const newPolygon = new google.maps.Polygon({
        paths,
        strokeColor: '#00ff88',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#00ff88',
        fillOpacity: 0.1,
        map: mapInstance
      });

      setPolygon(newPolygon);

      // Calculate area
      const area = google.maps.geometry.spherical.computeArea(paths);
      dispatch(updatePlanArea(area));
    }
  };

  const clearAllPins = () => {
    markers.forEach(marker => marker.setMap(null));
    if (polygon) {
      polygon.setMap(null);
    }
    setMarkers([]);
    setPolygon(null);
    setCurrentPinNumber(1);
  };

  const completePerimeter = () => {
    setIsDrawing(false);
    onPerimeterComplete();
    
    dispatch(addNotification({
      type: 'success',
      title: 'Perimeter Complete',
      message: 'Security perimeter defined successfully'
    }));
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!isDrawing || !event.latLng) return;
    addPin(event.latLng);
  };

  useEffect(() => {
    if (mapInstance) {
      mapInstance.addListener('click', handleMapClick);
    }

    return () => {
      if (mapInstance) {
        google.maps.event.clearListeners(mapInstance, 'click');
      }
    };
  }, [mapInstance, isDrawing, addPin]);

  return (
    <div className="absolute top-4 left-4 z-30">
      <div className="bg-dark-800/95 backdrop-blur-md rounded-lg border border-white/10 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          <i className="fas fa-map-pin mr-2 text-primary-500"></i>
          Perimeter Definition
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
              isDrawing
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-black'
            }`}
          >
            {isDrawing ? 'Stop Drawing' : 'Start Drawing'}
          </button>

          <div className="text-sm text-white/60">
            Pins placed: {markers.length}/8
          </div>

          {markers.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={clearAllPins}
                className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Clear All Pins
              </button>

              {markers.length >= 4 && (
                <button
                  onClick={completePerimeter}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Complete Perimeter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractivePerimeter;
