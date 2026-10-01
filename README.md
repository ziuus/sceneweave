# SceneWeave Prototype

SceneWeave is a spatial-design prototype focused on this loop:

1. Upload a room image (or use the demo image)
2. Run a **demo reconstruction pipeline**
3. Interact with a dominant 3D room scene
4. Ask the AI agent to add/move/remove/optimize objects via structured actions
5. Iterate with undo/redo, revert last AI action, and reset

## Prototype boundary

The current room reconstruction is intentionally controlled/demo-oriented. It does **not** claim exact geometry, perfect measurement accuracy, or production-grade single-image reconstruction.

## Run

```bash
npm install
npm run dev
```

## Validation commands

```bash
npm run lint
npm run build
```
