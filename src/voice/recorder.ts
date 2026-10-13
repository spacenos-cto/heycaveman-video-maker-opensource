// Record my voice (devpost/prd.md > F10): the microphone is used only while recording, the level meter
// shows it's hearing you, recordings stop at 60 s, and a silent take is caught before it's kept.
import { isSilent } from './envelope';

export const MAX_RECORDING_MS = 60_000;

export type Recording = { samples: Float32Array; sampleRate: number; blob: Blob };

export type RecorderHandle = {
  /** Live loudness 0..1 for the level meter. */
  level: () => number;
  stop: () => Promise<Recording>;
  cancel: () => void;
};

export class MicError extends Error {
  constructor(public readonly kind: 'denied' | 'unavailable') {
    super(kind);
  }
}

/** Ask for the microphone (only when Record is pressed). Recording starts with begin(), after the countdown. */
export async function openMic(): Promise<{ begin: (onAutoStop: () => void) => RecorderHandle; release: () => void }> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) {
    const name = e instanceof DOMException ? e.name : '';
    throw new MicError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
  }
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const release = () => {
    clearTimeout(timer);
    stream.getTracks().forEach((t) => t.stop()); // the browser's "recording" indicator goes away
    void ctx.close();
  };

  return {
    release,
    begin: (onAutoStop) => {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.start(250);
      timer = setTimeout(onAutoStop, MAX_RECORDING_MS);

      return {
        level: () => {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += v * v;
          return Math.min(1, Math.sqrt(sum / buf.length) * 6);
        },
        cancel: () => {
          if (recorder.state !== 'inactive') recorder.stop();
          release();
        },
        stop: () =>
          new Promise<Recording>((resolve, reject) => {
            recorder.onstop = async () => {
              release();
              try {
                const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
                const decodeCtx = new AudioContext();
                const audio = await decodeCtx.decodeAudioData(await blob.arrayBuffer());
                void decodeCtx.close();
                resolve({ samples: audio.getChannelData(0).slice(), sampleRate: audio.sampleRate, blob });
              } catch (e) {
                reject(e);
              }
            };
            recorder.stop();
          }),
      };
    },
  };
}

export const recordingIsSilent = (r: Recording) => isSilent(r.samples);
