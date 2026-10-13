// Small word helpers shared by the director steps. No AI: plain lists and rules.

export const STOP_WORDS = new Set(
  ('a an the and or but so if then than that this these those there here is are was were be been being am ' +
    'do does did done have has had having of to in on at by for from with without into onto over under about ' +
    'as it its it\'s they them their theirs we us our you your yours he him his she her hers i me my mine ' +
    'what which who whom whose when where why how all any each every some such no not only own same too very ' +
    'can could will would shall should may might must just also even still yet ever like up down out off ' +
    'again more most other into through during before after above below between both few many much lot lots ' +
    'get gets got make makes made let lets one ones thing things way really because while ok okay yes oh well')
    .split(/\s+/),
);

/** Lowercase word tokens, keeping apostrophes inside words. */
export function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) ?? []).map((w) => w.replace('’', "'"));
}

/** Very small stemmer: enough to make "leaves" ~ "leaf", "growing" ~ "grow". */
export function stem(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;
  if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith('ves') && w.length > 4) return `${w.slice(0, -3)}f`;
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && /(s|x|z|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

/**
 * Does a manifest name ("plant*", "leaves", "living room") match this text?
 * Returns how strongly: 2 = exact word, 1 = prefix or stem match, 0 = none.
 */
export function nameMatch(name: string, words: string[], lowered: string): number {
  if (name.includes(' ')) return lowered.includes(name) ? 2 : 0;
  if (name.endsWith('*')) {
    const prefix = name.slice(0, -1);
    return words.some((w) => w.startsWith(prefix)) ? 1 : 0;
  }
  if (words.includes(name)) return 2;
  const stemmed = stem(name);
  return words.some((w) => stem(w) === stemmed) ? 1 : 0;
}
