'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal,
  GripVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GlassPanel, Button, Input, Icon } from '@/components/ui';
import { hapticFeedback, generateId } from '@/lib/utils/mobile';
import { isMobile } from '@/lib/utils/mobile';

type ColumnId = 'backlog' | 'in-progress' | 'review' | 'done';

interface BoardTask {
  id: string;
  title: string;
  description?: string;
  column: ColumnId;
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
  tags: string[];
  assignee?: string;
}

const DEFAULT_COLUMNS: { id: ColumnId; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: '#6b6b8d' },
  { id: 'in-progress', label: 'In Progress', color: '#e94560' },
  { id: 'review', label: 'Review', color: '#ffd700' },
  { id: 'done', label: 'Done', color: '#00d4aa' },
];

const INITIAL_TASKS: BoardTask[] = [
  { id: '1', title: 'Design system setup', column: 'done', priority: 'high', tags: ['design'], dueDate: Date.now() - 86400000 * 2 },
  { id: '2', title: 'API integration', column: 'review', priority: 'high', tags: ['backend'], dueDate: Date.now() + 86400000 },
  { id: '3', title: 'User authentication', column: 'in-progress', priority: 'high', tags: ['frontend', 'security'], dueDate: Date.now() + 86400000 * 3 },
  { id: '4', title: 'Dashboard components', column: 'in-progress', priority: 'medium', tags: ['frontend'], dueDate: Date.now() + 86400000 * 5 },
  { id: '5', title: 'Write documentation', column: 'backlog', priority: 'low', tags: ['docs'], dueDate: Date.now() + 86400000 * 7 },
  { id: '6', title: 'Performance optimization', column: 'backlog', priority: 'medium', tags: ['performance'], dueDate: Date.now() + 86400000 * 10 },
];

export function TaskBoardWidget({ 
  columns: initialColumns, 
  tasks: initialTasks 
}: { 
  columns?: { id: string; label: string }[];
  tasks?: BoardTask[];
}) {
  const [boardTasks, setBoardTasks] = useState<BoardTask[]>(initialTasks || INITIAL_TASKS);
  const columns = initialColumns?.map(c => ({ ...c, color: DEFAULT_COLUMNS.find(d => d.id === c.id)?.color || '#6b6b8d' })) || DEFAULT_COLUMNS;
  const [draggedTask, setDraggedTask] = useState<BoardTask | null>(null);
  const [showAddForm, setShowAddForm] = useState<ColumnId | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const mobile = isMobile();
  
  const columnTasks = (columnId: ColumnId) => boardTasks.filter(t => t.column === columnId);
  
  const moveTask = (taskId: string, newColumn: ColumnId) => {
    hapticFeedback('light');
    setBoardTasks(prev => prev.map(t => t.id === taskId ? { ...t, column: newColumn } : t));
  };
  
  const addTask = (column: ColumnId) => {
    if (!newTaskTitle.trim()) return;
    hapticFeedback('light');
    const newTask: BoardTask = {
      id: generateId(),
      title: newTaskTitle.trim(),
      column,
      priority: 'medium',
      tags: [],
    };
    setBoardTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setShowAddForm(null);
  };
  
  const deleteTask = (id: string) => {
    hapticFeedback('medium');
    setBoardTasks(prev => prev.filter(t => t.id !== id));
  };
  
  const handleDragStart = (e: any, task: BoardTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, columnId: ColumnId) => {
    e.preventDefault();
    if (draggedTask) {
      moveTask(draggedTask.id, columnId);
      setDraggedTask(null);
    }
  };
  
  return (
    <GlassPanel variant="strong" padding="none" radius="xl" className="overflow-hidden" style={{ minHeight: 350 }}>
      <div className="flex flex-row overflow-x-auto pb-4 gap-4" style={{ minWidth: 'max-content' }}>
        {columns.map((column, colIndex) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colIndex * 0.05 }}
            className="relative flex-shrink-0 w-72 md:w-80 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id as ColumnId)}
          >
            <div className="flex items-center justify-between p-3 border-b border-bg-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
                <span className="font-medium text-text-primary">{column.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted">
                  {columnTasks(column.id as ColumnId).length}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            
            <div 
              className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]"
              onDragOver={handleDragOver}
onDrop={(e) => handleDrop(e, column.id as ColumnId)}
            >
              <AnimatePresence>
                {columnTasks(column.id as ColumnId).map((task, taskIndex) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: taskIndex * 0.03 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={() => setDraggedTask(null)}
                    className={`
                      relative p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all
                      ${draggedTask?.id === task.id ? 'opacity-50 rotate-2 scale-105' : ''}
                      ${task.priority === 'high' ? 'border-l-3 border-red-500' : ''}
                      ${task.priority === 'medium' ? 'border-l-3 border-amber-500' : ''}
                      ${task.priority === 'low' ? 'border-l-3 border-green-500' : ''}
                      bg-bg-tertiary/50 border border-bg-border/50 hover:bg-bg-tertiary hover:border-accent-primary/30
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary mb-1 line-clamp-2">{task.title}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {task.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted">
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted">
                              +{task.tags.length - 3}
                            </span>
                          )}
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary" onClick={(e) => { e.stopPropagation(); /* edit */ }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-text-muted hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {showAddForm === column.id ? (
                <motion.form
                  onSubmit={(e) => { e.preventDefault(); addTask(column.id as ColumnId); }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-2 space-y-2"
                >
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(column.id as ColumnId); } if (e.key === 'Escape') setShowAddForm(null); }}
                    placeholder="Add task..."
                    size="sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" type="submit" disabled={!newTaskTitle.trim()}>Add</Button>
                    <Button variant="ghost" size="sm" type="button" onClick={() => { setShowAddForm(null); setNewTaskTitle(''); }}>
                      <Icon name="x" size={16} />
                    </Button>
                  </div>
                </motion.form>
              ) : (
                <motion.button
                  onClick={() => { setShowAddForm(column.id as ColumnId); setNewTaskTitle(''); }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </GlassPanel>
  );
}