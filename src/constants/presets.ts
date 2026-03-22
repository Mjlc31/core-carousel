export interface CarouselPreset {
  id: string;
  name: string;
  description: string;
  font: string;
  color: string;
  accent: string;
  bg: string;
  layout: 'centered' | 'split' | 'editorial' | 'minimal';
}

export const CAROUSEL_PRESETS: CarouselPreset[] = [
  {
    id: 'core-neon',
    name: 'CORE Neon',
    description: 'Design brutalista com toques de neon e alto contraste.',
    font: "'Inter', sans-serif",
    color: '#FFFFFF',
    accent: '#CCFF00',
    bg: '#000000',
    layout: 'editorial'
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    description: 'Elegância e sofisticação em tons de cinza e branco.',
    font: "'Inter', sans-serif",
    color: '#FFFFFF',
    accent: '#60A5FA',
    bg: '#111827',
    layout: 'minimal'
  },
  {
    id: 'editorial-luxury',
    name: 'Editorial Luxury',
    description: 'Estilo revista de luxo com tipografia serifada.',
    font: "'Playfair Display', serif",
    color: '#1A1A1A',
    accent: '#D4AF37',
    bg: '#F5F5F0',
    layout: 'split'
  },
  {
    id: 'cinematic-neon',
    name: 'Cinematic Neon',
    description: 'Paleta de cinema sci-fi com roxo e ciano vibrantes.',
    font: "'Inter', sans-serif",
    color: '#FFFFFF',
    accent: '#A855F7',
    bg: '#0D0D1A',
    layout: 'centered'
  },
  {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    description: 'Tons terrosos quentes, sofisticados e atemporais.',
    font: "'Inter', sans-serif",
    color: '#F5F0E8',
    accent: '#E8855A',
    bg: '#1A1208',
    layout: 'split'
  }
];
