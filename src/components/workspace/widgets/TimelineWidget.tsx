'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Circle, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Calendar
} from 'lucide-react';
import { GlassPanel, Button, Icon } from '@/components/ui';
import { TimelineEvent, DEFAULT_TIMELINE } from '@/lib/workspace/types';
import { formatTime, hapticFeedback, generateId } from '@/lib/utils/mobile';
import { isMobile } from '@/lib/utils/mobile';

export function TimelineWidget({ 
  events: initialEvents, 
  width = 4, 
  height = 1.5, 
  interactive = true 
}: { 
  events?: TimelineEvent[];
  width?: number;
  height?: number;
  interactive?: boolean;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents || DEFAULT_TIMELINE);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const mobile = isMobile();
  
  const sortedEvents = [...events].sort((a, b) => a.startTime - b.startTime);
  const now = Date.now();
  
  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'milestone': return '#ffd700';
      case 'deadline': return '#e94560';
      case 'meeting': return '#6366f1';
      default: return '#00d4aa';
    }
  };
  
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'milestone': return Flag;
      case 'deadline': return AlertCircle;
      case 'meeting': return Circle;
      default: return Circle;
    }
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <GlassPanel variant="strong" padding="lg" radius="xl" style={{ minHeight: 300 }}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-medium text-text-primary">Project Timeline</h3>
          <p className="text-xs text-text-muted">{events.length} events</p>
        </div>
        <div className="flex items-center gap-1 bg-bg-tertiary/50 rounded-xl p-1">
          {(['month', 'week', 'day'] as const).map(mode => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(mode)}
              className="text-xs"
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-primary/50 to-accent-secondary/50" />
        
        <div className="space-y-4 pl-12">
          {sortedEvents.map((event, index) => {
            const isPast = event.endTime < now;
            const isCurrent = event.startTime <= now && event.endTime >= now;
            const isFuture = event.startTime > now;
            const EventIcon = getEventIcon(event.type);
            const color = getEventColor(event.type);
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
                onClick={() => interactive && setSelectedEvent(event)}
              >
                <div className={`
                  absolute left-[-6px] top-1 w-3 h-3 rounded-full border-2 transition-all
                  ${isPast ? `bg-${color === '#ffd700' ? 'yellow' : color === '#e94560' ? 'red' : color === '#6366f1' ? 'indigo' : 'green'}-500 border-${color === '#ffd700' ? 'yellow' : color === '#e94560' ? 'red' : color === '#6366f1' ? 'indigo' : 'green'}-500` : ''}
                  ${isCurrent ? `bg-${color === '#ffd700' ? 'yellow' : color === '#e94560' ? 'red' : color === '#6366f1' ? 'indigo' : 'green'}-500 border-${color === '#ffd700' ? 'yellow' : color === '#e94560' ? 'red' : color === '#6366f1' ? 'indigo' : 'green'}-500 animate-pulse` : 'bg-bg-tertiary border-bg-border'}
                  ${isFuture ? 'bg-bg-tertiary border-bg-border' : ''}
                `} />
                
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`
                    p-3 rounded-xl transition-all
                    ${isPast ? 'bg-green-500/5 border-green-500/20' : isCurrent ? 'bg-accent-primary/10 border-accent-primary/30' : 'bg-bg-secondary/50 border-bg-border/50 hover:bg-bg-tertiary/50'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <EventIcon className={`
                      flex-shrink-0 w-5 h-5 mt-0.5
                      ${isPast ? 'text-green-500' : isCurrent ? 'text-accent-primary' : 'text-text-muted'}
                    `} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-text-primary truncate">{event.title}</span>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary">
                            Now
                          </span>
                        )}
                        {isPast && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted mb-1">{event.description}</p>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.startTime)} - {formatDate(event.endTime)}
                        </span>
                        {event.progress > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {event.progress}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {interactive && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => { /* add event */ }}
          className="w-full mt-4 py-2 text-sm text-text-muted hover:text-text-primary rounded-xl hover:bg-bg-tertiary/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </motion.button>
      )}
      
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </GlassPanel>
  );
}

function EventDetailModal({ event, onClose }: { event: TimelineEvent; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-strong rounded-2xl p-6 shadow-glow"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-text-primary">Event Details</h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-bg-tertiary/50 hover:bg-bg-tertiary text-text-muted transition-colors">
            <Icon name="x" size={20} />
          </button>
        </div>
        
        <p className="text-text-secondary mb-4">{event.description}</p>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span>{new Date(event.startTime).toLocaleDateString()} - {new Date(event.endTime).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Circle className="w-4 h-4 text-text-muted" />
            <span>Progress: {event.progress}%</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary">Edit</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}