import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LIGHT_THEME,
  DARK_THEME,
  CHIPS_LIGHT,
  CHIPS_DARK,
  ThemeTokens,
  ChipStatus,
  ChipStyle,
} from '@/constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  t: ThemeTokens;
  chips: Record<ChipStatus, ChipStyle>;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'reliant_theme_mode_v1';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { setColorScheme } = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() ?? 'light');

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  // Listen to system appearance
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'light');
    });
    return () => sub.remove();
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  // Drive NativeWind's dark: variants
  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark, setColorScheme]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark,
      t: isDark ? DARK_THEME : LIGHT_THEME,
      chips: isDark ? CHIPS_DARK : CHIPS_LIGHT,
      setMode,
    }),
    [mode, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
