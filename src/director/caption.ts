// Step 7: big bold key words, not paragraphs (devpost/prd.md > F6 Gets back 4).
import type { Caption } from '../types';
import { STOP_WORDS, tokens } from './words';

export const MAX_CAPTION_WORDS = 5;

/** CO2 -> CO₂, H2O -> H₂O; "x^2" -> x². */
export function prettifyFormula(text: string): string {
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const SUP: Record<string, string> = { '2': '²', '3': '³' };
  return text
    .replace(/\b((?:[A-Z][a-z]?\d*){1,6})\b/g, (m) => (/[A-Z][a-z]?\d/.test(m) ? m.replace(/\d/g, (d) => SUB[+d]) : m))
    .replace(/\^([23])/g, (_, d: string) => SUP[d])
    .replace(/->/g, '→');
}

/** An equation or a stand-alone number worth drawing as word-art. */
export function findWordArt(sentence: string): string | undefined {
  const eq = sentence.match(/[\w₀-₉()]+(?:\s*[+\-×x*/=→]\s*[\w₀-₉()]+){1,6}/);
  if (eq && /[=+→]|->/.test(sentence) && /[\d=+]/.test(eq[0])) return prettifyFormula(eq[0].replace(/\s+/g, ' ').trim());
  return undefined;
}

export function makeCaption(sentence: string, preferredKeyword?: string): Caption {
  const art = findWordArt(sentence);
  if (art) return { text: art, wordArt: true };
  const original = sentence.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) ?? [];
  const lower = tokens(sentence);
  const keep: string[] = [];
  original.forEach((word, i) => {
    const w = lower[i] ?? word.toLowerCase();
    if (!STOP_WORDS.has(w) && (w.length > 2 || /\d/.test(w))) keep.push(word);
  });
  const words = (keep.length ? keep : original).slice(0, MAX_CAPTION_WORDS);
  // Key word: the word that matched a drawing, else the longest word.
  const keyword =
    words.find((w) => preferredKeyword && w.toLowerCase().startsWith(preferredKeyword.toLowerCase().slice(0, 4))) ??
    [...words].sort((a, b) => b.length - a.length)[0];
  return { text: words.join(' '), keyword };
}
