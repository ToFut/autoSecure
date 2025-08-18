import { configureStore } from '@reduxjs/toolkit';
import securitySlice from './slices/securitySlice';
import mapSlice from './slices/mapSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    security: securitySlice,
    map: mapSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['map/setMap', 'map/setMarkers'],
        ignoredPaths: ['map.map', 'map.markers'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



