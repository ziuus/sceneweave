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
    error,
    setError,
  } = useApp();
  
  const mobile = isMobile();
  
  useEffect(() => {
    if (stage === 'analyzing' && capturedInput && !sceneAnalysis) {
      const runAnalysis = async () => {
        try {
          const analysis = await analyzeScene(capturedInput.data, capturedInput.type);
          setSceneAnalysis(analysis);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Failed to analyze scene.');
          setStage('capture');
        }
      };
      runAnalysis();
    }
  }, [stage, capturedInput, sceneAnalysis, setSceneAnalysis, setError]);

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
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-8 left-1/2 z-[100] bg-red-500/90 text-white px-6 py-3 rounded-full font-medium shadow-lg whitespace-nowrap"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
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
        
        {stage === 'analyzing' && !sceneAnalysis && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary px-4"
          >
             <div className="flex flex-col items-center gap-4">
               <motion.div
                 className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full"
                 animate={{ rotate: 360 }}
                 transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
               />
               <p className="text-text-secondary font-medium">Analyzing with Gemini Vision...</p>
             </div>
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
              capturedInput={capturedInput}
              environmentMods={workspaceState.config?.environment}
              cameraPreset={workspaceState.config?.camera}
              isTransitioning={workspaceState.isTransitioning}
              onTransitionComplete={() => {}}
              className="absolute inset-0"
            />
            
            {/* WorkspaceRenderer — v2 feature, disabled for hackathon demo */}
            {/* <WorkspaceRenderer
              config={workspaceState.config}
              isTransitioning={workspaceState.isTransitioning}
            /> */}
            
            {/* <WorkspaceTransition
              isTransitioning={workspaceState.isTransitioning}
              fromMode={workspaceState.currentMode || undefined}
              toMode={workspaceState.config?.mode}
            /> */}
            
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