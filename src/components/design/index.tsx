import React from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/store/ThemeContext';
import {
  ChipStatus,
  CategoryMeta,
  ThemeTokens,
  FONTS,
  getPrimaryGradient,
} from '@/constants/theme';

// Shared design primitives — port of rh-components.jsx to React Native.

type IoniconName = keyof typeof Ionicons.glyphMap;

// ─── Typography ─────────────────────────────────────────────────────────────
// `Heading` uses Plus Jakarta Sans, `Body` uses Inter. Size presets encode
// the letter-spacing and line-height the design system calls for so screens
// can stay declarative.

type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type BodySize = 'xs' | 'sm' | 'md' | 'lg';

const HEADING_SIZES: Record<
  HeadingSize,
  { fontSize: number; lineHeight: number; letterSpacing: number; family: string }
> = {
  xs:  { fontSize: 14, lineHeight: 18, letterSpacing: -0.1, family: FONTS.headingMed },
  sm:  { fontSize: 15, lineHeight: 20, letterSpacing: -0.1, family: FONTS.heading },
  md:  { fontSize: 17, lineHeight: 22, letterSpacing: -0.2, family: FONTS.heading },
  lg:  { fontSize: 20, lineHeight: 26, letterSpacing: -0.3, family: FONTS.headingBold },
  xl:  { fontSize: 24, lineHeight: 30, letterSpacing: -0.4, family: FONTS.headingBold },
  '2xl': { fontSize: 32, lineHeight: 38, letterSpacing: -0.6, family: FONTS.headingBold },
};

const BODY_SIZES: Record<BodySize, { fontSize: number; lineHeight: number }> = {
  xs: { fontSize: 11, lineHeight: 15 },
  sm: { fontSize: 13, lineHeight: 18 },
  md: { fontSize: 15, lineHeight: 22 },
  lg: { fontSize: 17, lineHeight: 25 },
};

type BodyWeight = 'regular' | 'medium' | 'semibold' | 'bold';
const BODY_FAMILY: Record<BodyWeight, string> = {
  regular: FONTS.body,
  medium: FONTS.bodyMed,
  semibold: FONTS.bodySemi,
  bold: FONTS.bodyBold,
};

interface HeadingProps {
  children: React.ReactNode;
  size?: HeadingSize;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export const Heading = ({ children, size = 'md', color, style, numberOfLines }: HeadingProps) => {
  const { t } = useTheme();
  const preset = HEADING_SIZES[size];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: preset.fontSize,
          lineHeight: preset.lineHeight,
          letterSpacing: preset.letterSpacing,
          fontFamily: preset.family,
          color: color ?? t.onSurface,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

interface BodyProps {
  children: React.ReactNode;
  size?: BodySize;
  weight?: BodyWeight;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export const Body = ({
  children,
  size = 'md',
  weight = 'regular',
  color,
  style,
  numberOfLines,
}: BodyProps) => {
  const { t } = useTheme();
  const preset = BODY_SIZES[size];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: preset.fontSize,
          lineHeight: preset.lineHeight,
          fontFamily: BODY_FAMILY[weight],
          color: color ?? t.onSurfaceVariant,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// ─── StatusChip ─────────────────────────────────────────────────────────────

export const StatusChip = ({ status, label }: { status: ChipStatus; label?: string }) => {
  const { chips } = useTheme();
  const c = chips[status];
  return (
    <View
      className="self-start rounded-full px-[10px] py-[3px]"
      style={{ backgroundColor: c.bg }}
    >
      <Text
        style={{ color: c.fg, fontSize: 11, fontFamily: FONTS.bodyBold, letterSpacing: 0.3 }}
      >
        {label ?? c.label}
      </Text>
    </View>
  );
};

// ─── VerifiedBadge ──────────────────────────────────────────────────────────

export const VerifiedBadge = () => {
  const { t } = useTheme();
  return (
    <View
      className="flex-row items-center self-start rounded-full px-[10px] py-[3px]"
      style={{ backgroundColor: t.tertiaryFixed }}
    >
      <Ionicons name="checkmark" size={11} color={t.onTertiaryFixedVariant} />
      <Text
        style={{
          color: t.onTertiaryFixedVariant,
          fontSize: 11,
          fontFamily: FONTS.bodyBold,
          marginLeft: 4,
        }}
      >
        Verified Pro
      </Text>
    </View>
  );
};

// ─── ProAvatar ──────────────────────────────────────────────────────────────

const AVATAR_BG = ['#ffdcc5', '#b6d0ff', '#9ff5c1', '#E8DEF8', '#adc7f7'];
const AVATAR_FG = ['#371800', '#001b3c', '#005231', '#6A4C93', '#455f88'];

interface ProAvatarProps {
  name: string;
  size?: number;
  verified?: boolean;
}

export const ProAvatar = ({ name, size = 36, verified = false }: ProAvatarProps) => {
  const { t } = useTheme();
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const idx = (name.charCodeAt(0) || 0) % AVATAR_BG.length;
  const badge = size * 0.45;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 9999,
          backgroundColor: AVATAR_BG[idx],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: AVATAR_FG[idx], fontSize: size * 0.38, fontFamily: FONTS.bodyBold }}>
          {initials || '?'}
        </Text>
      </View>
      {verified && (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: badge,
            height: badge,
            borderRadius: 9999,
            backgroundColor: '#9ff5c1',
            borderWidth: 2,
            borderColor: t.surfaceContainerLowest,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={size * 0.22} color="#005231" />
        </View>
      )}
    </View>
  );
};

// ─── TopBar ─────────────────────────────────────────────────────────────────

interface TopBarProps {
  title?: string;
  brand?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export const TopBar = ({ title, brand = false, onBack, rightAction, leftAction }: TopBarProps) => {
  const { t } = useTheme();
  const isLogoMode = brand || !title;
  return (
    <View
      className="h-14 flex-row items-center justify-between px-4"
      style={{ backgroundColor: t.surfaceContainerLowest }}
    >
      <View className="w-10 items-start justify-center">
        {leftAction ??
          (onBack ? (
            <Pressable
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <Ionicons name="chevron-back" size={22} color={t.onSurface} />
            </Pressable>
          ) : null)}
      </View>
      {isLogoMode ? (
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 18,
            fontFamily: FONTS.headingBold,
            color: t.primary,
            letterSpacing: -0.5,
          }}
        >
          Reliant Home
        </Text>
      ) : (
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 17,
            fontFamily: FONTS.heading,
            color: t.onSurface,
          }}
        >
          {title}
        </Text>
      )}
      <View className="w-10 flex-row items-center justify-end">{rightAction}</View>
    </View>
  );
};

// ─── BottomNav ──────────────────────────────────────────────────────────────
// Note: wire this to React Navigation's bottom tabs via screenOptions.tabBar.
// Exported standalone for screens that embed their own nav preview.

interface BottomNavProps {
  items: { label: string; icon: IoniconName; onPress?: () => void }[];
  active: number;
}

export const BottomNav = ({ items, active }: BottomNavProps) => {
  const { t } = useTheme();
  return (
    <View
      className="flex-row"
      style={{
        height: 80,
        paddingBottom: 16,
        backgroundColor: t.surfaceContainerLowest,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      {items.map((item, i) => {
        const isActive = i === active;
        return (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            className="flex-1 items-center justify-center"
          >
            <View
              style={{
                width: 56,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                backgroundColor: isActive ? t.surfaceContainerLow : 'transparent',
              }}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? t.primary : t.onSurfaceVariant}
              />
            </View>
            <Text
              style={{
                marginTop: 3,
                fontSize: 11,
                fontFamily: isActive ? FONTS.bodySemi : FONTS.body,
                color: isActive ? t.primary : t.onSurfaceVariant,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── CategoryTile ───────────────────────────────────────────────────────────

export const CategoryTile = ({ cat, onPress }: { cat: CategoryMeta; onPress?: () => void }) => {
  const { t } = useTheme();
  const bg = t[cat.tileBg];
  return (
    <Pressable onPress={onPress} className="items-center">
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 26 }}>{cat.emoji}</Text>
      </View>
      <Text
        style={{ fontSize: 12, fontFamily: FONTS.bodyMed, color: t.onSurface, marginTop: 7 }}
      >
        {cat.label}
      </Text>
    </Pressable>
  );
};

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnSize = 'sm' | 'md' | 'lg';

const BTN_HEIGHTS: Record<BtnSize, number> = { sm: 40, md: 48, lg: 56 };
const BTN_FONTS: Record<BtnSize, number> = { sm: 13, md: 15, lg: 17 };

interface BtnProps {
  children: React.ReactNode;
  onPress?: () => void;
  size?: BtnSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PrimaryBtn = ({ children, onPress, size = 'md', disabled, style }: BtnProps) => {
  const { t, isDark } = useTheme();
  const gradient = getPrimaryGradient(isDark);
  // Dark mode gradient is a bright primaryFixedDim → orange; text should sit on
  // that warm band with the theme's onPrimary token. Light gradient is deep
  // brown so white text keeps the maximum contrast.
  const fgColor = isDark ? t.onPrimary : '#ffffff';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        {
          opacity: disabled ? 0.4 : 1,
          shadowColor: '#371800',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 6,
          borderRadius: 9999,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: BTN_HEIGHTS[size],
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: 20,
        }}
      >
        {typeof children === 'string' ? (
          <Text
            style={{
              color: fgColor,
              fontSize: BTN_FONTS[size],
              fontFamily: FONTS.bodyBold,
              letterSpacing: 0.1,
            }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </LinearGradient>
    </Pressable>
  );
};

export const SecondaryBtn = ({ children, onPress, size = 'md', disabled, style }: BtnProps) => {
  const { t } = useTheme();
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[{ opacity: disabled ? 0.4 : 1 }, style]}>
      <View
        style={{
          height: BTN_HEIGHTS[size],
          borderRadius: 9999,
          backgroundColor: t.secondaryFixed,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: 20,
        }}
      >
        {typeof children === 'string' ? (
          <Text
            style={{
              color: t.onSecondaryFixed,
              fontSize: BTN_FONTS[size],
              fontFamily: FONTS.bodySemi,
            }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
};

// ─── SectionLabel ───────────────────────────────────────────────────────────

export const SectionLabel = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => {
  const { t } = useTheme();
  return (
    <Text
      style={[
        { fontSize: 20, fontFamily: FONTS.headingBold, color: t.onSurface, letterSpacing: -0.3 },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// ─── Card ───────────────────────────────────────────────────────────────────

export const Card = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => {
  const { t } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.surfaceContainerLowest, borderRadius: 20, padding: 20 },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// ─── ProgressTracker ────────────────────────────────────────────────────────

const STEPS = ['Accepted', 'On the Way', 'In Progress', 'Completed', 'Paid'];

export const ProgressTracker = ({ step = 1 }: { step?: number }) => {
  const { t, isDark } = useTheme();
  const gradient = getPrimaryGradient(isDark);
  const doneFg = isDark ? t.onPrimary : '#ffffff';
  return (
    <View className="flex-row items-start" style={{ paddingVertical: 8 }}>
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        const dotSize = current ? 28 : 20;
        return (
          <React.Fragment key={label}>
            <View className="items-center" style={{ width: 52 }}>
              {done ? (
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={11} color={doneFg} />
                </LinearGradient>
              ) : (
                <View
                  style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: 9999,
                    backgroundColor: current ? t.primaryFixedDim : t.surfaceContainerHighest,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: current ? 4 : 0,
                    borderColor: t.primaryFixed,
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: FONTS.bodySemi,
                  color: done || current ? t.primary : t.onSurfaceVariant,
                  textAlign: 'center',
                  letterSpacing: 0.3,
                  marginTop: 6,
                }}
              >
                {label.toUpperCase()}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 9999,
                  marginTop: current ? 12 : 8,
                  overflow: 'hidden',
                  backgroundColor: done ? 'transparent' : t.surfaceContainerHighest,
                }}
              >
                {done && (
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─── JobCard ────────────────────────────────────────────────────────────────

export interface JobCardData {
  id: string | number;
  title: string;
  category: string;
  status: ChipStatus;
  meta: string;
  proName?: string;
  proVerified?: boolean;
}

const ACTION_CLIENT: Record<ChipStatus, string> = {
  in_progress: 'Track',
  scheduled: 'Manage',
  completed: 'Rate',
  awaiting: 'View',
  urgent: 'View',
};

const ACTION_PRO: Record<ChipStatus, string> = {
  in_progress: 'Update',
  scheduled: 'Navigate',
  completed: 'Completed',
  awaiting: 'Accept',
  urgent: 'Accept',
};

import { getCategory } from '@/constants/theme';

interface JobCardProps {
  job: JobCardData;
  role?: 'client' | 'pro';
  onAction?: () => void;
  onPress?: () => void;
}

export const JobCard = ({ job, role = 'client', onAction, onPress }: JobCardProps) => {
  const { t } = useTheme();
  const cat = getCategory(job.category);
  const bg = t[cat.tileBg];
  const actionLabel = (role === 'pro' ? ACTION_PRO : ACTION_CLIENT)[job.status] ?? 'View';

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: t.surfaceContainerLowest,
        borderRadius: 20,
        padding: 20,
      }}
    >
      <View className="flex-row items-start" style={{ gap: 14 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontFamily: FONTS.heading,
                color: t.onSurface,
                lineHeight: 20,
              }}
            >
              {job.title}
            </Text>
            <StatusChip status={job.status} />
          </View>
          <Text
            style={{ fontSize: 13, fontFamily: FONTS.body, color: t.onSurfaceVariant, marginTop: 3 }}
          >
            {job.meta}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between" style={{ marginTop: 14 }}>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <ProAvatar name={job.proName ?? 'Unassigned'} size={30} verified={job.proVerified} />
          <Text style={{ fontSize: 13, fontFamily: FONTS.bodyMed, color: t.onSurfaceVariant }}>
            {job.proName ?? 'Finding a pro…'}
          </Text>
        </View>
        {job.status !== 'completed' && (
          <Pressable
            onPress={onAction}
            style={{
              backgroundColor: t.primary,
              borderRadius: 9999,
              paddingVertical: 7,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontFamily: FONTS.bodySemi }}>
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

// ─── JobCreateShell ─────────────────────────────────────────────────────────
// Top bar with back + title + "step/total" counter and a thin progress bar.

interface JobCreateShellProps {
  step: number;
  total?: number;
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export const JobCreateShell = ({
  step,
  total = 3,
  title,
  onBack,
  children,
}: JobCreateShellProps) => {
  const { t } = useTheme();
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          backgroundColor: t.surfaceContainerLowest,
        }}
      >
        <Pressable
          onPress={onBack}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          disabled={!onBack}
        >
          {onBack ? <Ionicons name="chevron-back" size={22} color={t.onSurface} /> : null}
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 17,
            fontFamily: FONTS.heading,
            color: t.onSurface,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: FONTS.body,
            color: t.onSurfaceVariant,
            width: 40,
            textAlign: 'right',
          }}
        >
          {step}/{total}
        </Text>
      </View>
      <View style={{ height: 3, backgroundColor: t.surfaceContainerHighest }}>
        <View
          style={{
            height: 3,
            width: `${pct}%`,
            backgroundColor: t.primary,
            borderRadius: 9999,
          }}
        />
      </View>
      {children}
    </View>
  );
};

// ─── Screen container ───────────────────────────────────────────────────────
// Applies the theme surface colour so screens don't each re-read tokens.

export const Screen = ({
  children,
  style,
  variant = 'surface',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'container-low';
}) => {
  const { t } = useTheme();
  const bg = variant === 'container-low' ? t.surfaceContainerLow : t.surface;
  return <View style={[{ flex: 1, backgroundColor: bg }, style]}>{children}</View>;
};

// ─── MapPlaceholder ─────────────────────────────────────────────────────────
// Low-fidelity map stand-in for design previews and loading states. Real
// `react-native-maps` MapView is used on production screens.

interface MapPlaceholderProps {
  height?: number;
  pins?: string[];
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const MapPlaceholder = ({
  height = 160,
  pins = ['$85', '$120', '$150'],
  label = 'MAP VIEW',
  style,
}: MapPlaceholderProps) => {
  const { t, isDark } = useTheme();
  const base = isDark ? t.secondaryContainer : '#eaf1fd';
  const grid = isDark ? '#2a3f5e' : '#d9e3f4';
  const road = isDark ? '#3b5278' : '#c3d2e8';
  return (
    <View
      style={[
        {
          height,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: base,
          position: 'relative',
        },
        style,
      ]}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(frac => (
        <View
          key={`h-${frac}`}
          style={{
            position: 'absolute',
            top: `${frac * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: grid,
          }}
        />
      ))}
      {[0.25, 0.5, 0.75].map(frac => (
        <View
          key={`v-${frac}`}
          style={{
            position: 'absolute',
            left: `${frac * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: grid,
          }}
        />
      ))}
      {/* Curved roads — simple skewed bars stand in for the SVG curves */}
      <View
        style={{
          position: 'absolute',
          top: '30%',
          left: -40,
          right: -40,
          height: 6,
          backgroundColor: road,
          borderRadius: 9999,
          transform: [{ rotate: '-8deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '62%',
          left: -40,
          right: -40,
          height: 6,
          backgroundColor: road,
          borderRadius: 9999,
          transform: [{ rotate: '6deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '45%',
          width: 6,
          backgroundColor: road,
          borderRadius: 9999,
          transform: [{ rotate: '12deg' }],
        }}
      />
      {/* Price pins */}
      {pins.map((price, i) => (
        <View
          key={`${price}-${i}`}
          style={{
            position: 'absolute',
            top: `${20 + i * 25}%`,
            left: `${20 + i * 22}%`,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 9999,
            backgroundColor: t.primary,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontFamily: FONTS.bodyBold }}>{price}</Text>
        </View>
      ))}
      {/* Corner label */}
      <View
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: t.surfaceContainerLowest,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontFamily: FONTS.bodyBold,
            color: t.onSurfaceVariant,
            letterSpacing: 0.6,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
};

// ─── ImgPlaceholder ─────────────────────────────────────────────────────────

interface ImgPlaceholderProps {
  height?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const ImgPlaceholder = ({ height = 140, label = 'PHOTO', style }: ImgPlaceholderProps) => {
  const { t } = useTheme();
  return (
    <View
      style={[
        {
          height,
          borderRadius: 20,
          backgroundColor: t.surfaceContainerHighest,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Ionicons name="image-outline" size={28} color={t.onSurfaceVariant} />
      <Text
        style={{
          marginTop: 6,
          fontSize: 10,
          fontFamily: FONTS.bodyBold,
          color: t.onSurfaceVariant,
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
    </View>
  );
};
