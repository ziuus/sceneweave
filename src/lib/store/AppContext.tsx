'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { AppState, AppAction, initialAppState, appReducer } from './reducers';
import { WorkspaceConfig, WorkspaceModeId } from '@/lib/workspace/types';
import { SceneAnalysis } from '@/lib/scene/types';
import { CapturedInput } from '@/lib/scene/types';

interface AppContextType extends AppState {
  setStage: (stage: AppState['stage']) => void;
  setCapturedInput: (input: CapturedInput) => void;
  setSceneAnalysis: (analysis: SceneAnalysis) => void;
  setWorkspaceConfig: (config: WorkspaceConfig) => void;
  setMode: (mode: WorkspaceModeId) => void;
  setTransitioning: (transitioning: boolean) => void;
  toggleIntentPanel: () => void;
  setIntentPanelOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setDemo: (demo: boolean) => void;
  setError: (error: string | null) => void;
  updateTimer: (timer: Partial<AppState['workspaceState']['timer']>) => void;
  updateTasks: (tasks: AppState['workspaceState']['tasks']) => void;
  updateIdeas: (ideas: AppState['workspaceState']['ideas']) => void;
  updateTimeline: (timeline: AppState['workspaceState']['timeline']) => void;
  updateMilestones: (milestones: AppState['workspaceState']['milestones']) => void;
  setCurrentTask: (task: AppState['workspaceState']['currentTask']) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  const setStage = useCallback((stage: AppState['stage']) => dispatch({ type: 'SET_STAGE', payload: stage }), []);
  const setCapturedInput = useCallback((input: CapturedInput) => dispatch({ type: 'SET_CAPTURED_INPUT', payload: input }), []);
  const setSceneAnalysis = useCallback((analysis: SceneAnalysis) => dispatch({ type: 'SET_SCENE_ANALYSIS', payload: analysis }), []);
  const setWorkspaceConfig = useCallback((config: WorkspaceConfig) => dispatch({ type: 'SET_WORKSPACE_CONFIG', payload: config }), []);
  const setMode = useCallback((mode: WorkspaceModeId) => dispatch({ type: 'SET_MODE', payload: mode }), []);
  const setTransitioning = useCallback((transitioning: boolean) => dispatch({ type: 'SET_TRANSITIONING', payload: transitioning }), []);
  const toggleIntentPanel = useCallback(() => dispatch({ type: 'TOGGLE_INTENT_PANEL' }), []);
  const setIntentPanelOpen = useCallback((open: boolean) => dispatch({ type: 'SET_INTENT_PANEL_OPEN', payload: open }), []);
  const toggleMobileMenu = useCallback(() => dispatch({ type: 'TOGGLE_MOBILE_MENU' }), []);
  const setMobileMenuOpen = useCallback((open: boolean) => dispatch({ type: 'SET_MOBILE_MENU_OPEN', payload: open }), []);
  const setDemo = useCallback((demo: boolean) => dispatch({ type: 'SET_DEMO', payload: demo }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }), []);
  const updateTimer = useCallback((timer: Partial<AppState['workspaceState']['timer']>) => dispatch({ type: 'UPDATE_TIMER', payload: timer }), []);
  const updateTasks = useCallback((tasks: AppState['workspaceState']['tasks']) => dispatch({ type: 'UPDATE_TASKS', payload: tasks }), []);
  const updateIdeas = useCallback((ideas: AppState['workspaceState']['ideas']) => dispatch({ type: 'UPDATE_IDEAS', payload: ideas }), []);
  const updateTimeline = useCallback((timeline: AppState['workspaceState']['timeline']) => dispatch({ type: 'UPDATE_TIMELINE', payload: timeline }), []);
  const updateMilestones = useCallback((milestones: AppState['workspaceState']['milestones']) => dispatch({ type: 'UPDATE_MILESTONES', payload: milestones }), []);
  const setCurrentTask = useCallback((task: AppState['workspaceState']['currentTask']) => dispatch({ type: 'SET_CURRENT_TASK', payload: task }), []);
  const resetApp = useCallback(() => dispatch({ type: 'RESET_APP' }), []);

  const value: AppContextType = {
    ...state,
    setStage,
    setCapturedInput,
    setSceneAnalysis,
    setWorkspaceConfig,
    setMode,
    setTransitioning,
    toggleIntentPanel,
    setIntentPanelOpen,
    toggleMobileMenu,
    setMobileMenuOpen,
    setDemo,
    setError,
    updateTimer,
    updateTasks,
    updateIdeas,
    updateTimeline,
    updateMilestones,
    setCurrentTask,
    resetApp,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}