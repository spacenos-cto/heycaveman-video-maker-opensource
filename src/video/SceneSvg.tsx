// One scene at one frame, drawn as a single SVG. The player shows it on screen and the MP4 exporter
// paints the very same SVG onto a canvas, so what plays is exactly what exports
// (devpost/spec.md > Video scene renderer (SVG)).
import { CavemanRig } from '../caveman/CavemanRig';
import { assetById } from '../director/props';
import { isUpload, uploadHref, uploadRef } from '../editor/uploads';
import type { Caption, Project, Scene, Shape } from '../types';
import { MOODS, type MoodSpec } from './moods';
import { spring } from './spring';
import { FPS, SIZES } from './timeline';

/** Where the caveman stands, per shape, as % of the frame (feet line and height). */
const CAVEMAN_SPOT: Record<Shape, { x: number; withProps: number; feet: number; height: number }> = {
  wide: { x: 50, withProps: 30, feet: 80, height: 66 },
  square: { x: 50, withProps: 34, feet: 78, height: 58 },
  tall: { x: 50, withProps: 50, feet: 74, height: 36 },
};

export const CAPTION_FONT = "'Baloo 2', sans-serif";

export type SceneSvgProps = {
  project: Project;
  scene: Scene;
  /** Frames since this scene started. */
  frame: number;
  index: number;
  /** Turns an asset file ("assets/plant.svg") into an href: a URL on screen, a data URI for export. */
  hrefFor?: (file: string) => string;
  /** Extra <style> for export (the caption font embedded as a data URI). */
  embeddedCss?: string;
  className?: string;
  title?: string;
  /** Editor stage: drawings sit still and hidden ones show faintly so they can be picked. */
  editing?: boolean;
};

const defaultHref = (file: string) => (isUpload(file) ? uploadHref(file) : `/${file}`);

/** The drawing file (or uploaded picture reference) behind a prop. */
export const propFile = (assetId: string) => (isUpload(assetId) ? assetId : assetById(assetId)?.file);

const msAt = (frame: number) => (frame / FPS) * 1000;
export const propVisible = (p: { inMs?: number; outMs?: number }, frame: number) =>
  msAt(frame) >= (p.inMs ?? 0) && (p.outMs === undefined || msAt(frame) < p.outMs);
export const captionVisible = (c: Caption, frame: number) =>
  msAt(frame) >= (c.startMs ?? 0) && (c.endMs === undefined || msAt(frame) < c.endMs);

/** The caveman's spot in a scene as a placement (% of frame): feet centre, height, turn. */
export function cavemanAt(project: Project, scene: Scene) {
  const spot = CAVEMAN_SPOT[project.shape];
  return scene.cavemanAt ?? { x: scene.props.length ? spot.withProps : spot.x, y: spot.feet, scale: spot.height, rotation: 0 };
}

/** The same in frame pixels, with the rig's width. */
export function cavemanBox(project: Project, scene: Scene) {
  const { width, height } = SIZES[project.shape];
  const at = cavemanAt(project, scene);
  const h = (at.scale / 100) * height;
  return { cx: (at.x / 100) * width, feet: (at.y / 100) * height, h, w: h * (200 / 320), rotation: at.rotation };
}

/** Break caption words into lines that fit 88% of the frame width (estimated glyph width). */
function wrap(words: string[], fontSize: number, maxWidth: number): string[][] {
  const lines: string[][] = [[]];
  let width = 0;
  const space = fontSize * 0.28;
  for (const w of words) {
    const ww = w.length * fontSize * 0.5;
    if (lines[lines.length - 1].length && width + space + ww > maxWidth) {
      lines.push([]);
      width = 0;
    }
    width += (lines[lines.length - 1].length ? space : 0) + ww;
    lines[lines.length - 1].push(w);
  }
  return lines;
}

const CAPTION_STYLES: Record<NonNullable<Caption['style']>, { fill: string; stroke: string; strokeWidth: number }> = {
  yellow: { fill: '#FFD60A', stroke: '#111111', strokeWidth: 0.2 },
  red: { fill: '#FF5A4E', stroke: '#111111', strokeWidth: 0.2 },
  white: { fill: '#FFFFFF', stroke: '#111111', strokeWidth: 0.1 },
  outlined: { fill: '#FFFFFF', stroke: '#111111', strokeWidth: 0.32 },
};

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

function captionLayout(caption: Caption, width: number, height: number) {
  const size = Math.round(Math.min(width, height) * (caption.wordArt ? 0.1 : 0.075));
  const lines = wrap(caption.text.split(/\s+/).filter(Boolean), size, width * 0.88);
  return { size, lines, lineH: size * 1.08 };
}

function CaptionText({ caption, mood, shape, frame, width, height, lift }: { caption: Caption; mood: MoodSpec; shape: Shape; frame: number; width: number; height: number; lift: number }) {
  const { size, lines, lineH } = captionLayout(caption, width, height);
  const enter = Math.min(1, spring(frame + 1, FPS, 14, 200));
  const bottom = height * (shape === 'tall' ? 0.84 : 0.93) - lift;
  const kw = caption.keyword ? norm(caption.keyword) : undefined;
  // A chosen caption colour wins over the mood; otherwise the mood decides (devpost/prd.md > F8 Caption).
  const look = caption.style ? CAPTION_STYLES[caption.style] : undefined;
  const band = look ? undefined : mood.band;
  const fill = look?.fill ?? mood.captionFill;
  const strokeColor = look?.stroke ?? mood.captionStroke;
  const stroke = band ? 0 : size * (look?.strokeWidth ?? 0.2);
  const longest = Math.max(...lines.map((l) => l.join(' ').length));
  const bandW = Math.min(width * 0.92, longest * size * 0.52 + size * 0.8);
  return (
    <g data-testid="caption" opacity={Math.min(1, enter * 1.4)} transform={`translate(0 ${(1 - enter) * 40})`}>
      {band && (
        <rect x={(width - bandW) / 2} y={bottom - lines.length * lineH - size * 0.05} width={bandW} height={lines.length * lineH + size * 0.25} rx={size * 0.3} fill={band} />
      )}
      {lines.map((line, li) => (
        <text
          key={li}
          x={width / 2}
          y={bottom - (lines.length - 1 - li) * lineH}
          textAnchor="middle"
          fontFamily={CAPTION_FONT}
          fontWeight={800}
          fontSize={size}
          fill={fill}
          stroke={stroke ? strokeColor : undefined}
          strokeWidth={stroke || undefined}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {line.map((w, wi) => (
            <tspan
              key={wi}
              fill={kw && norm(w) === kw && !look ? mood.highlight : undefined}
              textDecoration={kw && norm(w) === kw && band ? 'underline' : undefined}
            >
              {wi ? ` ${w}` : w}
            </tspan>
          ))}
        </text>
      ))}
    </g>
  );
}

function EndCard({ project, frame, width, height, hrefFor }: { project: Project; frame: number; width: number; height: number; hrefFor: (f: string) => string }) {
  const short = Math.min(width, height);
  const rigH = short * 0.5;
  const enter = Math.min(1, spring(frame + 1, FPS, 14, 160));
  return (
    <g>
      <rect width={width} height={height} fill="#FBF6EC" />
      <g transform={`translate(${width / 2 - rigH * 0.31} ${height * 0.12}) scale(${rigH / 320})`}>
        <CavemanRig design={project.caveman} motion="wave" expression="happy" frame={frame} talking={false} />
      </g>
      <g opacity={enter} fontFamily={CAPTION_FONT} fontWeight={800} textAnchor="middle">
        <text x={width / 2} y={height * 0.12 + rigH + short * 0.1} fontSize={short * 0.075} fill="#1F1A17">
          Made with HeyCaveman
        </text>
        <text x={width / 2} y={height * 0.12 + rigH + short * 0.17} fontSize={short * 0.04} fill="#B8482A">
          {project.caveman.name ? `Explained by ${project.caveman.name}` : 'Free · open source · works offline'}
        </text>
      </g>
      {/* keep the handprint motif from the logo, bottom right */}
      <image href={hrefFor('icons/logo.svg')} x={width - short * 0.16} y={height - short * 0.16} width={short * 0.1} height={short * 0.1} />
    </g>
  );
}

export function SceneSvg({ project, scene, frame, index, hrefFor = defaultHref, embeddedCss, className, title, editing }: SceneSvgProps) {
  const { width, height } = SIZES[project.shape];
  const mood = MOODS[project.mood];
  const { cx, feet, h: rigH, w: rigW, rotation: rigTurn } = cavemanBox(project, scene);
  const bg = scene.background;
  const setting = bg.type === 'setting' ? assetById(bg.assetId) : undefined;
  // Captions showing now stack upwards from the bottom, so two at once never overlap.
  let lift = 0;
  const captions = scene.captions
    .map((c, i) => ({ c, i, on: captionVisible(c, frame) }))
    .filter((x) => x.on || editing)
    .map((x) => {
      const at = lift;
      if (x.on) {
        const { lines, lineH, size } = captionLayout(x.c, width, height);
        lift += lines.length * lineH + size * 0.35;
      }
      return { ...x, at };
    });

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={title ?? (scene.words || (scene.kind === 'end' ? 'End card' : 'Scene'))}
      data-testid="scene-svg"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {embeddedCss && <style>{embeddedCss}</style>}
      {scene.kind === 'end' ? (
        <EndCard project={project} frame={frame} width={width} height={height} hrefFor={hrefFor} />
      ) : (
        <>
          {setting || bg.type === 'upload' ? (
            <image href={hrefFor(setting ? setting.file : uploadRef(bg.type === 'upload' ? bg.blobId : '')) || undefined} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <rect width={width} height={height} fill={bg.type === 'color' ? bg.color : mood.backgrounds[0]} />
          )}
          {scene.props.map((p, i) => {
            const file = propFile(p.assetId);
            const on = propVisible(p, frame);
            if (!file || (!on && !editing)) return null;
            const size = (p.scale / 100) * height;
            const inFrame = ((p.inMs ?? 0) / 1000) * FPS;
            const pop = editing ? 1 : Math.max(0, spring(frame - inFrame - 4 - (p.inMs ? 0 : i * 6), FPS, 10, 220));
            const float = editing ? 0 : Math.sin((frame + i * 20) / 18) * height * 0.006;
            return (
              <g key={`${p.assetId}-${i}`} opacity={on ? 1 : 0.3} transform={`translate(${(p.x / 100) * width} ${(p.y / 100) * height + float}) rotate(${p.rotation}) scale(${pop})`} data-testid="prop" data-asset={p.assetId}>
                <image href={hrefFor(file) || undefined} x={-size / 2} y={-size / 2} width={size} height={size} />
              </g>
            );
          })}
          {!scene.hideCaveman && (
            <g transform={`rotate(${rigTurn} ${cx} ${feet}) translate(${cx - rigW / 2} ${feet - rigH}) scale(${rigH / 320})`}>
              <CavemanRig
                design={project.caveman}
                motion={scene.motion}
                expression={scene.expression}
                frame={frame}
                blinkSeed={index}
                mouthOpen={scene.voice.envelope ? (scene.voice.envelope[frame] ?? 0) : undefined}
              />
            </g>
          )}
          {captions.map(({ c, i, at, on }) => (
            <g key={i} opacity={on ? 1 : 0}>
              <CaptionText caption={c} mood={mood} shape={project.shape} frame={editing ? 30 : frame - ((c.startMs ?? 0) / 1000) * FPS} width={width} height={height} lift={at} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
