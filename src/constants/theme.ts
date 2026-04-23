import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

// ─── Theme tokens ──────────────────────────────────────────────────────────
// Architectural Humanist — warm brown primary, deep blue secondary, green tertiary.

export interface ThemeTokens {
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  primary: string;
  primaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimary: string;
  secondary: string;
  secondaryContainer: string;
  secondaryFixed: string;
  onSecondaryFixed: string;
  tertiary: string;
  tertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixedVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  error: string;
  errorContainer: string;
  onErrorContainer: string;
  accentOrange: string;
  paintingTile: string;
  paintingIcon: string;
  hvacTile: string;
  // Gradient endpoints
  primaryGradientFrom: string;
  primaryGradientTo: string;
}

export const LIGHT_THEME: ThemeTokens = {
  surface: '#faf9fd',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f4f3f7',
  surfaceContainer: '#efedf1',
  surfaceContainerHigh: '#e9e7eb',
  surfaceContainerHighest: '#e3e2e6',
  primary: '#371800',
  primaryContainer: '#572900',
  primaryFixed: '#ffdcc5',
  primaryFixedDim: '#ffb783',
  onPrimary: '#ffffff',
  secondary: '#455f88',
  secondaryContainer: '#b6d0ff',
  secondaryFixed: '#d6e3ff',
  onSecondaryFixed: '#001b3c',
  tertiary: '#002715',
  tertiaryContainer: '#003f25',
  tertiaryFixed: '#9ff5c1',
  tertiaryFixedDim: '#83d8a6',
  onTertiaryFixedVariant: '#005231',
  onSurface: '#1a1c1e',
  onSurfaceVariant: '#43474e',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  accentOrange: '#C25F1F',
  paintingTile: '#E8DEF8',
  paintingIcon: '#6A4C93',
  hvacTile: '#adc7f7',
  primaryGradientFrom: '#371800',
  primaryGradientTo: '#572900',
};

export const DARK_THEME: ThemeTokens = {
  surface: '#111214',
  surfaceContainerLowest: '#0d0e10',
  surfaceContainerLow: '#1a1c1e',
  surfaceContainer: '#1f2124',
  surfaceContainerHigh: '#282b2e',
  surfaceContainerHighest: '#323538',
  primary: '#ffb783',
  primaryContainer: '#572900',
  primaryFixed: '#ffdcc5',
  primaryFixedDim: '#ffb783',
  onPrimary: '#5c1a00',
  secondary: '#a9c7ff',
  secondaryContainer: '#1e3558',
  secondaryFixed: '#d6e3ff',
  onSecondaryFixed: '#001b3c',
  tertiary: '#83d8a6',
  tertiaryContainer: '#003f25',
  tertiaryFixed: '#9ff5c1',
  tertiaryFixedDim: '#83d8a6',
  onTertiaryFixedVariant: '#83d8a6',
  onSurface: '#e3e2e6',
  onSurfaceVariant: '#c4c7cf',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  accentOrange: '#ffb783',
  paintingTile: '#4A3870',
  paintingIcon: '#CDB9F0',
  hvacTile: '#1e3558',
  primaryGradientFrom: '#ffb783',
  primaryGradientTo: '#ff8a3d',
};

// ─── Status chips ──────────────────────────────────────────────────────────

export type ChipStatus = 'urgent' | 'scheduled' | 'awaiting' | 'in_progress' | 'completed';

export interface ChipStyle {
  bg: string;
  fg: string;
  label: string;
}

export const CHIPS_LIGHT: Record<ChipStatus, ChipStyle> = {
  urgent:      { bg: '#ffdad6', fg: '#93000a', label: 'URGENT' },
  scheduled:   { bg: '#d6e3ff', fg: '#001b3c', label: 'Scheduled' },
  awaiting:    { bg: '#e3e2e6', fg: '#43474e', label: 'Matching pro' },
  in_progress: { bg: '#9ff5c1', fg: '#005231', label: 'In progress' },
  completed:   { bg: '#003f25', fg: '#9ff5c1', label: 'Completed' },
};

export const CHIPS_DARK: Record<ChipStatus, ChipStyle> = {
  urgent:      { bg: '#93000a', fg: '#ffdad6', label: 'URGENT' },
  scheduled:   { bg: '#1e3558', fg: '#a9c7ff', label: 'Scheduled' },
  awaiting:    { bg: '#323538', fg: '#c4c7cf', label: 'Matching pro' },
  in_progress: { bg: '#003f25', fg: '#9ff5c1', label: 'In progress' },
  completed:   { bg: '#003f25', fg: '#9ff5c1', label: 'Completed' },
};

// ─── Category registry ─────────────────────────────────────────────────────
// Maps the app's existing categories to the design's tile colours + emoji +
// an Ionicon fallback. Order here is the canonical grid order.

export interface CategoryMeta {
  id: string;
  label: string;
  emoji: string;
  icon: IoniconName;
  tileBg: keyof ThemeTokens;
  iconColor: keyof ThemeTokens;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'Plumbing',   label: 'Plumbing',   emoji: '🚿', icon: 'water-outline',       tileBg: 'secondaryContainer',     iconColor: 'secondary' },
  { id: 'Electrical', label: 'Electrical', emoji: '⚡', icon: 'flash-outline',       tileBg: 'tertiaryFixed',          iconColor: 'onTertiaryFixedVariant' },
  { id: 'Carpentry',  label: 'Carpentry',  emoji: '🪚', icon: 'hammer-outline',      tileBg: 'primaryFixed',           iconColor: 'primary' },
  { id: 'Painting',   label: 'Painting',   emoji: '🖌️', icon: 'brush-outline',       tileBg: 'paintingTile',           iconColor: 'paintingIcon' },
  { id: 'HVAC',       label: 'HVAC',       emoji: '❄️', icon: 'thermometer-outline', tileBg: 'hvacTile',               iconColor: 'secondary' },
  { id: 'Cleaning',   label: 'Cleaning',   emoji: '🧹', icon: 'sparkles-outline',    tileBg: 'surfaceContainerHigh',   iconColor: 'onSurfaceVariant' },
];

export const getCategory = (id: string): CategoryMeta =>
  CATEGORIES.find(c => c.id.toLowerCase() === id.toLowerCase()) ?? CATEGORIES[5];

// ─── Gradient tuples ───────────────────────────────────────────────────────
// `expo-linear-gradient` takes a `colors` prop typed as a readonly tuple of
// at least two color strings, so we export tuples (not plain arrays) and
// keep them outside the theme object to preserve the literal types.

export const PRIMARY_GRADIENT_LIGHT = ['#371800', '#572900'] as const;
export const PRIMARY_GRADIENT_DARK = ['#ffb783', '#ff8a3d'] as const;

export type GradientTuple = readonly [string, string, ...string[]];

export const getPrimaryGradient = (isDark: boolean): GradientTuple =>
  isDark ? PRIMARY_GRADIENT_DARK : PRIMARY_GRADIENT_LIGHT;

// ─── Font family helper ────────────────────────────────────────────────────
// Keys match the strings expo-google-fonts exports so `useFonts` can map
// directly. Screens reference these via `FONTS.heading` etc. to avoid string
// typos spreading through the codebase.

export const FONTS = {
  heading: 'PlusJakartaSans_700Bold',
  headingBold: 'PlusJakartaSans_800ExtraBold',
  headingMed: 'PlusJakartaSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export type FontKey = keyof typeof FONTS;
