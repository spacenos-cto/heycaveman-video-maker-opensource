// Step 1: tidy pasted text (devpost/prd.md > F2 edge cases 4 and F3.4).

const URL_RE = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;
const EMOJI_RE = /\p{Extended_Pictographic}️?/gu;
const BULLET_RE = /^\s*(?:[-*•▪◦·]|\d+[.)])\s+/;
const HEADING_RE = /^\s*#{1,6}\s+/;

export type Cleaned = { text: string; removedLinks: number };

export function clean(input: string): Cleaned {
  let removedLinks = 0;
  const lines = input
    .replace(/\r\n?/g, '\n')
    .replace(URL_RE, () => {
      removedLinks++;
      return '';
    })
    .replace(EMOJI_RE, '')
    .split('\n')
    .map((line) => {
      const isBullet = BULLET_RE.test(line);
      let out = line.replace(HEADING_RE, '').replace(BULLET_RE, '').replace(/[ \t]+/g, ' ').trim();
      // A bullet or heading without an ending becomes its own sentence.
      if ((isBullet || HEADING_RE.test(line)) && out && !/[.!?:;]$/.test(out)) out += '.';
      return out;
    });
  const text = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text, removedLinks };
}

export function containsLink(input: string): boolean {
  URL_RE.lastIndex = 0;
  return URL_RE.test(input);
}

export function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
}

/** "volcanoes" or "the water cycle": a few words and no sentence ending (PRD F2 edge case 1). */
export function isTopicOnly(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && countWords(t) <= 4 && !/[.!?]/.test(t);
}
