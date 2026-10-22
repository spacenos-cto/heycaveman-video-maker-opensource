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
 * Manifest names that are weak hints, not the topic: time words, adjectives, everyday verbs.
 * "Leaves catch the bright sunlight every day" is about leaves and sunlight, not days or light bulbs,
 * so these only bring a drawing when nothing in the sentence names a real thing.
 */
export const WEAK_NAMES = new Set([
  'day', 'days', 'date', 'week*', 'month*', 'year*', 'season*', 'time', 'late', 'early', 'wait*', 'morning',
  'bright', 'think*', 'smart', 'clever', 'important', 'remember', 'attention', 'wow', 'careful',
  'food', 'eat*', 'meal*', 'hungry', 'lunch', 'dinner', 'snack', 'healthy', 'drink*', 'energy',
  'work', 'feel*', 'kind*', 'care', 'say*', 'said', 'tell*', 'word*', 'rest', 'tired',
  'down', 'less', 'lower', 'up', 'more', 'higher', 'live', 'living', 'family', 'find*', 'place*',
  'best', 'great', 'excellent', 'famous', 'give', 'giving', 'present', 'far', 'sky', 'half', 'party',
  'fly', 'flying', 'strong', 'wonder*', 'progress', 'result*', 'data', 'screen', 'online', 'digital', 'save*',
]);

/** A "starts with" name counts only for short endings: "plant*" matches plants and planted, "win*" not window. */
const MAX_ENDING = 2;

/** Where and how well a manifest name ("plant*", "leaves", "living room") matches: `at` = word index. */
export function matchName(name: string, words: string[], lowered: string): { strength: 0 | 1 | 2; at: number } {
  const none = { strength: 0, at: -1 } as const;
  const strength = WEAK_NAMES.has(name) ? 1 : 2;
  if (name.includes(' ')) {
    if (!lowered.includes(name)) return none;
    const first = name.split(' ')[0];
    return { strength, at: Math.max(0, words.indexOf(first)) };
  }
  if (name.endsWith('*')) {
    const prefix = name.slice(0, -1);
    const at = words.findIndex((w) => {
      const root = stem(w);
      return root.startsWith(prefix) && root.length - prefix.length <= MAX_ENDING;
    });
    return at < 0 ? none : { strength, at };
  }
  const stemmed = stem(name);
  const at = words.findIndex((w) => w === name || stem(w) === stemmed);
  return at < 0 ? none : { strength, at };
}

/**
 * Does a manifest name match this text? 2 = a real thing named, 1 = only a weak hint, 0 = none.
 */
export function nameMatch(name: string, words: string[], lowered: string): number {
  return matchName(name, words, lowered).strength;
}
