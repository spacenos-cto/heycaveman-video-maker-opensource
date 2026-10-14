// Start from a topic (devpost/prd.md > F3.2) and templates (F3.3): fill-in-the-blanks with grey examples,
// then Make my video, or Turn into text to edit the script freely. No AI: the order does the work.
import { Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { countWords } from '../director/clean';
import { lessonProblems, MAX_POINTS, TEMPLATES, type Template } from '../director/lesson';
import { en } from '../i18n/en';
import type { LessonFields } from '../types';
import { Button } from '../ui/Button';

const t = en.lesson;
export const EMPTY_LESSON: LessonFields = { topic: '', points: ['', '', ''], titleCard: true };

const field = 'mt-1 w-full rounded-[16px] border-[1.5px] border-black bg-white px-3 py-2 placeholder:text-ash/60 focus:bg-[#fffbe0] focus:outline-none';

function Blank({ label, hint, value, onChange, required, long }: { label: string; hint?: string; value: string; onChange: (v: string) => void; required?: boolean; long?: boolean }) {
  const tooLong = countWords(value) > 60;
  return (
    <label className="block">
      <span className="text-sm font-extrabold uppercase tracking-[0.03em]">
        {label} {!required && <span className="font-medium normal-case tracking-normal text-ash">{t.optional}</span>}
      </span>
      {long ? (
        <textarea rows={2} value={value} placeholder={hint} onChange={(e) => onChange(e.target.value)} className={field} />
      ) : (
        <input value={value} placeholder={hint} onChange={(e) => onChange(e.target.value)} className={field} />
      )}
      {tooLong && <span className="mt-1 block text-xs text-violet">{t.shortReads}</span>}
    </label>
  );
}

export function TemplateCards({ onPick }: { onPick: (tpl: Template) => void }) {
  const COLORS = ['bg-lavender', 'bg-mint', 'bg-sun', 'bg-[#dceeff]', 'bg-[#ffd2c2]', 'bg-white'];
  return (
    <ul className="stagger mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="templates">
      {TEMPLATES.map((tpl, i) => (
        <li key={tpl.id}>
          <button type="button" onClick={() => onPick(tpl)} className={`lift flex h-full w-full flex-col items-start gap-1 rounded-[22px] border-[1.5px] border-black p-4 text-left ${COLORS[i]}`}>
            <span className="text-3xl" aria-hidden="true">{tpl.emoji}</span>
            <span className="font-display text-2xl">{tpl.title}</span>
            <span className="text-sm text-ash">{tpl.subject}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function LessonBuilder({ lesson, onChange, template, onMake, onTurnIntoText }: { lesson: LessonFields; onChange: (l: LessonFields) => void; template?: Template; onMake: () => void; onTurnIntoText: () => void }) {
  const ex = (template ?? TEMPLATES[0]).example;
  const labels = template?.labels ?? {};
  const set = (patch: Partial<LessonFields>) => onChange({ ...lesson, ...patch });
  const quiz = lesson.quiz ?? { question: '' };
  const setQuiz = (patch: Partial<NonNullable<LessonFields['quiz']>>) => set({ quiz: { ...quiz, ...patch } });
  const problems = lessonProblems(lesson);
  const options = quiz.options ?? ['', '', '', ''];
  const choice = quiz.options !== undefined;

  return (
    <div className="stagger space-y-4" data-testid="lesson-builder">
      {template && (
        <p className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-black bg-sun px-3 py-1 text-sm font-extrabold uppercase tracking-[0.03em]">
          {template.emoji} {template.title}
        </p>
      )}
      <Blank label={labels.topic ?? t.topic} hint={ex.topic} value={lesson.topic} onChange={(topic) => set({ topic })} required />
      <Blank label={labels.hook ?? t.hook} hint={ex.hook} value={lesson.hook ?? ''} onChange={(hook) => set({ hook })} />
      <fieldset>
        <legend className="text-sm font-extrabold uppercase tracking-[0.03em]">{labels.points ?? t.points}</legend>
        <ol className="mt-1 space-y-2">
          {lesson.points.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black bg-white font-display text-lg">{i + 1}</span>
              <input aria-label={`${labels.points ?? t.points} ${i + 1}`} value={p} placeholder={ex.points[i] ?? ''} onChange={(e) => set({ points: lesson.points.map((q, j) => (j === i ? e.target.value : q)) })} className={field.replace('mt-1 ', '')} />
              {lesson.points.length > 1 && (
                <button type="button" onClick={() => set({ points: lesson.points.filter((_, j) => j !== i) })} className="rounded-full p-2 text-ash hover:text-black" aria-label={t.removePoint(i + 1)}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ol>
        {lesson.points.length < MAX_POINTS && (
          <Button className="mt-2 px-3 py-1.5 text-sm" onClick={() => set({ points: [...lesson.points, ''] })}>
            <Plus size={14} aria-hidden="true" /> {t.addPoint}
          </Button>
        )}
      </fieldset>
      <Blank label={labels.example ?? t.example} hint={ex.example} value={lesson.example ?? ''} onChange={(example) => set({ example })} />
      <Blank label={labels.recap ?? t.recap} hint={ex.recap} value={lesson.recap ?? ''} onChange={(recap) => set({ recap })} />

      <fieldset className="rounded-[20px] border-[1.5px] border-black bg-lavender p-4">
        <legend className="rounded-full border-[1.5px] border-black bg-white px-3 text-sm font-extrabold uppercase tracking-[0.03em]">{t.quiz}</legend>
        <Blank label={t.question} hint={ex.quiz?.question} value={quiz.question} onChange={(question) => setQuiz({ question })} />
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={choice} onChange={(e) => setQuiz({ options: e.target.checked ? options : undefined, correct: e.target.checked ? quiz.correct : undefined })} className="h-4 w-4 accent-black" />
          {t.multipleChoice}
        </label>
        {choice ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t.rightAnswer}>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" aria-label={t.markRight(String.fromCharCode(65 + i))} checked={quiz.correct === i} onChange={() => setQuiz({ correct: i })} className="h-4 w-4 accent-black" />
                <input aria-label={t.option(String.fromCharCode(65 + i))} value={o} placeholder={ex.quiz?.options?.[i] ?? ''} onChange={(e) => setQuiz({ options: options.map((q, j) => (j === i ? e.target.value : q)) })} className={field.replace('mt-1 ', '')} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2">
            <Blank label={t.answer} hint={ex.quiz?.answer} value={quiz.answer ?? ''} onChange={(answer) => setQuiz({ answer })} />
          </div>
        )}
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          {t.thinkTime}
          <select value={quiz.thinkSeconds ?? 5} onChange={(e) => setQuiz({ thinkSeconds: Number(e.target.value) })} className="rounded-full border-[1.5px] border-black bg-white px-2 py-1">
            {[3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} s</option>)}
          </select>
        </label>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={lesson.titleCard !== false} onChange={(e) => set({ titleCard: e.target.checked })} className="h-4 w-4 accent-black" />
        {t.titleCard}
      </label>

      {problems.includes('correct') && <p className="text-sm font-semibold text-berry" role="alert">{t.pickRight}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" className="flex-1 py-4 text-lg" disabled={problems.length > 0} onClick={onMake} title={problems.includes('points') ? t.needPoint : undefined}>
          <Sparkles size={18} aria-hidden="true" /> {en.make}
        </Button>
        <Button disabled={problems.includes('topic') || problems.includes('points')} onClick={onTurnIntoText}>
          <Wand2 size={16} aria-hidden="true" /> {t.toText}
        </Button>
      </div>
      {problems.includes('points') && !problems.includes('topic') && <p className="text-sm text-ash">{t.needPoint}</p>}
      <Button variant="ghost" className="px-0" onClick={() => onChange({ ...ex, template: template?.id, titleCard: true })}>{t.fillExample}</Button>
    </div>
  );
}
