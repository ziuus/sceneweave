'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  Award, 
  Clock,
  RefreshCw,
  Plus
} from 'lucide-react';
import { GlassPanel, Button, Icon } from '@/components/ui';
import { hapticFeedback } from '@/lib/utils/mobile';

interface ProgressRingWidgetProps {
  progress: number;
  size?: number;
  showPercentage?: boolean;
}

export function ProgressRingWidget({ 
  progress = 0, 
  size = 120, 
  showPercentage = true 
}: ProgressRingWidgetProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [goals, setGoals] = useState<Array<{ id: string; label: string; target: number; current: number }>>([
    { id: '1', label: 'Focus Sessions', target: 5, current: 2 },
    { id: '2', label: 'Tasks Completed', target: 10, current: 3 },
    { id: '3', label: 'Hours Deep Work', target: 8, current: 3.5 },
  ]);
  
  React.useEffect(() => {
    const target = Math.min(100, Math.max(0, progress));
    let current = animatedProgress;
    
    const animate = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.5) {
        setAnimatedProgress(target);
        return;
      }
      current += diff * 0.1;
      setAnimatedProgress(current);
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [progress]);
  
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const strokeDashoffset = circumference * (1 - animatedProgress / 100);
  
  return (
    <GlassPanel variant="strong" padding="lg" radius="xl" className="text-center">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-text-primary">Progress</h3>
        <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      
      <motion.div
        className="relative mx-auto mb-6"
        style={{ width: size, height: size }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 8}
            fill="none"
            stroke="#2a2a3e"
            strokeWidth="8"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 8}
            fill="none"
            stroke="url(#progress-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: 'drop-shadow(0 0 8px rgba(233, 69, 96, 0.5))' }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e94560" />
              <stop offset="100%" stopColor="#00d4aa" />
            </linearGradient>
          </defs>
        </svg>
        
        {showPercentage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl md:text-4xl font-bold text-text-primary">
              {Math.round(animatedProgress)}%
            </span>
            <span className="text-xs text-text-muted">Complete</span>
          </div>
        )}
      </motion.div>
      
      <div className="space-y-3">
        {goals.map((goal, index) => {
          const goalProgress = Math.min(100, (goal.current / goal.target) * 100);
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-primary">{goal.label}</span>
                <span className="text-sm font-medium text-text-secondary">
                  {goal.current} / {goal.target}
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    background: 'linear-gradient(90deg, #e94560, #00d4aa)',
                    width: `${goalProgress}%`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${goalProgress}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => { /* add goal */ }}>
        <Plus className="w-4 h-4 mr-1.5" />
        Add Goal
      </Button>
    </GlassPanel>
  );
}