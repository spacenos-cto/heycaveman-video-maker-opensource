// Settings, Help and About (devpost/prd.md > F16). Everything here stays on this device; the only links
// out (the code repository, HeyCaveman, Report a problem) open only when clicked.
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Bug, Code2, ExternalLink, Trash2 } from 'lucide-react';
import { CavemanRig } from '../caveman/CavemanRig';
import { CAVEY } from '../caveman/presets';
import { HEYCAVEMAN_URL, LAUNCH_CODE, openHeyCaveman } from '../data/premium';
import { en } from '../i18n/en';
import { checkSpace } from '../offline/status';
import { storage } from '../storage/db';
import { useApp } from '../store/app';
import { useSettings, type Theme } from '../store/settings';
import type { Mood, MotionId, Shape } from '../types';
import { Button } from '../ui/Button';
import { deleteVoices } from '../voice/voiceClient';
import { useVoice } from '../voice/voiceStore';

/** The code repository, set at build time (VITE_REPO_URL); without it the code and issue buttons stay hidden. */
export const REPO_URL: string = import.meta.env.VITE_REPO_URL ?? '';
export const APP_VERSION = '0.1.0';
const t = en.info;

function Page({ title, children, sticker }: { title: string; children: ReactNode; sticker?: string }) {
  const go = useApp((s) => s.go);
  return (
    <main className="mx-auto w-full max-w-[860px] px-4 pb-20 pt-4">
      <Button variant="ghost" className="px-0" onClick={() => go('start')}>
        <ArrowLeft size={18} aria-hidden="true" /> {t.back}
      </Button>
      <h1 className="mt-2 flex items-center gap-3 font-display text-6xl sm:text-7xl">
        {title}
        {sticker && <img src={`/${sticker}`} alt="" className="float h-14 w-14" style={{ ['--r' as string]: '-8deg' }} />}
      </h1>
      <div className="stagger mt-6 space-y-5">{children}</div>
    </main>
  );
}

function Card({ title, children, tone = 'bg-white' }: { title: string; children: ReactNode; tone?: string }) {
  return (
    <section className={`rounded-[24px] border-[1.5px] border-black p-5 ${tone}`}>
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Choice<T extends string>({ label, value, options, onPick }: { label: string; value: T; options: [T, string][]; onPick: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="mr-1 min-w-[9rem] text-sm font-extrabold uppercase tracking-[0.03em]">{label}</span>
      {options.map(([v, name]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onPick(v)} className={`rounded-full border-[1.5px] border-black px-3 py-1 text-sm font-semibold transition-transform hover:-rotate-2 ${value === v ? 'bg-sun' : 'bg-white'}`}>
          {name}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage({ onEditCaveman }: { onEditCaveman: () => void }) {
  const s = useSettings();
  const refresh = useApp((a) => a.refreshProjects);
  const voiceStatus = useVoice((v) => v.status);
  const [space, setSpace] = useState<string>('');
  const [confirm, setConfirm] = useState(0);
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => {
    void checkSpace().then(() => navigator.storage?.estimate?.().then((e) => setSpace(`${((e.usage ?? 0) / 1e6).toFixed(1)} MB`)));
  }, []);

  const deleteAll = async () => {
    if (confirm < 2) return setConfirm(confirm + 1);
    const db = await storage();
    for (const p of await db.allProjects()) await db.deleteProject(p.id);
    useApp.setState({ project: null });
    await refresh();
    setConfirm(0);
    setDone(t.deletedAll);
  };

  return (
    <Page title={t.settings} sticker="assets/lightbulb.svg">
      <Card title={t.classroom} tone="bg-mint">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={s.classroomMode} onChange={(e) => s.update({ classroomMode: e.target.checked })} className="mt-1 h-5 w-5 accent-black" />
          <span>
            <span className="font-extrabold">{t.classroomOn}</span>
            <span className="block text-sm">{t.classroomHint}</span>
            <code className="mt-1 inline-block rounded-full border border-black bg-white px-2 text-xs">{`${location.origin}/?classroom`}</code>
          </span>
        </label>
      </Card>

      <Card title={t.defaults}>
        <Choice<Shape> label={en.shape.label} value={s.defaults.shape} options={[['wide', en.shape.wide], ['tall', en.shape.tall], ['square', en.shape.square]]} onPick={(shape) => s.setDefaults({ shape })} />
        <Choice<Mood> label={en.mood.label} value={s.defaults.mood} options={[['bright', en.mood.bright], ['earthy', en.mood.earthy], ['soft', en.mood.soft]]} onPick={(mood) => s.setDefaults({ mood })} />
        <Choice label={en.voice.sfx} value={s.defaults.sfxLevel} options={[['on', en.voice.sfxLevels.on], ['gentle', en.voice.sfxLevels.gentle], ['off', en.voice.sfxLevels.off]]} onPick={(sfxLevel) => s.setDefaults({ sfxLevel })} />
        <Choice label={en.player.readingSpeed} value={s.defaults.readingSpeed} options={[['slow', en.voice.speeds.slow], ['normal', en.voice.speeds.normal], ['fast', en.voice.speeds.fast]]} onPick={(readingSpeed) => s.setDefaults({ readingSpeed })} />
        <Choice label={t.endCard} value={s.defaults.endCard ? 'on' : 'off'} options={[['on', t.on], ['off', t.off]]} onPick={(v) => s.setDefaults({ endCard: v === 'on' })} />
      </Card>

      <Card title={t.appearance} tone="bg-lavender">
        <Choice<Theme> label={t.theme} value={s.theme} options={[['light', t.light], ['dark', t.dark], ['system', t.system]]} onPick={(theme) => s.update({ theme })} />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={s.uiSounds} onChange={(e) => s.update({ uiSounds: e.target.checked })} className="h-4 w-4 accent-black" />
          {t.appSounds}
        </label>
      </Card>

      <Card title={en.caveman.avatar}>
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 200 320" className="h-24 w-16 rounded-[14px] border-[1.5px] border-black bg-lavender" aria-hidden="true">
            <CavemanRig design={s.myCaveman ?? CAVEY} motion="wave" expression="happy" frame={12} talking={false} />
          </svg>
          <Button onClick={onEditCaveman}>{t.editCaveman}</Button>
        </div>
      </Card>

      <Card title={t.storage} tone="bg-[#ffe9df]">
        <p className="text-sm">{t.using(space || '…')}</p>
        <div className="flex flex-wrap gap-2">
          <Button disabled={voiceStatus !== 'ready'} onClick={() => void deleteVoices().then(() => { useVoice.setState({ status: 'not-downloaded' }); setDone(t.deletedVoices); })}>
            <Trash2 size={16} aria-hidden="true" /> {t.deleteVoices}
          </Button>
          <Button className={confirm ? 'bg-ember' : ''} onClick={() => void deleteAll()}>
            <Trash2 size={16} aria-hidden="true" /> {confirm === 0 ? t.deleteAll : confirm === 1 ? t.deleteAllSure : t.deleteAllReally}
          </Button>
        </div>
        {done && <p className="text-sm font-semibold" role="status">{done}</p>}
      </Card>
    </Page>
  );
}

const STEPS: { motion: MotionId; title: string; body: string; color: string }[] = [
  { motion: 'explain', title: '1. Write it', body: 'Paste your lesson. One idea per sentence. A blank line starts a new scene.', color: 'bg-sun' },
  { motion: 'point', title: '2. Make it', body: 'Press Make my video. The caveman acts every sentence with drawings and big captions.', color: 'bg-mint' },
  { motion: 'think', title: '3. Tweak it', body: 'Tap any scene to change words, action, drawings or sound. Ctrl+Z undoes.', color: 'bg-lavender' },
  { motion: 'celebrate', title: '4. Share it', body: 'Download video makes an MP4 right here in your browser. Save project file keeps an editable copy.', color: 'bg-[#dceeff]' },
];

export function HelpPage() {
  return (
    <Page title={t.help} sticker="assets/question-mark.svg">
      <ol className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((st) => (
          <li key={st.title} className={`lift flex gap-3 rounded-[24px] border-[1.5px] border-black p-4 ${st.color}`}>
            <svg viewBox="0 0 200 320" className="h-28 w-16 shrink-0" aria-hidden="true">
              <CavemanRig design={CAVEY} motion={st.motion} expression="happy" frame={14} talking={false} />
            </svg>
            <span>
              <span className="block font-display text-2xl">{st.title}</span>
              <span className="text-sm">{st.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <Card title={t.shortcuts}>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {t.keys.map(([k, what]) => (
            <li key={k} className="flex items-center gap-2">
              <kbd className="rounded-[8px] border-[1.5px] border-black bg-white px-2 py-0.5 font-mono text-xs">{k}</kbd> {what}
            </li>
          ))}
        </ul>
      </Card>
      <Card title={t.wontExport} tone="bg-[#ffe9df]">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {t.exportTips.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      </Card>
    </Page>
  );
}

export function AboutPage() {
  const classroom = useSettings((s) => s.classroomMode);
  const [report, setReport] = useState(false);
  const body = `**What happened?**\n\n\n**What did you expect?**\n\n\n---\nHeyCaveman Stone Age ${APP_VERSION}\n${navigator.userAgent}`;
  const issueUrl = `${REPO_URL}/issues/new?title=${encodeURIComponent('Problem: ')}&body=${encodeURIComponent(body)}`;
  return (
    <Page title={t.about} sticker="assets/heart.svg">
      <Card title={t.promiseTitle} tone="bg-mint">
        <p className="font-display text-3xl leading-tight">{t.promise}</p>
      </Card>
      <Card title={t.versionTitle}>
        <p className="text-sm">HeyCaveman Stone Age {APP_VERSION}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {t.credits.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <div className="flex flex-wrap gap-2">
          {REPO_URL && (
          <Button onClick={() => window.open(REPO_URL, '_blank', 'noopener,noreferrer')}>
            <Code2 size={16} aria-hidden="true" /> {t.code}
          </Button>
          )}
          {REPO_URL && (
          <Button onClick={() => setReport(true)}>
            <Bug size={16} aria-hidden="true" /> {t.report}
          </Button>
          )}
        </div>
        {report && (
          <div className="rounded-[18px] border-[1.5px] border-black bg-sun p-4" role="region" aria-label={t.report}>
            <p className="text-sm font-semibold">{t.reportPreview}</p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-[12px] border border-black bg-white p-2 text-xs" data-testid="report-preview">{body}</pre>
            <Button variant="primary" className="mt-3" onClick={() => window.open(issueUrl, '_blank', 'noopener,noreferrer')}>
              <ExternalLink size={16} aria-hidden="true" /> {t.reportOpen}
            </Button>
          </div>
        )}
      </Card>
      <Card title={t.aboutHeyCaveman} tone="bg-lavender">
        <p className="text-sm">{t.aboutHeyCavemanText}</p>
        {!classroom && <p className="text-sm">{t.launchCode(LAUNCH_CODE)}</p>}
        <Button onClick={() => openHeyCaveman(HEYCAVEMAN_URL)}>
          <ExternalLink size={16} aria-hidden="true" /> heycaveman.com
        </Button>
      </Card>
    </Page>
  );
}
