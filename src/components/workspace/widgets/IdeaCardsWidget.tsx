'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Move, 
  Minimize2, 
  Maximize2,
  Download,
  PenTool,
  Eraser,
  Type,
  ArrowUpRight
} from 'lucide-react';
import { GlassPanel, Button, Icon } from '@/components/ui';
import { IdeaCard, DEFAULT_IDEAS } from '@/lib/workspace/types';
import { hapticFeedback, generateId } from '@/lib/utils/mobile';
import { isMobile } from '@/lib/utils/mobile';

const CARD_COLORS = [
  '#e94560', '#00d4aa', '#ffd700', '#6366f1', '#f97316', '#ec4899', '#14b8a6', '#84cc16',
];

export function WhiteboardWidget({ 
  width = 2.4, 
  height = 1.8, 
  backgroundColor = '#001515', 
  grid = true 
}: { 
  width?: number; 
  height?: number; 
  backgroundColor?: string; 
  grid?: boolean;
}) {
  return (
    <GlassPanel variant="strong" padding="none" radius="xl" className="overflow-hidden" style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <div className="relative w-full h-full" style={{ backgroundColor }}>
        {grid && (
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}
        
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-xs text-text-muted px-2 py-1 rounded bg-black/50 backdrop-blur">Whiteboard</span>
          </div>
          <div className="flex items-center gap-1 pointer-events-auto">
            <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
              <PenTool className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
              <Eraser className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
              <Type className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-2 pointer-events-auto">
          <span className="text-xs text-text-muted px-3 py-1.5 rounded-full bg-black/50 backdrop-blur">
            Double-click to add cards • Drag to move
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}

export function IdeaCardsWidget({ 
  cards: initialCards, 
  maxCards = 12, 
  physics = true 
}: { 
  cards?: IdeaCard[];
  maxCards?: number;
  physics?: boolean;
}) {
  const [cards, setCards] = useState<IdeaCard[]>(initialCards || DEFAULT_IDEAS);
  const [selectedCard, setSelectedCard] = useState<IdeaCard | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [newCardColor, setNewCardColor] = useState(CARD_COLORS[0]);
  const mobile = isMobile();
  
  const addCard = useCallback((content: string, position?: [number, number, number]) => {
    if (cards.length >= maxCards) return;
    hapticFeedback('light');
    const newCard: IdeaCard = {
      id: generateId(),
      content: content.trim(),
      position: position || [0, 1.5, -2],
      color: newCardColor,
      createdAt: Date.now(),
    };
    setCards(prev => [...prev, newCard]);
    setNewCardContent('');
    setShowAddForm(false);
  }, [cards.length, maxCards, newCardColor]);
  
  const deleteCard = useCallback((id: string) => {
    hapticFeedback('medium');
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);
  
  const updateCard = useCallback((id: string, updates: Partial<IdeaCard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);
  
  const duplicateCard = useCallback((card: IdeaCard) => {
    if (cards.length >= maxCards) return;
    hapticFeedback('light');
    const newCard: IdeaCard = {
      ...card,
      id: generateId(),
      position: [
        card.position[0] + (Math.random() - 0.5) * 0.5,
        card.position[1],
        card.position[2] + (Math.random() - 0.5) * 0.5,
      ],
      createdAt: Date.now(),
    };
    setCards(prev => [...prev, newCard]);
  }, [cards.length, maxCards]);
  
  return (
    <div className="relative w-full h-full" style={{ minHeight: 300 }}>
      <AnimatePresence>
        {cards.map((card, index) => (
          <IdeaCard3D
            key={card.id}
            card={card}
            index={index}
            selected={selectedCard?.id === card.id}
            onSelect={() => setSelectedCard(card)}
            onDeselect={() => setSelectedCard(null)}
            onUpdate={updateCard}
            onDelete={deleteCard}
            onDuplicate={duplicateCard}
            physics={physics}
          />
        ))}
      </AnimatePresence>
      
      <AddIdeaWidget onAdd={addCard} />
      
      {selectedCard && (
        <CardEditor 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
          onUpdate={updateCard}
          onDelete={deleteCard}
          onDuplicate={duplicateCard}
        />
      )}
    </div>
  );
}

function IdeaCard3D({ 
  card, 
  index, 
  selected, 
  onSelect, 
  onDeselect, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  physics,
}: { 
  card: IdeaCard; 
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onUpdate: (id: string, updates: Partial<IdeaCard>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (card: IdeaCard) => void;
  physics: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; pos: [number, number, number] } | null>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, pos: card.position };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = (e.clientX - dragStart.current.x) * 0.01;
    const dy = (e.clientY - dragStart.current.y) * 0.01;
    onUpdate(card.id, {
      position: [
        dragStart.current.pos[0] + dx,
        dragStart.current.pos[1],
        dragStart.current.pos[2] - dy,
      ],
    });
  };
  
  const handleMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  const handleDoubleClick = () => {
    onSelect();
  };
  
  return (
    <motion.div
      className="absolute pointer-events-auto"
      style={{
        left: `calc(50% + ${card.position[0]} * 100px)`,
        top: `calc(50% - ${card.position[1]} * 100px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: selected ? 100 : index + 10,
      }}
      animate={{
        x: physics && !dragging ? Math.sin(Date.now() / 2000 + index) * 2 : 0,
        y: physics && !dragging ? Math.cos(Date.now() / 2500 + index) * 2 : 0,
      }}
      transition={{ duration: 3, ease: 'easeInOut' }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      <motion.div
        className={`
          relative min-w-[180px] max-w-[280px] p-4 rounded-xl shadow-xl
          backdrop-blur-sm border transition-all duration-200
          ${selected ? 'ring-2 ring-accent-primary' : ''}
          ${hovered ? 'shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : ''}
        `}
        style={{ 
          background: `${card.color}20`, 
          borderColor: `${card.color}40`,
          boxShadow: `0 4px 20px ${card.color}30`,
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start gap-2">
          <div className="w-2 h-full rounded-l-full" style={{ background: card.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{card.content}</p>
          </div>
        </div>
        
        <AnimatePresence>
          {(hovered || selected) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Button variant="ghost" size="icon" onClick={() => onDuplicate(card)} className="text-text-muted hover:text-text-primary" aria-label="Duplicate">
                <Icon name="copy" size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(card.id)} className="text-text-muted hover:text-red-400" aria-label="Delete">
                <Trash2 className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export function AddIdeaWidget({ onAdd }: { onAdd: (content: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAdd(content);
    }
  };
  
  return (
    <motion.div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence>
        {!expanded ? (
          <motion.button
            onClick={() => setExpanded(true)}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-strong shadow-glow"
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <Plus className="w-5 h-5 text-accent-primary" />
            <span className="font-medium text-text-primary">Add Idea</span>
          </motion.button>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 w-full max-w-md glass-strong p-3 rounded-xl shadow-glow"
          >
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="What's your idea?"
              className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-sm resize-none focus:outline-none min-h-[44px] max-h-32"
              rows={1}
            />
            <Button variant="primary" size="sm" type="submit" disabled={!content.trim()}>
              Add
            </Button>
            <Button variant="ghost" size="icon" type="button" onClick={() => { setExpanded(false); setContent(''); }}>
              <Icon name="x" size={18} />
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CardEditor({ card, onClose, onUpdate, onDelete, onDuplicate }: { 
  card: IdeaCard; 
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<IdeaCard>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (card: IdeaCard) => void;
}) {
  const [content, setContent] = useState(card.content);
  const [color, setColor] = useState(card.color);
  
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
        className="w-full max-w-md glass-strong rounded-2xl p-6 shadow-glow"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-text-primary">Edit Idea</h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-bg-tertiary/50 hover:bg-bg-tertiary text-text-muted transition-colors">
            <Icon name="x" size={20} />
          </button>
        </div>
        
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); onUpdate(card.id, { content: e.target.value }); }}
          className="w-full min-h-[100px] p-3 rounded-xl bg-bg-tertiary border border-bg-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary resize-y"
          placeholder="Write your idea..."
        />
        
        <div className="mt-4">
          <p className="text-xs text-text-muted mb-2">Color</p>
          <div className="flex gap-2 flex-wrap">
            {CARD_COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); onUpdate(card.id, { color: c }); }}
                className={`
                  w-8 h-8 rounded-xl border-2 transition-all
                  ${color === c ? 'border-white scale-110' : 'border-transparent hover:border-bg-border'}
                `}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-bg-border">
          <Button variant="ghost" onClick={() => { onDuplicate(card); onClose(); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Duplicate
          </Button>
          <Button variant="ghost" onClick={() => { onDelete(card.id); onClose(); }} className="text-red-400 hover:text-red-300">
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}