// The page side of the voice worker: download the model once, list voices, speak a line.
// Also the device check (devpost/prd.md > F10 edge case 1): weak devices get "try Record my voice".

export type VoiceInfo = { id: string; name: string; language: string; gender: string; grade: string };

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; onProgress?: (loaded: number, total: number) => void };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./kokoroWorker.ts', import.meta.url), { type: 'module', name: 'kokoroWorker' });
  worker.addEventListener('message', (e) => {
    const m = e.data as { id: number; type: string; loaded?: number; total?: number; message?: string };
    const p = pending.get(m.id);
    if (!p) return;
    if (m.type === 'progress') p.onProgress?.(m.loaded ?? 0, m.total ?? 0);
    else if (m.type === 'error') {
      pending.delete(m.id);
      p.reject(new Error(m.message));
    } else if (m.type === 'done') {
      pending.delete(m.id);
      p.resolve(m);
    }
  });
  worker.addEventListener('error', (e) => {
    for (const p of pending.values()) p.reject(new Error(e.message || 'voice engine failed'));
    pending.clear();
  });
  return worker;
}

function call<T>(msg: Record<string, unknown>, onProgress?: Pending['onProgress']): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
    getWorker().postMessage({ ...msg, id });
  });
}

/** Can this device run the built-in voices? Needs WebAssembly SIMD and enough memory. */
export function voicesSupported(): boolean {
  const simd = (() => {
    try {
      // Minimal module using a v128 instruction; validates only where SIMD is supported.
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
    } catch {
      return false;
    }
  })();
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return simd && (memory === undefined || memory >= 4);
}

/** Download (first time) and start the voice model. Progress in bytes. */
export function loadVoices(onProgress?: (loaded: number, total: number) => void): Promise<void> {
  return call<void>({ type: 'load' }, onProgress);
}

export async function listVoices(): Promise<VoiceInfo[]> {
  const r = await call<{ voices: VoiceInfo[] }>({ type: 'voices' });
  return r.voices;
}

export async function speak(text: string, voice: string, speed: number): Promise<{ samples: Float32Array; sampleRate: number }> {
  return call<{ samples: Float32Array; sampleRate: number }>({ type: 'speak', text, voice, speed });
}

/** True once the model files are in the browser's cache (used to say "Voices ready" on reload). */
export async function voicesDownloaded(): Promise<boolean> {
  try {
    const cache = await caches.open('transformers-cache');
    const keys = await cache.keys();
    return keys.some((k) => k.url.includes('Kokoro-82M') && k.url.includes('.onnx'));
  } catch {
    return false;
  }
}

/** Delete voices (frees ~90 MB; devpost/prd.md > F16 Storage). */
export async function deleteVoices(): Promise<void> {
  await caches.delete('transformers-cache');
}
