// The first screen (devpost/prd.md > F2). The first thing a person can do is type.
import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { containsLink, countWords, isTopicOnly } from '../director/clean';
import { estimateSeconds } from '../director/timing';
import { EXAMPLE_LESSON } from '../data/examples';
import { en } from '../i18n/en';
import { DEFAULTS, useApp } from '../store/app';
import { newProject } from '../director';
import { blankProject } from '../editor/sceneOps';
import { Button } from '../ui/Button';

const WARN_WORDS = 1500;
const MAX_WORDS = 3000;

export function StartScreen() {
  const { draft, setDraft, go, projects, openProject, project, setRemakeId, setProject } = useApp();
  const startBlank = () => {
    setProject(blankProject(newProject('', DEFAULTS)));
    useApp.setState({ editorStart: 0 });
    go('editor');
  };
  const [askRemake, setAskRemake] = useState(false);
  const recent = projects.find((p) => !p.deletedAt);
  const [note, setNote] = useState<string | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const words = countWords(draft);
  const seconds = estimateSeconds(draft);
  const hasLink = containsLink(draft);

  useEffect(() => {
    // Focus the box on desktop so typing can start straight away (PRD F2 acceptance 1).
    if (window.matchMedia('(pointer: fine)').matches) box.current?.focus();
  }, []);

  const onChange = (text: string) => {
    if (countWords(text) > MAX_WORDS && countWords(text) > words) {
      setNote(en.tooMuch);
      return;
    }
    setNote(null);
    setDraft(text);
  };

  const onMake = () => {
    if (isTopicOnly(draft)) {
      // Stone Age's Lesson Builder arrives in a later slice; until then, ask for sentences.
      setNote(en.topicNote);
      return;
    }
    // Back from a video with hand edits: ask before replacing them (devpost/prd.md > F6 Edge case 3).
    if (project?.edited && !project.deletedAt) {
      setAskRemake(true);
      return;
    }
    setRemakeId(null);
    go('making');
  };

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-8 sm:pt-14">
      {recent && (
        <button type="button" onClick={() => void openProject(recent.id)} className="mb-5 inline-flex max-w-full items-center gap-2 truncate rounded-full border-2 border-charcoal bg-sand px-4 py-1.5 font-display font-semibold" data-testid="continue-chip">
          ▶ {en.continueChip(recent.title)}
        </button>
      )}
      <h1 className="font-display text-[30px] font-bold leading-tight sm:text-[46px]">
        {en.headline.before}
        <span className="relative inline-block">
          {en.headline.word}
          <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
            <path d="M3 8 C 50 2, 120 12, 197 5" stroke="#B8482A" strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        </span>
        {en.headline.after}
      </h1>
      <p className="mt-3 text-ash">{en.subline}</p>

      <div className="mt-8" role="tablist" aria-label="How to start">
        <span role="tab" aria-selected="true" className="inline-block rounded-full border-2 border-charcoal bg-sand px-4 py-1.5 font-display font-semibold">
          ✏️ {en.tabs.write}
        </span>
      </div>

      <label htmlFor="lesson" className="sr-only">
        Your lesson
      </label>
      <textarea
        id="lesson"
        ref={box}
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        placeholder={en.placeholder}
        rows={9}
        className="mt-3 w-full resize-y rounded-[14px] border-2 border-charcoal bg-bone p-4 text-[17px] leading-relaxed placeholder:text-ash focus:outline-none focus-visible:outline-3 focus-visible:outline-river"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span data-testid="counter" className={words > WARN_WORDS ? 'font-bold text-ochre' : 'text-ash'}>
          {en.counter(words, seconds)}
        </span>
        <Button variant="ghost" className="px-0 py-0" onClick={() => onChange(EXAMPLE_LESSON)}>
          {en.tryExample}
        </Button>
      </div>
      {words > WARN_WORDS && <p className="mt-2 text-sm text-ochre">{en.tooLong}</p>}
      {hasLink && (
        <div className="panel mt-3 flex flex-wrap items-center gap-3 p-4 text-sm" role="status">
          <span className="flex-1">{en.linkNote}</span>
          <Button onClick={() => onChange(draft.replace(/\bhttps?:\/\/\S+|\bwww\.\S+/gi, '').trim())}>{en.linkRemove}</Button>
        </div>
      )}
      {note && (
        <p className="mt-3 rounded-[12px] border border-river bg-bone p-3 text-sm" role="status">
          {note}
        </p>
      )}

      <Button
        variant="primary"
        className="mt-8 w-full py-4 text-xl"
        disabled={words === 0}
        title={words === 0 ? en.makeHint : undefined}
        onClick={onMake}
      >
        {en.make} <Play size={20} fill="currentColor" aria-hidden="true" />
      </Button>
      {words === 0 && <p className="mt-2 text-center text-sm text-ash">{en.makeHint}</p>}
      <p className="mt-3 text-center">
        <Button variant="ghost" onClick={startBlank}>{en.editor.blank}</Button>
      </p>

      <p className="mt-10 text-center text-sm text-ash">{en.smallPrint}</p>
      {askRemake && project && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(31_26_23/0.45)] p-4 sm:items-center" onClick={() => setAskRemake(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="remake-title" aria-describedby="remake-body" className="panel w-full max-w-md p-6" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && setAskRemake(false)}>
            <h2 id="remake-title" className="font-display text-2xl font-bold">{en.remake.title}</h2>
            <p id="remake-body" className="mt-2">{en.remake.body}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="primary" autoFocus onClick={() => { setRemakeId(project.id); setAskRemake(false); go('making'); }}>{en.remake.yes}</Button>
              <Button onClick={() => { setAskRemake(false); go('player'); }}>{en.remake.no}</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
