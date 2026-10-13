// One Remotion composition for both the in-page Player and the MP4 export, so what plays is
// exactly what exports (devpost/spec.md > Video composition (Remotion)).
import { AbsoluteFill, Img, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CavemanRig } from '../caveman/CavemanRig';
import { assetById } from '../director/props';
import type { Caption, Project, Scene, Shape } from '../types';
import { MOODS, type MoodSpec } from './moods';

export const FPS = 30;

export const SIZES: Record<Shape, { width: number; height: number }> = {
  wide: { width: 1920, height: 1080 },
  tall: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

export const sceneFrames = (scene: Scene) => Math.max(1, Math.round((scene.durationMs / 1000) * FPS));

/** Start frame of each scene plus the total length. */
export function timeline(project: Project): { starts: number[]; total: number } {
  const starts: number[] = [];
  let t = 0;
  for (const s of project.scenes) {
    starts.push(t);
    t += sceneFrames(s);
  }
  return { starts, total: Math.max(1, t) };
}

/** Where the caveman stands, per shape, as % of the frame (feet position and height). */
const CAVEMAN_SPOT: Record<Shape, { x: number; withProps: number; feet: number; height: number }> = {
  wide: { x: 50, withProps: 30, feet: 80, height: 66 },
  square: { x: 50, withProps: 34, feet: 78, height: 58 },
  tall: { x: 50, withProps: 50, feet: 74, height: 36 },
};

function SceneBackground({ scene, mood }: { scene: Scene; mood: MoodSpec }) {
  const bg = scene.background;
  if (bg.type === 'setting') {
    const asset = assetById(bg.assetId);
    if (asset) return <Img src={`/${asset.file}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  const color = bg.type === 'color' ? bg.color : mood.backgrounds[0];
  return <AbsoluteFill style={{ background: color }} />;
}

function CaptionView({ caption, mood, shape }: { caption: Caption; mood: MoodSpec; shape: Shape }) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const short = Math.min(width, height);
  const size = Math.round(short * (caption.wordArt ? 0.1 : 0.075));
  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const words = caption.text.split(/(\s+)/);
  const kw = caption.keyword?.toLowerCase();
  const stroke = mood.band ? 0 : Math.round(size * 0.14);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: `${shape === 'tall' ? 14 : 4.5}%` }}>
      <div
        data-testid="caption"
        style={{
          fontFamily: "'Baloo 2', 'Fredoka', sans-serif",
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.05,
          textAlign: 'center',
          maxWidth: '88%',
          color: mood.captionFill,
          WebkitTextStroke: stroke ? `${stroke}px ${mood.captionStroke}` : undefined,
          paintOrder: 'stroke fill',
          background: mood.band,
          borderRadius: mood.band ? size * 0.3 : 0,
          padding: mood.band ? `${size * 0.08}px ${size * 0.35}px` : 0,
          transform: `translateY(${(1 - enter) * 40}px) scale(${0.9 + enter * 0.1})`,
          opacity: Math.min(1, enter * 1.4),
        }}
      >
        {words.map((w, i) =>
          kw && w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === kw.replace(/[^\p{L}\p{N}]/gu, '') ? (
            <span key={i} style={{ color: mood.band ? mood.highlight : mood.highlight, textDecoration: mood.band ? `underline ${Math.round(size * 0.08)}px` : undefined }}>
              {w}
            </span>
          ) : (
            <span key={i}>{w}</span>
          ),
        )}
      </div>
    </AbsoluteFill>
  );
}

function PropView({ assetId, x, y, scale, rotation, index }: Scene['props'][number] & { index: number }) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const asset = assetById(assetId);
  if (!asset) return null;
  const pop = spring({ frame: frame - 4 - index * 6, fps, config: { damping: 10, mass: 0.5 } });
  const float = Math.sin((frame + index * 20) / 18) * height * 0.006;
  const size = (scale / 100) * height;
  return (
    <Img
      src={`/${asset.file}`}
      data-testid="prop"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) translateY(${float}px) rotate(${rotation}deg) scale(${pop})`,
      }}
    />
  );
}

function SceneView({ scene, project, index }: { scene: Scene; project: Project; index: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const mood = MOODS[project.mood];
  const spot = CAVEMAN_SPOT[project.shape];
  const rigH = (spot.height / 100) * height;
  const rigW = rigH * (200 / 320);
  const cx = ((scene.props.length ? spot.withProps : spot.x) / 100) * width;
  const feet = (spot.feet / 100) * height;
  return (
    <AbsoluteFill>
      <SceneBackground scene={scene} mood={mood} />
      {scene.props.map((p, i) => (
        <PropView key={`${p.assetId}-${i}`} {...p} index={i} />
      ))}
      {!scene.hideCaveman && (
        <svg
          viewBox="0 0 200 320"
          width={rigW}
          height={rigH}
          style={{ position: 'absolute', left: cx - rigW / 2, top: feet - rigH, overflow: 'visible' }}
        >
          <CavemanRig design={project.caveman} motion={scene.motion} expression={scene.expression} frame={frame} blinkSeed={index} />
        </svg>
      )}
      {scene.captions.map((c, i) => (
        <CaptionView key={i} caption={c} mood={mood} shape={project.shape} />
      ))}
    </AbsoluteFill>
  );
}

export function LessonVideo({ project }: { project: Project }) {
  const { starts } = timeline(project);
  return (
    <AbsoluteFill style={{ background: '#FDF6E3' }}>
      {project.scenes.map((scene, i) => (
        <Sequence key={scene.id} from={starts[i]} durationInFrames={sceneFrames(scene)} layout="none">
          <SceneView scene={scene} project={project} index={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
