'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Lightbulb, 
  Calendar, 
  Target, 
  Send, 
  Mic, 
  X, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { GlassPanel, Button, Input, Icon } from '@/components/ui';
import { useApp } from '@/lib/store/AppContext';
import { WORKSPACE_MODES, WorkspaceModeId } from '@/lib/workspace/types';
import { interpretIntent } from '@/lib/ai';
import { isMobile, hapticFeedback, generateId } from '@/lib/utils/mobile';

export function IntentPanel() {
  const { 
    intentPanelOpen, 
    setIntentPanelOpen, 
    setMode, 
    workspaceState,
    sceneAnalysis 
  } = useApp();
  
  const currentMode = workspaceState.currentMode;
  const isTransitioning = workspaceState.isTransitioning;
  
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mobile = isMobile();
  
  const handleModeSelect = useCallback((mode: WorkspaceModeId) => {
    if (isTransitioning || currentMode === mode) return;
    hapticFeedback('light');
    setMode(mode);
    setInputValue('');
    setShowSuggestions(false);
  }, [isTransitioning, currentMode, setMode]);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTransitioning) return;
    
    hapticFeedback('medium');
    
    try {
      const interpretedMode = await interpretIntent(inputValue, sceneAnalysis || undefined);
      setMode(interpretedMode as WorkspaceModeId);
    } catch {
      // Fallback to first keyword match
      const lower = inputValue.toLowerCase();
      if (lower.includes('study') || lower.includes('focus')) setMode('study');
      else if (lower.includes('brainstorm') || lower.includes('idea')) setMode('brainstorm');
      else if (lower.includes('plan') || lower.includes('project')) setMode('plan');
      else if (lower.includes('distraction') || lower.includes('minimal')) setMode('focus');
      else setMode('study');
    }
    
    setInputValue('');
    setShowSuggestions(false);
    if (mobile) setIntentPanelOpen(false);
  }, [inputValue, isTransitioning, sceneAnalysis, setMode, mobile, setIntentPanelOpen]);
  
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    if (value.length > 2) {
      const lower = value.toLowerCase();
      const matches = WORKSPACE_MODES
        .filter(m => 
          m.label.toLowerCase().includes(lower) || 
          m.description.toLowerCase().includes(lower) ||
          m.shortDescription.toLowerCase().includes(lower)
        )
        .map(m => m.label);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };
  
  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    setIsListening(true);
    hapticFeedback('light');
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      handleSubmit(new Event('submit') as any);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      hapticFeedback('heavy');
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };
  
  const getModeIcon = (modeId: WorkspaceModeId) => {
    const mode = WORKSPACE_MODES.find(m => m.id === modeId);
    if (!mode) return BookOpen;
    
    switch (mode.icon) {
      case 'book-open': return BookOpen;
      case 'lightbulb': return Lightbulb;
      case 'calendar': return Calendar;
      case 'target': return Target;
      default: return BookOpen;
    }
  };
  
  if (!intentPanelOpen && mobile) return null;
  
  return (
    <AnimatePresence mode="wait">
      {intentPanelOpen || !mobile ? (
        <motion.div
          ref={panelRef}
          key={mobile ? 'mobile' : 'desktop'}
          initial={{ opacity: 0, y: mobile ? 100 : 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: mobile ? 100 : -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`
            fixed z-40 pointer-events-auto
            ${mobile 
              ? 'bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl' 
              : 'top-1/2 right-4 -translate-y-1/2 w-72'
            }
          `}
          style={{ touchAction: 'manipulation' }}
        >
          <GlassPanel 
            variant="strong" 
            padding={mobile ? 'lg' : 'md'} 
            radius={mobile ? 'xl' : '2xl'} 
            className={`
              ${mobile ? 'border-t-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'shadow-glow'}
              ${!mobile && currentMode ? 'border-l-4' : ''}
              ${!mobile && currentMode ? `border-l-[${WORKSPACE_MODES.find(m => m.id === currentMode)?.color}]` : ''}
            `}
          >
            {!mobile && (
              <motion.button
                onClick={() => setIntentPanelOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-xl bg-bg-tertiary/50 hover:bg-bg-tertiary text-text-muted transition-colors"
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
            
            <div className={mobile ? 'space-y-4' : 'space-y-3'}>
              {!mobile && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 px-1"
                >
                  <Sparkles className="w-5 h-5 text-accent-primary" />
                  <span className="text-sm font-medium text-text-primary">What do you want to do here?</span>
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={mobile ? "Type or say what you want to do..." : "Type your intent..."}
                    size={mobile ? 'lg' : 'md'}
                    leftIcon={<Icon name="sparkles" size={18} />}
                    rightIcon={
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleVoiceInput}
                          disabled={isListening}
                          className={isListening ? 'text-accent-primary animate-pulse' : 'text-text-muted'}
                          aria-label={isListening ? 'Listening...' : 'Voice input'}
                        >
                          <Mic className="w-5 h-5" />
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="icon"
                          disabled={!inputValue.trim() || isTransitioning}
                          loading={isTransitioning}
                          className="ml-1"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    }
                    className="pr-0"
                  />
                </div>
                
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full left-0 right-0 mb-2 glass-strong rounded-xl border border-bg-border p-2 shadow-glass z-10 max-h-40 overflow-auto"
                    >
                      {suggestions.map((suggestion, index) => (
                        <motion.li
                          key={suggestion}
                          onClick={() => {
                            setInputValue(suggestion);
                            handleSubmit(new Event('submit') as any);
                          }}
                          className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary cursor-pointer transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {suggestion}
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </form>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={mobile ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}
              >
                {WORKSPACE_MODES.map((mode) => {
                  const IconComponent = getModeIcon(mode.id);
                  const isActive = currentMode === mode.id;
                  
                  return (
                    <motion.button
                      key={mode.id}
                      onClick={() => handleModeSelect(mode.id)}
                      disabled={isTransitioning}
                      whileTap={{ scale: isTransitioning ? 1 : 0.97 }}
                      className={`
                        relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                        ${isActive 
                          ? `bg-[${mode.color}]/20 border border-[${mode.color}]/40 text-[${mode.color}]` 
                          : 'bg-bg-tertiary/50 border border-bg-border/50 text-text-secondary hover:bg-bg-tertiary hover:border-accent-primary/30 hover:text-text-primary'
                        }
                        ${isTransitioning ? 'opacity-50 cursor-wait' : ''}
                        ${mobile ? 'min-h-[56px]' : ''}
                      `}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + WORKSPACE_MODES.indexOf(mode) * 0.05 }}
                    >
                      <span className={`
                        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                        ${isActive ? `bg-[${mode.color}] text-white` : 'bg-bg-secondary text-text-secondary'}
                      `}>
                        <IconComponent className="w-5 h-5" />
                      </span>
                      
                      {!mobile && (
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{mode.label}</p>
                          <p className="text-xs opacity-75 truncate">{mode.shortDescription}</p>
                        </div>
                      )}
                      
                      {mobile && (
                        <span className="text-xs opacity-75">{mode.shortDescription}</span>
                      )}
                      
                      {isActive && !mobile && (
                        <motion.div
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Icon name="check" size={16} className="text-current" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
              
              {currentMode && !mobile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-3 mt-2 border-t border-bg-border"
                >
                  <p className="text-xs text-text-muted mb-2">Current: {WORKSPACE_MODES.find(m => m.id === currentMode)?.label} Mode</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-accent-primary rounded-full"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: workspaceState.isTransitioning ? 0.5 : 1 }}
                        transition={{ duration: workspaceState.isTransitioning ? 1 : 0.5, repeat: workspaceState.isTransitioning ? Infinity : 0, ease: 'easeInOut' }}
                      />
                    </div>
                    {workspaceState.isTransitioning && (
                      <span className="text-xs text-text-muted whitespace-nowrap">Transitioning...</span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </GlassPanel>
          
          {mobile && (
            <motion.button
              onClick={() => setIntentPanelOpen(true)}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-full glass-strong shadow-glow flex items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-5 h-5 text-accent-primary" />
              <span className="font-medium text-text-primary">Open Intent Panel</span>
              <ChevronDown className="w-5 h-5 text-text-muted" />
            </motion.button>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}