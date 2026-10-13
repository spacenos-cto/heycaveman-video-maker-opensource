// One scene at one frame, drawn as a single SVG. The player shows it on screen and the MP4 exporter
// paints the very same SVG onto a canvas, so what plays is exactly what exports
// (devpost/spec.md > Video scene renderer (SVG)).
import { CavemanRig } from '../caveman/CavemanRig';
import { assetById } from '../director/props';
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

export const CAPTION_FONT = "'Baloo 2', 'Fredoka', sans-serif";

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
};

const defaultHref = (file: string) => `/${file}`;

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

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

function CaptionText({ caption, mood, shape, frame, width, height }: { caption: Caption; mood: MoodSpec; shape: Shape; frame: number; width: number; height: number }) {
  const short = Math.min(width, height);
  const size = Math.round(short * (caption.wordArt ? 0.1 : 0.075));
  const enter = Math.min(1, spring(frame + 1, FPS, 14, 200));
  const lines = wrap(caption.text.split(/\s+/).filter(Boolean), size, width * 0.88);
  const lineH = size * 1.08;
  const bottom = height * (shape === 'tall' ? 0.84 : 0.93);
  const kw = caption.keyword ? norm(caption.keyword) : undefined;
  const stroke = mood.band ? 0 : size * 0.2;
  const longest = Math.max(...lines.map((l) => l.join(' ').length));
  const bandW = Math.min(width * 0.92, longest * size * 0.52 + size * 0.8);
  return (
    <g data-testid="caption" opacity={Math.min(1, enter * 1.4)} transform={`translate(0 ${(1 - enter) * 40})`}>
      {mood.band && (
        <rect x={(width - bandW) / 2} y={bottom - lines.length * lineH - size * 0.05} width={bandW} height={lines.length * lineH + size * 0.25} rx={size * 0.3} fill={mood.band} />
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
          fill={mood.captionFill}
          stroke={stroke ? mood.captionStroke : undefined}
          strokeWidth={stroke || undefined}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {line.map((w, wi) => (
            <tspan
              key={wi}
              fill={kw && norm(w) === kw ? mood.highlight : undefined}
              textDecoration={kw && norm(w) === kw && mood.band ? 'underline' : undefined}
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

export function SceneSvg({ project, scene, frame, index, hrefFor = defaultHref, embeddedCss, className, title }: SceneSvgProps) {
  const { width, height } = SIZES[project.shape];
  const mood = MOODS[project.mood];
  const spot = CAVEMAN_SPOT[project.shape];
  const rigH = (spot.height / 100) * height;
  const rigW = rigH * (200 / 320);
  const cx = ((scene.props.length ? spot.withProps : spot.x) / 100) * width;
  const feet = (spot.feet / 100) * height;
  const bg = scene.background;
  const setting = bg.type === 'setting' ? assetById(bg.assetId) : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={title ?? (scene.words || 'End card')}
      data-testid="scene-svg"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {embeddedCss && <style>{embeddedCss}</style>}
      {scene.kind === 'end' ? (
        <EndCard project={project} frame={frame} width={width} height={height} hrefFor={hrefFor} />
      ) : (
        <>
          {setting ? (
            <image href={hrefFor(setting.file)} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <rect width={width} height={height} fill={bg.type === 'color' ? bg.color : mood.backgrounds[0]} />
          )}
          {scene.props.map((p, i) => {
            const asset = assetById(p.assetId);
            if (!asset) return null;
            const size = (p.scale / 100) * height;
            const pop = Math.max(0, spring(frame - 4 - i * 6, FPS, 10, 220));
            const float = Math.sin((frame + i * 20) / 18) * height * 0.006;
            return (
              <g key={`${p.assetId}-${i}`} transform={`translate(${(p.x / 100) * width} ${(p.y / 100) * height + float}) rotate(${p.rotation}) scale(${pop})`} data-testid="prop" data-asset={p.assetId}>
                <image href={hrefFor(asset.file)} x={-size / 2} y={-size / 2} width={size} height={size} />
              </g>
            );
          })}
          {!scene.hideCaveman && (
            <g transform={`translate(${cx - rigW / 2} ${feet - rigH}) scale(${rigH / 320})`}>
              <CavemanRig design={project.caveman} motion={scene.motion} expression={scene.expression} frame={frame} blinkSeed={index} />
            </g>
          )}
          {scene.captions.map((c, i) => (
            <CaptionText key={i} caption={c} mood={mood} shape={project.shape} frame={frame} width={width} height={height} />
          ))}
        </>
      )}
    </svg>
  );
}
