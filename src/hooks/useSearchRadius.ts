import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'handyman_search_radius_km';
const DEFAULT_RADIUS_KM = 25;

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

interface SearchRadiusContextValue {
  radiusKm: RadiusOption;
  setRadiusKm: (km: RadiusOption) => void;
  isLoading: boolean;
}

const SearchRadiusContext = createContext<SearchRadiusContextValue>({
  radiusKm: DEFAULT_RADIUS_KM,
  setRadiusKm: () => {},
  isLoading: true,
});

/**
 * Wrap the handyman navigator with this provider so all screens
 * share the same radius state in-memory.
 */
export const SearchRadiusProvider = ({ children }: { children: React.ReactNode }) => {
  const [radiusKm, setRadiusState] = useState<RadiusOption>(DEFAULT_RADIUS_KM);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          const parsed = Number(stored);
          if (RADIUS_OPTIONS.includes(parsed as RadiusOption)) {
            setRadiusState(parsed as RadiusOption);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setRadiusKm = useCallback((km: RadiusOption) => {
    setRadiusState(km);
    AsyncStorage.setItem(STORAGE_KEY, String(km));
  }, []);

  return React.createElement(
    SearchRadiusContext.Provider,
    { value: { radiusKm, setRadiusKm, isLoading } },
    children,
  );
};

export const useSearchRadius = (): SearchRadiusContextValue =>
  useContext(SearchRadiusContext);
