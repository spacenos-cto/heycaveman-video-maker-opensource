// Every mention of HeyCaveman (premium) lives here and only here (devpost/spec.md > Premium bridge (F15)).
// Each one is labelled as HeyCaveman's, can be dismissed for good, and disappears in Classroom mode.
// Nothing is sent anywhere: "Open in HeyCaveman" saves the project file and opens a page in a new tab.
import { useSettings } from '../store/settings';

export const HEYCAVEMAN_URL = 'https://heycaveman.com';
export const IMPORT_URL = `${HEYCAVEMAN_URL}/import?from=stoneage`;
/** The launch discount code shown at the handoff (set by HeyCaveman; shown, never sent). */
export const LAUNCH_CODE = 'STONEAGE';

export type PremiumId = 'smallPrint' | 'lessonFooter' | 'linkCard' | 'moreLooks' | 'propLibrary' | 'lockedStyles';

export const PREMIUM: Record<PremiumId, { text: string; cta: string }> = {
  smallPrint: { text: 'Want AI writing & art?', cta: 'See HeyCaveman →' },
  lessonFooter: { text: 'Want the caveman to write this for you? HeyCaveman can research and write it.', cta: 'See HeyCaveman →' },
  linkCard: { text: 'HeyCaveman turns YouTube links into videos.', cta: "What's HeyCaveman?" },
  moreLooks: { text: 'More looks — Storybook, Cinematic, Illustrated, Diagram.', cta: 'In HeyCaveman →' },
  propLibrary: { text: 'Need more pictures? HeyCaveman searches millions of free ones.', cta: 'See HeyCaveman →' },
  lockedStyles: { text: 'Countryball and Blob styles', cta: 'In HeyCaveman' },
};

/** Should this mention show right now? */
export function usePremium(id: PremiumId): boolean {
  return useSettings((s) => !s.classroomMode && !s.dismissed[`premium:${id}`]);
}

export const dismissPremium = (id: PremiumId) => useSettings.getState().dismiss(`premium:${id}`);

/** Opens HeyCaveman in a new tab, only ever after a click. */
export function openHeyCaveman(url = HEYCAVEMAN_URL) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
