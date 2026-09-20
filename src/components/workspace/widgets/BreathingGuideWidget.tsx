'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Wind, 
  Play, 
  Pause, 
  RotateCcw,
  Settings,
  X
} from 'lucide-react';
import { GlassPanel, Button, Icon } from '@/components/ui';
import { hapticFeedback } from '@/lib/utils/mobile';

interface BreathingPattern {
  name: string;
  inhale: number;
  hold?: number;
  exhale: number;
  hold2?: number;
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  { name: '4-7-8', inhale: 4, hold: 7, exhale: 8 },
  { name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, hold2: 4 },
  { name: 'Coherent', inhale: 5.5, exhale: 5.5 },
  { name: '4-4-6', inhale: 4, hold: 4, exhale: 6 },
  { name: '5-5', inhale: 5, exhale: 5 },
];

export function BreathingGuideWidget({ 
  pattern: initialPattern = '4-7-8', 
  autoStart = false, 
  minimal = true 
}: { 
  pattern?: string;
  autoStart?: boolean;
  minimal?: boolean;
}) {
  const [selectedPattern, setSelectedPattern] = useState(initialPattern);
  const [running, setRunning] = useState(autoStart);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold2'>('inhale');
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState(0);
  const phaseStartRef = useRef(Date.now());
  const phaseDurationRef = useRef(0);
  
  const pattern = BREATHING_PATTERNS.find(p => p.name === selectedPattern) || BREATHING_PATTERNS[0];
  const phases = [
    { key: 'inhale', label: 'Inhale', duration: pattern.inhale, color: '#00d4aa' },
    { key: 'hold', label: 'Hold', duration: pattern.hold || 0, color: '#ffd700' },
    { key: 'exhale', label: 'Exhale', duration: pattern.exhale, color: '#e94560' },
    { key: 'hold2', label: 'Hold', duration: pattern.hold2 || 0, color: '#ffd700' },
  ].filter(p => p.duration > 0);
  
  useEffect(() => {
    if (!running) return;
    
    const currentPhase = phases.find(p => p.key === phase);
    if (!currentPhase) return;
    
    phaseDurationRef.current = currentPhase.duration * 1000;
    phaseStartRef.current = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - phaseStartRef.current;
      const p = Math.min(elapsed / phaseDurationRef.current, 1);
      setProgress(p);
      
      if (p >= 1) {
        const currentIndex = phases.findIndex(p => p.key === phase);
        const nextIndex = (currentIndex + 1) % phases.length;
        const nextPhase = phases[nextIndex];
        
        setPhase(nextPhase.key as 'inhale' | 'hold' | 'exhale' | 'hold2');
        setProgress(0);
        
        if (nextIndex === 0) {
          setCycle(c => c + 1);
        }
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [running, phase, phases]);
  
  useEffect(() => {
    setPhase('inhale');
    setProgress(0);
    setCycle(0);
  }, [selectedPattern]);
  
  const currentPhaseInfo = phases.find(p => p.key === phase) || phases[0];
  
  const toggleRunning = () => {
    hapticFeedback('medium');
    setRunning(!running);
  };
  
  const reset = () => {
    hapticFeedback('light');
    setRunning(false);
    setPhase('inhale');
    setProgress(0);
    setCycle(0);
  };
  
  if (minimal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="relative w-24 h-24"
          animate={{ 
            scale: phase === 'inhale' ? 1.15 : phase === 'exhale' ? 0.85 : 1,
            borderColor: currentPhaseInfo.color,
          }}
          transition={{ duration: 500, ease: 'easeInOut' }}
        >
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#2a2a3e"
              strokeWidth="4"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={currentPhaseInfo.color}
              strokeWidth="4"
              strokeDasharray={264}
              strokeDashoffset={264 * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className="font-mono text-xl font-bold text-text-primary">
              {Math.ceil(currentPhaseInfo.duration * (1 - progress))}s
            </motion.span>
          </div>
        </motion.div>
        
        <motion.span className="text-sm font-medium text-text-primary">
          {currentPhaseInfo.label}
        </motion.span>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleRunning} className="w-10 h-10">
            {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={reset} className="w-10 h-10">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <GlassPanel variant="strong" padding="lg" radius="xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-text-primary">Breathing Guide</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            className="bg-bg-tertiary border border-bg-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          >
            {BREATHING_PATTERNS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <motion.div
        className="relative w-full aspect-square max-w-xs mx-auto mb-6"
        animate={{ 
          scale: phase === 'inhale' ? 1.05 : phase === 'exhale' ? 0.95 : 1,
        }}
        transition={{ duration: 500, ease: 'easeInOut' }}
      >
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="#2a2a3e"
            strokeWidth="8"
          />
          <motion.circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke={currentPhaseInfo.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={534}
            strokeDashoffset={534 * (1 - progress)}
            style={{ filter: `drop-shadow(0 0 15px ${currentPhaseInfo.color})` }}
            className="transition-all duration-300"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-display text-5xl font-bold text-text-primary font-mono"
            animate={{ color: currentPhaseInfo.color }}
          >
            {Math.ceil(currentPhaseInfo.duration * (1 - progress))}s
          </motion.span>
          <motion.span
            className="text-lg font-medium mt-2"
            animate={{ color: currentPhaseInfo.color }}
          >
            {currentPhaseInfo.label}
          </motion.span>
          <motion.p className="text-sm text-text-muted mt-4">
            Cycle {cycle + 1}
          </motion.p>
        </div>
      </motion.div>
      
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button 
          variant={running ? 'secondary' : 'primary'} 
          size="lg"
          onClick={toggleRunning}
          className="min-w-[160px]"
        >
          {running ? (
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
        <Button variant="ghost" size="lg" onClick={reset}>
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset
        </Button>
      </div>
      
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {phases.map((p, index) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium
              ${phase === p.key ? `bg-[${p.color}]/20 text-[${p.color}] border border-[${p.color}]/40` : 'bg-bg-tertiary/50 text-text-muted border border-bg-border/50'}
            `}
          >
            {p.label} {p.duration}s
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-bg-border">
        <p className="text-xs text-text-muted text-center">
          {pattern.name} • {phases.reduce((sum, p) => sum + p.duration, 0)}s per cycle
        </p>
      </div>
    </GlassPanel>
  );
}