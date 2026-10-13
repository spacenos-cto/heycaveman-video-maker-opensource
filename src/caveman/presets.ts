// Ready-made cavemen (devpost/prd.md > F4). Cavey is the default.
import type { CavemanDesign } from '../types';

export const CAVEY: CavemanDesign = { style: 'classic', skin: '#F2C8A0', clothesColor: '#3D7FC4', headSize: 1 };

export const PRESETS: { id: string; label: string; design: CavemanDesign }[] = [
  { id: 'cavey', label: 'Cavey', design: CAVEY },
  {
    id: 'teacher', label: 'Teacher',
    design: { style: 'cartoon', skin: '#E8B48A', clothes: 'labcoat', clothesColor: '#FFFFFF', trousersColor: '#3B4A5A', hair: 'short', hairColor: '#3A2A20', glasses: 'round', headSize: 1 },
  },
  {
    id: 'student', label: 'Student',
    design: { style: 'cartoon', skin: '#C68E62', clothes: 'hoodie', clothesColor: '#E8892B', trousersColor: '#2F5E8E', hair: 'spiky', hairColor: '#1F1A17', headSize: 1.05 },
  },
  {
    id: 'storyteller', label: 'Storyteller',
    design: { style: 'cartoon', skin: '#A86F47', clothes: 'kurta', clothesColor: '#B8482A', trousersColor: '#F1E8D6', hair: 'short', hairColor: '#6B5F55', facialHair: 'beard', headSize: 1 },
  },
];

export const SKIN_TONES = ['#F7D9C0', '#F2C8A0', '#E8B48A', '#C68E62', '#A86F47', '#6E4630'];
export const SWATCHES = ['#3D7FC4', '#E8892B', '#B8482A', '#4F7A3A', '#7B5EA7', '#F2C14E', '#1F1A17', '#FFFFFF'];
