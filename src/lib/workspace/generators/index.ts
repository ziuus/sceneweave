import { SceneAnalysis, EnvironmentModifications, CameraPreset } from '@/lib/scene/types';
import { WorkspaceConfig, WidgetConfig, WORKSPACE_MODES } from '@/lib/workspace/types';

function getModeColor(mode: string): string {
  const m = WORKSPACE_MODES.find(w => w.id === mode);
  return m?.color || '#e94560';
}

function createBaseEnvironment(scene: SceneAnalysis, mode: string): EnvironmentModifications {
  const color = getModeColor(mode);
  const hasWindow = scene.spatialFeatures.hasWindow;
  const focalPoint = scene.spatialFeatures.focalPoint || [0, 0.8, -0.5];
  
  return {
    lighting: {
      ambientIntensity: 0.8,
      ambientColor: '#ffffff',
      keyLightIntensity: 1.2,
      keyLightColor: '#ffffff',
      keyLightPosition: [focalPoint[0], focalPoint[1] + 3.0, focalPoint[2] + 2],
      accentLights: [
        {
          position: [focalPoint[0] - 2, focalPoint[1] + 2, focalPoint[2] - 1],
          color: color,
          intensity: 0.5,
          type: 'point',
        },
      ],
      fog: {
        color: '#0a0a0f',
        density: 0.005,
      },
    },
    materials: [],
    camera: {
      position: [focalPoint[0], focalPoint[1] + 2.0, focalPoint[2] + 4.0],
      target: [focalPoint[0], focalPoint[1] + 0.5, focalPoint[2] - 0.5],
      fov: 65,
      transitionDuration: 1.5,
    },
    effects: {
      vignette: 0.3,
      bloom: 0.1,
      chromaticAberration: 0.0,
    },
  };
}

export function generateWorkspaceConfig(mode: string, scene: SceneAnalysis): WorkspaceConfig {
  const baseEnv = createBaseEnvironment(scene, mode);
  const focalPoint = scene.spatialFeatures.focalPoint || [0, 0.8, -0.5];
  const deskPosition = scene.objects.find(o => o.type === 'desk')?.position || focalPoint;
  const monitorPosition = scene.objects.find(o => o.type === 'monitor')?.position || [0, 1.3, -1.1];
  const whiteboardPosition = scene.objects.find(o => o.type === 'whiteboard')?.position || [-2.0, 1.4, 0.5];
  
  let environment: EnvironmentModifications;
  let widgets: WidgetConfig[];
  let camera: CameraPreset;
  
  switch (mode) {
    case 'study':
      environment = {
        ...baseEnv,
        lighting: {
          ...baseEnv.lighting,
          ambientIntensity: 0.25,
          ambientColor: '#1a1520',
          keyLightIntensity: 1.2,
          keyLightColor: '#ff6b8a',
          keyLightPosition: [deskPosition[0], deskPosition[1] + 1.2, deskPosition[2] - 0.8],
          accentLights: [
            {
              position: [deskPosition[0], deskPosition[1] + 1.5, deskPosition[2] - 1.2],
              color: '#ffd700',
              intensity: 0.5,
              type: 'spot',
            },
            {
              position: [monitorPosition[0], monitorPosition[1], monitorPosition[2] - 0.1],
              color: '#64b5f6',
              intensity: 0.6,
              type: 'rect',
            },
          ],
          fog: { color: '#0a0a0f', density: 0.03 },
        },
        materials: [
          { objectId: 'desk', emissive: '#e94560', emissiveIntensity: 0.1, color: '#2a1a20' },
          { objectId: 'monitor', emissive: '#64b5f6', emissiveIntensity: 0.8 },
          { objectId: 'lamp', emissive: '#ffd700', emissiveIntensity: 1.0 },
          { objectId: 'chair', opacity: 0.9 },
          { objectId: 'plant', opacity: 0.5 },
          { objectId: 'bookshelf', opacity: 0.4 },
          { objectId: 'whiteboard', opacity: 0.2 },
        ],
        camera: {
          position: [deskPosition[0], deskPosition[1] + 1.0, deskPosition[2] + 1.8],
          target: [deskPosition[0], deskPosition[1] + 0.2, deskPosition[2] - 0.3],
          fov: 50,
          transitionDuration: 1.8,
        },
        effects: {
          vignette: 0.5,
          bloom: 0.2,
          chromaticAberration: 0.0,
        },
      };
      
      widgets = [
        {
          id: 'timer',
          type: 'timer',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [0, 1.5, -0.5],
          props: { duration: 45 * 60, mode: 'countdown', showControls: true },
          zIndex: 10,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.2 },
        },
        {
          id: 'task-list',
          type: 'task-list',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [-1.2, 1.2, -0.5],
          props: { tasks: [], showAdd: true, maxVisible: 5 },
          zIndex: 9,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.3 },
        },
        {
          id: 'focus-controls',
          type: 'focus-controls',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [1.2, 1.2, -0.5],
          props: { showBreathing: true, showMusic: true, showStats: true },
          zIndex: 9,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.4 },
        },
      ];
      
      camera = environment.camera;
      break;
      
    case 'brainstorm':
      environment = {
        ...baseEnv,
        lighting: {
          ...baseEnv.lighting,
          ambientIntensity: 0.4,
          ambientColor: '#102020',
          keyLightIntensity: 1.0,
          keyLightColor: '#00ffcc',
          keyLightPosition: [whiteboardPosition[0], whiteboardPosition[1] + 0.5, whiteboardPosition[2] + 1.5],
          accentLights: [
            {
              position: [whiteboardPosition[0] - 1, whiteboardPosition[1], whiteboardPosition[2] + 1],
              color: '#e94560',
              intensity: 0.4,
              type: 'point',
            },
            {
              position: [whiteboardPosition[0] + 1, whiteboardPosition[1], whiteboardPosition[2] + 1],
              color: '#ffd700',
              intensity: 0.4,
              type: 'point',
            },
          ],
          fog: { color: '#0a0a0f', density: 0.015 },
        },
        materials: [
          { objectId: 'whiteboard', emissive: '#00d4aa', emissiveIntensity: 0.3, color: '#002020' },
          { objectId: 'desk', color: '#1a2a2a', opacity: 0.8 },
          { objectId: 'monitor', emissive: '#00d4aa', emissiveIntensity: 0.3 },
          { objectId: 'lamp', emissive: '#ffd700', emissiveIntensity: 0.8 },
          { objectId: 'chair', opacity: 0.7 },
          { objectId: 'plant', opacity: 0.6 },
          { objectId: 'bookshelf', opacity: 0.5 },
        ],
        camera: {
          position: [whiteboardPosition[0], whiteboardPosition[1] + 0.2, whiteboardPosition[2] + 2.5],
          target: [whiteboardPosition[0], whiteboardPosition[1], whiteboardPosition[2]],
          fov: 55,
          transitionDuration: 1.8,
        },
        effects: {
          vignette: 0.2,
          bloom: 0.3,
          chromaticAberration: 0.0,
        },
      };
      
      widgets = [
        {
          id: 'whiteboard',
          type: 'whiteboard',
          position: 'spatial',
          anchor: 'whiteboard',
          anchorOffset: [0, 0, 0.1],
          props: { width: 2.4, height: 1.8, backgroundColor: '#001515', grid: true },
          zIndex: 10,
          visible: true,
          animation: { enter: 'scale-in', exit: 'scale-in', delay: 0.1 },
        },
        {
          id: 'idea-cards',
          type: 'idea-cards',
          position: 'spatial',
          anchor: 'whiteboard',
          anchorOffset: [0, 0, 0.15],
          props: { cards: [], maxCards: 12, physics: true },
          zIndex: 11,
          visible: true,
          animation: { enter: 'scale-in', exit: 'scale-in', delay: 0.3 },
        },
        {
          id: 'add-idea',
          type: 'add-idea',
          position: 'floating',
          anchor: 'whiteboard',
          anchorOffset: [0, -1.2, 1.5],
          props: { placeholder: 'Add an idea...', voiceInput: true },
          zIndex: 12,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.5 },
        },
      ];
      
      camera = environment.camera;
      break;
      
    case 'plan':
      environment = {
        ...baseEnv,
        lighting: {
          ...baseEnv.lighting,
          ambientIntensity: 0.35,
          ambientColor: '#1a1a10',
          keyLightIntensity: 0.9,
          keyLightColor: '#ffe066',
          keyLightPosition: [focalPoint[0], focalPoint[1] + 1.5, focalPoint[2] + 1],
          accentLights: [
            {
              position: [focalPoint[0] - 2, focalPoint[1] + 1, focalPoint[2]],
              color: '#e94560',
              intensity: 0.3,
              type: 'point',
            },
            {
              position: [focalPoint[0] + 2, focalPoint[1] + 1, focalPoint[2]],
              color: '#00d4aa',
              intensity: 0.3,
              type: 'point',
            },
          ],
          fog: { color: '#0a0a0f', density: 0.02 },
        },
        materials: [
          { objectId: 'wall-back', emissive: '#ffd700', emissiveIntensity: 0.1 },
          { objectId: 'desk', color: '#2a2a1a', opacity: 0.9 },
          { objectId: 'monitor', emissive: '#ffd700', emissiveIntensity: 0.4 },
          { objectId: 'whiteboard', emissive: '#ffd700', emissiveIntensity: 0.2, color: '#1a1a00' },
          { objectId: 'chair', opacity: 0.8 },
          { objectId: 'plant', opacity: 0.7 },
          { objectId: 'bookshelf', opacity: 0.9 },
        ],
        camera: {
          position: [focalPoint[0], focalPoint[1] + 2.0, focalPoint[2] + 3],
          target: [focalPoint[0], focalPoint[1] + 0.5, focalPoint[2] - 0.5],
          fov: 65,
          transitionDuration: 2.0,
        },
        effects: {
          vignette: 0.25,
          bloom: 0.15,
          chromaticAberration: 0.0,
        },
      };
      
      widgets = [
        {
          id: 'timeline',
          type: 'timeline',
          position: 'spatial',
          anchor: 'wall-back',
          anchorOffset: [0, 0.5, 0.2],
          props: { events: [], width: 4, height: 1.5, interactive: true },
          zIndex: 10,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.2 },
        },
        {
          id: 'milestones',
          type: 'milestones',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [-1.5, 1.5, -0.5],
          props: { milestones: [], showProgress: true },
          zIndex: 9,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.3 },
        },
        {
          id: 'task-board',
          type: 'task-board',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [1.5, 1.5, -0.5],
          props: { columns: ['Backlog', 'In Progress', 'Review', 'Done'], tasks: [] },
          zIndex: 9,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.4 },
        },
        {
          id: 'progress-ring',
          type: 'progress-ring',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [0, 2.0, -1.5],
          props: { progress: 0, size: 120, showPercentage: true },
          zIndex: 11,
          visible: true,
          animation: { enter: 'scale-in', exit: 'scale-in', delay: 0.5 },
        },
      ];
      
      camera = environment.camera;
      break;
      
    case 'focus':
      environment = {
        ...baseEnv,
        lighting: {
          ...baseEnv.lighting,
          ambientIntensity: 0.08,
          ambientColor: '#0a0a10',
          keyLightIntensity: 1.5,
          keyLightColor: '#ff8c42',
          keyLightPosition: [deskPosition[0], deskPosition[1] + 1.0, deskPosition[2] - 0.5],
          accentLights: [],
          fog: { color: '#050508', density: 0.08 },
        },
        materials: [
          { objectId: 'desk', emissive: '#e94560', emissiveIntensity: 0.15, color: '#2a0a10' },
          { objectId: 'monitor', emissive: '#6366f1', emissiveIntensity: 0.2, opacity: 0.3 },
          { objectId: 'lamp', emissive: '#ff8c42', emissiveIntensity: 1.2 },
          { objectId: 'chair', opacity: 0.3 },
          { objectId: 'plant', opacity: 0.1 },
          { objectId: 'bookshelf', opacity: 0.05 },
          { objectId: 'whiteboard', opacity: 0.02 },
          { objectId: 'laptop', opacity: 0.2 },
          { objectId: 'keyboard', opacity: 0.5 },
          { objectId: 'mouse', opacity: 0.5 },
          { objectId: 'coffee', opacity: 0.3 },
        ],
        camera: {
          position: [deskPosition[0], deskPosition[1] + 0.8, deskPosition[2] + 1.2],
          target: [deskPosition[0], deskPosition[1] + 0.1, deskPosition[2] - 0.4],
          fov: 40,
          transitionDuration: 2.2,
        },
        effects: {
          vignette: 0.8,
          bloom: 0.4,
          chromaticAberration: 0.005,
        },
      };
      
      widgets = [
        {
          id: 'large-timer',
          type: 'large-timer',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [0, 1.2, -0.3],
          props: { duration: 45 * 60, mode: 'countdown', size: 'large', minimal: true },
          zIndex: 10,
          visible: true,
          animation: { enter: 'scale-in', exit: 'scale-in', delay: 0.1 },
        },
        {
          id: 'single-task',
          type: 'single-task',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [0, 0.5, -0.3],
          props: { task: null, showProgress: true, minimal: true },
          zIndex: 9,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.3 },
        },
        {
          id: 'breathing-guide',
          type: 'breathing-guide',
          position: 'floating',
          anchor: 'desk',
          anchorOffset: [0, -0.5, -0.3],
          props: { pattern: '4-7-8', autoStart: false, minimal: true },
          zIndex: 9,
          visible: true,
          animation: { enter: 'slide-up', exit: 'slide-down', delay: 0.5 },
        },
      ];
      
      camera = environment.camera;
      break;
      
    default:
      return generateWorkspaceConfig('study', scene);
  }
  
  return {
    mode: mode as any,
    environment,
    widgets,
    camera,
    generatedAt: Date.now(),
    version: '1.0.0',
  };
}