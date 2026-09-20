'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Coffee, 
  Music, 
  Wind, 
  Brain, 
  Leaf, 
  Sun, 
  Moon,
  Volume2,
  VolumeX,
  Zap,
  Clock
} from 'lucide-react';
import { GlassPanel, Button, Icon } from '@/components/ui';
import { hapticFeedback } from '@/lib/utils/mobile';

const FOCUS_MODES = [
  { id: 'deep', label: 'Deep Focus', icon: Brain, description: 'No distractions', color: '#e94560' },
  { id: 'creative', label: 'Creative Flow', icon: Zap, description: 'Background inspiration', color: '#00d4aa' },
  { id: 'balanced', label: 'Balanced', icon: Leaf, description: 'Gentle ambient', color: '#ffd700' },
  { id: 'custom', label: 'Custom', icon: Sun, description: 'Your settings', color: '#6366f1' },
];

const AMBIENT_OPTIONS = [
  { id: 'none', label: 'Silence', icon: VolumeX, color: '#6b6b8d' },
  { id: 'white', label: 'White Noise', icon: Wind, color: '#6366f1' },
  { id: 'rain', label: 'Rain', icon: Cloud, color: '#3b82f6' },
  { id: 'lofi', label: 'Lo-fi Beats', icon: Music, color: '#e94560' },
  { id: 'cafe', label: 'Cafe Ambience', icon: Coffee, color: '#f59e0b' },
  { id: 'forest', label: 'Forest', icon: Leaf, color: '#22c55e' },
];

function Cloud({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

export function FocusControlsWidget({ 
  showBreathing = true, 
  showMusic = true, 
  showStats = true 
}: { 
  showBreathing?: boolean; 
  showMusic?: boolean; 
  showStats?: boolean;
}) {
  const [selectedMode, setSelectedMode] = useState('deep');
  const [ambientSound, setAmbientSound] = useState('none');
  const [volume, setVolume] = useState(50);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  
  return (
    <GlassPanel variant="strong" padding="lg" radius="xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="font-medium text-text-primary mb-4">Focus Controls</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-xs text-text-muted mb-2">Focus Mode</p>
          <div className="flex flex-wrap gap-2">
            {FOCUS_MODES.map(mode => (
              <motion.button
                key={mode.id}
                onClick={() => { hapticFeedback('light'); setSelectedMode(mode.id); }}
                whileTap={{ scale: 0.97 }}
                className={`
                  px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${selectedMode === mode.id 
                    ? `bg-[${mode.color}]/20 border border-[${mode.color}]/40 text-[${mode.color}]` 
                    : 'bg-bg-tertiary/50 border border-bg-border/50 text-text-secondary hover:bg-bg-tertiary hover:border-accent-primary/30'
                  }
                `}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: FOCUS_MODES.indexOf(mode) * 0.05 }}
              >
                <span className="flex items-center gap-1.5">
                  <mode.icon className="w-4 h-4" />
                  {mode.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
        
        {showMusic && (
          <div>
            <p className="text-xs text-text-muted mb-2">Ambient Sound</p>
            <div className="flex flex-wrap gap-2">
              {AMBIENT_OPTIONS.map(sound => (
                <motion.button
                  key={sound.id}
                  onClick={() => { hapticFeedback('light'); setAmbientSound(sound.id); }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${ambientSound === sound.id 
                      ? `bg-[${sound.color}]/20 border border-[${sound.color}]/40 text-[${sound.color}]` 
                      : 'bg-bg-tertiary/50 border border-bg-border/50 text-text-secondary hover:bg-bg-tertiary hover:border-accent-primary/30'
                    }
                  `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: AMBIENT_OPTIONS.indexOf(sound) * 0.03 }}
                >
                  <span className="flex items-center gap-1.5">
                    <sound.icon className="w-4 h-4" />
                    {sound.label}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {ambientSound !== 'none' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-muted">Volume</span>
                  <span className="text-text-secondary">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none accent-accent-primary"
                />
              </div>
            )}
          </div>
        )}
        
        {showBreathing && (
          <motion.button
            onClick={() => { hapticFeedback('medium'); setShowBreathingGuide(!showBreathingGuide); }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary/50 border border-bg-border/50 text-text-secondary hover:bg-bg-tertiary hover:border-accent-primary/30 hover:text-text-primary transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <Wind className="w-5 h-5" />
              <span>Breathing Guide</span>
              {showBreathingGuide && <span className="text-xs text-accent-primary">Active</span>}
            </span>
          </motion.button>
        )}
        
        {showStats && (
          <div className="pt-4 border-t border-bg-border">
            <p className="text-xs text-text-muted mb-3">Session Stats</p>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Sessions" value="0" icon={<Coffee className="w-4 h-4" />} />
              <StatCard label="Minutes" value="0" icon={<Clock className="w-4 h-4" />} />
              <StatCard label="Streak" value="0" icon={<Zap className="w-4 h-4" />} />
            </div>
          </div>
        )}
      </div>
      
      {showBreathingGuide && (
        <BreathingGuide onClose={() => setShowBreathingGuide(false)} />
      )}
    </GlassPanel>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center p-3 rounded-xl bg-bg-tertiary/50"
    >
      <div className="text-text-muted mb-1">{icon}</div>
      <p className="font-bold text-text-primary text-lg">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </motion.div>
  );
}

function BreathingGuide({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  
  const patterns = {
    '4-7-8': { inhale: 4, hold: 7, exhale: 8 },
    'box': { inhale: 4, hold: 4, exhale: 4, hold2: 4 },
    'coherent': { inhale: 5.5, exhale: 5.5 },
  };
  
  const pattern = patterns['4-7-8'];
  const totalDuration = pattern.inhale + pattern.hold + pattern.exhale;
  
  React.useEffect(() => {
    if (!running) return;
    
    const cycle = () => {
      // Inhale
      setPhase('inhale');
      animateProgress(pattern.inhale);
      setTimeout(() => {
        // Hold
        setPhase('hold');
        animateProgress(pattern.hold);
        setTimeout(() => {
          // Exhale
          setPhase('exhale');
          animateProgress(pattern.exhale);
          setTimeout(cycle, pattern.exhale * 1000);
        }, pattern.hold * 1000);
      }, pattern.inhale * 1000);
    };
    
    cycle();
    
    return () => setRunning(false);
  }, [running]);
  
  const animateProgress = (duration: number) => {
    const start = Date.now();
    const end = start + duration * 1000;
    
    const tick = () => {
      const now = Date.now();
      const p = Math.min((now - start) / (duration * 1000), 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(tick);
    };
    
    requestAnimationFrame(tick);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm glass-strong rounded-2xl p-8 text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-xl bg-bg-tertiary/50 hover:bg-bg-tertiary text-text-muted transition-colors"
        >
          <Icon name="x" size={20} />
        </button>
        
        <h3 className="font-medium text-text-primary mb-2">4-7-8 Breathing</h3>
        <p className="text-sm text-text-muted mb-6">Inhale 4s • Hold 7s • Exhale 8s</p>
        
        <motion.div
          className="relative w-48 h-48 mx-auto mb-6"
          animate={{ 
            scale: phase === 'inhale' ? 1.2 : phase === 'hold' ? 1.1 : 0.9,
            borderColor: phase === 'inhale' ? '#00d4aa' : phase === 'hold' ? '#ffd700' : '#e94560',
          }}
          transition={{ duration: 500, ease: 'easeInOut' }}
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
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="font-display text-4xl font-bold text-text-primary"
              animate={{ 
                color: phase === 'inhale' ? '#00d4aa' : phase === 'hold' ? '#ffd700' : '#e94560',
              }}
            >
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </motion.span>
            <motion.span className="text-sm text-text-muted">
              {Math.ceil((phase === 'inhale' ? pattern.inhale : phase === 'hold' ? pattern.hold : pattern.exhale) * (1 - progress))}s
            </motion.span>
          </div>
        </motion.div>
        
        <motion.button
          onClick={() => setRunning(!running)}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-3 rounded-xl font-medium transition-all"
          style={{ background: running ? 'linear-gradient(135deg, #e94560, #c73650)' : 'linear-gradient(135deg, #00d4aa, #00b894)' }}
        >
          {running ? 'Pause' : 'Start Breathing'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}