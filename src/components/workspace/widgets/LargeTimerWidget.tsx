'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Bell, 
  Minus,
  Plus,
  X
} from 'lucide-react';
import { GlassPanel, Button, Icon } from '@/components/ui';
import { useApp } from '@/lib/store/AppContext';
import { formatTime, hapticFeedback } from '@/lib/utils/mobile';

export function LargeTimerWidget({ 
  duration = 45 * 60, 
  mode = 'countdown', 
  size = 'large', 
  minimal = true 
}: { 
  duration?: number; 
  mode?: 'pomodoro' | 'countdown' | 'stopwatch';
  size?: 'normal' | 'large';
  minimal?: boolean;
}) {
  const { workspaceState, updateTimer } = useApp();
  const timer = workspaceState.timer;
  const [localRemaining, setLocalRemaining] = useState(duration);
  const [localRunning, setLocalRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    setLocalRemaining(timer.remaining);
    setLocalRunning(timer.running);
    setProgress(timer.duration > 0 ? 1 - timer.remaining / timer.duration : 0);
  }, [timer.remaining, timer.running, timer.duration]);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (localRunning && mode === 'countdown') {
      interval = setInterval(() => {
        setLocalRemaining(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            setLocalRunning(false);
            hapticFeedback('heavy');
          }
          return next;
        });
      }, 1000);
    } else if (localRunning && mode === 'stopwatch') {
      interval = setInterval(() => {
        setLocalRemaining(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [localRunning, mode]);
  
  const toggleTimer = () => {
    hapticFeedback('light');
    setLocalRunning(prev => !prev);
    updateTimer({ running: !localRunning });
  };
  
  const resetTimer = () => {
    hapticFeedback('medium');
    setLocalRemaining(duration);
    setLocalRunning(false);
    setProgress(0);
    updateTimer({ remaining: duration, running: false });
  };
  
  const adjustTime = (delta: number) => {
    hapticFeedback('selection');
    const newTime = Math.max(0, localRemaining + delta);
    setLocalRemaining(newTime);
    updateTimer({ remaining: newTime });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <motion.div
        className="relative"
        style={{ width: 280, height: 280 }}
        animate={{ rotate: localRunning && mode === 'countdown' ? 360 : 0 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#2a2a3e"
            strokeWidth="12"
          />
          <motion.circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#e94560"
            strokeWidth="12"
            strokeDasharray={754}
            strokeDashoffset={754 * (1 - progress)}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0 0 20px rgba(233, 69, 96, 0.6))' }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="font-display text-6xl md:text-8xl font-bold text-text-primary font-mono tabular-nums"
            key={localRemaining}
          >
            {formatTime(localRemaining)}
          </motion.span>
        </div>
      </motion.div>
      
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => adjustTime(-300)} 
          disabled={localRemaining <= 300}
          aria-label="Subtract 5 minutes"
          className="w-14 h-14"
        >
          <Minus className="w-7 h-7" />
        </Button>
        
        <Button 
          variant={localRunning ? 'secondary' : 'primary'} 
          size="xl"
          onClick={toggleTimer}
          className="min-w-[180px] py-4"
        >
          {localRunning ? (
            <>
              <Pause className="w-7 h-7 mr-3" />
              <span className="text-xl">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-7 h-7 mr-3" />
              <span className="text-xl">Start Focus</span>
            </>
          )}
        </Button>
        
        <Button variant="secondary" size="icon" onClick={() => adjustTime(300)} aria-label="Add 5 minutes" className="w-14 h-14">
          <Plus className="w-7 h-7" />
        </Button>
      </div>
      
      <div className="flex items-center justify-center gap-4 pt-4">
        <Button variant="ghost" size="sm" onClick={resetTimer} disabled={localRemaining === duration && !localRunning}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button variant="ghost" size="sm">
          <Bell className="w-4 h-4 mr-2" />
          Alert
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </motion.div>
  );
}