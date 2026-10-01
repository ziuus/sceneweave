'use client';

import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import Image from 'next/image';
import {
  Bot,
  Download,
  ImagePlus,
  Move3D,
  Redo2,
  RotateCcw,
  Save,
  Send,
  Trash2,
  Undo2,
  WandSparkles,
} from 'lucide-react';
import { DEMO_IMAGE_SVG } from '@/lib/sceneweave/demo';
import { OBJECT_LIBRARY } from '@/lib/sceneweave/catalog';
import {
  SUGGESTED_PROMPTS,
  applyAction,
  buildAgentMessage,
  createAgentTurn,
  createInitialScene,
  parsePromptToAction,
} from '@/lib/sceneweave/engine';
import { AgentTurn, SceneObject, SceneState } from '@/lib/sceneweave/types';

interface HistoryItem {
  scene: SceneState;
  source: 'initial' | 'manual' | 'ai';
}

function objectGeometry(object: SceneObject) {
  if (object.type === 'plant') return <cylinderGeometry args={[object.dimensions[0] / 2, object.dimensions[0] / 3, object.dimensions[1], 12]} />;
  if (object.type === 'floor_lamp') return <cylinderGeometry args={[object.dimensions[0] / 3, object.dimensions[0] / 2, object.dimensions[1], 12]} />;
  if (object.type === 'tv' || object.type === 'monitor' || object.type === 'artwork' || object.type === 'mirror') {
    return <boxGeometry args={object.dimensions} />;
  }
  if (object.type === 'rug') return <boxGeometry args={[object.dimensions[0], 0.03, object.dimensions[2]]} />;
  return <boxGeometry args={object.dimensions} />;
}

function roomMeshColor(kind: 'floor' | 'ceiling' | 'wall' | 'opening') {
  if (kind === 'floor') return '#ddd1bf';
  if (kind === 'ceiling') return '#f4efe7';
  if (kind === 'opening') return '#d6e4ef';
  return '#efe7dc';
}

function SceneViewport({
  scene,
  selectedObjectId,
  onSelectObject,
  selectedSurface,
  onSelectSurface,
}: {
  scene: SceneState;
  selectedObjectId: string | null;
  selectedSurface: string | null;
  onSelectObject: (id: string) => void;
  onSelectSurface: (id: string | null) => void;
}) {
  const width = scene.room.dimensions.width;
  const depth = scene.room.dimensions.depth;
  const height = scene.room.dimensions.height;

  return (
    <Canvas camera={{ position: [7, 5, 7], fov: 45 }} shadows>
      <color attach="background" args={['#f7f3ed']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <hemisphereLight args={['#fffdf8', '#d6d0c4', 0.45]} />

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSurface('floor');
        }}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={roomMeshColor('floor')} />
      </mesh>

      {[
        { id: 'north', pos: [0, height / 2, -depth / 2] as [number, number, number], rot: [0, 0, 0] as [number, number, number], dims: [width, height] as [number, number] },
        { id: 'south', pos: [0, height / 2, depth / 2] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], dims: [width, height] as [number, number] },
        { id: 'west', pos: [-width / 2, height / 2, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], dims: [depth, height] as [number, number] },
        { id: 'east', pos: [width / 2, height / 2, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], dims: [depth, height] as [number, number] },
      ].map((wall) => (
        <mesh
          key={wall.id}
          position={wall.pos}
          rotation={wall.rot}
          onClick={(e) => {
            e.stopPropagation();
            onSelectSurface(`wall:${wall.id}`);
          }}
        >
          <planeGeometry args={wall.dims} />
          <meshStandardMaterial color={selectedSurface === `wall:${wall.id}` ? '#d8e3f4' : roomMeshColor('wall')} side={THREE.DoubleSide} />
        </mesh>
      ))}

      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={(e) => {
        e.stopPropagation();
        onSelectSurface('ceiling');
      }}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={selectedSurface === 'ceiling' ? '#d8e3f4' : roomMeshColor('ceiling')} side={THREE.DoubleSide} />
      </mesh>

      {scene.room.openings.map((opening) => {
        const rotation = opening.wall === 'north' ? [0, 0, 0] : opening.wall === 'south' ? [0, Math.PI, 0] : opening.wall === 'east' ? [0, -Math.PI / 2, 0] : [0, Math.PI / 2, 0];
        return (
          <mesh
            key={opening.id}
            position={opening.center}
            rotation={rotation as [number, number, number]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSurface(`opening:${opening.id}`);
            }}
          >
            <planeGeometry args={opening.size} />
            <meshStandardMaterial color={selectedSurface === `opening:${opening.id}` ? '#b8cee6' : roomMeshColor('opening')} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
        );
      })}

      {scene.objects.map((object) => (
        <group key={object.id} position={object.position} rotation={object.rotation}>
          <mesh
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              onSelectObject(object.id);
            }}
          >
            {objectGeometry(object)}
            <meshStandardMaterial color={selectedObjectId === object.id ? '#6f9ac4' : object.metadata.color} roughness={0.75} metalness={0.1} />
          </mesh>
          {selectedObjectId === object.id && (
            <Html center distanceFactor={15}>
              <div className="rounded border border-blue-200 bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-700">
                {object.metadata.label}
              </div>
            </Html>
          )}
        </group>
      ))}

      <Grid position={[0, 0.01, 0]} args={[width + 1.5, depth + 1.5]} cellSize={0.5} cellThickness={0.5} sectionSize={2} sectionThickness={1} cellColor={'#d7d1c5'} sectionColor={'#c5bcad'} fadeDistance={20} />

      <OrbitControls makeDefault enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2 - 0.05} minDistance={4} maxDistance={16} />
    </Canvas>
  );
}

export default function HomePage() {
  const [stage, setStage] = useState<'input' | 'processing' | 'workspace'>('input');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  const [history, setHistory] = useState<HistoryItem[]>([{ scene: createInitialScene(), source: 'initial' }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null);
  const [agentInput, setAgentInput] = useState('');
  const [turns, setTurns] = useState<AgentTurn[]>([
    createAgentTurn('agent', 'Demo reconstruction loaded. Ask me to add, move, remove, or optimize the scene.'),
  ]);
  const [lastActionContext, setLastActionContext] = useState<AgentTurn['context']>();
  const [lastReferencedObjectId, setLastReferencedObjectId] = useState<string>();

  const scene = history[historyIndex].scene;
  const selectedObject = scene.objects.find((object) => object.id === selectedObjectId) ?? null;

  const processingCopy = useMemo(
    () => ['Understanding your space…', 'Detecting objects…', 'Building your scene…'],
    [],
  );

  useEffect(() => {
    if (stage !== 'processing') return;
    setProcessingStep(0);
    const interval = setInterval(() => {
      setProcessingStep((step) => {
        if (step >= processingCopy.length - 1) {
          clearInterval(interval);
          setTimeout(() => setStage('workspace'), 350);
          return step;
        }
        return step + 1;
      });
    }, 950);

    return () => clearInterval(interval);
  }, [stage, processingCopy.length]);

  const pushScene = (nextScene: SceneState, source: HistoryItem['source']) => {
    const nextHistory = [...history.slice(0, historyIndex + 1), { scene: nextScene, source }];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const runAgentPrompt = (prompt: string) => {
    if (!prompt.trim()) return;

    const action = parsePromptToAction(prompt, scene, lastReferencedObjectId);
    const result = applyAction(scene, action);
    pushScene(result.next, 'ai');

    setTurns((prev) => [
      ...prev,
      createAgentTurn('user', prompt),
      createAgentTurn('agent', buildAgentMessage(action, result), result.context),
    ]);
    setLastActionContext(result.context);

    if (action.action === 'add_object') {
      const created = result.next.objects[result.next.objects.length - 1];
      if (created) {
        setSelectedObjectId(created.id);
        setLastReferencedObjectId(created.id);
      }
    }
    if (
      action.action === 'move_object' ||
      action.action === 'rotate_object' ||
      action.action === 'resize_object' ||
      action.action === 'replace_object' ||
      action.action === 'remove_object'
    ) {
      setLastReferencedObjectId((action as { objectId: string }).objectId);
    }

    setAgentInput('');
  };

  const addObject = (type: (typeof OBJECT_LIBRARY)[number]['type']) => {
    const result = applyAction(scene, { action: 'add_object', objectType: type, reason: 'Manual add from object library.' });
    pushScene(result.next, 'manual');
    const created = result.next.objects[result.next.objects.length - 1];
    if (created) setSelectedObjectId(created.id);
    setLastActionContext(result.context);
  };

  const removeSelected = () => {
    if (!selectedObject) return;
    const result = applyAction(scene, { action: 'remove_object', objectId: selectedObject.id, reason: 'Manual removal.' });
    pushScene(result.next, 'manual');
    setSelectedObjectId(null);
    setLastActionContext(result.context);
  };

  const runManualAction = (action: Parameters<typeof applyAction>[1]) => {
    const result = applyAction(scene, action);
    pushScene(result.next, 'manual');
    setLastActionContext(result.context);
  };

  const revertLastAiAction = () => {
    for (let i = historyIndex; i > 0; i -= 1) {
      if (history[i].source === 'ai') {
        setHistoryIndex(Math.max(i - 1, 0));
        return;
      }
    }
  };

  const exportScene = () => {
    const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sceneweave-scene.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveScene = () => {
    localStorage.setItem('sceneweave-demo-save', JSON.stringify(scene));
  };

  if (stage === 'input') {
    return (
      <main className="min-h-screen bg-[#f7f3ed] px-6 py-10 text-[#272626]">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-5xl font-semibold tracking-tight">SceneWeave</h1>
          <p className="mt-3 max-w-2xl text-base text-[#54504a]">
            Upload a room image, preview a controlled demo reconstruction, and direct an AI agent that performs structured scene actions.
          </p>

          <div className="mt-8 grid gap-6 rounded-xl border border-[#ddd4c6] bg-white p-6 md:grid-cols-2">
            <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#cec2af] bg-[#faf8f3] px-4 text-center">
              <ImagePlus className="h-8 w-8 text-[#4f6f93]" />
              <span className="mt-3 text-sm font-medium">Upload room photo (demo reconstruction pipeline)</span>
              <span className="mt-1 text-xs text-[#7b746a]">JPG/PNG. Prototype uses controlled reconstruction, not exact photogrammetry.</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setUploadedPreview(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            <div className="rounded-lg border border-[#e3dacb] bg-[#fcfaf6] p-4">
              <p className="text-sm font-medium">Demo room image</p>
              <Image src={uploadedPreview ?? DEMO_IMAGE_SVG} alt="Room preview" width={800} height={400} className="mt-3 h-40 w-full rounded-md object-cover" unoptimized />
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStage('processing')}
                  className="rounded-md border border-[#3f658f] bg-[#4f79a8] px-4 py-2 text-sm font-medium text-white"
                >
                  Use This Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedPreview(DEMO_IMAGE_SVG);
                    setStage('processing');
                  }}
                  className="rounded-md border border-[#d5cab8] bg-white px-4 py-2 text-sm"
                >
                  Load Demo Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (stage === 'processing') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3ed]">
        <div className="rounded-xl border border-[#dfd4c3] bg-white px-12 py-10 text-center">
          <WandSparkles className="mx-auto h-8 w-8 text-[#4f79a8]" />
          <p className="mt-4 text-sm text-[#5b5650]">Demo reconstruction pipeline</p>
          <h2 className="mt-2 text-xl font-semibold text-[#282622]">{processingCopy[processingStep]}</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f3ed] text-[#282623]">
      <header className="flex items-center justify-between border-b border-[#ddd3c5] bg-white px-6 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7b746b]">SceneWeave Prototype</p>
          <h1 className="text-lg font-semibold">{scene.room.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => historyIndex > 0 && setHistoryIndex(historyIndex - 1)} className="rounded border border-[#dacdbb] bg-white px-3 py-1.5 text-sm disabled:opacity-40" disabled={historyIndex === 0}><Undo2 className="mr-1 inline h-4 w-4" />Undo</button>
          <button type="button" onClick={() => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1)} className="rounded border border-[#dacdbb] bg-white px-3 py-1.5 text-sm disabled:opacity-40" disabled={historyIndex >= history.length - 1}><Redo2 className="mr-1 inline h-4 w-4" />Redo</button>
          <button type="button" onClick={() => setHistoryIndex(0)} className="rounded border border-[#dacdbb] bg-white px-3 py-1.5 text-sm"><RotateCcw className="mr-1 inline h-4 w-4" />Reset</button>
          <button type="button" onClick={saveScene} className="rounded border border-[#dacdbb] bg-white px-3 py-1.5 text-sm"><Save className="mr-1 inline h-4 w-4" />Save</button>
          <button type="button" onClick={exportScene} className="rounded border border-[#dacdbb] bg-white px-3 py-1.5 text-sm"><Download className="mr-1 inline h-4 w-4" />Export</button>
        </div>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[280px_1fr_330px]">
        <aside className="rounded-xl border border-[#ddd3c4] bg-white p-4">
          <h2 className="text-sm font-semibold">Scene Controls</h2>
          <p className="mt-1 text-xs text-[#7c7469]">Demo reconstruction · structured room state</p>

          <div className="mt-4 space-y-4">
            {(['Furniture', 'Electronics', 'Decor'] as const).map((category) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6f675f]">{category}</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {OBJECT_LIBRARY.filter((item) => item.category === category).map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addObject(item.type)}
                      className="flex items-center justify-between rounded border border-[#e4dacb] px-2 py-1.5 text-left text-sm hover:border-[#8eaed0]"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-[#7a7368]">Add</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="relative overflow-hidden rounded-xl border border-[#dbd1c3] bg-white">
          <div className="absolute left-3 top-3 z-10 rounded border border-[#dfd5c7] bg-white/95 px-2 py-1 text-xs">
            <Move3D className="mr-1 inline h-3.5 w-3.5" /> Orbit · Pan · Zoom · Select
          </div>
          <div className="h-[64vh] w-full lg:h-full" onClick={() => {
            setSelectedObjectId(null);
            setSelectedSurface(null);
          }}>
            <SceneViewport
              scene={scene}
              selectedObjectId={selectedObjectId}
              selectedSurface={selectedSurface}
              onSelectObject={(id) => {
                setSelectedObjectId(id);
                setSelectedSurface(null);
              }}
              onSelectSurface={(id) => {
                setSelectedSurface(id);
                setSelectedObjectId(null);
              }}
            />
          </div>
          <div className="absolute bottom-3 left-3 rounded border border-[#ddd2c2] bg-white/95 px-2 py-1 text-xs">
            Objects: {scene.objects.length} · History: {historyIndex}/{history.length - 1}
          </div>
        </section>

        <aside className="flex flex-col rounded-xl border border-[#ddd3c4] bg-white">
          <div className="border-b border-[#ece2d3] p-4">
            <h2 className="text-sm font-semibold"><Bot className="mr-1 inline h-4 w-4" />AI Agent</h2>
            <p className="mt-1 text-xs text-[#7b746b]">Deterministic demo parser: actions are structured and applied to scene state.</p>
          </div>

          <div className="flex-1 space-y-2 overflow-auto p-4">
            {turns.map((turn) => (
              <div key={turn.id} className={`rounded-lg border px-3 py-2 text-sm ${turn.role === 'agent' ? 'border-[#d7e1ed] bg-[#f7fbff]' : 'border-[#eadfcd] bg-[#fffdf9]'}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6f6a61]">{turn.role === 'agent' ? 'Agent' : 'You'}</p>
                <p className="mt-1">{turn.text}</p>
                {turn.context && (
                  <p className="mt-1 text-xs text-[#576477]">
                    {turn.context.object ?? 'Scene'} {turn.context.wall ? `· ${turn.context.wall} wall` : ''} · Status: {turn.context.status}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#ece2d3] p-4">
            <div className="mb-2 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" onClick={() => runAgentPrompt(prompt)} className="rounded-full border border-[#d9cebc] px-2.5 py-1 text-xs hover:border-[#7da1ca]">
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={agentInput}
                onChange={(event) => setAgentInput(event.target.value)}
                className="w-full rounded border border-[#d8cbb8] px-3 py-2 text-sm outline-none focus:border-[#7fa7d5]"
                placeholder="Tell agent what to change..."
              />
              <button type="button" onClick={() => runAgentPrompt(agentInput)} className="rounded border border-[#3f658f] bg-[#4f79a8] px-3 text-white">
                <Send className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex gap-2 text-xs">
              <button type="button" onClick={revertLastAiAction} className="rounded border border-[#d9ceb9] px-2 py-1">Revert last AI action</button>
              <button type="button" onClick={() => runAgentPrompt('How can I optimize this room?')} className="rounded border border-[#d9ceb9] px-2 py-1">Optimize room</button>
            </div>
          </div>
        </aside>
      </section>

      {selectedObject && (
        <section className="border-t border-[#ddd2c2] bg-white px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 text-sm">
            <strong>{selectedObject.metadata.label}</strong>
            <span className="text-[#7c7468]">x:{selectedObject.position[0].toFixed(2)} y:{selectedObject.position[1].toFixed(2)} z:{selectedObject.position[2].toFixed(2)}</span>

            <button
              type="button"
              onClick={() =>
                runManualAction({
                  action: 'move_object',
                  objectId: selectedObject.id,
                  position: [selectedObject.position[0] - 0.2, selectedObject.position[1], selectedObject.position[2]],
                  reason: 'Nudge selected object left.',
                })
              }
              className="rounded border border-[#d9ceb9] px-2 py-1"
            >
              Left
            </button>
            <button
              type="button"
              onClick={() =>
                runManualAction({
                  action: 'move_object',
                  objectId: selectedObject.id,
                  position: [selectedObject.position[0] + 0.2, selectedObject.position[1], selectedObject.position[2]],
                  reason: 'Nudge selected object right.',
                })
              }
              className="rounded border border-[#d9ceb9] px-2 py-1"
            >
              Right
            </button>
            <button
              type="button"
              onClick={() =>
                runManualAction({
                  action: 'move_object',
                  objectId: selectedObject.id,
                  position: [selectedObject.position[0], selectedObject.position[1], selectedObject.position[2] - 0.2],
                  reason: 'Nudge selected object forward.',
                })
              }
              className="rounded border border-[#d9ceb9] px-2 py-1"
            >
              Forward
            </button>
            <button
              type="button"
              onClick={() =>
                runManualAction({
                  action: 'move_object',
                  objectId: selectedObject.id,
                  position: [selectedObject.position[0], selectedObject.position[1], selectedObject.position[2] + 0.2],
                  reason: 'Nudge selected object backward.',
                })
              }
              className="rounded border border-[#d9ceb9] px-2 py-1"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() =>
                runManualAction({
                  action: 'rotate_object',
                  objectId: selectedObject.id,
                  rotation: [selectedObject.rotation[0], selectedObject.rotation[1] + Math.PI / 8, selectedObject.rotation[2]],
                  reason: 'Rotate selected object.',
                })
              }
              className="rounded border border-[#d9ceb9] px-2 py-1"
            >
              Rotate
            </button>
            <button
              type="button"
              onClick={() => {
                const current = selectedObject.dimensions;
                const scale = 1.08;
                runManualAction({
                  action: 'resize_object',
                  objectId: selectedObject.id,
                  dimensions: [current[0] * scale, current[1] * scale, current[2] * scale],
                  reason: 'Resize selected object.',
                });
              }}
              className="rounded border border-[#d9ceb9] px-2 py-1"
            >
              Resize +
            </button>
            <button type="button" onClick={removeSelected} className="rounded border border-[#e1c1bc] px-2 py-1 text-[#8b4741]"><Trash2 className="mr-1 inline h-4 w-4" />Delete</button>
            {lastActionContext && <span className="ml-auto text-xs text-[#5f6f84]">Status: {lastActionContext.status}</span>}
          </div>
        </section>
      )}
    </main>
  );
}
