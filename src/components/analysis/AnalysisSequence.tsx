'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Box, 
  Layers, 
  Zap, 
  CheckCircle, 
  Loader2,
  Eye,
  Grid,
  Wand2
} from 'lucide-react';
import { GlassPanel } from '@/components/ui';
import { useApp } from '@/lib/store/AppContext';

const ANALYSIS_STEPS = [
  { 
    id: 'understand', 
    label: 'Understanding space', 
    icon: Brain, 
    description: 'Analyzing spatial layout and geometry',
    duration: 800,
  },
  { 
    id: 'surfaces', 
    label: 'Detecting surfaces', 
    icon: Box, 
    description: 'Identifying floors, walls, windows',
    duration: 600,
  },
  { 
    id: 'objects', 
    label: 'Mapping objects', 
    icon: Layers, 
    description: 'Locating furniture and key elements',
    duration: 700,
  },
  { 
    id: 'build', 
    label: 'Building environment', 
    icon: Wand2, 
    description: 'Generating interactive 3D scene',
    duration: 900,
  },
];

export function AnalysisSequence() {
  const { sceneAnalysis, setStage, setError } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showComplete, setShowComplete] = useState(false);
  
  useEffect(() => {
    if (!sceneAnalysis) {
      setError('No scene data available');
      setStage('capture');
      return;
    }
    
    const runAnalysis = async () => {
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        const step = ANALYSIS_STEPS[i];
        setCurrentStep(i);
        
        await new Promise(resolve => setTimeout(resolve, step.duration));
        
        setCompletedSteps(prev => new Set([...prev, step.id]));
      }
      
      setShowComplete(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      setStage('spatial');
    };
    
    runAnalysis();
  }, [sceneAnalysis, setStage, setError]);
  
  if (!sceneAnalysis) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!showComplete ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-accent-secondary/10 rounded-3xl blur-3xl" />
              
              <GlassPanel variant="strong" padding="xl" radius="2xl" className="relative overflow-hidden">
                <div className="text-center mb-10">
                  <motion.div
                    className="relative w-20 h-20 mx-auto mb-6"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  >
                    <svg className="w-full h-full text-accent-primary" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" stroke="currentColor" strokeWidth="3" 
                        strokeDasharray="283" strokeDashoffset="70"
                        strokeLinecap="round"
                      />
                    </svg>
                    <Brain className="absolute inset-0 w-10 h-10 mx-auto my-auto text-accent-primary/50" />
                  </motion.div>
                  
                  <motion.h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                    Analyzing your space
                  </motion.h2>
                  <motion.p className="text-text-secondary">
                    This will just take a moment...
                  </motion.p>
                </div>
                
                <div className="space-y-4">
                  {ANALYSIS_STEPS.map((step, index) => {
                    const isComplete = completedSteps.has(step.id);
                    const isCurrent = index === currentStep && !isComplete;
                    
                    return (
                      <AnimatePresence key={step.id}>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`
                            flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                            ${isComplete ? 'bg-accent-primary/10 border border-accent-primary/20' : ''}
                            ${isCurrent ? 'bg-bg-tertiary/50 border border-accent-primary/30' : 'bg-bg-secondary/50 border border-bg-border'}
                          `}
                        >
                          <motion.div
                            className={`
                              flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                              ${isComplete 
                                ? 'bg-accent-primary text-white' 
                                : isCurrent 
                                ? 'bg-accent-primary/20 text-accent-primary animate-pulse-soft' 
                                : 'bg-bg-tertiary text-text-muted'
                              }
                            `}
                            animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            {isComplete ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <step.icon className="w-6 h-6" />
                            )}
                          </motion.div>
                          
                          <div className="flex-1 min-w-0">
                            <motion.p
                              className={`font-medium ${isComplete || isCurrent ? 'text-text-primary' : 'text-text-secondary'}`}
                              animate={{ color: isComplete || isCurrent ? '#f0f0f5' : '#a0a0b8' }}
                            >
                              {step.label}
                            </motion.p>
                            <motion.p className="text-sm text-text-muted mt-0.5">
                              {step.description}
                            </motion.p>
                          </div>
                          
                          {isCurrent && (
                            <motion.div className="w-8 h-8 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
                            </motion.div>
                          )}
                          
                          {isComplete && (
                            <motion.div className="w-8 h-8 flex items-center justify-center text-accent-primary">
                              <CheckCircle className="w-5 h-5" />
                            </motion.div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    );
                  })}
                </div>
                
                <motion.div
                  className="mt-8 h-2 bg-bg-tertiary rounded-full overflow-hidden"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 3, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                  />
                </motion.div>
              </GlassPanel>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <GlassPanel variant="strong" padding="xl" radius="2xl" className="relative text-center">
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 relative"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div className="absolute inset-0 rounded-full bg-accent-primary/20 animate-pulse" />
                  <CheckCircle className="absolute inset-0 w-full h-full text-accent-primary animate-float" />
                </motion.div>
                
                <motion.h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                  Space understood
                </motion.h2>
                <motion.p className="text-text-secondary mb-6">
                  Your interactive environment is ready
                </motion.p>
                
                <div className="flex items-center justify-center gap-3 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-tertiary">
                    <Eye className="w-3.5 h-3.5" />
                    {sceneAnalysis.surfaces.length} surfaces
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-tertiary">
                    <Box className="w-3.5 h-3.5" />
                    {sceneAnalysis.objects.length} objects
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-tertiary">
                    <Grid className="w-3.5 h-3.5" />
                    {sceneAnalysis.roomType}
                  </span>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}