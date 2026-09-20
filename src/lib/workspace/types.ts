import { EnvironmentModifications, CameraPreset } from '@/lib/scene/types';

export type WorkspaceModeId = 'study' | 'brainstorm' | 'plan' | 'focus';

export interface WorkspaceMode {
  id: WorkspaceModeId;
  label: string;
  icon: string;
  description: string;
  shortDescription: string;
  color: string;
  gradient: string;
}

export const WORKSPACE_MODES: WorkspaceMode[] = [
  {
    id: 'study',
    label: 'Study',
    icon: 'book-open',
    description: 'Focused workspace with timer, tasks, and distraction-free environment',
    shortDescription: 'Deep focus session',
    color: '#e94560',
    gradient: 'linear-gradient(135deg, #e94560 0%, #c73650 100%)',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    icon: 'lightbulb',
    description: 'Creative space with spatial whiteboard and idea cards',
    shortDescription: 'Creative ideation',
    color: '#00d4aa',
    gradient: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: 'calendar',
    description: 'Project planning with timeline, milestones, and task board',
    shortDescription: 'Project planning',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #e6c200 100%)',
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: 'target',
    description: 'Minimal environment with single task and large timer',
    shortDescription: 'Distraction-free',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  },
];

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: 'floating' | 'anchored' | 'spatial' | 'docked';
  anchor?: string;
  anchorOffset?: [number, number, number];
  props: Record<string, unknown>;
  zIndex: number;
  visible: boolean;
  animation?: {
    enter: string;
    exit: string;
    delay: number;
  };
}

export type WidgetType = 
  | 'timer' 
  | 'task-list' 
  | 'focus-controls' 
  | 'whiteboard' 
  | 'idea-cards' 
  | 'add-idea' 
  | 'timeline' 
  | 'milestones' 
  | 'task-board' 
  | 'progress-ring' 
  | 'large-timer' 
  | 'single-task' 
  | 'breathing-guide';

export interface WorkspaceConfig {
  mode: WorkspaceModeId;
  environment: EnvironmentModifications;
  widgets: WidgetConfig[];
  camera: CameraPreset;
  generatedAt: number;
  version: string;
}

export interface TimerState {
  duration: number; // seconds
  remaining: number;
  running: boolean;
  mode: 'pomodoro' | 'countdown' | 'stopwatch';
  sessionsCompleted: number;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
  actualMinutes?: number;
  category?: string;
}

export interface IdeaCard {
  id: string;
  content: string;
  position: [number, number, number];
  color: string;
  createdAt: number;
  connections?: string[]; // other idea card IDs
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  type: 'milestone' | 'task' | 'meeting' | 'deadline';
  progress: number;
  dependencies?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: number;
  completed: boolean;
  progress: number;
  tasks: string[];
}

export interface WorkspaceState {
  currentMode: WorkspaceModeId | null;
  config: WorkspaceConfig | null;
  isTransitioning: boolean;
  timer: TimerState;
  tasks: TaskItem[];
  ideas: IdeaCard[];
  timeline: TimelineEvent[];
  milestones: Milestone[];
  currentTask: TaskItem | null;
}

export const DEFAULT_TIMER_STATE: TimerState = {
  duration: 45 * 60,
  remaining: 45 * 60,
  running: false,
  mode: 'countdown',
  sessionsCompleted: 0,
};

export const DEFAULT_TASKS: TaskItem[] = [
  { id: '1', title: 'Review project requirements', completed: false, estimatedMinutes: 30 },
  { id: '2', title: 'Set up development environment', completed: false, estimatedMinutes: 20 },
  { id: '3', title: 'Implement core features', completed: false, estimatedMinutes: 60 },
  { id: '4', title: 'Write tests', completed: false, estimatedMinutes: 30 },
  { id: '5', title: 'Document API', completed: false, estimatedMinutes: 20 },
];

export const DEFAULT_IDEAS: IdeaCard[] = [
  { 
    id: '1', 
    content: 'Problem: Users struggle with context switching', 
    position: [-1.5, 1.5, -2], 
    color: '#e94560',
    createdAt: Date.now(),
  },
  { 
    id: '2', 
    content: 'Users: Remote workers, students, creatives', 
    position: [0, 1.5, -2], 
    color: '#00d4aa',
    createdAt: Date.now(),
  },
  { 
    id: '3', 
    content: 'Solution: Adaptive spatial environments', 
    position: [1.5, 1.5, -2], 
    color: '#ffd700',
    createdAt: Date.now(),
  },
  { 
    id: '4', 
    content: 'Tech: WebXR, Three.js, AI scene understanding', 
    position: [0, 1.0, -2.5], 
    color: '#6366f1',
    createdAt: Date.now(),
  },
];

export const DEFAULT_TIMELINE: TimelineEvent[] = [
  { id: '1', title: 'Project Kickoff', description: 'Initial planning and setup', startTime: Date.now(), endTime: Date.now() + 86400000 * 3, type: 'milestone', progress: 100 },
  { id: '2', title: 'Research Phase', description: 'Market research and user interviews', startTime: Date.now() + 86400000 * 3, endTime: Date.now() + 86400000 * 10, type: 'task', progress: 60 },
  { id: '3', title: 'Design Sprint', description: 'UI/UX design and prototyping', startTime: Date.now() + 86400000 * 10, endTime: Date.now() + 86400000 * 17, type: 'task', progress: 20 },
  { id: '4', title: 'Development Sprint 1', description: 'Core feature implementation', startTime: Date.now() + 86400000 * 17, endTime: Date.now() + 86400000 * 31, type: 'task', progress: 0 },
  { id: '5', title: 'Beta Launch', description: 'Release to beta testers', startTime: Date.now() + 86400000 * 31, endTime: Date.now() + 86400000 * 35, type: 'deadline', progress: 0 },
];

export const DEFAULT_MILESTONES: Milestone[] = [
  { id: '1', title: 'MVP Complete', description: 'Core features working end-to-end', dueDate: Date.now() + 86400000 * 14, completed: false, progress: 45, tasks: ['1', '2', '3'] },
  { id: '2', title: 'Beta Ready', description: 'Polished and tested for beta users', dueDate: Date.now() + 86400000 * 30, completed: false, progress: 10, tasks: ['4', '5'] },
  { id: '3', title: 'Public Launch', description: 'Production release', dueDate: Date.now() + 86400000 * 60, completed: false, progress: 0, tasks: ['6', '7'] },
];