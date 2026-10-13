// Make the MP4 in the browser: draw each frame's SVG onto a canvas, encode with WebCodecs through
// Mediabunny, add the mixed audio, and return the file. No server, no network
// (devpost/spec.md > Export (F13)).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AudioBufferSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, QUALITY_MEDIUM } from 'mediabunny';
import { hasVoices } from '../audio/sounds';
import { assetById } from '../director/props';
import type { Project } from '../types';
import { SceneSvg } from '../video/SceneSvg';
import { FPS, locate, timeline } from '../video/timeline';
import { mixAudio } from './audioMix';
import { checkCapability, outputSize, type Quality } from './capability';
import { embeddedFontCss, embeddedHrefs } from './embed';

export type ExportProgress = { frame: number; total: number; elapsedMs: number; etaMs: number | null };

export class ExportError extends Error {
  constructor(
    public readonly kind: 'unsupported' | 'memory' | 'failed',
    message: string,
  ) {
    super(message);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('frame image failed to load'));
    img.src = url;
  });
}

/** Wait while the tab is hidden: browsers throttle hidden tabs, so the export pauses and resumes. */
function whenVisible(): Promise<void> {
  if (typeof document === 'undefined' || document.visibilityState === 'visible') return Promise.resolve();
  return new Promise((resolve) => {
    const on = () => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', on);
        resolve();
      }
    };
    document.addEventListener('visibilitychange', on);
  });
}

export async function renderMp4(
  project: Project,
  options: { quality: Quality; signal?: AbortSignal; onProgress?: (p: ExportProgress) => void },
): Promise<Blob> {
  const { width, height } = outputSize(project.shape, options.quality);
  const capability = await checkCapability(width, height);
  if (!capability.ok) throw new ExportError('unsupported', capability.reason);

  const tl = timeline(project);
  const files = tl.scenes.flatMap((s) => [
    ...s.props.map((p) => assetById(p.assetId)?.file ?? ''),
    ...(s.background.type === 'setting' ? [assetById(s.background.assetId)?.file ?? ''] : []),
  ]);
  const [hrefFor, fontCss] = await Promise.all([embeddedHrefs([...files.filter(Boolean), 'icons/logo.svg']), embeddedFontCss()]);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new ExportError('unsupported', 'no-canvas');

  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const video = new CanvasSource(canvas, { codec: 'avc', quality: options.quality === '1080p' ? QUALITY_HIGH : QUALITY_MEDIUM, keyFrameInterval: 2 });
  output.addVideoTrack(video, { frameRate: FPS });
  let audio: AudioBufferSource | null = null;
  if (capability.audio && (project.sfxLevel !== 'off' || hasVoices(project))) {
    audio = new AudioBufferSource({ codec: capability.audio, quality: QUALITY_MEDIUM });
    output.addAudioTrack(audio);
  }

  const started = performance.now();
  const abort = () => {
    void output.cancel();
  };
  options.signal?.addEventListener('abort', abort, { once: true });
  try {
    await output.start();
    for (let f = 0; f < tl.total; f++) {
      if (options.signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
      await whenVisible();
      const { index, local } = locate(tl, f);
      const svg = renderToStaticMarkup(createElement(SceneSvg, { project, scene: tl.scenes[index], frame: local, index, hrefFor, embeddedCss: fontCss }));
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      try {
        const img = await loadImage(url);
        ctx.drawImage(img, 0, 0, width, height);
      } finally {
        URL.revokeObjectURL(url);
      }
      await video.add(f / FPS, 1 / FPS);
      const elapsedMs = performance.now() - started;
      options.onProgress?.({ frame: f + 1, total: tl.total, elapsedMs, etaMs: f > 10 ? (elapsedMs / (f + 1)) * (tl.total - f - 1) : null });
    }
    if (audio) {
      if (options.signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
      await audio.add(await mixAudio(project, tl.total / FPS));
    }
    await output.finalize();
  } catch (e) {
    // Cancelling stops the encoder mid-frame, which can surface as the encoder's own error: still a cancel.
    if ((e instanceof DOMException && e.name === 'AbortError') || options.signal?.aborted) {
      throw new DOMException('Export cancelled', 'AbortError');
    }
    if (e instanceof RangeError || /memory|allocation/i.test(String(e))) throw new ExportError('memory', String(e));
    if (e instanceof ExportError) throw e;
    throw new ExportError('failed', e instanceof Error ? e.message : String(e));
  } finally {
    options.signal?.removeEventListener('abort', abort);
  }
  const buffer = (output.target as BufferTarget).buffer;
  if (!buffer) throw new ExportError('failed', 'empty output');
  return new Blob([buffer], { type: 'video/mp4' });
}

/** "photosynthesis-heycaveman.mp4" (devpost/prd.md > F13). */
export function fileName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'lesson';
  return `${slug}-heycaveman.mp4`;
}
