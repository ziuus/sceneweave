'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flag, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Target,
  Plus,
  MoreVertical,
  Circle
} from 'lucide-react';
import { GlassPanel, Button, Icon } from '@/components/ui';
import { Milestone, DEFAULT_MILESTONES } from '@/lib/workspace/types';
import { hapticFeedback, generateId } from '@/lib/utils/mobile';
import { isMobile } from '@/lib/utils/mobile';

export function MilestonesWidget({ 
  milestones: initialMilestones, 
  showProgress = true 
}: { 
  milestones?: Milestone[];
  showProgress?: boolean;
}) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones || DEFAULT_MILESTONES);
  const [expanded, setExpanded] = useState<string | null>(null);
  const mobile = isMobile();
  
  const sortedMilestones = [...milestones].sort((a, b) => a.dueDate - b.dueDate);
  const now = Date.now();
  
  const getStatus = (milestone: Milestone) => {
    if (milestone.completed) return 'completed';
    if (milestone.dueDate < now) return 'overdue';
    if (milestone.dueDate < now + 7 * 86400000) return 'upcoming';
    return 'future';
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const daysUntil = (timestamp: number) => {
    const diff = timestamp - now;
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };
  
  return (
    <GlassPanel variant="strong" padding="lg" radius="xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-medium text-text-primary">Milestones</h3>
          <p className="text-xs text-text-muted">
            {milestones.filter(m => m.completed).length} of {milestones.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatBadge label="On Track" value={milestones.filter(m => getStatus(m) === 'future' || getStatus(m) === 'upcoming').length} color="#00d4aa" />
          <StatBadge label="At Risk" value={milestones.filter(m => getStatus(m) === 'overdue').length} color="#e94560" />
        </div>
      </div>
      
      <div className="space-y-3">
        {sortedMilestones.map((milestone, index) => {
          const status = getStatus(milestone);
          const isExpanded = expanded === milestone.id;
          
          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <motion.button
                onClick={() => setExpanded(isExpanded ? null : milestone.id)}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full p-4 rounded-xl transition-all text-left
                  ${status === 'completed' ? 'bg-green-500/5 border-green-500/20' : ''}
                  ${status === 'overdue' ? 'bg-red-500/5 border-red-500/20' : ''}
                  ${status === 'upcoming' ? 'bg-amber-500/5 border-amber-500/20' : ''}
                  ${status === 'future' ? 'bg-bg-secondary/50 border-bg-border/50 hover:bg-bg-tertiary/50' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                    ${status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}
                    ${status === 'overdue' ? 'bg-red-500/20 text-red-400' : ''}
                    ${status === 'upcoming' ? 'bg-amber-500/20 text-amber-400' : ''}
                    ${status === 'future' ? 'bg-bg-tertiary text-text-muted' : ''}
                  `}>
                    {milestone.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Flag className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-text-primary truncate">{milestone.title}</span>
                      {milestone.completed && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          Completed
                        </span>
                      )}
                      {status === 'overdue' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                          Overdue
                        </span>
                      )}
                      {status === 'upcoming' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                          Due Soon
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-text-muted mb-2 line-clamp-1">{milestone.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due {formatDate(milestone.dueDate)}
                      </span>
                      <span className={status === 'overdue' ? 'text-red-400' : status === 'upcoming' ? 'text-amber-400' : 'text-text-muted'}>
                        {daysUntil(milestone.dueDate)}
                      </span>
                    </div>
                  </div>
                  
                  {showProgress && (
                    <div className="flex flex-col items-end gap-1 min-w-[80px]">
                      <span className="font-medium text-text-primary">{milestone.progress}%</span>
                      <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            background: status === 'completed' ? 'linear-gradient(90deg, #00d4aa, #00b894)' :
                                      status === 'overdue' ? 'linear-gradient(90deg, #e94560, #c73650)' :
                                      'linear-gradient(90deg, #ffd700, #e6c200)',
                            width: `${milestone.progress}%`
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Icon name="chevron-down" size={16} className="text-text-muted transition-transform group-hover:rotate-180" />
                </div>
              </motion.button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 ml-14 space-y-2"
                  >
                    {milestone.tasks.map((taskId, taskIndex) => (
                      <motion.div
                        key={taskId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: taskIndex * 0.03 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary/50 text-sm text-text-secondary"
                      >
                        <Circle className="w-4 h-4" />
                        <span>Task {taskId}</span>
                      </motion.div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Task
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mt-4 py-2 text-sm text-text-muted hover:text-text-primary rounded-xl hover:bg-bg-tertiary/50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Milestone
      </motion.button>
    </GlassPanel>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-3 py-1.5 rounded-xl" style={{ background: `${color}15`, borderColor: `${color}30` }}>
      <div className="flex items-center gap-1.5">
        <span className="font-bold" style={{ color }}>{value}</span>
        <span className="text-xs text-text-muted">{label}</span>
      </div>
    </div>
  );
}