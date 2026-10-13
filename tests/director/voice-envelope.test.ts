import { describe, expect, it } from 'vitest';
import { isSilent, loudnessEnvelope } from '../../src/voice/envelope';
import { sceneDuration } from '../../src/director/timing';

const tone = (seconds: number, rate = 24000, amp = 0.5) => Float32Array.from({ length: seconds * rate }, (_, i) => amp * Math.sin((i / rate) * 2 * Math.PI * 220));

describe('voice clips (prd.md > F10, lip-sync)', () => {
  it('makes one mouth value per video frame, open while speaking and shut in silence', () => {
    const clip = new Float32Array(24000 * 2);
    clip.set(tone(1), 0); // 1 s of sound, then 1 s of silence
    const env = loudnessEnvelope(clip, 24000);
    expect(env).toHaveLength(60);
    expect(Math.max(...env.slice(5, 25))).toBeGreaterThan(0.5);
    expect(Math.max(...env.slice(40))).toBe(0);
  });

  it('catches a silent recording before it is kept', () => {
    expect(isSilent(new Float32Array(48000))).toBe(true);
    expect(isSilent(tone(1, 48000, 0.2))).toBe(false);
  });

  it('a voiced scene lasts as long as its voice, plus a short beat', () => {
    expect(sceneDuration('Short words.', 'normal', 4200)).toBe(4800);
    expect(sceneDuration('Short words.', 'normal', 900)).toBe(2500); // never shorter than 2.5 s
  });
});
