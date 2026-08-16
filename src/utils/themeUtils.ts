import { ThemeColor, ThemeMode, SystemSettings } from '../types';

export interface ThemeDefinition {
  id: ThemeColor;
  name: string;
  subtitle: string;
  emoji: string;
  hex: string;
  pdfHeaderRgb: [number, number, number];
  classes: {
    btnPrimary: string;
    btnPrimaryHover: string;
    activeNavBg: string;
    activeNavText: string;
    activeNavBorder: string;
    badgeBg: string;
    badgeText: string;
    textAccent: string;
    bgAccentLight: string;
    borderAccent: string;
    ringAccent: string;
    gradientFrom: string;
    gradientTo: string;
  };
}

export const THEME_PALETTES: Record<ThemeColor, ThemeDefinition> = {
  emerald: {
    id: 'emerald',
    name: 'Esmeralda Fresco',
    subtitle: 'Verde Restaurante & Alimentos',
    emoji: '🥗',
    hex: '#10b981',
    pdfHeaderRgb: [16, 185, 129],
    classes: {
      btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      btnPrimaryHover: 'hover:bg-emerald-500',
      activeNavBg: 'bg-emerald-500/15',
      activeNavText: 'text-emerald-400',
      activeNavBorder: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500',
      badgeText: 'text-slate-950',
      textAccent: 'text-emerald-600 dark:text-emerald-400',
      bgAccentLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderAccent: 'border-emerald-200 dark:border-emerald-800',
      ringAccent: 'focus:ring-emerald-500',
      gradientFrom: 'from-emerald-400',
      gradientTo: 'to-teal-600',
    }
  },
  amber: {
    id: 'amber',
    name: 'Âmbar Lanchonete',
    subtitle: 'Laranja Hamburgueria & Fast Food',
    emoji: '🍔',
    hex: '#f59e0b',
    pdfHeaderRgb: [217, 119, 6],
    classes: {
      btnPrimary: 'bg-amber-600 hover:bg-amber-500 text-white',
      btnPrimaryHover: 'hover:bg-amber-500',
      activeNavBg: 'bg-amber-500/15',
      activeNavText: 'text-amber-400',
      activeNavBorder: 'border-amber-500/30',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-slate-950',
      textAccent: 'text-amber-600 dark:text-amber-400',
      bgAccentLight: 'bg-amber-50 dark:bg-amber-950/30',
      borderAccent: 'border-amber-200 dark:border-amber-800',
      ringAccent: 'focus:ring-amber-500',
      gradientFrom: 'from-amber-400',
      gradientTo: 'to-orange-600',
    }
  },
  rose: {
    id: 'rose',
    name: 'Rubi & Pizzaria',
    subtitle: 'Vermelho Gastronômico & Bar',
    emoji: '🍕',
    hex: '#e11d48',
    pdfHeaderRgb: [225, 29, 72],
    classes: {
      btnPrimary: 'bg-rose-600 hover:bg-rose-500 text-white',
      btnPrimaryHover: 'hover:bg-rose-500',
      activeNavBg: 'bg-rose-500/15',
      activeNavText: 'text-rose-400',
      activeNavBorder: 'border-rose-500/30',
      badgeBg: 'bg-rose-500',
      badgeText: 'text-white',
      textAccent: 'text-rose-600 dark:text-rose-400',
      bgAccentLight: 'bg-rose-50 dark:bg-rose-950/30',
      borderAccent: 'border-rose-200 dark:border-rose-800',
      ringAccent: 'focus:ring-rose-500',
      gradientFrom: 'from-rose-400',
      gradientTo: 'to-red-600',
    }
  },
  blue: {
    id: 'blue',
    name: 'Safira Corporativo',
    subtitle: 'Azul Moderno & Limpo',
    emoji: '💎',
    hex: '#2563eb',
    pdfHeaderRgb: [37, 99, 235],
    classes: {
      btnPrimary: 'bg-blue-600 hover:bg-blue-500 text-white',
      btnPrimaryHover: 'hover:bg-blue-500',
      activeNavBg: 'bg-blue-500/15',
      activeNavText: 'text-blue-400',
      activeNavBorder: 'border-blue-500/30',
      badgeBg: 'bg-blue-500',
      badgeText: 'text-white',
      textAccent: 'text-blue-600 dark:text-blue-400',
      bgAccentLight: 'bg-blue-50 dark:bg-blue-950/30',
      borderAccent: 'border-blue-200 dark:border-blue-800',
      ringAccent: 'focus:ring-blue-500',
      gradientFrom: 'from-blue-400',
      gradientTo: 'to-indigo-600',
    }
  },
  violet: {
    id: 'violet',
    name: 'Ametista Bistrô',
    subtitle: 'Púrpura & Café Gourmet',
    emoji: '☕',
    hex: '#7c3aed',
    pdfHeaderRgb: [124, 58, 237],
    classes: {
      btnPrimary: 'bg-violet-600 hover:bg-violet-500 text-white',
      btnPrimaryHover: 'hover:bg-violet-500',
      activeNavBg: 'bg-violet-500/15',
      activeNavText: 'text-violet-400',
      activeNavBorder: 'border-violet-500/30',
      badgeBg: 'bg-violet-500',
      badgeText: 'text-white',
      textAccent: 'text-violet-600 dark:text-violet-400',
      bgAccentLight: 'bg-violet-50 dark:bg-violet-950/30',
      borderAccent: 'border-violet-200 dark:border-violet-800',
      ringAccent: 'focus:ring-violet-500',
      gradientFrom: 'from-violet-400',
      gradientTo: 'to-purple-600',
    }
  },
  teal: {
    id: 'teal',
    name: 'Teal Tropical',
    subtitle: 'Verde Petróleo & Sucos',
    emoji: '🍹',
    hex: '#0d9488',
    pdfHeaderRgb: [13, 148, 136],
    classes: {
      btnPrimary: 'bg-teal-600 hover:bg-teal-500 text-white',
      btnPrimaryHover: 'hover:bg-teal-500',
      activeNavBg: 'bg-teal-500/15',
      activeNavText: 'text-teal-400',
      activeNavBorder: 'border-teal-500/30',
      badgeBg: 'bg-teal-500',
      badgeText: 'text-slate-950',
      textAccent: 'text-teal-600 dark:text-teal-400',
      bgAccentLight: 'bg-teal-50 dark:bg-teal-950/30',
      borderAccent: 'border-teal-200 dark:border-teal-800',
      ringAccent: 'focus:ring-teal-500',
      gradientFrom: 'from-teal-400',
      gradientTo: 'to-emerald-600',
    }
  },
  slate: {
    id: 'slate',
    name: 'Grafite Minimalista',
    subtitle: 'Monocromático Sofisticado',
    emoji: '⚡',
    hex: '#475569',
    pdfHeaderRgb: [51, 65, 85],
    classes: {
      btnPrimary: 'bg-slate-800 hover:bg-slate-700 text-white',
      btnPrimaryHover: 'hover:bg-slate-700',
      activeNavBg: 'bg-slate-700/40',
      activeNavText: 'text-slate-200',
      activeNavBorder: 'border-slate-500/50',
      badgeBg: 'bg-slate-200',
      badgeText: 'text-slate-900',
      textAccent: 'text-slate-800 dark:text-slate-200',
      bgAccentLight: 'bg-slate-100 dark:bg-slate-800/40',
      borderAccent: 'border-slate-300 dark:border-slate-700',
      ringAccent: 'focus:ring-slate-500',
      gradientFrom: 'from-slate-600',
      gradientTo: 'to-slate-900',
    }
  }
};

export const getThemeConfig = (settings?: SystemSettings): ThemeDefinition => {
  const themeKey = settings?.themeColor || 'emerald';
  return THEME_PALETTES[themeKey] || THEME_PALETTES.emerald;
};

/**
 * Applies dark mode class and meta theme colors to document
 */
export const applyThemeToDom = (settings?: SystemSettings) => {
  const mode = settings?.themeMode || 'light';
  const root = document.documentElement;

  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
