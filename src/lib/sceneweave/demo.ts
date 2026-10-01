import { SceneState } from './types';

export const DEMO_IMAGE_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#e9e2d8'/>
        <stop offset='100%' stop-color='#d9d1c6'/>
      </linearGradient>
    </defs>
    <rect width='960' height='540' fill='url(#g)'/>
    <rect x='0' y='320' width='960' height='220' fill='#c9bba8'/>
    <rect x='640' y='120' width='220' height='150' fill='#dfe7ef' stroke='#9aa3aa'/>
    <rect x='130' y='250' width='260' height='130' rx='12' fill='#8d98a6'/>
    <rect x='445' y='325' width='130' height='55' rx='8' fill='#bca588'/>
    <rect x='670' y='295' width='170' height='85' rx='8' fill='#a89781'/>
    <circle cx='875' cy='325' r='26' fill='#7d9f7f'/>
    <rect x='60' y='165' width='85' height='195' fill='#b6aa99'/>
  </svg>`,
)}`;

export const DEMO_SCENE: SceneState = {
  room: {
    name: 'Modern Living Room — Demo Reconstruction',
    dimensions: {
      width: 7.2,
      depth: 5.2,
      height: 3,
    },
    openings: [
      {
        id: 'window-north',
        type: 'window',
        wall: 'north',
        center: [1.8, 1.5, -2.58],
        size: [2.1, 1.3],
      },
      {
        id: 'door-west',
        type: 'door',
        wall: 'west',
        center: [-3.58, 1.05, 1.6],
        size: [0.95, 2.1],
      },
    ],
  },
  objects: [
    {
      id: 'sofa-1',
      type: 'sofa',
      category: 'Furniture',
      position: [0.1, 0.45, 1.5],
      rotation: [0, Math.PI, 0],
      dimensions: [2.2, 0.9, 0.95],
      metadata: { label: 'Sofa', color: '#a2abb2' },
      relationships: { near: ['coffee-table-1'], againstWall: 'south' },
    },
    {
      id: 'coffee-table-1',
      type: 'coffee_table',
      category: 'Furniture',
      position: [0.1, 0.225, 0.45],
      rotation: [0, 0, 0],
      dimensions: [1.1, 0.45, 0.6],
      metadata: { label: 'Coffee Table', color: '#cdb8a0' },
      relationships: { near: ['sofa-1'] },
    },
    {
      id: 'tv-console-1',
      type: 'tv_console',
      category: 'Furniture',
      position: [0, 0.35, -2.15],
      rotation: [0, 0, 0],
      dimensions: [1.8, 0.7, 0.45],
      metadata: { label: 'TV Console', color: '#a89781' },
      relationships: { againstWall: 'north' },
    },
    {
      id: 'chair-1',
      type: 'chair',
      category: 'Furniture',
      position: [2.35, 0.475, 0.9],
      rotation: [0, -Math.PI / 2, 0],
      dimensions: [0.65, 0.95, 0.65],
      metadata: { label: 'Chair', color: '#7f8a96' },
      relationships: { near: ['plant-1'] },
    },
    {
      id: 'plant-1',
      type: 'plant',
      category: 'Decor',
      position: [2.7, 0.6, -1.5],
      rotation: [0, 0, 0],
      dimensions: [0.5, 1.2, 0.5],
      metadata: { label: 'Plant', color: '#7f9f80' },
      relationships: { againstWall: 'east' },
    },
    {
      id: 'lamp-1',
      type: 'floor_lamp',
      category: 'Electronics',
      position: [-2.45, 0.875, 0.7],
      rotation: [0, Math.PI / 4, 0],
      dimensions: [0.35, 1.75, 0.35],
      metadata: { label: 'Floor Lamp', color: '#ddc17e' },
    },
  ],
};
