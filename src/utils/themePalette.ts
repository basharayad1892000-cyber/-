/**
 * Dynamic App Color Gradient & Palette Engine
 * Generates Tailwind v4 compatible shade scales (50..950) from any two hex colors
 * (Preset Gradients or User Custom Start/End Colors) and applies them to :root.
 */

export interface AppColorPreset {
  id: string;
  name: string;
  description: string;
  fromHex: string;
  toHex: string;
}

export interface CustomGradientConfig {
  presetId: string; // 'emerald' | 'royal-blue' | 'lavender' | 'desert-gold' | 'coral-rose' | 'turquoise' | 'custom'
  fromHex: string;
  toHex: string;
}

export const APP_COLOR_PRESETS: AppColorPreset[] = [
  {
    id: 'emerald',
    name: 'الزمردي الإسلامي',
    description: 'اللون الافتراضي الهادئ المريح للعين',
    fromHex: '#059669',
    toHex: '#0d9488',
  },
  {
    id: 'royal-blue',
    name: 'الأزرق الملكي',
    description: 'تدرج سماوي ولازوردي صافي يبعث على السكينة',
    fromHex: '#2563eb',
    toHex: '#4f46e5',
  },
  {
    id: 'lavender',
    name: 'البنفسجي الروحاني',
    description: 'تدرج بنفسجي هادئ وأنيق للقراءة المسائية',
    fromHex: '#7c3aed',
    toHex: '#9333ea',
  },
  {
    id: 'desert-gold',
    name: 'الذهبي الرملي الدافئ',
    description: 'تدرج كهرماني دافئ مستوحى من زخارف المصاحف',
    fromHex: '#d97706',
    toHex: '#ea580c',
  },
  {
    id: 'coral-rose',
    name: 'الوردي المرجاني',
    description: 'تدرج وردي لطيف ومبهج ومحبب للأطفال',
    fromHex: '#e11d48',
    toHex: '#db2777',
  },
  {
    id: 'turquoise',
    name: 'التركواز النقي',
    description: 'تدرج فيروزي مشرق ومنعش',
    fromHex: '#0891b2',
    toHex: '#0284c7',
  },
];

const PALETTE_STORAGE_KEY = 'azkar_app_gradient_palette_v1';

export function loadSavedGradientConfig(): CustomGradientConfig {
  if (typeof window === 'undefined') {
    return {
      presetId: 'emerald',
      fromHex: '#059669',
      toHex: '#0d9488',
    };
  }
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) {
      return {
        presetId: 'emerald',
        fromHex: '#059669',
        toHex: '#0d9488',
      };
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.fromHex === 'string' && typeof parsed.toHex === 'string') {
      return {
        presetId: parsed.presetId || 'custom',
        fromHex: parsed.fromHex,
        toHex: parsed.toHex,
      };
    }
  } catch {
    // ignore
  }
  return {
    presetId: 'emerald',
    fromHex: '#059669',
    toHex: '#0d9488',
  };
}

export function saveGradientConfig(config: CustomGradientConfig): void {
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Helper to parse #RRGGBB to [r, g, b]
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 0;
    const g = parseInt(clean[1] + clean[1], 16) || 0;
    const b = parseInt(clean[2] + clean[2], 16) || 0;
    return [r, g, b];
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

/**
 * Mix two RGB colors by weight (0 = color1, 1 = color2)
 */
function mixRgb(c1: [number, number, number], c2: [number, number, number], weight: number): string {
  const r = Math.round(c1[0] * (1 - weight) + c2[0] * weight);
  const g = Math.round(c1[1] * (1 - weight) + c2[1] * weight);
  const b = Math.round(c1[2] * (1 - weight) + c2[2] * weight);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generates a full 50..950 shade scale from a base hex color (treated as ~600 shade)
 */
function generateShadeScale(baseHex: string): Record<number, string> {
  const base = hexToRgb(baseHex);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [8, 12, 18];

  return {
    50: mixRgb(base, white, 0.93),
    100: mixRgb(base, white, 0.85),
    200: mixRgb(base, white, 0.72),
    300: mixRgb(base, white, 0.52),
    400: mixRgb(base, white, 0.30),
    500: mixRgb(base, white, 0.12),
    600: `rgb(${base[0]}, ${base[1]}, ${base[2]})`,
    700: mixRgb(base, black, 0.16),
    800: mixRgb(base, black, 0.34),
    900: mixRgb(base, black, 0.52),
    950: mixRgb(base, black, 0.74),
  };
}

/**
 * Applies the selected gradient config to document.documentElement CSS variables.
 * In Tailwind v4, overriding --color-emerald-* and --color-teal-* dynamically themes
 * all primary gradients, buttons, active tabs, progress bars, and cards seamlessly.
 */
export function applyGradientToDOM(config: CustomGradientConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const primaryScale = generateShadeScale(config.fromHex);
  const secondaryScale = generateShadeScale(config.toHex);

  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  shades.forEach(shade => {
    root.style.setProperty(`--color-emerald-${shade}`, primaryScale[shade]);
    root.style.setProperty(`--color-teal-${shade}`, secondaryScale[shade]);
  });

  root.style.setProperty('--app-grad-from', config.fromHex);
  root.style.setProperty('--app-grad-to', config.toHex);
}
