/// <reference lib="webworker" />
// Offline caveman voices (devpost/spec.md > Voice (F10)). Runs the Kokoro speech model in a background
// worker so typing never freezes. The model downloads once from Hugging Face (the app's single,
// documented outside request) and is kept in the browser's cache; the speech engine's WebAssembly
// loads from this app's own /ort/ folder, never a CDN.
import { env } from '@huggingface/transformers';
import { KokoroTTS } from 'kokoro-js';

export const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

type Request =
  | { id: number; type: 'load'; modelBase?: string }
  | { id: number; type: 'voices' }
  | { id: number; type: 'speak'; text: string; voice: string; speed: number };

env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = '/ort/';
  env.backends.onnx.wasm.numThreads = 1; // no cross-origin isolation needed
}

let tts: KokoroTTS | null = null;
let loading: Promise<KokoroTTS> | null = null;

const post = (msg: unknown, transfer: Transferable[] = []) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, transfer);

function load(id: number, modelBase?: string): Promise<KokoroTTS> {
  if (modelBase) env.remoteHost = modelBase; // schools can host the model themselves
  loading ??= (async () => {
    const files = new Map<string, { loaded: number; total: number }>();
    const model = await KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (p.status === 'progress' && p.file && p.total) {
          files.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
          let loaded = 0;
          let total = 0;
          for (const f of files.values()) {
            loaded += f.loaded;
            total += f.total;
          }
          post({ id, type: 'progress', loaded, total });
        }
      },
    });
    tts = model;
    return model;
  })();
  loading.catch(() => {
    loading = null; // allow a retry
  });
  return loading;
}

self.addEventListener('message', async (e: MessageEvent<Request>) => {
  const req = e.data;
  try {
    if (req.type === 'load') {
      await load(req.id);
      post({ id: req.id, type: 'done' });
    } else if (req.type === 'voices') {
      const model = tts ?? (await load(req.id));
      const voices = Object.entries(model.voices as Record<string, { name: string; language: string; gender: string; overallGrade?: string }>).map(
        ([vid, v]) => ({ id: vid, name: v.name, language: v.language, gender: v.gender, grade: v.overallGrade ?? '' }),
      );
      post({ id: req.id, type: 'done', voices });
    } else if (req.type === 'speak') {
      const model = tts ?? (await load(req.id));
      const audio = await model.generate(req.text, { voice: req.voice as never, speed: req.speed });
      const samples = audio.audio as Float32Array;
      post({ id: req.id, type: 'done', samples, sampleRate: audio.sampling_rate }, [samples.buffer]);
    }
  } catch (err) {
    post({ id: req.id, type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
});
