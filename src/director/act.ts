// Step 4: the caveman's motion and face fit the words (devpost/prd.md > F6 Gets back 2).
// A ranked rule list: the first matching rule wins; otherwise he talks.
import type { ExpressionId, MotionId } from '../types';
import { pick } from './random';

type Rule = { test: (s: string, lower: string) => boolean; motion: MotionId; expression: ExpressionId };

const has = (re: RegExp) => (_s: string, lower: string) => re.test(lower);

export const ACTING_RULES: Rule[] = [
  { test: has(/\b(hello|hi|hey|welcome|goodbye|bye|see you)\b/), motion: 'wave', expression: 'happy' },
  { test: has(/\b(yay|hooray|great|awesome|amazing|brilliant|well done|congrat\w*|win|won|success\w*)\b/), motion: 'celebrate', expression: 'happy' },
  { test: has(/\b(scared|afraid|scary|danger\w*|careful|warning|watch out|risk\w*)\b/), motion: 'scared', expression: 'worried' },
  { test: has(/\b(oops|mistake\w*|forgot|silly|confus\w*)\b/), motion: 'facepalm', expression: 'sad' },
  { test: has(/\b(sad|tired|bored|unfortunately|sadly|lonely|sick)\b/), motion: 'slump', expression: 'sad' },
  { test: has(/\b(wow|surpris\w*|incredible|unbelievable|whoa)\b/), motion: 'shrug', expression: 'surprised' },
  { test: has(/\b(but|however|wrong|myth|not true|false|never|don't|isn't|aren't|no way)\b/), motion: 'disagree', expression: 'determined' },
  { test: (s) => /\?\s*$/.test(s), motion: 'think', expression: 'neutral' },
  { test: has(/\b(i think|maybe|perhaps|imagine|guess|wonder\w*|suppose)\b/), motion: 'think', expression: 'neutral' },
  { test: has(/\b(eat\w*|food|hungry|lunch|dinner|breakfast|snack\w*|tasty)\b/), motion: 'eat', expression: 'happy' },
  { test: has(/\b(run\w*|fast|quick\w*|race|hurry|speed)\b/), motion: 'run', expression: 'determined' },
  { test: has(/\b(walk\w*|go|goes|went|travel\w*|journey|move\w*)\b/), motion: 'walk', expression: 'neutral' },
  { test: has(/\b(first|second|third|then|next|finally|step\w*|lastly)\b|\b\d+\b/), motion: 'explain', expression: 'determined' },
  { test: has(/\b(remember|important|key|look|notice|this is|here is)\b/), motion: 'point', expression: 'determined' },
  { test: has(/\b(because|that's why|so that|which means|this means)\b/), motion: 'explain', expression: 'neutral' },
  { test: has(/\b(not sure|don't know|who knows)\b/), motion: 'shrug', expression: 'neutral' },
  { test: has(/\b(rule\w*|must|always|strict)\b/), motion: 'crossArms', expression: 'determined' },
];

const TALKING: MotionId[] = ['talk', 'explain', 'point'];

export function act(
  sentence: string,
  previous: MotionId | undefined,
  rnd: () => number,
): { motion: MotionId; expression: ExpressionId } {
  const lower = sentence.toLowerCase();
  for (const rule of ACTING_RULES) {
    if (rule.test(sentence, lower)) return { motion: rule.motion, expression: rule.expression };
  }
  // No cue word: talk, but vary from the previous scene so neighbouring scenes don't look alike.
  const options = TALKING.filter((m) => m !== previous);
  return { motion: pick(options, rnd), expression: rnd() < 0.5 ? 'neutral' : 'happy' };
}
