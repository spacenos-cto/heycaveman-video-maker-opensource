// My videos (devpost/prd.md > F14): every project saved on this device, plus Recently deleted.
import { useEffect, useRef, useState } from 'react';
import { FilePlus, FolderOpen, MoreHorizontal, Undo2 } from 'lucide-react';
import { checkSpace } from '../offline/status';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { ProjectFileError } from '../storage/projectFile';
import type { Project } from '../types';
import { Button } from '../ui/Button';
import { SceneSvg } from '../video/SceneSvg';
import { FPS, timeline } from '../video/timeline';

function ago(ts: number): string {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

const length = (p: Project) => {
  const sec = Math.round(timeline(p).total / FPS);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

/** One video: Open, plus a ⋯ menu for the rest (finish-to-submit PRD CLUTTER-2). */
function Card({ p, onDeleted }: { p: Project; onDeleted: (p: Project) => void }) {
  const { openProject, renameProject, duplicateProject, deleteProject, saveProjectFile } = useApp();
  const [renaming, setRenaming] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);
  const item = (label: string, act: () => void, danger = false) => (
    <button type="button" role="menuitem" onClick={() => { setMenu(false); act(); }} className={`block w-full border-b border-hairline px-4 py-2.5 text-left text-sm font-extrabold uppercase tracking-[0.03em] last:border-0 hover:bg-sun hover:text-[#000] ${danger ? 'text-berry' : ''}`}>
      {label}
    </button>
  );
  const [title, setTitle] = useState(p.title);
  const first = p.scenes[0];
  return (
    <li className="panel overflow-hidden" data-testid="video-card">
      <button type="button" className="block w-full border-b border-hairline bg-bone p-2" onClick={() => void openProject(p.id)} aria-label={`${en.videos.open} ${p.title}`}>
        {first && <SceneSvg project={p} scene={first} frame={24} index={0} title={p.title} />}
      </button>
      <div className="p-3">
        {renaming ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void renameProject(p.id, title).then(() => setRenaming(false));
            }}
          >
            <label className="sr-only" htmlFor={`t-${p.id}`}>{en.videos.renameLabel}</label>
            <input id={`t-${p.id}`} value={title} onChange={(e) => setTitle(e.target.value)} className="min-w-0 flex-1 rounded-[10px] border-2 border-charcoal px-2" autoFocus />
            <Button type="submit">{en.videos.save}</Button>
          </form>
        ) : (
          <h2 className="font-display text-lg font-semibold leading-tight">{p.title}</h2>
        )}
        <p className="mt-1 text-sm text-ash">
          {length(p)} · {en.videos.edited(ago(p.updatedAt))}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <Button variant="primary" className="px-4 py-1.5" onClick={() => void openProject(p.id)}>{en.videos.open}</Button>
          <div className="relative" ref={menuRef} onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}>
            <button type="button" className="sticker flex h-9 w-9 items-center justify-center" aria-label={en.videos.more(p.title)} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <MoreHorizontal size={18} aria-hidden="true" />
            </button>
            {menu && (
              <div role="menu" className="panel pop-in absolute bottom-11 right-0 z-30 w-48 overflow-hidden p-0">
                {item(en.videos.rename, () => setRenaming(true))}
                {item(en.videos.duplicate, () => void duplicateProject(p.id))}
                {item(en.videos.saveFile, () => saveProjectFile(p))}
                {item(en.videos.delete, () => void deleteProject(p.id).then(() => onDeleted(p)), true)}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function VideosPage() {
  const { projects, refreshProjects, restoreProject, go, openProjectFile } = useApp();
  const [used, setUsed] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [justDeleted, setJustDeleted] = useState<Project | null>(null);
  useEffect(() => {
    if (!justDeleted) return;
    const t = setTimeout(() => setJustDeleted(null), 8000);
    return () => clearTimeout(t);
  }, [justDeleted]);
  const picker = useRef<HTMLInputElement>(null);
  const live = projects.filter((p) => !p.deletedAt);
  const deleted = projects.filter((p) => p.deletedAt);

  useEffect(() => {
    void refreshProjects();
    void checkSpace();
    void navigator.storage?.estimate?.().then((e) => e.usage != null && setUsed(`${(e.usage / 1024 / 1024).toFixed(0)} MB`));
  }, [refreshProjects]);

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{en.videos.title}</h1>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => go('start')}>
            <FilePlus size={18} aria-hidden="true" /> {en.videos.newVideo}
          </Button>
          <Button onClick={() => picker.current?.click()}>
            <FolderOpen size={18} aria-hidden="true" /> {en.videos.openFile}
          </Button>
          <input
            ref={picker}
            type="file"
            accept=".caveman,application/zip"
            className="hidden"
            data-testid="open-file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                const { newer } = await openProjectFile(file);
                if (newer) setFileNote(en.videos.newerFile);
              } catch (err) {
                setFileNote(err instanceof ProjectFileError ? en.videos.badFile : en.videos.badFile);
              }
            }}
          />
        </div>
      </div>
      {used && <p className="mt-2 text-sm text-ash">{en.videos.storage(used)}</p>}
      {fileNote && <p className="mt-3 rounded-[12px] border-2 border-ochre bg-bone p-3 text-sm" role="alert">{fileNote}</p>}

      {live.length === 0 ? (
        <p className="mt-10 text-center font-display text-xl text-ash">{en.videos.empty}</p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((p) => <Card key={p.id} p={p} onDeleted={setJustDeleted} />)}
        </ul>
      )}

      {justDeleted && (
        <div className="fixed inset-x-0 bottom-10 z-40 flex justify-center px-4">
          <p role="status" className="flex items-center gap-4 rounded-full py-2 pl-5 pr-2 text-sm font-semibold" style={{ background: '#000', color: '#fff' }} data-testid="deleted-toast">
            {en.videos.deleted(justDeleted.title)}
            <button type="button" className="flex items-center gap-1.5 rounded-full border-[1.5px] border-[#000] px-3 py-1.5 font-extrabold uppercase" style={{ background: 'var(--color-sun)', color: '#000' }} onClick={() => { void restoreProject(justDeleted.id); setJustDeleted(null); }}>
              <Undo2 size={16} aria-hidden="true" /> {en.videos.undo}
            </button>
          </p>
        </div>
      )}

      {deleted.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">{en.videos.recentlyDeleted}</h2>
          <ul className="mt-3 space-y-2">
            {deleted.map((p) => (
              <li key={p.id} className="panel flex items-center justify-between gap-3 px-4 py-2" data-testid="deleted-card">
                <span>{p.title}</span>
                <Button className="px-3 py-1.5" onClick={() => void restoreProject(p.id)}>{en.videos.restore}</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
