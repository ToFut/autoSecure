import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MapView {
  center: { lat: number; lng: number };
  zoom: number;
  tilt: number;
  mapType: 'satellite' | 'hybrid' | 'terrain' | 'roadmap';
}

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  type: 'perimeter' | 'guard' | 'camera' | 'risk' | 'resource';
  icon?: string;
  label?: string;
  draggable?: boolean;
  visible: boolean;
}

export interface MapPolygon {
  id: string;
  paths: { lat: number; lng: number }[];
  fillColor: string;
  strokeColor: string;
  fillOpacity: number;
  strokeWeight: number;
  visible: boolean;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

interface MapState {
  map: google.maps.Map | null;
  view: MapView;
  markers: MapMarker[];
  polygons: MapPolygon[];
  heatmapPoints: HeatmapPoint[];
  drawingMode: boolean;
  selectedMarker: string | null;
  showHeatmap: boolean;
  show3D: boolean;
}

const initialState: MapState = {
  map: null,
  view: {
    center: { lat: 40.7580, lng: -73.9855 }, // Times Square, NYC
    zoom: 17,
    tilt: 0,
    mapType: 'satellite',
  },
  markers: [],
  polygons: [],
  heatmapPoints: [],
  drawingMode: false,
  selectedMarker: null,
  showHeatmap: false,
  show3D: false,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMap: (state, action: PayloadAction<google.maps.Map | null>) => {
      state.map = action.payload;
    },
    setView: (state, action: PayloadAction<Partial<MapView>>) => {
      state.view = { ...state.view, ...action.payload };
    },
    addMarker: (state, action: PayloadAction<MapMarker>) => {
      state.markers.push(action.payload);
    },
    updateMarker: (state, action: PayloadAction<{ id: string; updates: Partial<MapMarker> }>) => {
      const index = state.markers.findIndex(marker => marker.id === action.payload.id);
      if (index !== -1) {
        state.markers[index] = { ...state.markers[index], ...action.payload.updates };
      }
    },
    removeMarker: (state, action: PayloadAction<string>) => {
      state.markers = state.markers.filter(marker => marker.id !== action.payload);
    },
    setMarkers: (state, action: PayloadAction<MapMarker[]>) => {
      state.markers = action.payload;
    },
    addPolygon: (state, action: PayloadAction<MapPolygon>) => {
      state.polygons.push(action.payload);
    },
    updatePolygon: (state, action: PayloadAction<{ id: string; updates: Partial<MapPolygon> }>) => {
      const index = state.polygons.findIndex(polygon => polygon.id === action.payload.id);
      if (index !== -1) {
        state.polygons[index] = { ...state.polygons[index], ...action.payload.updates };
      }
    },
    removePolygon: (state, action: PayloadAction<string>) => {
      state.polygons = state.polygons.filter(polygon => polygon.id !== action.payload);
    },
    setPolygons: (state, action: PayloadAction<MapPolygon[]>) => {
      state.polygons = action.payload;
    },
    setHeatmapPoints: (state, action: PayloadAction<HeatmapPoint[]>) => {
      state.heatmapPoints = action.payload;
    },
    setDrawingMode: (state, action: PayloadAction<boolean>) => {
      state.drawingMode = action.payload;
    },
    setSelectedMarker: (state, action: PayloadAction<string | null>) => {
      state.selectedMarker = action.payload;
    },
    toggleHeatmap: (state) => {
      state.showHeatmap = !state.showHeatmap;
    },
    toggle3D: (state) => {
      state.show3D = !state.show3D;
      state.view.tilt = state.show3D ? 45 : 0;
    },
    clearMap: (state) => {
      state.markers = [];
      state.polygons = [];
      state.heatmapPoints = [];
      state.selectedMarker = null;
      state.showHeatmap = false;
      state.show3D = false;
      state.view.tilt = 0;
    },
  },
});

export const {
  setMap,
  setView,
  addMarker,
  updateMarker,
  removeMarker,
  setMarkers,
  addPolygon,
  updatePolygon,
  removePolygon,
  setPolygons,
  setHeatmapPoints,
  setDrawingMode,
  setSelectedMarker,
  toggleHeatmap,
  toggle3D,
  clearMap,
} = mapSlice.actions;

export default mapSlice.reducer;



