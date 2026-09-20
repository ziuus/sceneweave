'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Bell, 
  Music, 
  Wind,
  Coffee,
  CheckCircle,
  Plus,
  Minus,
  X
} from 'lucide-react';
import { GlassPanel, Button, Icon } from '@/components/ui';
import { useApp } from '@/lib/store/AppContext';
import { formatTime, hapticFeedback, generateId } from '@/lib/utils/mobile';
import { isMobile } from '@/lib/utils/mobile';

const PRESET_DURATIONS = [5, 15, 25, 45, 60, 90];

export function TimerWidget({ 
  duration = 45 * 60, 
  mode = 'countdown', 
  showControls = true, 
  size: sizeProp = 'normal',
  minimal = false,
}: { 
  duration?: number; 
  mode?: 'pomodoro' | 'countdown' | 'stopwatch';
  showControls?: boolean;
  size?: 'normal' | 'large';
  minimal?: boolean;
}) {
  const { workspaceState, updateTimer } = useApp();
  const timer = workspaceState.timer;
  const [localRemaining, setLocalRemaining] = useState(duration);
  const [localRunning, setLocalRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const mobile = isMobile();
  const size = sizeProp === 'large' || minimal ? 'large' : 'normal';
  
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
            // Play completion sound
            if (typeof window !== 'undefined') {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            }
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
  
  const setDuration = (minutes: number) => {
    hapticFeedback('light');
    const seconds = minutes * 60;
    setLocalRemaining(seconds);
    setLocalRunning(false);
    setProgress(0);
    updateTimer({ duration: seconds, remaining: seconds, running: false });
  };
  
  const adjustTime = (delta: number) => {
    hapticFeedback('selection');
    const newTime = Math.max(0, localRemaining + delta);
    setLocalRemaining(newTime);
    updateTimer({ remaining: newTime });
  };
  
  if (minimal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="relative w-32 h-32 md:w-40 md:h-40"
          animate={{ rotate: localRunning && mode === 'countdown' ? 360 : 0 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#2a2a3e"
              strokeWidth="4"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e94560"
              strokeWidth="4"
              strokeDasharray={283}
              strokeDashoffset={283 * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className="font-mono text-3xl md:text-5xl font-bold text-text-primary">
              {formatTime(localRemaining)}
            </motion.span>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTimer} className="w-12 h-12">
            {localRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={resetTimer} className="w-12 h-12">
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <GlassPanel variant="strong" padding="lg" radius="xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-medium text-text-primary">Focus Timer</h3>
          <p className="text-xs text-text-muted">Stay focused, take breaks</p>
        </div>
        <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
      
      <motion.div
        className="relative w-full aspect-square max-w-xs mx-auto"
        animate={{ rotate: localRunning && mode === 'countdown' ? 360 : 0 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#2a2a3e"
            strokeWidth="6"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#e94560"
            strokeWidth="6"
            strokeDasharray={264}
            strokeDashoffset={264 * (1 - progress)}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="font-mono text-4xl md:text-6xl font-bold text-text-primary"
            key={localRemaining}
          >
            {formatTime(localRemaining)}
          </motion.span>
          <p className="text-xs text-text-muted mt-1">
            {mode === 'pomodoro' ? `Session ${timer.sessionsCompleted + 1}` : mode === 'stopwatch' ? 'Stopwatch' : 'Countdown'}
          </p>
        </div>
      </motion.div>
      
      {showControls && (
        <>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="secondary" size="icon" onClick={() => adjustTime(-60)} disabled={localRemaining <= 60} aria-label="Subtract minute">
              <Minus className="w-5 h-5" />
            </Button>
            <Button 
              variant={localRunning ? 'secondary' : 'primary'} 
              size="lg"
              onClick={toggleTimer}
              className="min-w-[140px]"
            >
              {localRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button variant="secondary" size="icon" onClick={() => adjustTime(60)} aria-label="Add minute">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
            {PRESET_DURATIONS.map(min => (
              <Button
                key={min}
                variant={duration === min * 60 && !localRunning ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setDuration(min)}
                disabled={localRunning}
                className="text-xs"
              >
                {min}min
              </Button>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-bg-border">
            <Button variant="ghost" size="sm" onClick={resetTimer} disabled={localRemaining === duration && !localRunning}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4 mr-1.5" />
              Alerts
            </Button>
            <Button variant="ghost" size="sm">
              <Music className="w-4 h-4 mr-1.5" />
              Sounds
            </Button>
          </div>
        </>
      )}
    </GlassPanel>
  );
}