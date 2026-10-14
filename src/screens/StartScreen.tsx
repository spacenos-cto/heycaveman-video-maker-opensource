// The first screen (devpost/prd.md > F2). The first thing a person can do is type.
import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { containsLink, countWords, isTopicOnly } from '../director/clean';
import { estimateSeconds } from '../director/timing';
import { EXAMPLE_LESSON } from '../data/examples';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { projectDefaults, useSettings } from '../store/settings';
import { CavemanSheet } from '../caveman/CavemanSheet';
import type { CavemanDesign, Shape } from '../types';
import { ShapeIcon } from '../ui/ShapeIcon';
import { HeroCaveman } from '../ui/HeroCaveman';
import { newProject } from '../director';
import { blankProject } from '../editor/sceneOps';
import { Button } from '../ui/Button';

const WARN_WORDS = 1500;
const MAX_WORDS = 3000;

export function StartScreen() {
  const { draft, setDraft, go, projects, openProject, project, setRemakeId, setProject } = useApp();
  const startBlank = () => {
    setProject(blankProject(newProject('', projectDefaults())));
    useApp.setState({ editorStart: 0 });
    go('editor');
  };
  const [askRemake, setAskRemake] = useState(false);
  const { met, markMet, update, defaults, setDefaults } = useSettings();
  const [meet, setMeet] = useState(false);
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
    // The very first Make on this device: meet your caveman first (devpost/prd.md > F4).
    if (!met) {
      setMeet(true);
      return;
    }
    setRemakeId(null);
    go('making');
  };

  const met_ = (design: CavemanDesign) => {
    update({ myCaveman: design });
    markMet();
    setMeet(false);
    setRemakeId(null);
    go('making');
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-2">
      {recent && (
        <button type="button" onClick={() => void openProject(recent.id)} className="lift relative z-10 mb-3 inline-flex max-w-full items-center gap-2 truncate rounded-full border-[1.5px] border-black bg-mint px-4 py-2 text-sm font-extrabold uppercase tracking-[0.03em]" data-testid="continue-chip">
          ▶ {en.continueChip(recent.title)}
        </button>
      )}
      <section className="relative pt-2 sm:pt-6">
        <HeroCaveman />
        <div className="stagger relative mt-[14%] text-center sm:mt-[9%]">
          <h1 className="mx-auto max-w-[16ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[60px]">
            {en.headline.before}
            <span className="inline-block -rotate-2 rounded-[14px] border-[1.5px] border-black bg-ember px-3 text-black">{en.headline.word}</span>
            {en.headline.after}
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-lg text-ash sm:text-xl">{en.subline}</p>
        </div>
      </section>

      <div className="panel stagger relative mx-auto mt-10 max-w-[900px] p-4 sm:p-7">

      <div role="tablist" aria-label="How to start">
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
        className="mt-3 w-full resize-y rounded-[20px] border-[1.5px] border-black bg-white p-5 text-[17px] leading-relaxed placeholder:text-ash/80 transition-colors focus:bg-[#fffbe0] focus:outline-none"
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

      <fieldset className="mt-8">
        <legend className="font-display font-semibold">{en.shape.label}</legend>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {(['wide', 'tall', 'square'] as Shape[]).map((sh) => (
            <label key={sh} className={`flex cursor-pointer flex-col items-center gap-1 rounded-[14px] border-2 p-3 text-center ${defaults.shape === sh ? 'border-ochre bg-sand' : 'border-hairline bg-bone'}`}>
              <input type="radio" name="shape" value={sh} checked={defaults.shape === sh} onChange={() => setDefaults({ shape: sh })} className="sr-only" />
              <ShapeIcon shape={sh} />
              <span className="font-display font-semibold">{en.shape[sh]}</span>
              <span className="text-xs text-ash">{en.shape[`${sh}Hint`]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button
        variant="primary"
        className="mt-6 w-full py-4 text-xl"
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

      </div>

      <p className="mt-10 text-center text-sm text-ash">{en.smallPrint}</p>
      {meet && <CavemanSheet mode="first" initial={projectDefaults().caveman} onDone={met_} />}
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
