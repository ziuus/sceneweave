import React, { useState } from 'react';
import { SceneAnalysis, CapturedInput } from '@/lib/scene/types';

export function DebugPanel({ scene, capturedInput }: { scene: SceneAnalysis | null, capturedInput: CapturedInput | null }) {
  const [open, setOpen] = useState(false);

  if (!scene) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50 text-xs font-mono">
      <button 
        onClick={() => setOpen(!open)}
        className="bg-black/80 text-white/80 px-3 py-1 rounded border border-white/10 hover:bg-black"
      >
        {open ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {open && (
        <div className="mt-2 bg-black/90 text-green-400 p-4 rounded border border-white/20 w-80 max-h-96 overflow-y-auto">
          <h3 className="text-white font-bold mb-2 uppercase text-sm border-b border-white/20 pb-1">Scene Inspection</h3>
          
          <div className="mb-2">
            <span className="text-white/60">Panorama loaded:</span>{' '}
            <span className={capturedInput?.type !== 'demo' ? 'text-green-400' : 'text-yellow-400'}>
              {capturedInput?.type !== 'demo' ? '✓' : 'no'}
            </span>
          </div>
          
          <div className="mb-2">
            <span className="text-white/60">Detected room:</span> {scene.roomType || 'unknown'}
            <br />
            <span className="text-white/60">Dimensions:</span> {[scene.dimensions.width, scene.dimensions.height, scene.dimensions.depth].join('x')}
          </div>
          
          <div className="mb-2">
            <span className="text-white/60">Lighting:</span> {scene.lighting.type} ({scene.lighting.intensity})
          </div>
          
          <div className="mb-2">
            <span className="text-white/60">Detected surfaces:</span> {scene.surfaces.length}
            <ul className="pl-4 mt-1 opacity-80">
              {scene.surfaces.map(s => (
                <li key={s.id}>- {s.type} [{s.dimensions.join('x')}]</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-2">
            <span className="text-white/60">Detected objects:</span> {scene.objects.length}
            <ul className="pl-4 mt-1 opacity-80">
              {scene.objects.map(o => (
                <li key={o.id}>- {o.type} ({o.confidence ? (o.confidence*100).toFixed(0)+'%' : 'N/A'})</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
