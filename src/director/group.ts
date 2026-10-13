// Step 3: roughly one idea per scene (devpost/prd.md > F6 Gets back 1).
// Very short sentences join a neighbour; very long ones split at a comma or conjunction.
import { countWords } from './clean';

export const MIN_WORDS = 5;
export const MAX_WORDS = 28;

function splitLong(sentence: string): string[] {
  if (countWords(sentence) <= MAX_WORDS) return [sentence];
  const words = sentence.split(/\s+/);
  const middle = Math.floor(words.length / 2);
  // Prefer a break after a comma, then before a conjunction, nearest the middle.
  let best = -1;
  let bestDistance = Infinity;
  words.forEach((w, i) => {
    if (i < 3 || i > words.length - 4) return;
    const breakHere = /[,;:]$/.test(w) || /^(and|but|so|because|which|while|then)$/i.test(words[i + 1] ?? '');
    if (breakHere && Math.abs(i - middle) < bestDistance) {
      best = i;
      bestDistance = Math.abs(i - middle);
    }
  });
  const cut = best >= 0 ? best + 1 : middle;
  const first = words.slice(0, cut).join(' ').replace(/[,;:]$/, '.');
  const second = words.slice(cut).join(' ');
  const capitalised = second.charAt(0).toUpperCase() + second.slice(1);
  return [...splitLong(first), ...splitLong(capitalised)];
}

/** Each paragraph becomes one or more scene texts; paragraphs never merge. */
export function group(paragraphs: string[][]): string[] {
  const scenes: string[] = [];
  for (const sentences of paragraphs) {
    const pieces = sentences.flatMap(splitLong);
    const merged: string[] = [];
    for (const piece of pieces) {
      const last = merged[merged.length - 1];
      if (last !== undefined && (countWords(piece) < MIN_WORDS || countWords(last) < MIN_WORDS) &&
          countWords(last) + countWords(piece) <= MAX_WORDS) {
        merged[merged.length - 1] = `${last} ${piece}`;
      } else {
        merged.push(piece);
      }
    }
    scenes.push(...merged);
  }
  return scenes;
}
