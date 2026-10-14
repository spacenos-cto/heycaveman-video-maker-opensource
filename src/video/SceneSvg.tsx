// One scene at one frame, drawn as a single SVG. The player shows it on screen and the MP4 exporter
// paints the very same SVG onto a canvas, so what plays is exactly what exports
// (devpost/spec.md > Video scene renderer (SVG)).
import { CavemanRig } from '../caveman/CavemanRig';
import { assetById } from '../director/props';
import { isUpload, uploadHref, uploadRef } from '../editor/uploads';
import { QUIZ_REVEAL_MS } from '../director/lesson';
import type { Caption, Project, Quiz, Scene, Shape } from '../types';
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
  // Quiz and recap cards fill the right side, so the caveman steps aside for them.
  const aside = scene.props.length || scene.kind === 'quiz' || scene.kind === 'recap';
  return scene.cavemanAt ?? { x: aside ? spot.withProps : spot.x, y: spot.feet, scale: spot.height, rotation: 0 };
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

const INK = '#1F1A17';

/** Text that wraps inside a box, set in the caption face. */
function BoxText({ text, x, y, w, size, anchor = 'start', fill = INK }: { text: string; x: number; y: number; w: number; size: number; anchor?: 'start' | 'middle'; fill?: string }) {
  const lines = wrap(text.split(/\s+/).filter(Boolean), size, w);
  return (
    <text x={x} y={y} fontFamily={CAPTION_FONT} fontWeight={800} fontSize={size} fill={fill} textAnchor={anchor}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i ? size * 1.1 : 0}>
          {l.join(' ')}
        </tspan>
      ))}
    </text>
  );
}
const linesOf = (text: string, size: number, w: number) => wrap(text.split(/\s+/).filter(Boolean), size, w).length;

/** Title card (prd.md > F12.1): the topic, huge, on a tilted sticker. */
function TitleCard({ text, frame, width, height }: { text: string; frame: number; width: number; height: number }) {
  const short = Math.min(width, height);
  const size = short * (text.length > 22 ? 0.1 : 0.14);
  const n = linesOf(text, size, width * 0.8);
  const boxH = n * size * 1.1 + size * 0.7;
  const enter = Math.min(1.04, spring(frame, FPS, 10, 160));
  return (
    <g data-testid="title-card" transform={`translate(${width / 2} ${height * 0.08 + boxH / 2}) rotate(-2.5) scale(${enter})`}>
      <rect x={-width * 0.44} y={-boxH / 2} width={width * 0.88} height={boxH} rx={size * 0.35} fill="#FFFFFF" stroke={INK} strokeWidth={short * 0.008} />
      <BoxText text={text} x={0} y={-boxH / 2 + size * 1.0} w={width * 0.8} size={size} anchor="middle" />
    </g>
  );
}

/** Recap (prd.md > F12.3): the recap line as bold word-art the caveman points at. */
function RecapCard({ text, frame, width, height, shape }: { text: string; frame: number; width: number; height: number; shape: Shape }) {
  const short = Math.min(width, height);
  const w = shape === 'tall' ? width * 0.86 : width * 0.5;
  const x = shape === 'tall' ? width * 0.07 : width * 0.44;
  const size = short * 0.085;
  const n = linesOf(text, size, w - size);
  const boxH = n * size * 1.12 + size * 1.6;
  const y = shape === 'tall' ? height * 0.1 : (height - boxH) / 2 - height * 0.06;
  const enter = Math.min(1, spring(frame - 6, FPS, 12, 180));
  return (
    <g data-testid="recap-card" opacity={enter} transform={`translate(0 ${(1 - enter) * 30})`}>
      <rect x={x} y={y} width={w} height={boxH} rx={size * 0.4} fill="#FFD731" stroke={INK} strokeWidth={short * 0.008} />
      <text x={x + size * 0.5} y={y + size * 0.85} fontFamily={CAPTION_FONT} fontWeight={800} fontSize={size * 0.45} fill={INK}>REMEMBER</text>
      <BoxText text={text} x={x + size * 0.5} y={y + size * 1.75} w={w - size} size={size} />
    </g>
  );
}

/** Quiz (prd.md > F12.2): question, a countdown while everyone thinks, then the answer with a ding. */
function QuizCard({ quiz, scene, frame, width, height, shape }: { quiz: Quiz; scene: Scene; frame: number; width: number; height: number; shape: Shape }) {
  const short = Math.min(width, height);
  const tall = shape === 'tall';
  const x = tall ? width * 0.06 : width * 0.4;
  const w = tall ? width * 0.88 : width * 0.56;
  const size = short * 0.06;
  const ms = (frame / FPS) * 1000;
  const revealAt = scene.durationMs - QUIZ_REVEAL_MS;
  const thinkAt = revealAt - quiz.thinkSeconds * 1000;
  const revealed = ms >= revealAt;
  const left = Math.max(0, Math.ceil((revealAt - ms) / 1000));
  const qLines = linesOf(quiz.question, size, w - size);
  const qH = qLines * size * 1.12 + size * 1.5;
  const y0 = height * (tall ? 0.06 : 0.07);
  const opts = quiz.options ?? [];
  const optH = size * 1.5;
  const optsY = y0 + qH + size * 0.5;
  const afterOpts = optsY + (opts.length ? Math.ceil(opts.length / 2) * (optH + size * 0.35) : 0);
  const pop = Math.min(1, spring(Math.max(0, frame - (revealAt / 1000) * FPS), FPS, 10, 200));
  const COLORS = ['#E9CCFF', '#DCEEFF', '#FFE9A8', '#C9F4DF'];
  return (
    <g data-testid="quiz-card">
      <rect x={x} y={y0} width={w} height={qH} rx={size * 0.45} fill="#FFFFFF" stroke={INK} strokeWidth={short * 0.007} />
      <text x={x + size * 0.5} y={y0 + size * 0.8} fontFamily={CAPTION_FONT} fontWeight={800} fontSize={size * 0.5} fill="#5C4ADE">QUIZ TIME</text>
      <BoxText text={quiz.question} x={x + size * 0.5} y={y0 + size * 1.6} w={w - size} size={size} />
      {opts.map((o, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const ow = (w - size * 0.35) / 2;
        const ox = x + col * (ow + size * 0.35);
        const oy = optsY + row * (optH + size * 0.35);
        const right = revealed && quiz.correct === i;
        return (
          <g key={i} data-testid="quiz-option" data-correct={right ? 'true' : undefined} opacity={revealed && !right ? 0.45 : 1}>
            <rect x={ox} y={oy} width={ow} height={optH} rx={optH / 2} fill={right ? '#55DB9C' : COLORS[i % 4]} stroke={INK} strokeWidth={short * (right ? 0.01 : 0.006)} />
            <text x={ox + optH * 0.5} y={oy + optH * 0.66} fontFamily={CAPTION_FONT} fontWeight={800} fontSize={size * 0.8} fill={INK}>
              {String.fromCharCode(65 + i)}. {o}
            </text>
          </g>
        );
      })}
      {ms >= thinkAt && !revealed && (
        <g data-testid="quiz-countdown" transform={`translate(${x + w - size * 1.4} ${afterOpts + size * 1.8})`}>
          <circle r={size * 1.25} fill="#FB4903" stroke={INK} strokeWidth={short * 0.007} />
          <text y={size * 0.5} textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={800} fontSize={size * 1.4} fill="#FFFFFF">{left}</text>
          <text x={-size * 1.8} y={size * 0.25} textAnchor="end" fontFamily={CAPTION_FONT} fontWeight={800} fontSize={size * 0.8} fill={INK}>Think…</text>
        </g>
      )}
      {revealed && (
        <g data-testid="quiz-answer" transform={`translate(${x + w / 2} ${afterOpts + size * 1.8}) scale(${pop}) rotate(-2)`}>
          <rect x={-w / 2} y={-size * 1.05} width={w} height={size * 2.1} rx={size} fill="#55DB9C" stroke={INK} strokeWidth={short * 0.008} />
          <text y={size * 0.35} textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={800} fontSize={size * 0.95} fill={INK}>
            {quiz.answer ? `✓ ${quiz.answer}` : 'Discuss!'}
          </text>
        </g>
      )}
    </g>
  );
}

export function SceneSvg({ project, scene, frame, index, hrefFor = defaultHref, embeddedCss, className, title, editing }: SceneSvgProps) {
  const { width, height } = SIZES[project.shape];
  const mood = MOODS[project.mood];
  const { cx, feet, h: rigH, w: rigW, rotation: rigTurn } = cavemanBox(project, scene);
  const bg = scene.background;
  const ms = (frame / FPS) * 1000;
  const quizPhase = scene.kind === 'quiz' && scene.quiz ? (ms >= scene.durationMs - QUIZ_REVEAL_MS ? 'reveal' : 'ask') : undefined;
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
                motion={quizPhase === 'reveal' ? 'celebrate' : scene.kind === 'quiz' ? 'think' : scene.motion}
                expression={quizPhase === 'reveal' ? 'happy' : scene.expression}
                frame={frame}
                blinkSeed={index}
                mouthOpen={scene.voice.envelope ? (scene.voice.envelope[frame] ?? 0) : undefined}
              />
            </g>
          )}
          {scene.kind === 'quiz' && scene.quiz && <QuizCard quiz={scene.quiz} scene={scene} frame={frame} width={width} height={height} shape={project.shape} />}
          {scene.kind === 'title' && <TitleCard text={scene.captions[0]?.text ?? scene.words} frame={frame} width={width} height={height} />}
          {scene.kind === 'recap' && <RecapCard text={scene.captions[0]?.text ?? scene.words} frame={frame} width={width} height={height} shape={project.shape} />}
          {scene.kind !== 'title' && scene.kind !== 'recap' && captions.map(({ c, i, at, on }) => (
            <g key={i} opacity={on ? 1 : 0}>
              <CaptionText caption={c} mood={mood} shape={project.shape} frame={editing ? 30 : frame - ((c.startMs ?? 0) / 1000) * FPS} width={width} height={height} lift={at} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
