// The Editor stage (devpost/spec.md > Editor (F9)): the real scene drawing with an SVG overlay on top.
// Drag to move, the corner handle resizes, the top handle turns; snap guides keep things centred.
// Positions are stored as % of the frame, so they survive a shape switch.
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import type { CavemanPlacement, PropPlacement } from '../types';
import { cavemanAt, SceneSvg } from '../video/SceneSvg';
import { SIZES } from '../video/timeline';
import { clampCaveman, clampProp, removeProp, setCavemanAt, setProp } from './sceneOps';
import { useUploads } from './uploads';

export type Selection = { kind: 'prop'; index: number } | { kind: 'caveman' } | null;

const SNAP = 1.5; // % of frame
const ROTATE_SNAP = 6; // degrees

type Drag = {
  mode: 'move' | 'resize' | 'rotate';
  startX: number;
  startY: number;
  start: { x: number; y: number; scale: number; rotation: number };
  cx: number; // item centre in frame px (for resize / rotate)
  cy: number;
  startDist: number;
};

export function Stage({ sceneIndex, frame, selection, onSelect }: { sceneIndex: number; frame: number; selection: Selection; onSelect: (s: Selection) => void }) {
  const { project, setProject, readOnly } = useApp();
  useUploads((u) => u.urls); // redraw once uploaded pictures have loaded
  const overlay = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [guides, setGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const scene = project?.scenes[sceneIndex];
  if (!project || !scene) return null;
  const { width, height } = SIZES[project.shape];
  const key = `stage:${scene.id}:${selection?.kind === 'prop' ? selection.index : 'caveman'}`;
  const man = cavemanAt(project, scene);

  const toFrame = (e: { clientX: number; clientY: number }) => {
    const svg = overlay.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  /** Where an item's handles sit, in frame px. */
  const box = (sel: NonNullable<Selection>) => {
    if (sel.kind === 'prop') {
      const p = scene.props[sel.index];
      const s = (p.scale / 100) * height;
      return { cx: (p.x / 100) * width, cy: (p.y / 100) * height, w: s, h: s, rotation: p.rotation, pivotY: 0.5 };
    }
    const h = (man.scale / 100) * height;
    // The caveman turns around his feet; his box centre sits half a height above them.
    return { cx: (man.x / 100) * width, cy: (man.y / 100) * height - h / 2, w: h * 0.62, h, rotation: man.rotation, pivotY: 1 };
  };

  const begin = (e: ReactPointerEvent, sel: NonNullable<Selection>, mode: Drag['mode']) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(sel);
    const at = toFrame(e);
    const b = box(sel);
    const start = sel.kind === 'prop' ? scene.props[sel.index] : man;
    const cy = sel.kind === 'caveman' && mode === 'rotate' ? (man.y / 100) * height : b.cy;
    drag.current = { mode, startX: at.x, startY: at.y, start: { x: start.x, y: start.y, scale: start.scale, rotation: start.rotation }, cx: b.cx, cy, startDist: Math.max(8, Math.hypot(at.x - b.cx, at.y - b.cy)) };
    overlay.current?.setPointerCapture(e.pointerId);
  };

  const apply = (patch: Partial<PropPlacement & CavemanPlacement>) => {
    if (!selection) return;
    if (selection.kind === 'prop') {
      const next = clampProp({ ...scene.props[selection.index], ...patch }, project.shape);
      setProject(setProp(project, sceneIndex, selection.index, next), key);
    } else {
      setProject(setCavemanAt(project, sceneIndex, clampCaveman({ ...man, ...patch })), key);
    }
  };

  const move = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || !selection) return;
    const at = toFrame(e);
    if (d.mode === 'move') {
      let x = d.start.x + ((at.x - d.startX) / width) * 100;
      let y = d.start.y + ((at.y - d.startY) / height) * 100;
      const snapX = Math.abs(x - 50) < SNAP;
      // Props snap their centre to the middle line; the caveman snaps his feet to the ground line.
      const yTarget = selection.kind === 'prop' ? 50 : cavemanAt(project, { ...scene, cavemanAt: undefined }).y;
      const snapY = Math.abs(y - yTarget) < SNAP;
      if (snapX) x = 50;
      if (snapY) y = yTarget;
      setGuides({ x: snapX, y: snapY && selection.kind === 'prop' });
      apply({ x, y });
    } else if (d.mode === 'resize') {
      const ratio = Math.hypot(at.x - d.cx, at.y - d.cy) / d.startDist;
      apply({ scale: d.start.scale * ratio });
    } else {
      let deg = (Math.atan2(at.y - d.cy, at.x - d.cx) * 180) / Math.PI + 90;
      deg = ((deg + 540) % 360) - 180;
      if (Math.abs(deg) < ROTATE_SNAP) deg = 0;
      apply({ rotation: Math.round(deg) });
    }
  };

  const end = () => {
    drag.current = null;
    setGuides({ x: false, y: false });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!selection || readOnly) return;
    const step = e.shiftKey ? 5 : 1;
    const nudge: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (nudge[e.key]) {
      e.preventDefault();
      const cur = selection.kind === 'prop' ? scene.props[selection.index] : man;
      apply({ x: cur.x + nudge[e.key][0], y: cur.y + nudge[e.key][1] });
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selection.kind === 'prop') {
      e.preventDefault();
      setProject(removeProp(project, sceneIndex, selection.index));
      onSelect(null);
    }
  };

  const items: NonNullable<Selection>[] = [...scene.props.map((_, index) => ({ kind: 'prop' as const, index })), ...(scene.hideCaveman ? [] : [{ kind: 'caveman' as const }])];
  const same = (a: Selection, b: Selection) => !!a && !!b && a.kind === b.kind && (a.kind === 'caveman' || (b.kind === 'prop' && a.index === b.index));
  const handle = Math.min(width, height) * 0.022;

  return (
    <div className="relative overflow-hidden rounded-[14px] border-2 border-charcoal bg-charcoal" data-testid="stage">
      <SceneSvg project={project} scene={scene} frame={frame} index={sceneIndex} editing />
      <svg
        ref={overlay}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 h-full w-full touch-none outline-none focus-visible:ring-4 focus-visible:ring-ochre"
        tabIndex={0}
        role="application"
        aria-label={en.editor.stage}
        onPointerDown={() => onSelect(null)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKey}
      >
        {guides.x && <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="#5c4ade" strokeWidth={3} strokeDasharray="12 8" />}
        {guides.y && <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#5c4ade" strokeWidth={3} strokeDasharray="12 8" />}
        {items.map((sel) => {
          const b = box(sel);
          const on = same(sel, selection);
          const pivot = `${b.cx} ${sel.kind === 'caveman' ? b.cy + b.h / 2 : b.cy}`;
          const label = sel.kind === 'prop' ? scene.props[sel.index].assetId : 'caveman';
          return (
            <g key={sel.kind === 'prop' ? `p${sel.index}` : 'c'} transform={`rotate(${b.rotation} ${pivot})`}>
              <rect
                x={b.cx - b.w / 2}
                y={b.cy - b.h / 2}
                width={b.w}
                height={b.h}
                fill="transparent"
                stroke={on ? '#5c4ade' : 'transparent'}
                strokeWidth={4}
                strokeDasharray={on ? undefined : '10 8'}
                className="cursor-move hover:stroke-[#5c4ade]/60"
                data-testid={`stage-${sel.kind}`}
                data-asset={label}
                onPointerDown={(e) => begin(e, sel, 'move')}
              />
              {on && (
                <>
                  <line x1={b.cx} y1={b.cy - b.h / 2} x2={b.cx} y2={b.cy - b.h / 2 - handle * 3} stroke="#5c4ade" strokeWidth={3} />
                  <circle cx={b.cx} cy={b.cy - b.h / 2 - handle * 3} r={handle} fill="#FFFFFF" stroke="#1F1A17" strokeWidth={3} className="cursor-grab" data-testid="rotate-handle" onPointerDown={(e) => begin(e, sel, 'rotate')} />
                  <rect x={b.cx + b.w / 2 - handle} y={b.cy + b.h / 2 - handle} width={handle * 2} height={handle * 2} rx={4} fill="#5c4ade" stroke="#1F1A17" strokeWidth={3} className="cursor-nwse-resize" data-testid="resize-handle" onPointerDown={(e) => begin(e, sel, 'resize')} />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
