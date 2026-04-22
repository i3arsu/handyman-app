import { Ionicons } from '@expo/vector-icons';

import { JobStatus } from '@/types/database';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface CategoryIconConfig {
  icon: IoniconName;
  bg: string;
}

export const CATEGORY_ICONS: Record<string, CategoryIconConfig> = {
  Plumbing:   { icon: 'water-outline',         bg: '#ffdcc5' },
  Electrical: { icon: 'flash-outline',         bg: '#9ff5c1' },
  HVAC:       { icon: 'thermometer-outline',   bg: '#9ff5c1' },
  Painting:   { icon: 'brush-outline',         bg: '#e9e7eb' },
  Locksmith:  { icon: 'key-outline',           bg: '#d6e3ff' },
  Tiling:     { icon: 'grid-outline',          bg: '#ffdcc5' },
  Carpentry:  { icon: 'hammer-outline',        bg: '#e9e7eb' },
  General:    { icon: 'construct-outline',     bg: '#e9e7eb' },
};

export const getCategoryIcon = (category: string): CategoryIconConfig =>
  CATEGORY_ICONS[category] ?? CATEGORY_ICONS.General;

export interface StatusBadgeConfig {
  label: string;
  bg: string;
  fg: string;
}

export const STATUS_BADGE: Record<JobStatus, StatusBadgeConfig> = {
  open:        { label: 'Awaiting Pro', bg: '#e9e7eb', fg: '#43474e' },
  accepted:    { label: 'Scheduled',    bg: '#b6d0ff', fg: '#2d476f' },
  in_progress: { label: 'In Progress',  bg: '#9ff5c1', fg: '#005231' },
  completed:   { label: 'Completed',    bg: '#e9e7eb', fg: '#43474e' },
  cancelled:   { label: 'Cancelled',    bg: '#ffdad6', fg: '#93000a' },
};

export const APPLIED_BADGE: StatusBadgeConfig = {
  label: 'Awaiting Reply',
  bg: '#ffdcc5',
  fg: '#703700',
};
