import { SceneAnalysis } from '@/lib/scene/types';
import { WorkspaceConfig, WorkspaceModeId, WorkspaceState, DEFAULT_TIMER_STATE, DEFAULT_TASKS, DEFAULT_IDEAS, DEFAULT_TIMELINE, DEFAULT_MILESTONES } from '@/lib/workspace/types';
import { CapturedInput } from '@/lib/scene/types';

export type AppStage = 'capture' | 'analyzing' | 'spatial';

export interface AppState {
  stage: AppStage;
  capturedInput: CapturedInput | null;
  sceneAnalysis: SceneAnalysis | null;
  workspaceState: WorkspaceState;
  isDemo: boolean;
  intentPanelOpen: boolean;
  mobileMenuOpen: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_STAGE'; payload: AppStage }
  | { type: 'SET_CAPTURED_INPUT'; payload: CapturedInput }
  | { type: 'SET_SCENE_ANALYSIS'; payload: SceneAnalysis }
  | { type: 'SET_WORKSPACE_CONFIG'; payload: WorkspaceConfig }
  | { type: 'SET_MODE'; payload: WorkspaceModeId }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'TOGGLE_INTENT_PANEL' }
  | { type: 'SET_INTENT_PANEL_OPEN'; payload: boolean }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'SET_MOBILE_MENU_OPEN'; payload: boolean }
  | { type: 'SET_DEMO'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_TIMER'; payload: Partial<WorkspaceState['timer']> }
  | { type: 'UPDATE_TASKS'; payload: WorkspaceState['tasks'] }
  | { type: 'UPDATE_IDEAS'; payload: WorkspaceState['ideas'] }
  | { type: 'UPDATE_TIMELINE'; payload: WorkspaceState['timeline'] }
  | { type: 'UPDATE_MILESTONES'; payload: WorkspaceState['milestones'] }
  | { type: 'SET_CURRENT_TASK'; payload: WorkspaceState['currentTask'] }
  | { type: 'RESET_APP' };

export const initialAppState: AppState = {
  stage: 'capture',
  capturedInput: null,
  sceneAnalysis: null,
  workspaceState: {
    currentMode: null,
    config: null,
    isTransitioning: false,
    timer: DEFAULT_TIMER_STATE,
    tasks: DEFAULT_TASKS,
    ideas: DEFAULT_IDEAS,
    timeline: DEFAULT_TIMELINE,
    milestones: DEFAULT_MILESTONES,
    currentTask: null,
  },
  isDemo: false,
  intentPanelOpen: true,
  mobileMenuOpen: false,
  error: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, stage: action.payload };
    
    case 'SET_CAPTURED_INPUT':
      return { ...state, capturedInput: action.payload };
    
    case 'SET_SCENE_ANALYSIS':
      return { ...state, sceneAnalysis: action.payload };
    
    case 'SET_WORKSPACE_CONFIG':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          config: action.payload,
          currentMode: action.payload.mode,
        },
      };
    
    case 'SET_MODE':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          currentMode: action.payload,
          isTransitioning: true,
        },
      };
    
    case 'SET_TRANSITIONING':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          isTransitioning: action.payload,
        },
      };
    
    case 'TOGGLE_INTENT_PANEL':
      return { ...state, intentPanelOpen: !state.intentPanelOpen };
    
    case 'SET_INTENT_PANEL_OPEN':
      return { ...state, intentPanelOpen: action.payload };
    
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, mobileMenuOpen: !state.mobileMenuOpen };
    
    case 'SET_MOBILE_MENU_OPEN':
      return { ...state, mobileMenuOpen: action.payload };
    
    case 'SET_DEMO':
      return { ...state, isDemo: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'UPDATE_TIMER':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          timer: { ...state.workspaceState.timer, ...action.payload },
        },
      };
    
    case 'UPDATE_TASKS':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          tasks: action.payload,
        },
      };
    
    case 'UPDATE_IDEAS':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          ideas: action.payload,
        },
      };
    
    case 'UPDATE_TIMELINE':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          timeline: action.payload,
        },
      };
    
    case 'UPDATE_MILESTONES':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          milestones: action.payload,
        },
      };
    
    case 'SET_CURRENT_TASK':
      return {
        ...state,
        workspaceState: {
          ...state.workspaceState,
          currentTask: action.payload,
        },
      };
    
    case 'RESET_APP':
      return { ...initialAppState };
    
    default:
      return state;
  }
}