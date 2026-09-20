'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface WorkspaceTransitionProps {
  isTransitioning: boolean;
  fromMode?: string;
  toMode?: string;
}

export function WorkspaceTransition({ isTransitioning, fromMode, toMode }: WorkspaceTransitionProps) {
  if (!isTransitioning) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="text-center"
      >
        <motion.div
          className="relative w-24 h-24 mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="w-full h-full text-accent-primary" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" stroke="currentColor" strokeWidth="3" 
              strokeDasharray="283" strokeDashoffset="70"
              strokeLinecap="round"
            />
          </svg>
          <Sparkles className="absolute inset-0 w-10 h-10 mx-auto my-auto text-accent-primary/50 animate-pulse" />
        </motion.div>
        
        <motion.p className="text-lg font-medium text-text-primary mb-2">
          Adapting environment...
        </motion.p>
        
        {fromMode && toMode && (
          <motion.p className="text-sm text-text-muted">
            {fromMode} → {toMode}
          </motion.p>
        )}
        
        <motion.div className="mt-6 h-1 w-48 mx-auto bg-bg-tertiary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}