// Prop library (devpost/prd.md > F9.3) and your own pictures (F9.6). Search matches names and groups.
import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Search } from 'lucide-react';
import { ASSETS } from '../director/props';
import { nameMatch, tokens } from '../director/words';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import type { ManifestAsset } from '../types';
import { addProp, editScene, MAX_PROPS } from './sceneOps';
import { blobIdOf, keepPicture, PictureError, preparePicture, uploadIds, uploadRef, useUploads } from './uploads';
import { ui } from '../ui/uiSounds';

const t = en.editor;
const label = (a: ManifestAsset) => a.names[0].replace('*', '');
const GROUPS = ['people', 'school', 'science', 'nature', 'food', 'money', 'home', 'travel', 'symbols', 'settings'];

/** Search: any name or the group name matches ("body" finds people & body drawings). */
export function searchAssets(q: string, group: string | null): ManifestAsset[] {
  const pool = ASSETS.filter((a) => a.kidSafeReviewed !== false && (!group || a.category === group));
  const words = tokens(q);
  if (!words.length) return pool;
  const lowered = q.toLowerCase().trim();
  return pool.filter(
    (a) =>
      a.names.some((n) => nameMatch(n, words, lowered) > 0 || n.replace('*', '').startsWith(lowered)) ||
      a.category.startsWith(lowered) ||
      (t.categories[a.category] ?? '').toLowerCase().includes(lowered),
  );
}

export function Library({ sceneIndex, onAdded }: { sceneIndex: number; onAdded: (propIndex: number) => void }) {
  const { project, setProject, readOnly } = useApp();
  const urls = useUploads((u) => u.urls);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchAssets(q, group), [q, group]);
  const scene = project?.scenes[sceneIndex];
  if (!project || !scene) return null;
  const full = scene.props.length >= MAX_PROPS;

  const pick = (a: ManifestAsset) => {
    if (a.kind === 'setting') return setProject(editScene(project, sceneIndex, { background: { type: 'setting', assetId: a.id } }));
    if (full) return;
    ui.pop();
    setProject(addProp(project, sceneIndex, a.id));
    onAdded(scene.props.length);
  };

  const upload = async (f: File | undefined) => {
    if (!f) return;
    setProblem(null);
    setBusy(true);
    try {
      const ref = await keepPicture(project.id, await preparePicture(f));
      const latest = useApp.getState().project!;
      setProject(addProp(latest, sceneIndex, ref));
      onAdded(latest.scenes[sceneIndex].props.length);
    } catch (e) {
      ui.nope();
      setProblem(e instanceof PictureError && e.kind === 'type' ? t.badType : t.tooLarge);
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  };

  const mine = uploadIds(project);

  return (
    <div className="space-y-3" data-testid="library">
      <div className="rounded-[12px] border-2 border-dashed border-charcoal/40 p-3">
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" id="picture-upload" onChange={(e) => void upload(e.target.files?.[0])} disabled={readOnly || busy || full} />
        <label htmlFor="picture-upload" className={`sticker inline-flex cursor-pointer items-center gap-2 bg-bone px-4 py-2 font-display font-semibold ${readOnly || busy || full ? 'opacity-50' : ''}`}>
          <ImagePlus size={18} aria-hidden="true" /> {busy ? t.uploading : t.upload}
        </label>
        <p className="mt-1 text-xs text-ash">{t.uploadHint}</p>
        {problem && <p className="mt-2 text-sm text-berry" role="alert">{problem}</p>}
        {mine.length > 0 && (
          <>
            <p className="mt-3 text-sm font-semibold">{t.myPictures}</p>
            <ul className="mt-1 grid grid-cols-3 gap-2">
              {mine.map((id) => (
                <li key={id} className="rounded-[10px] border-2 border-hairline bg-bone p-1">
                  <img src={urls[id]} alt="" className="h-14 w-full object-contain" />
                  <div className="mt-1 flex flex-col gap-1">
                    <button type="button" className="rounded bg-sand px-1 text-[11px]" disabled={full} onClick={() => setProject(addProp(project, sceneIndex, uploadRef(id)))}>{t.asProp}</button>
                    <button type="button" className="rounded bg-sand px-1 text-[11px]" onClick={() => setProject(editScene(project, sceneIndex, { background: { type: 'upload', blobId: blobIdOf(uploadRef(id)) } }))}>{t.asBackground}</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1.5">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">{en.scenePanel.search}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={en.scenePanel.searchHint} className="w-full bg-transparent outline-none" />
      </label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Groups">
        {[null, ...GROUPS].map((g) => (
          <button key={g ?? 'all'} type="button" aria-pressed={group === g} onClick={() => setGroup(g)} className={`rounded-full border-2 px-2.5 py-0.5 text-xs ${group === g ? 'border-ochre bg-sand' : 'border-hairline bg-bone'}`}>
            {g ? t.categories[g] : t.all}
          </button>
        ))}
      </div>
      {full && <p className="text-sm text-berry">{en.scenePanel.maxProps}</p>}
      {results.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3" aria-label={en.scenePanel.search}>
          {results.map((a) => (
            <li key={a.id}>
              <button type="button" disabled={readOnly || (full && a.kind === 'prop')} onClick={() => pick(a)} className="flex w-full flex-col items-center rounded-[10px] border-2 border-hairline bg-bone p-1 text-[11px] hover:border-ochre disabled:opacity-40" aria-label={a.kind === 'setting' ? `Use ${label(a)} background` : `Add ${label(a)}`}>
                <img src={`/${a.file}`} alt="" className={a.kind === 'setting' ? 'aspect-video w-full object-cover' : 'h-12 w-12 object-contain'} loading="lazy" />
                <span className="w-full truncate text-center">{label(a)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ash">{en.scenePanel.noMatch}</p>
      )}
    </div>
  );
}
