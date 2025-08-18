import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppMode = 'planning' | 'simulation' | 'operations';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface Modal {
  id: string;
  type: 'analysis' | 'resources' | 'settings' | 'export';
  isOpen: boolean;
  data?: any;
}

interface UIState {
  mode: AppMode;
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: Modal[];
  loading: boolean;
  loadingMessage: string;
  selectedStep: number;
  showInfoPanel: boolean;
  showFloatingControls: boolean;
}

const initialState: UIState = {
  mode: 'planning',
  sidebarOpen: true,
  notifications: [],
  modals: [],
  loading: false,
  loadingMessage: '',
  selectedStep: 1,
  showInfoPanel: true,
  showFloatingControls: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<AppMode>) => {
      state.mode = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        duration: action.payload.duration || 4000,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<Omit<Modal, 'isOpen'>>) => {
      const modal: Modal = {
        ...action.payload,
        isOpen: true,
      };
      state.modals.push(modal);
    },
    closeModal: (state, action: PayloadAction<string>) => {
      const modal = state.modals.find(m => m.id === action.payload);
      if (modal) {
        modal.isOpen = false;
      }
    },
    removeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLoadingMessage: (state, action: PayloadAction<string>) => {
      state.loadingMessage = action.payload;
    },
    setSelectedStep: (state, action: PayloadAction<number>) => {
      state.selectedStep = action.payload;
    },
    toggleInfoPanel: (state) => {
      state.showInfoPanel = !state.showInfoPanel;
    },
    setShowInfoPanel: (state, action: PayloadAction<boolean>) => {
      state.showInfoPanel = action.payload;
    },
    toggleFloatingControls: (state) => {
      state.showFloatingControls = !state.showFloatingControls;
    },
    setShowFloatingControls: (state, action: PayloadAction<boolean>) => {
      state.showFloatingControls = action.payload;
    },
  },
});

export const {
  setMode,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  removeModal,
  setLoading,
  setLoadingMessage,
  setSelectedStep,
  toggleInfoPanel,
  setShowInfoPanel,
  toggleFloatingControls,
  setShowFloatingControls,
} = uiSlice.actions;

export default uiSlice.reducer;



