'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Plus, 
  Trash2, 
  GripVertical,
  Edit2,
  Clock,
  MoreVertical
} from 'lucide-react';
import { GlassPanel, Button, Input, Icon } from '@/components/ui';
import { useApp } from '@/lib/store/AppContext';
import { TaskItem, DEFAULT_TASKS } from '@/lib/workspace/types';
import { hapticFeedback, generateId } from '@/lib/utils/mobile';
import { isMobile } from '@/lib/utils/mobile';

export function TaskListWidget({ 
  tasks: initialTasks, 
  showAdd = true, 
  maxVisible = 5 
}: { 
  tasks?: TaskItem[];
  showAdd?: boolean;
  maxVisible?: number;
}) {
  const { workspaceState, updateTasks } = useApp();
  const tasks = workspaceState.tasks;
  const [localTasks, setLocalTasks] = useState<TaskItem[]>(tasks || initialTasks || DEFAULT_TASKS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const mobile = isMobile();
  
  useEffect(() => {
    if (tasks) setLocalTasks(tasks);
  }, [tasks]);
  
  const saveTasks = useCallback((newTasks: TaskItem[]) => {
    setLocalTasks(newTasks);
    updateTasks(newTasks);
  }, [updateTasks]);
  
  const toggleTask = (id: string) => {
    hapticFeedback('selection');
    saveTasks(localTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  
  const deleteTask = (id: string) => {
    hapticFeedback('medium');
    saveTasks(localTasks.filter(t => t.id !== id));
  };
  
  const startEdit = (task: TaskItem) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };
  
  const finishEdit = () => {
    if (editValue.trim() && editingId) {
      hapticFeedback('light');
      saveTasks(localTasks.map(t => t.id === editingId ? { ...t, title: editValue.trim() } : t));
    }
    setEditingId(null);
    setEditValue('');
  };
  
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    hapticFeedback('light');
    const newTask: TaskItem = {
      id: generateId(),
      title: newTaskTitle.trim(),
      completed: false,
      estimatedMinutes: 25,
    };
    saveTasks([newTask, ...localTasks]);
    setNewTaskTitle('');
    setShowAddForm(false);
  };
  
  const visibleTasks = localTasks.slice(0, maxVisible);
  const hiddenCount = localTasks.length - maxVisible;
  
  return (
    <GlassPanel variant="strong" padding="lg" radius="xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-medium text-text-primary">Tasks</h3>
          <p className="text-xs text-text-muted">
            {localTasks.filter(t => t.completed).length} of {localTasks.length} completed
          </p>
        </div>
        {showAdd && !showAddForm && (
          <Button variant="ghost" size="icon" onClick={() => setShowAddForm(true)} className="text-text-muted hover:text-accent-primary">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>
      
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a task..."
                size="sm"
                autoFocus
                className="flex-1"
              />
              <Button variant="primary" size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewTaskTitle(''); }}>
                <Icon name="x" size={18} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence>
          {visibleTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-text-muted"
            >
              <Icon name="check-circle" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks yet</p>
              {showAdd && <p className="text-xs mt-1">Click + to add your first task</p>}
            </motion.div>
          ) : (
            visibleTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                  ${task.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-bg-secondary/50 border-bg-border/50 hover:bg-bg-tertiary/50'}
                `}
              >
                <motion.button
                  onClick={() => toggleTask(task.id)}
                  whileTap={{ scale: 0.9 }}
                  className={`
                    flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200
                    ${task.completed 
                      ? 'border-green-500 bg-green-500 text-white' 
                      : 'border-bg-border text-text-muted hover:border-accent-primary hover:text-accent-primary'
                    }
                  `}
                >
                  {task.completed && <CheckCircle className="w-4 h-4" />}
                </motion.button>
                
                {editingId === task.id ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') { setEditingId(null); setEditValue(''); } }}
                    onBlur={finishEdit}
                    autoFocus
                    size="sm"
                    className="flex-1 min-w-0"
                  />
                ) : (
                  <motion.span
                    className={`
                      flex-1 text-left truncate transition-colors
                      ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}
                    `}
                    onDoubleClick={() => startEdit(task)}
                  >
                    {task.title}
                  </motion.span>
                )}
                
                {task.estimatedMinutes && !task.completed && !editingId && (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs text-text-muted px-2 py-0.5 rounded bg-bg-secondary">
                    <Clock className="w-3 h-3" />
                    {task.estimatedMinutes}min
                  </span>
                )}
                
                {!editingId && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(task)} className="text-text-muted hover:text-text-primary" aria-label="Edit">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="text-text-muted hover:text-red-400" aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {hiddenCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { /* expand */ }}
            className="w-full py-2 text-sm text-text-muted hover:text-text-primary rounded-xl hover:bg-bg-tertiary/50 transition-colors"
          >
            + {hiddenCount} more task{hiddenCount > 1 ? 's' : ''}
          </motion.button>
        )}
      </div>
      
      {localTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-bg-border flex items-center justify-between"
        >
          <span className="text-xs text-text-muted">
            {localTasks.filter(t => !t.completed).length} remaining
          </span>
          <Button variant="ghost" size="sm" onClick={() => saveTasks(localTasks.filter(t => !t.completed))} disabled={localTasks.every(t => !t.completed)}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear completed
          </Button>
        </motion.div>
      )}
    </GlassPanel>
  );
}