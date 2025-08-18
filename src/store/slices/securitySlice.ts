import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SecurityPin {
  id: string;
  lat: number;
  lng: number;
  type: 'perimeter' | 'guard' | 'camera' | 'checkpoint' | 'medical';
  label?: string;
}

export interface RiskAssessment {
  id: string;
  level: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  location: { lat: number; lng: number };
  recommendations: string[];
}

export interface SecurityResource {
  id: string;
  type: 'guard' | 'camera' | 'barrier' | 'metal-detector' | 'medical' | 'radio' | 'k9' | 'sensor' | 'drone';
  count: number;
  deployed: number;
  status: 'ready' | 'deployed' | 'standby';
  location?: { lat: number; lng: number };
}

export interface SecurityPlan {
  id: string;
  name: string;
  perimeter: SecurityPin[];
  resources: SecurityResource[];
  risks: RiskAssessment[];
  area: number;
  capacity: number;
  status: 'draft' | 'analyzing' | 'complete' | 'deployed';
  createdAt: string;
  updatedAt: string;
}

interface SecurityState {
  currentPlan: SecurityPlan | null;
  plans: SecurityPlan[];
  analysisStatus: 'idle' | 'analyzing' | 'complete' | 'error';
  analysisProgress: number;
  analysisMessage: string;
}

const initialState: SecurityState = {
  currentPlan: null,
  plans: [],
  analysisStatus: 'idle',
  analysisProgress: 0,
  analysisMessage: '',
};

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    setCurrentPlan: (state, action: PayloadAction<SecurityPlan | null>) => {
      state.currentPlan = action.payload;
    },
    addPerimeterPin: (state, action: PayloadAction<SecurityPin>) => {
      if (state.currentPlan) {
        state.currentPlan.perimeter.push(action.payload);
      }
    },
    removePerimeterPin: (state, action: PayloadAction<string>) => {
      if (state.currentPlan) {
        state.currentPlan.perimeter = state.currentPlan.perimeter.filter(
          pin => pin.id !== action.payload
        );
      }
    },
    updatePerimeterPin: (state, action: PayloadAction<{ id: string; updates: Partial<SecurityPin> }>) => {
      if (state.currentPlan) {
        const index = state.currentPlan.perimeter.findIndex(pin => pin.id === action.payload.id);
        if (index !== -1) {
          state.currentPlan.perimeter[index] = { ...state.currentPlan.perimeter[index], ...action.payload.updates };
        }
      }
    },
    setAnalysisStatus: (state, action: PayloadAction<'idle' | 'analyzing' | 'complete' | 'error'>) => {
      state.analysisStatus = action.payload;
    },
    setAnalysisProgress: (state, action: PayloadAction<number>) => {
      state.analysisProgress = action.payload;
    },
    setAnalysisMessage: (state, action: PayloadAction<string>) => {
      state.analysisMessage = action.payload;
    },
    addRiskAssessment: (state, action: PayloadAction<RiskAssessment>) => {
      if (state.currentPlan) {
        state.currentPlan.risks.push(action.payload);
      }
    },
    addSecurityResource: (state, action: PayloadAction<SecurityResource>) => {
      if (state.currentPlan) {
        state.currentPlan.resources.push(action.payload);
      }
    },
    updatePlanArea: (state, action: PayloadAction<number>) => {
      if (state.currentPlan) {
        state.currentPlan.area = action.payload;
        state.currentPlan.capacity = Math.floor(action.payload / 2); // 2m² per person
      }
    },
    setPlanStatus: (state, action: PayloadAction<'draft' | 'analyzing' | 'complete' | 'deployed'>) => {
      if (state.currentPlan) {
        state.currentPlan.status = action.payload;
        state.currentPlan.updatedAt = new Date().toISOString();
      }
    },
    clearCurrentPlan: (state) => {
      state.currentPlan = null;
    },
    clearPerimeter: (state) => {
      if (state.currentPlan) {
        state.currentPlan.perimeter = [];
      }
    },
    clearRisks: (state) => {
      if (state.currentPlan) {
        state.currentPlan.risks = [];
      }
    },
    removeSecurityResource: (state, action: PayloadAction<string>) => {
      if (state.currentPlan) {
        state.currentPlan.resources = state.currentPlan.resources.filter(
          resource => resource.id !== action.payload
        );
      }
    },
    updateResourceStatus: (state, action: PayloadAction<{ id: string; status: 'ready' | 'deployed' | 'standby' }>) => {
      if (state.currentPlan) {
        const resource = state.currentPlan.resources.find(r => r.id === action.payload.id);
        if (resource) {
          resource.status = action.payload.status;
        }
      }
    },
    incrementResourceDeployed: (state, action: PayloadAction<string>) => {
      if (state.currentPlan) {
        const resource = state.currentPlan.resources.find(r => r.type === action.payload);
        if (resource && resource.deployed < resource.count) {
          resource.deployed++;
          if (resource.deployed === resource.count) {
            resource.status = 'deployed';
          }
        }
      }
    },
    updatePlanCapacity: (state, action: PayloadAction<number>) => {
      if (state.currentPlan) {
        state.currentPlan.capacity = action.payload;
      }
    },
  },
});

export const {
  setCurrentPlan,
  addPerimeterPin,
  removePerimeterPin,
  updatePerimeterPin,
  setAnalysisStatus,
  setAnalysisProgress,
  setAnalysisMessage,
  addRiskAssessment,
  addSecurityResource,
  updatePlanArea,
  setPlanStatus,
  clearCurrentPlan,
  clearPerimeter,
  clearRisks,
  removeSecurityResource,
  updateResourceStatus,
  incrementResourceDeployed,
  updatePlanCapacity,
} = securitySlice.actions;

// Helper action for updating resource deployment
export const updateResourceDeployment = (payload: { id: string; deployed: number }) => 
  updateResourceStatus({ id: payload.id, status: 'deployed' });

export default securitySlice.reducer;


