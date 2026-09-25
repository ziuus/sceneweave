'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, RotateCcw } from 'lucide-react';
import { CaptureArea } from '@/components/capture/CaptureArea';
import { AnalysisSequence } from '@/components/analysis/AnalysisSequence';
import { SpatialCanvas } from '@/components/spatial/SpatialCanvas';
import { IntentPanel } from '@/components/intent/IntentPanel';
import { WorkspaceRenderer, WorkspaceTransition } from '@/components/workspace';
import { useApp } from '@/lib/store/AppContext';
import { getDemoSceneAnalysis } from '@/lib/scene/demoScene';
import { analyzeScene, generateWorkspace } from '@/lib/ai';
import { CapturedInput } from '@/lib/scene/types';
import { isMobile } from '@/lib/utils/mobile';

export default function HomePage() {
  const { 
    stage, 
    capturedInput, 
    sceneAnalysis, 
    workspaceState,
    setStage, 
    setSceneAnalysis, 
    setWorkspaceConfig,
    setMode,
    setTransitioning,
    isDemo,
    setError,
  } = useApp();
  
  const mobile = isMobile();
  
  const handleCaptureComplete = useCallback(async (input: CapturedInput) => {
    setStage('analyzing');
    
    try {
      const analysis = await analyzeScene(input.data, input.type);
      setSceneAnalysis(analysis);
    } catch (err) {
      setError('Failed to analyze scene. Using demo scene.');
      const demoAnalysis = getDemoSceneAnalysis();
      setSceneAnalysis(demoAnalysis);
    }
  }, [setStage, setSceneAnalysis, setError]);
  
  useEffect(() => {
    if (stage === 'spatial' && sceneAnalysis && workspaceState.currentMode) {
      if (!workspaceState.config || workspaceState.config.mode !== workspaceState.currentMode) {
        const fetchConfig = async () => {
          try {
            const config = await generateWorkspace(workspaceState.currentMode!, sceneAnalysis);
            setWorkspaceConfig(config);
          } catch (err) {
            console.error('Failed to generate workspace:', err);
          } finally {
            setTimeout(() => setTransitioning(false), 2000);
          }
        };
        fetchConfig();
      }
    }
  }, [stage, sceneAnalysis, workspaceState.currentMode, workspaceState.config?.mode, setWorkspaceConfig, setTransitioning]);
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12 md:py-20"
          >
            <CaptureArea />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <p className="text-sm text-text-muted">
                No account needed • Works offline • Privacy first
              </p>
            </motion.div>
          </motion.div>
        )}
        
        {stage === 'analyzing' && sceneAnalysis && (
          <AnalysisSequence />
        )}
        
        {stage === 'spatial' && sceneAnalysis && (
          <motion.div
            key="spatial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
          >
            <SpatialCanvas
              scene={sceneAnalysis}
              environmentMods={workspaceState.config?.environment}
              cameraPreset={workspaceState.config?.camera}
              isTransitioning={workspaceState.isTransitioning}
              onTransitionComplete={() => {}}
              className="absolute inset-0"
            />
            
            <WorkspaceRenderer
              config={workspaceState.config}
              isTransitioning={workspaceState.isTransitioning}
            />
            
            <WorkspaceTransition
              isTransitioning={workspaceState.isTransitioning}
              fromMode={workspaceState.currentMode || undefined}
              toMode={workspaceState.config?.mode}
            />
            
            <IntentPanel />
            
            {!mobile && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-4 left-4 z-20 flex items-center gap-2"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-strong">
                  <Sparkles className="w-5 h-5 text-accent-primary" />
                  <span className="font-medium text-text-primary">SceneWeave</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" />
                </div>
              </motion.div>
            )}
            
            {!mobile && workspaceState.currentMode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="fixed top-4 right-4 z-20"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-strong">
                  <RotateCcw className="w-5 h-5 text-accent-primary" />
                  <span className="font-medium text-text-primary capitalize">{workspaceState.currentMode} Mode</span>
                </div>
              </motion.div>
            )}
            
            {mobile && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setStage('capture')}
                className="fixed top-4 left-4 z-30 p-2 rounded-xl glass-strong shadow-glow"
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-5 h-5 text-text-primary" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}