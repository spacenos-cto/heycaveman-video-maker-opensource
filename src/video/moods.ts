// Colour moods for the inside of the video. Values copied exactly from
// devpost/prd.md > Look and Feel > Inside the video. A mood changes background, caption-highlight
// and word-art colours only; drawings and the caveman keep their own colours.
import type { Mood } from '../types';

export type MoodSpec = {
  label: string;
  backgrounds: string[];
  highlight: string; // key-word colour in captions
  captionFill: string; // normal caption text
  captionStroke: string; // outline around caption text
  band?: string; // Soft draws charcoal text on a light band instead of an outline
};

export const MOODS: Record<Mood, MoodSpec> = {
  bright: {
    label: 'Bright',
    backgrounds: ['#4CC9F0', '#FFD60A', '#06D6A0', '#FF6B6B', '#B79CED', '#FF9F1C', '#FDF6E3'],
    highlight: '#FFD60A',
    captionFill: '#FFFFFF',
    captionStroke: '#111111',
  },
  earthy: {
    label: 'Earthy',
    backgrounds: ['#E3A857', '#C8754A', '#8DA65A', '#B8AFA3', '#7FA7C9', '#EAD9B5'],
    highlight: '#FFF4D6',
    captionFill: '#FFFFFF',
    captionStroke: '#1F1A17',
  },
  soft: {
    label: 'Soft',
    backgrounds: ['#FFD6E0', '#CDEBFF', '#D8F5DD', '#FFF1B8', '#E6DCFF'],
    highlight: '#B8482A',
    captionFill: '#1F1A17',
    captionStroke: '#1F1A17',
    band: 'rgba(255,255,255,0.88)',
  },
};
