// Step 2: split cleaned text into paragraphs (blank line = forced scene break) of sentences.

const ABBREVIATIONS = ['mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'vs', 'etc', 'e.g', 'i.e', 'approx', 'no', 'fig'];

export function splitSentences(paragraph: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < paragraph.length; i++) {
    const ch = paragraph[i];
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;
    // Decimal number like 3.14
    if (ch === '.' && /\d/.test(paragraph[i - 1] ?? '') && /\d/.test(paragraph[i + 1] ?? '')) continue;
    // Abbreviation like "Dr." or "e.g."
    if (ch === '.') {
      const before = paragraph.slice(start, i).toLowerCase().match(/([a-z.]+)$/)?.[1] ?? '';
      if (ABBREVIATIONS.includes(before)) continue;
    }
    // Keep runs like "?!" or "..." together, then require a space or the end.
    let end = i + 1;
    while (end < paragraph.length && /[.!?"”’')]/.test(paragraph[end])) end++;
    if (end < paragraph.length && !/\s/.test(paragraph[end])) continue;
    const sentence = paragraph.slice(start, end).trim();
    if (sentence) out.push(sentence);
    start = end;
    i = end - 1;
  }
  const rest = paragraph.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}

/** Paragraphs (split on blank lines), each a list of sentences. */
export function split(text: string): string[][] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .map(splitSentences)
    .filter((s) => s.length > 0);
}
