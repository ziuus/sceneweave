'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkspaceConfig, WidgetConfig, WidgetType } from '@/lib/workspace/types';
import { 
  TimerWidget 
} from './widgets/TimerWidget';
import { 
  TaskListWidget 
} from './widgets/TaskListWidget';
import { 
  FocusControlsWidget 
} from './widgets/FocusControlsWidget';
import { 
  WhiteboardWidget, 
  IdeaCardsWidget, 
  AddIdeaWidget 
} from './widgets/IdeaCardsWidget';
import { 
  TimelineWidget 
} from './widgets/TimelineWidget';
import { 
  MilestonesWidget 
} from './widgets/MilestonesWidget';
import { 
  TaskBoardWidget 
} from './widgets/TaskBoardWidget';
import { 
  ProgressRingWidget 
} from './widgets/ProgressRingWidget';
import { 
  LargeTimerWidget 
} from './widgets/LargeTimerWidget';
import { 
  SingleTaskWidget 
} from './widgets/SingleTaskWidget';
import { 
  BreathingGuideWidget 
} from './widgets/BreathingGuideWidget';
import { isMobile } from '@/lib/utils/mobile';

export const widgetComponents: Record<WidgetType, React.ComponentType<any>> = {
  'timer': TimerWidget,
  'task-list': TaskListWidget,
  'focus-controls': FocusControlsWidget,
  'whiteboard': WhiteboardWidget,
  'idea-cards': IdeaCardsWidget,
  'add-idea': AddIdeaWidget,
  'timeline': TimelineWidget,
  'milestones': MilestonesWidget,
  'task-board': TaskBoardWidget,
  'progress-ring': ProgressRingWidget,
  'large-timer': LargeTimerWidget,
  'single-task': SingleTaskWidget,
  'breathing-guide': BreathingGuideWidget,
};

interface WorkspaceRendererProps {
  config: WorkspaceConfig | null;
  isTransitioning: boolean;
  onTransitionComplete?: () => void;
}

export function WorkspaceRenderer({ config, isTransitioning, onTransitionComplete }: WorkspaceRendererProps) {
  const mobile = isMobile();
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  
  useEffect(() => {
    if (isTransitioning) {
      setTransitionPhase('exiting');
      const timer = setTimeout(() => {
        setTransitionPhase('entering');
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setTransitionPhase('idle');
      onTransitionComplete?.();
    }
  }, [isTransitioning, onTransitionComplete]);
  
  if (!config) return null;
  
  const floatingWidgets: WidgetConfig[] = [];
  const spatialWidgets: WidgetConfig[] = [];
  const anchoredWidgets = config.widgets.filter(w => w.position === 'anchored' && w.visible);
  const dockedWidgets = config.widgets.filter(w => w.position === 'docked' && w.visible);
  
  const renderWidget = (widget: WidgetConfig) => {
    const Component = widgetComponents[widget.type];
    if (!Component) {
      console.warn(`Unknown widget type: ${widget.type}`);
      return null;
    }
    
    return (
      <motion.div
        key={widget.id}
        style={{ zIndex: widget.zIndex }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: widget.animation?.delay || 0, duration: 0.3 }}
        className="pointer-events-auto"
      >
        <Component {...widget.props} />
      </motion.div>
    );
  };
  
  return (
    <>
      {!mobile && (
        <AnimatePresence mode="wait">
          {transitionPhase !== 'exiting' && (
            <motion.div
              key="floating-widgets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-30"
            >
              <div className="relative w-full h-full">
                {floatingWidgets.map(widget => (
                  <motion.div
                    key={widget.id}
                    style={({ 
                      zIndex: widget.zIndex,
                      position: 'absolute' as const,
                      left: widget.anchor ? '50%' : (widget.props.left as string) || '20px',
                      top: widget.anchor ? '50%' : (widget.props.top as string) || '100px',
                      transform: widget.anchor ? 'translate(-50%, -50%)' : 'none',
                    } as React.CSSProperties)}
                    className="pointer-events-auto"
                    animate={{ opacity: transitionPhase === 'entering' ? 1 : 1 }}
                  >
                    {renderWidget(widget)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {!mobile && spatialWidgets.length > 0 && (
        <AnimatePresence mode="wait">
          {transitionPhase !== 'exiting' && (
            <motion.div
              key="spatial-widgets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-20"
            >
              <div className="relative w-full h-full">
                {spatialWidgets.map(widget => (
                  <motion.div
                    key={widget.id}
                    style={{ 
                      zIndex: widget.zIndex,
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="pointer-events-auto"
                  >
                    {renderWidget(widget)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {mobile && (
        <AnimatePresence mode="wait">
          <motion.div
            key={config.mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-4 px-4"
          >
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              {[
                ...floatingWidgets,
                ...spatialWidgets,
                ...anchoredWidgets,
                ...dockedWidgets,
              ].map(widget => {
                const Component = widgetComponents[widget.type];
                if (!Component) return null;
                return (
                  <motion.div
                    key={widget.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="pointer-events-auto"
                  >
                    <Component {...widget.props} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      
      {!mobile && dockedWidgets.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key="docked-widgets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:top-1/2 md:-translate-y-1/2 md:w-80 z-30 pointer-events-none flex flex-col gap-3"
          >
            {dockedWidgets.map(widget => {
              const Component = widgetComponents[widget.type];
              if (!Component) return null;
              return (
                <motion.div
                  key={widget.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="pointer-events-auto"
                >
                  <Component {...widget.props} />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}