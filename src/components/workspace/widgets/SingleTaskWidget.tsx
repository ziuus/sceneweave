'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  Flag, 
  Tag,
  MoreHorizontal,
  Edit2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GlassPanel, Button, Icon, Input } from '@/components/ui';
import { TaskItem, DEFAULT_TASKS } from '@/lib/workspace/types';
import { useApp } from '@/lib/store/AppContext';
import { hapticFeedback, generateId } from '@/lib/utils/mobile';

export function SingleTaskWidget({ 
  task: initialTask, 
  showProgress = true, 
  minimal = true 
}: { 
  task?: TaskItem | null;
  showProgress?: boolean;
  minimal?: boolean;
}) {
  const { workspaceState, updateTasks, setCurrentTask } = useApp();
  const tasks = workspaceState.tasks;
  const [currentTask, setLocalTask] = useState<TaskItem | null>(initialTask || tasks[0] || null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  
  React.useEffect(() => {
    if (initialTask) setLocalTask(initialTask);
    else if (tasks.length > 0 && !currentTask) setLocalTask(tasks[0]);
  }, [initialTask, tasks, currentTask]);
  
  const handleComplete = () => {
    if (!currentTask) return;
    hapticFeedback('medium');
    const updated = { ...currentTask, completed: true };
    setLocalTask(updated);
    setCurrentTask(updated);
    updateTasks(tasks.map(t => t.id === currentTask.id ? updated : t));
  };
  
  const handleNext = () => {
    const currentIndex = tasks.findIndex(t => t.id === currentTask?.id);
    const nextIndex = (currentIndex + 1) % tasks.length;
    const nextTask = tasks[nextIndex];
    setLocalTask(nextTask);
    setCurrentTask(nextTask);
    hapticFeedback('light');
  };
  
  const handlePrev = () => {
    const currentIndex = tasks.findIndex(t => t.id === currentTask?.id);
    const prevIndex = currentIndex <= 0 ? tasks.length - 1 : currentIndex - 1;
    const prevTask = tasks[prevIndex];
    setLocalTask(prevTask);
    setCurrentTask(prevTask);
    hapticFeedback('light');
  };
  
  const startEdit = () => {
    if (!currentTask) return;
    setEditValue(currentTask.title);
    setEditing(true);
  };
  
  const finishEdit = () => {
    if (!currentTask || !editValue.trim()) return;
    hapticFeedback('light');
    const updated = { ...currentTask, title: editValue.trim() };
    setLocalTask(updated);
    setCurrentTask(updated);
    updateTasks(tasks.map(t => t.id === currentTask.id ? updated : t));
    setEditing(false);
  };
  
  if (!currentTask) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <Icon name="check-circle" size={48} className="text-text-muted/30 mb-4" />
        <p className="text-text-muted">No current task</p>
        <p className="text-xs text-text-muted mt-1">Add tasks in Study mode</p>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {editing ? (
        <GlassPanel variant="strong" padding="lg" radius="xl">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={finishEdit}
            autoFocus
            size="lg"
          />
        </GlassPanel>
      ) : (
        <GlassPanel variant="strong" padding="lg" radius="xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') setEditing(false); }}
                  onBlur={finishEdit}
                  autoFocus
                  size="lg"
                />
              ) : (
                <motion.h3
                  className={`font-display text-2xl font-bold truncate ${currentTask.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}
                  key={currentTask.id}
                  onDoubleClick={startEdit}
                >
                  {currentTask.title}
                </motion.h3>
              )}
            </div>
            
            {!editing && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handlePrev} className="text-text-muted hover:text-text-primary" aria-label="Previous task">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext} className="text-text-muted hover:text-text-primary" aria-label="Next task">
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={startEdit} className="text-text-muted hover:text-text-primary" aria-label="Edit task">
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { /* delete */ }} className="text-text-muted hover:text-red-400" aria-label="Delete task">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
          
          {!currentTask.completed && (
            <motion.button
              onClick={handleComplete}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-medium text-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #00b894)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                Mark Complete
              </span>
            </motion.button>
          )}
          
          {currentTask.completed && (
            <div className="w-full py-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-2 text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">Task Completed!</span>
            </div>
          )}
          
          {showProgress && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Session Progress</span>
                <span className="font-medium text-text-primary">
                  {tasks.filter(t => t.completed).length} / {tasks.length}
                </span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    background: 'linear-gradient(90deg, #e94560, #00d4aa)',
                    width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          
          {(currentTask.estimatedMinutes || currentTask.actualMinutes) && (
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-text-muted">
              {currentTask.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Est: {currentTask.estimatedMinutes}min
                </span>
              )}
              {currentTask.actualMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Actual: {currentTask.actualMinutes}min
                </span>
              )}
            </div>
          )}
        </GlassPanel>
      )}
    </motion.div>
  );
}