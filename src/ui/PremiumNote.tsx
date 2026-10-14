// One premium mention (devpost/prd.md > F15): clearly HeyCaveman's, dismissible, hidden in Classroom mode.
import { X } from 'lucide-react';
import { dismissPremium, openHeyCaveman, PREMIUM, usePremium, type PremiumId } from '../data/premium';

export function PremiumNote({ id, className = '', onOpen }: { id: PremiumId; className?: string; onOpen?: () => void }) {
  const show = usePremium(id);
  if (!show) return null;
  const { text, cta } = PREMIUM[id];
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-black bg-white/70 px-3 py-2 text-sm ${className}`} data-premium={id}>
      <span className="rounded-full bg-violet px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white">HeyCaveman</span>
      <span className="flex-1">{text}</span>
      <button type="button" onClick={() => (onOpen ? onOpen() : openHeyCaveman())} className="font-extrabold uppercase tracking-[0.03em] text-violet underline-offset-4 hover:underline">
        {cta}
      </button>
      <button type="button" onClick={() => dismissPremium(id)} className="rounded-full p-1 text-ash hover:bg-black/5 hover:text-black" aria-label={`Hide this HeyCaveman note`}>
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
