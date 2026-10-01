export type Vec3 = [number, number, number];

export type ObjectCategory = 'Furniture' | 'Electronics' | 'Decor';

export type ObjectType =
  | 'sofa'
  | 'chair'
  | 'desk'
  | 'dining_table'
  | 'coffee_table'
  | 'bed'
  | 'bookshelf'
  | 'tv'
  | 'monitor'
  | 'speaker'
  | 'floor_lamp'
  | 'plant'
  | 'rug'
  | 'artwork'
  | 'mirror'
  | 'tv_console'
  | 'door'
  | 'window';

export interface RoomOpening {
  id: string;
  type: 'door' | 'window';
  wall: 'north' | 'south' | 'east' | 'west';
  center: Vec3;
  size: [number, number];
}

export interface RoomState {
  name: string;
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  openings: RoomOpening[];
}

export interface SceneObject {
  id: string;
  type: ObjectType;
  category: ObjectCategory;
  position: Vec3;
  rotation: Vec3;
  dimensions: Vec3;
  metadata: {
    label: string;
    color: string;
    notes?: string;
  };
  relationships?: {
    near?: string[];
    againstWall?: 'north' | 'south' | 'east' | 'west';
  };
}

export interface SceneState {
  room: RoomState;
  objects: SceneObject[];
}

export type SceneActionType =
  | 'add_object'
  | 'remove_object'
  | 'move_object'
  | 'rotate_object'
  | 'resize_object'
  | 'replace_object'
  | 'rearrange_scene'
  | 'optimize_scene';

export interface SceneActionBase {
  action: SceneActionType;
  reason: string;
}

export interface AddObjectAction extends SceneActionBase {
  action: 'add_object';
  objectType: ObjectType;
  category?: ObjectCategory;
  position?: Vec3;
  rotation?: Vec3;
}

export interface RemoveObjectAction extends SceneActionBase {
  action: 'remove_object';
  objectId: string;
}

export interface MoveObjectAction extends SceneActionBase {
  action: 'move_object';
  objectId: string;
  position: Vec3;
}

export interface RotateObjectAction extends SceneActionBase {
  action: 'rotate_object';
  objectId: string;
  rotation: Vec3;
}

export interface ResizeObjectAction extends SceneActionBase {
  action: 'resize_object';
  objectId: string;
  dimensions: Vec3;
}

export interface ReplaceObjectAction extends SceneActionBase {
  action: 'replace_object';
  objectId: string;
  withType: ObjectType;
}

export interface RearrangeSceneAction extends SceneActionBase {
  action: 'rearrange_scene';
  strategy: 'movie_night' | 'study' | 'open_space';
}

export interface OptimizeSceneAction extends SceneActionBase {
  action: 'optimize_scene';
  goal: 'movie_night' | 'walking_space' | 'study';
}

export type SceneAction =
  | AddObjectAction
  | RemoveObjectAction
  | MoveObjectAction
  | RotateObjectAction
  | ResizeObjectAction
  | ReplaceObjectAction
  | RearrangeSceneAction
  | OptimizeSceneAction;

export interface ActionResult {
  next: SceneState;
  message: string;
  context: {
    object?: string;
    wall?: string;
    position?: Vec3;
    status: 'Applied' | 'Rejected';
  };
}

export interface AgentTurn {
  id: string;
  role: 'user' | 'agent';
  text: string;
  context?: ActionResult['context'];
}
