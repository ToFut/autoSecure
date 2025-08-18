import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MapContextType {
  mapInstance: google.maps.Map | null;
  setMapInstance: (map: google.maps.Map | null) => void;
  perimeterPolygon: google.maps.Polygon | null;
  setPerimeterPolygon: (polygon: google.maps.Polygon | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [perimeterPolygon, setPerimeterPolygon] = useState<google.maps.Polygon | null>(null);

  return (
    <MapContext.Provider value={{
      mapInstance,
      setMapInstance,
      perimeterPolygon,
      setPerimeterPolygon
    }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};