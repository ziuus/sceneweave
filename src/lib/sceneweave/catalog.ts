import { ObjectCategory, ObjectType, SceneObject, Vec3 } from './types';

export interface ObjectTemplate {
  type: ObjectType;
  category: ObjectCategory;
  label: string;
  color: string;
  dimensions: Vec3;
}

export const OBJECT_LIBRARY: ObjectTemplate[] = [
  { type: 'sofa', category: 'Furniture', label: 'Sofa', color: '#a2abb2', dimensions: [2.2, 0.9, 0.95] },
  { type: 'chair', category: 'Furniture', label: 'Chair', color: '#7f8a96', dimensions: [0.65, 0.95, 0.65] },
  { type: 'desk', category: 'Furniture', label: 'Desk', color: '#d2c2ad', dimensions: [1.4, 0.75, 0.7] },
  { type: 'dining_table', category: 'Furniture', label: 'Dining Table', color: '#bfa88d', dimensions: [1.6, 0.75, 0.9] },
  { type: 'coffee_table', category: 'Furniture', label: 'Coffee Table', color: '#cdb8a0', dimensions: [1.1, 0.45, 0.6] },
  { type: 'bed', category: 'Furniture', label: 'Bed', color: '#b3bdca', dimensions: [2.0, 0.55, 1.5] },
  { type: 'bookshelf', category: 'Furniture', label: 'Bookshelf', color: '#b9ab95', dimensions: [1.0, 2.0, 0.35] },
  { type: 'tv', category: 'Electronics', label: 'TV', color: '#2c3743', dimensions: [1.22, 0.72, 0.08] },
  { type: 'monitor', category: 'Electronics', label: 'Monitor', color: '#3a4653', dimensions: [0.7, 0.45, 0.1] },
  { type: 'speaker', category: 'Electronics', label: 'Speaker', color: '#4d5661', dimensions: [0.22, 0.45, 0.22] },
  { type: 'floor_lamp', category: 'Electronics', label: 'Floor Lamp', color: '#ddc17e', dimensions: [0.35, 1.75, 0.35] },
  { type: 'plant', category: 'Decor', label: 'Plant', color: '#7f9f80', dimensions: [0.5, 1.2, 0.5] },
  { type: 'rug', category: 'Decor', label: 'Rug', color: '#b9bec5', dimensions: [2.3, 0.03, 1.6] },
  { type: 'artwork', category: 'Decor', label: 'Artwork', color: '#d4c7b2', dimensions: [0.9, 0.65, 0.05] },
  { type: 'mirror', category: 'Decor', label: 'Mirror', color: '#c6d2dc', dimensions: [0.7, 1.2, 0.06] },
];

const TEMPLATE_BY_TYPE = new Map<ObjectType, ObjectTemplate>(
  OBJECT_LIBRARY.map((template) => [template.type, template]),
);

let nextObjectId = 400;

export function getTemplate(type: ObjectType): ObjectTemplate {
  const template = TEMPLATE_BY_TYPE.get(type);
  if (!template) {
    throw new Error(`Unknown object template: ${type}`);
  }
  return template;
}

export function createObjectFromTemplate(type: ObjectType, position: Vec3): SceneObject {
  const template = getTemplate(type);
  const id = `${type}-${nextObjectId++}`;
  const halfHeight = template.dimensions[1] / 2;

  return {
    id,
    type,
    category: template.category,
    position: [position[0], Math.max(halfHeight, position[1]), position[2]],
    rotation: [0, 0, 0],
    dimensions: template.dimensions,
    metadata: {
      label: template.label,
      color: template.color,
    },
    relationships: {},
  };
}
