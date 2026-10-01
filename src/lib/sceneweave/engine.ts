import { createObjectFromTemplate, getTemplate } from './catalog';
import { DEMO_SCENE } from './demo';
import {
  ActionResult,
  AddObjectAction,
  AgentTurn,
  MoveObjectAction,
  ObjectType,
  RearrangeSceneAction,
  RemoveObjectAction,
  ReplaceObjectAction,
  ResizeObjectAction,
  RotateObjectAction,
  SceneAction,
  SceneObject,
  SceneState,
  Vec3,
} from './types';

export function cloneScene(scene: SceneState): SceneState {
  return JSON.parse(JSON.stringify(scene)) as SceneState;
}

export function createInitialScene(): SceneState {
  return cloneScene(DEMO_SCENE);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function footprint(obj: SceneObject) {
  return {
    minX: obj.position[0] - obj.dimensions[0] / 2,
    maxX: obj.position[0] + obj.dimensions[0] / 2,
    minZ: obj.position[2] - obj.dimensions[2] / 2,
    maxZ: obj.position[2] + obj.dimensions[2] / 2,
  };
}

function intersects(a: SceneObject, b: SceneObject): boolean {
  const af = footprint(a);
  const bf = footprint(b);
  return af.minX < bf.maxX && af.maxX > bf.minX && af.minZ < bf.maxZ && af.maxZ > bf.minZ;
}

function distance2d(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

function withConstraints(scene: SceneState, draft: SceneObject, ignoreId?: string): SceneObject {
  const constrained = { ...draft, position: [...draft.position] as Vec3 };
  const halfW = constrained.dimensions[0] / 2;
  const halfD = constrained.dimensions[2] / 2;
  const roomHalfW = scene.room.dimensions.width / 2 - 0.1;
  const roomHalfD = scene.room.dimensions.depth / 2 - 0.1;

  constrained.position[0] = clamp(constrained.position[0], -roomHalfW + halfW, roomHalfW - halfW);
  constrained.position[2] = clamp(constrained.position[2], -roomHalfD + halfD, roomHalfD - halfD);
  constrained.position[1] = Math.max(constrained.dimensions[1] / 2, constrained.position[1]);

  for (const opening of scene.room.openings) {
    const nearOpening = distance2d(constrained.position, opening.center) < 0.95;
    if (!nearOpening) continue;

    if (opening.type === 'door') {
      if (opening.wall === 'west') constrained.position[0] = Math.max(constrained.position[0], opening.center[0] + 0.75);
      if (opening.wall === 'east') constrained.position[0] = Math.min(constrained.position[0], opening.center[0] - 0.75);
      if (opening.wall === 'north') constrained.position[2] = Math.max(constrained.position[2], opening.center[2] + 0.75);
      if (opening.wall === 'south') constrained.position[2] = Math.min(constrained.position[2], opening.center[2] - 0.75);
    }
  }

  const others = scene.objects.filter((obj) => obj.id !== ignoreId && obj.type !== 'door' && obj.type !== 'window');
  let guard = 0;
  while (others.some((other) => intersects(constrained, other)) && guard < 20) {
    constrained.position[0] += 0.25;
    constrained.position[2] += guard % 2 === 0 ? 0.2 : -0.2;
    constrained.position[0] = clamp(constrained.position[0], -roomHalfW + halfW, roomHalfW - halfW);
    constrained.position[2] = clamp(constrained.position[2], -roomHalfD + halfD, roomHalfD - halfD);
    guard += 1;
  }

  return constrained;
}

function bestTvWall(scene: SceneState): { wall: 'north' | 'south' | 'east' | 'west'; position: Vec3 } {
  const byWall: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];
  const blocked = new Set(scene.room.openings.map((opening) => opening.wall));
  const wall = byWall.find((candidate) => !blocked.has(candidate)) ?? 'north';
  if (wall === 'north') return { wall, position: [0, 1.35, -(scene.room.dimensions.depth / 2) + 0.08] };
  if (wall === 'south') return { wall, position: [0, 1.35, scene.room.dimensions.depth / 2 - 0.08] };
  if (wall === 'east') return { wall, position: [scene.room.dimensions.width / 2 - 0.08, 1.35, 0] };
  return { wall, position: [-(scene.room.dimensions.width / 2) + 0.08, 1.35, 0] };
}

function applyAdd(scene: SceneState, action: AddObjectAction): ActionResult {
  const candidate = createObjectFromTemplate(action.objectType, action.position ?? [0, 0, 0]);
  candidate.rotation = action.rotation ?? [0, 0, 0];
  const object = withConstraints(scene, candidate);

  if (action.objectType === 'tv') {
    const wallPlacement = bestTvWall(scene);
    object.position = wallPlacement.position;
    object.rotation = wallPlacement.wall === 'north' ? [0, 0, 0] : wallPlacement.wall === 'south' ? [0, Math.PI, 0] : wallPlacement.wall === 'east' ? [0, -Math.PI / 2, 0] : [0, Math.PI / 2, 0];
    object.relationships = { ...object.relationships, againstWall: wallPlacement.wall };
  }

  scene.objects.push(object);
  return {
    next: scene,
    message: `Added ${object.metadata.label}.`,
    context: {
      object: object.metadata.label,
      wall: object.relationships?.againstWall,
      position: object.position,
      status: 'Applied',
    },
  };
}

function applyRemove(scene: SceneState, action: RemoveObjectAction): ActionResult {
  const idx = scene.objects.findIndex((obj) => obj.id === action.objectId);
  if (idx < 0) {
    return { next: scene, message: 'Could not find that object.', context: { status: 'Rejected' } };
  }
  const [removed] = scene.objects.splice(idx, 1);
  return {
    next: scene,
    message: `Removed ${removed.metadata.label}.`,
    context: { object: removed.metadata.label, status: 'Applied' },
  };
}

function applyMove(scene: SceneState, action: MoveObjectAction): ActionResult {
  const object = scene.objects.find((obj) => obj.id === action.objectId);
  if (!object) return { next: scene, message: 'Could not find that object.', context: { status: 'Rejected' } };
  object.position = withConstraints(scene, { ...object, position: action.position }, object.id).position;
  return {
    next: scene,
    message: `Moved ${object.metadata.label}.`,
    context: {
      object: object.metadata.label,
      position: object.position,
      status: 'Applied',
    },
  };
}

function applyRotate(scene: SceneState, action: RotateObjectAction): ActionResult {
  const object = scene.objects.find((obj) => obj.id === action.objectId);
  if (!object) return { next: scene, message: 'Could not find that object.', context: { status: 'Rejected' } };
  object.rotation = action.rotation;
  return {
    next: scene,
    message: `Rotated ${object.metadata.label}.`,
    context: {
      object: object.metadata.label,
      status: 'Applied',
    },
  };
}

function applyResize(scene: SceneState, action: ResizeObjectAction): ActionResult {
  const object = scene.objects.find((obj) => obj.id === action.objectId);
  if (!object) return { next: scene, message: 'Could not find that object.', context: { status: 'Rejected' } };
  object.dimensions = action.dimensions;
  object.position[1] = Math.max(object.dimensions[1] / 2, object.position[1]);
  const constrained = withConstraints(scene, object, object.id);
  object.position = constrained.position;

  return {
    next: scene,
    message: `Resized ${object.metadata.label}.`,
    context: { object: object.metadata.label, status: 'Applied', position: object.position },
  };
}

function applyReplace(scene: SceneState, action: ReplaceObjectAction): ActionResult {
  const idx = scene.objects.findIndex((obj) => obj.id === action.objectId);
  if (idx < 0) return { next: scene, message: 'Could not find that object.', context: { status: 'Rejected' } };

  const previous = scene.objects[idx];
  const template = getTemplate(action.withType);
  const replacement = createObjectFromTemplate(action.withType, previous.position);
  replacement.rotation = previous.rotation;
  replacement.dimensions = template.dimensions;
  replacement.position[1] = replacement.dimensions[1] / 2;
  scene.objects[idx] = withConstraints(scene, replacement, previous.id);

  return {
    next: scene,
    message: `Replaced ${previous.metadata.label} with ${scene.objects[idx].metadata.label}.`,
    context: { object: scene.objects[idx].metadata.label, status: 'Applied' },
  };
}

function applyRearrange(scene: SceneState, action: RearrangeSceneAction): ActionResult {
  const sofa = scene.objects.find((obj) => obj.type === 'sofa');
  const chair = scene.objects.find((obj) => obj.type === 'chair');
  const table = scene.objects.find((obj) => obj.type === 'coffee_table');

  if (action.strategy === 'movie_night') {
    const tv = scene.objects.find((obj) => obj.type === 'tv');
    if (!tv) {
      const addResult = applyAdd(scene, { action: 'add_object', objectType: 'tv', reason: 'Movie setup anchor.' });
      scene = addResult.next;
    }
    if (sofa) sofa.position = withConstraints(scene, { ...sofa, position: [0, sofa.dimensions[1] / 2, 1.55] }, sofa.id).position;
    if (table) table.position = withConstraints(scene, { ...table, position: [0, table.dimensions[1] / 2, 0.45] }, table.id).position;
    if (chair) chair.position = withConstraints(scene, { ...chair, position: [2.0, chair.dimensions[1] / 2, 0.85] }, chair.id).position;
  }

  if (action.strategy === 'open_space') {
    for (const obj of scene.objects) {
      if (obj.type === 'coffee_table' || obj.type === 'plant') {
        obj.position = withConstraints(scene, { ...obj, position: [2.2, obj.dimensions[1] / 2, -1.5] }, obj.id).position;
      }
    }
    if (sofa) sofa.position = withConstraints(scene, { ...sofa, position: [0, sofa.dimensions[1] / 2, 2] }, sofa.id).position;
  }

  if (action.strategy === 'study') {
    const desk = scene.objects.find((obj) => obj.type === 'desk');
    if (!desk) {
      applyAdd(scene, {
        action: 'add_object',
        objectType: 'desk',
        position: [1.4, 0.4, -1.8],
        reason: 'Create study setup near daylight.',
      });
    }
  }

  return {
    next: scene,
    message: 'Rearranged the scene for the requested setup.',
    context: { status: 'Applied' },
  };
}

export function applyAction(scene: SceneState, action: SceneAction): ActionResult {
  const mutable = cloneScene(scene);
  switch (action.action) {
    case 'add_object':
      return applyAdd(mutable, action);
    case 'remove_object':
      return applyRemove(mutable, action);
    case 'move_object':
      return applyMove(mutable, action);
    case 'rotate_object':
      return applyRotate(mutable, action);
    case 'resize_object':
      return applyResize(mutable, action);
    case 'replace_object':
      return applyReplace(mutable, action);
    case 'rearrange_scene':
      return applyRearrange(mutable, action);
    case 'optimize_scene':
      return applyRearrange(mutable, {
        action: 'rearrange_scene',
        strategy: action.goal === 'walking_space' ? 'open_space' : action.goal,
        reason: action.reason,
      });
    default: {
      const neverAction: never = action;
      throw new Error(`Unsupported action: ${neverAction}`);
    }
  }
}

function findByType(scene: SceneState, type: ObjectType): SceneObject | undefined {
  return scene.objects.find((obj) => obj.type === type);
}

function inferTypeFromText(text: string): ObjectType | null {
  const checks: Array<{ keywords: string[]; type: ObjectType }> = [
    { keywords: ['sofa', 'couch'], type: 'sofa' },
    { keywords: ['coffee table'], type: 'coffee_table' },
    { keywords: ['tv console', 'console'], type: 'tv_console' },
    { keywords: ['chair'], type: 'chair' },
    { keywords: ['plant'], type: 'plant' },
    { keywords: ['lamp'], type: 'floor_lamp' },
    { keywords: ['tv', '55-inch'], type: 'tv' },
    { keywords: ['desk'], type: 'desk' },
    { keywords: ['monitor'], type: 'monitor' },
    { keywords: ['speaker'], type: 'speaker' },
    { keywords: ['rug'], type: 'rug' },
    { keywords: ['artwork', 'art'], type: 'artwork' },
    { keywords: ['mirror'], type: 'mirror' },
    { keywords: ['bookshelf'], type: 'bookshelf' },
    { keywords: ['dining table'], type: 'dining_table' },
    { keywords: ['bed'], type: 'bed' },
  ];

  for (const check of checks) {
    if (check.keywords.some((keyword) => text.includes(keyword))) return check.type;
  }
  return null;
}

export function parsePromptToAction(prompt: string, scene: SceneState, lastReferencedId?: string): SceneAction {
  const lower = prompt.toLowerCase();
  const inferredType = inferTypeFromText(lower);

  if (lower.includes('optimize') && (lower.includes('movie') || lower.includes('movie night'))) {
    return { action: 'optimize_scene', goal: 'movie_night', reason: 'Optimize layout for movie nights.' };
  }
  if (lower.includes('optimize') || lower.includes('walking space') || lower.includes('more space')) {
    return { action: 'optimize_scene', goal: 'walking_space', reason: 'Open walking paths.' };
  }
  if (lower.includes('study')) {
    return { action: 'optimize_scene', goal: 'study', reason: 'Create a calm study zone.' };
  }

  if ((lower.includes('add') || lower.includes('put')) && inferredType) {
    if (inferredType === 'desk' && lower.includes('window')) {
      const windowOpening = scene.room.openings.find((opening) => opening.type === 'window');
      const nearWindowPos: Vec3 = windowOpening ? [windowOpening.center[0] - 0.8, 0.4, windowOpening.center[2] + 1.1] : [1.4, 0.4, -1.8];
      return {
        action: 'add_object',
        objectType: inferredType,
        position: nearWindowPos,
        reason: 'Place desk near window for daylight.',
      };
    }
    return {
      action: 'add_object',
      objectType: inferredType,
      reason: 'Add requested object.',
    };
  }

  if ((lower.includes('remove') || lower.includes('delete')) && inferredType) {
    const target = findByType(scene, inferredType);
    if (target) return { action: 'remove_object', objectId: target.id, reason: 'Remove requested object.' };
  }

  if ((lower.includes('move') || lower.includes('shift')) && (inferredType || lastReferencedId)) {
    const target = inferredType ? findByType(scene, inferredType) : scene.objects.find((obj) => obj.id === lastReferencedId);
    if (target) {
      if (target.type === 'sofa' && (lower.includes('back') || lower.includes('walking'))) {
        return {
          action: 'move_object',
          objectId: target.id,
          position: [0, target.dimensions[1] / 2, 2.05],
          reason: 'Increase walking space near center.',
        };
      }

      if (lower.includes('left')) {
        return {
          action: 'move_object',
          objectId: target.id,
          position: [target.position[0] - 0.7, target.position[1], target.position[2]],
          reason: 'Shift object left.',
        };
      }

      return {
        action: 'move_object',
        objectId: target.id,
        position: [target.position[0], target.position[1], target.position[2] - 0.5],
        reason: 'Move object to create clearer path.',
      };
    }
  }

  if (lower.includes('replace') && inferredType) {
    const target = scene.objects.find((obj) => obj.id === lastReferencedId) ?? scene.objects[0];
    return {
      action: 'replace_object',
      objectId: target.id,
      withType: inferredType,
      reason: 'Swap selected object.',
    };
  }

  return {
    action: 'rearrange_scene',
    strategy: 'open_space',
    reason: 'Apply a balanced open layout in demo mode.',
  };
}

export function buildAgentMessage(action: SceneAction, result: ActionResult): string {
  if (result.context.status === 'Rejected') return `I couldn't apply that change safely. ${result.message}`;

  if (action.action === 'add_object' && action.objectType === 'tv') {
    return `Added a TV to the ${result.context.wall ?? 'best'} wall and aligned it for viewing.`;
  }
  if (action.action === 'move_object') {
    return `Moved ${result.context.object ?? 'the object'} to improve circulation.`;
  }
  if (action.action === 'optimize_scene' && action.goal === 'movie_night') {
    return 'Optimized the layout for movie nights with a clearer viewing zone.';
  }
  return result.message;
}

export const SUGGESTED_PROMPTS = [
  'Add a 55-inch TV to the best wall',
  'Move the sofa back to create more walking space',
  'Optimize this room for movie nights',
  'Put a desk near the window',
  'Remove the coffee table',
  'How can I optimize this room?',
];

export function createAgentTurn(role: AgentTurn['role'], text: string, context?: AgentTurn['context']): AgentTurn {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    context,
  };
}
