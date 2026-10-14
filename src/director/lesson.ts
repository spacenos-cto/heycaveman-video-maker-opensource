// Start from a topic (devpost/prd.md > F3.2–F3.3, F12): the Lesson Builder's blanks become a script in a
// proven explainer order — title → hook → points → example → recap → quiz → outro — with title, recap and
// quiz scenes. Pure functions; no AI.
import type { LessonFields, Project, Quiz, Scene } from '../types';
import { MOODS } from '../video/moods';
import { makeCaption, prettifyFormula } from './caption';
import { clean } from './clean';
import { direct } from './index';
import { chooseProps } from './props';
import { sceneLength } from './timing';

export const DEFAULT_THINK_SECONDS = 5;
export const MAX_POINTS = 5;

export type Template = {
  id: string;
  emoji: string;
  title: string;
  subject: string;
  /** Labels for the blanks where this template asks differently. */
  labels?: Partial<Record<'topic' | 'hook' | 'points' | 'example' | 'recap' | 'quiz', string>>;
  /** The grey examples. Filled only with these, every template makes a 30–90 s video. */
  example: LessonFields;
};

export const TEMPLATES: Template[] = [
  {
    id: 'concept',
    emoji: '💡',
    title: 'Explain a concept',
    subject: 'Science, maths',
    example: {
      topic: 'Photosynthesis',
      hook: 'Ever wondered how a plant eats without a mouth?',
      points: ['Leaves catch the bright sunlight.', 'Roots drink water from the soil.', 'The leaves breathe in carbon dioxide from the air.'],
      example: "That's why plants lean towards the window.",
      recap: 'Sunlight + water + air = plant food.',
      quiz: { question: 'What gas do plants breathe in?', answer: 'Carbon dioxide' },
    },
  },
  {
    id: 'history',
    emoji: '🏛️',
    title: 'Tell a story from history',
    subject: 'Who, when, what happened, why it matters',
    labels: { points: 'What happened (in order)', example: 'Why it matters today' },
    example: {
      topic: 'The first moon landing',
      hook: 'Can you imagine walking on the moon?',
      points: ['In 1969, three astronauts flew a rocket to the moon.', 'Neil Armstrong was the first person to step onto it.', 'They collected moon rocks and came safely home.'],
      example: 'It showed that people can explore new worlds by working together.',
      recap: 'July 1969: humans walked on the moon.',
      quiz: { question: 'Who was the first person on the moon?', answer: 'Neil Armstrong' },
    },
  },
  {
    id: 'process',
    emoji: '🔢',
    title: 'Step-by-step process',
    subject: 'How something works or how to do it',
    labels: { points: 'Steps (in order)' },
    example: {
      topic: 'How to wash your hands',
      hook: 'Do you know the right way to wash your hands?',
      points: ['First, wet your hands with clean water.', 'Next, rub soap on every finger for twenty seconds.', 'Then rinse the soap away and dry your hands.'],
      example: 'This keeps germs away before you eat your food.',
      recap: 'Wet, soap, rinse, dry.',
      quiz: { question: 'How long should you rub the soap?', answer: 'Twenty seconds' },
    },
  },
  {
    id: 'word',
    emoji: '🔤',
    title: 'Word of the day',
    subject: 'Word, meaning, use it in a sentence',
    labels: { topic: 'The word', points: 'What it means', example: 'Use it in a sentence' },
    example: {
      topic: 'Delicious',
      hook: "Here's a tasty word for today!",
      points: ['Delicious means food tastes really, really good.', 'When a meal is delicious, you want another bite.'],
      example: 'This hot pizza is delicious!',
      recap: 'Delicious means yummy.',
      quiz: { question: 'Which one can be delicious?', options: ['A pencil', 'An apple', 'A shoe'], correct: 1 },
    },
  },
  {
    id: 'myth',
    emoji: '🕵️',
    title: 'Myth vs fact',
    subject: 'The myth, why people believe it, the fact',
    labels: { points: 'The myth, then why people believe it', example: 'The fact' },
    example: {
      topic: 'Reading in dim light',
      hook: 'Will reading a book in dim light ruin your eyes?',
      points: ['Many people say reading in dim light damages your eyes forever.', 'People believe it because their eyes feel tired after reading in the dark.'],
      example: "In fact, your eyes just get tired, and a good night's sleep in bed fixes it!",
      recap: 'Myth busted: dim light makes eyes tired, not damaged.',
      quiz: { question: 'Does reading in dim light damage your eyes?', answer: 'No, it just makes them tired' },
    },
  },
  {
    id: 'book',
    emoji: '📚',
    title: 'Book or chapter summary',
    subject: 'Title, characters, three events, the lesson',
    labels: { topic: 'Book or chapter title', points: 'Three big events', example: 'The lesson of the story' },
    example: {
      topic: 'The Tortoise and the Hare',
      hook: 'Who do you think wins a race, a fast hare or a slow tortoise?',
      points: ['The hare laughed at the slow tortoise and raced ahead.', 'The hare felt so sure that he took a nap.', 'The tortoise kept walking and crossed the finish line first.'],
      example: 'Slow and steady wins the race.',
      recap: 'Keep going, even when you are slow.',
      quiz: { question: 'Why did the hare lose the race?', answer: 'He took a nap' },
    },
  },
];

const filled = (s?: string) => (s ?? '').trim();
const sentence = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** The topic inside a sentence: "Photosynthesis" → "photosynthesis", but "NASA" and "Neil Armstrong" stay. */
export function inSentence(topic: string): string {
  const t = topic.trim();
  const first = t.split(/\s+/)[0] ?? '';
  const properName = /^[A-Z][a-z]+$/.test(first) && /\s[A-Z]/.test(t) && !/^(The|A|An|How|Why|What)$/.test(first);
  return /^[A-Z][a-z]/.test(t) && !properName ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}
export const autoHook = (topic: string) => `Ever wondered about ${inSentence(topic)}?`;
export const outroLine = (topic: string) => `And that's ${inSentence(topic)} in a nutshell!`;

/** What's missing before Make works. */
export function lessonProblems(l: LessonFields): ('topic' | 'points' | 'correct')[] {
  const out: ('topic' | 'points' | 'correct')[] = [];
  if (!filled(l.topic)) out.push('topic');
  if (!l.points.some((p) => filled(p))) out.push('points');
  const opts = l.quiz?.options?.filter((o) => filled(o)) ?? [];
  if (filled(l.quiz?.question) && opts.length >= 2 && (l.quiz?.correct === undefined || !filled(l.quiz.options?.[l.quiz.correct]))) out.push('correct');
  return out;
}

/** The spoken script, in order (Turn into text). */
export function buildScript(l: LessonFields): string {
  const parts = [
    filled(l.hook) || autoHook(l.topic),
    ...l.points.filter((p) => filled(p)).map(sentence),
    filled(l.example) && sentence(l.example!),
    filled(l.recap) && sentence(l.recap!),
    filled(l.quiz?.question),
    outroLine(l.topic),
  ].filter(Boolean) as string[];
  return parts.join('\n\n');
}

function quizOf(l: LessonFields): Quiz | undefined {
  const q = l.quiz;
  if (!q || !filled(q.question)) return undefined;
  const options = q.options?.map((o) => o.trim()).filter(Boolean);
  return {
    question: q.question.trim(),
    answer: filled(q.answer) || (options && q.correct !== undefined ? q.options?.[q.correct]?.trim() : undefined),
    options: options && options.length >= 2 ? options.slice(0, 4) : undefined,
    correct: options && options.length >= 2 ? q.correct : undefined,
    thinkSeconds: Math.min(10, Math.max(3, q.thinkSeconds ?? DEFAULT_THINK_SECONDS)),
  };
}

/** A whole video from the Lesson Builder. */
export function newLessonProject(l: LessonFields, base: Pick<Project, 'shape' | 'mood' | 'caveman' | 'readingSpeed'> & Partial<Pick<Project, 'sfxLevel' | 'endCard'>>): Project {
  const speed = base.readingSpeed;
  const hook = filled(l.hook) || autoHook(l.topic);
  const recap = filled(l.recap);
  const body = [hook, ...l.points.filter((p) => filled(p)).map(sentence), filled(l.example) && sentence(l.example!)].filter(Boolean).join('\n\n');
  const outro = outroLine(l.topic);
  const { scenes: bodyScenes, seed } = direct(`${body}\n\n${outro}`, { shape: base.shape, mood: base.mood, readingSpeed: speed });
  const outroScene = bodyScenes.pop()!;
  const palette = MOODS[base.mood].backgrounds;
  const scenes: Scene[] = [];

  if (l.titleCard !== false) {
    const words = l.topic.trim();
    scenes.push({
      id: `title-${seed.toString(36)}`,
      kind: 'title',
      words,
      captions: [{ text: prettifyFormula(words), wordArt: true }],
      motion: 'wave',
      expression: 'happy',
      background: { type: 'color', color: palette[palette.length - 1] },
      props: chooseProps(words, base.shape, [], 1),
      sfx: 'sparkle',
      durationMs: Math.max(3000, sceneLength({ kind: 'title', words }, speed)),
      voice: { type: 'none' },
    });
  }
  // A sentence with no drawing of its own keeps the lesson's main drawing on screen (the topic object).
  const main = chooseProps(`${l.topic} ${body}`, base.shape, [], 1);
  for (const s of [...bodyScenes, outroScene]) if (!s.props.length && s.background.type !== 'setting' && main.length) s.props = main;
  scenes.push(...bodyScenes);
  const prevColor = () => {
    const b = scenes[scenes.length - 1]?.background;
    return b?.type === 'color' ? b.color : undefined;
  };
  const freshColor = () => palette.find((c) => c !== prevColor()) ?? palette[0];

  if (recap) {
    const text = sentence(recap);
    scenes.push({
      id: `recap-${seed.toString(36)}`,
      kind: 'recap',
      words: text,
      captions: [{ ...makeCaption(text), text: prettifyFormula(recap.replace(/[.!]+$/, '')), wordArt: true }],
      motion: 'point',
      expression: 'happy',
      background: { type: 'color', color: freshColor() },
      props: [],
      sfx: 'ding',
      durationMs: sceneLength({ kind: 'recap', words: text }, speed),
      voice: { type: 'none' },
    });
  }
  const quiz = quizOf(l);
  if (quiz) {
    const scene: Scene = {
      id: `quiz-${seed.toString(36)}`,
      kind: 'quiz',
      words: quiz.question,
      captions: [],
      motion: 'think',
      expression: 'neutral',
      background: { type: 'color', color: freshColor() },
      props: [],
      durationMs: 0,
      voice: { type: 'none' },
      quiz,
    };
    scene.durationMs = sceneLength(scene, speed);
    scenes.push(scene);
  }
  scenes.push({ ...outroScene, motion: 'wave', expression: 'happy', background: { type: 'color', color: freshColor() } });

  const now = Date.now();
  return {
    id: `p${now.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    formatVersion: 1,
    title: clean(l.topic).text.slice(0, 60) || 'Untitled lesson',
    shape: base.shape,
    mood: base.mood,
    caveman: base.caveman,
    scenes,
    seed,
    voiceMode: 'none',
    sfxLevel: base.sfxLevel ?? 'gentle',
    readingSpeed: speed,
    endCard: base.endCard ?? true,
    sourceText: buildScript(l),
    lesson: l,
    createdAt: now,
    updatedAt: now,
  };
}

/** When the answer shows, in ms from the start of a quiz scene (after the question is read and the countdown). */
export function quizRevealMs(scene: Pick<Scene, 'durationMs' | 'quiz'>): number {
  return Math.max(0, scene.durationMs - QUIZ_REVEAL_MS);
}
export const QUIZ_REVEAL_MS = 2800;
