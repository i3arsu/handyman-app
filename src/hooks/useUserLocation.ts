import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseUserLocationResult {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

/**
 * Requests foreground location permission and returns the user's current
 * position. Falls back gracefully when permission is denied.
 */
export const useUserLocation = (): UseUserLocationResult => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const requestLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (cancelled) return;

        if (status !== 'granted') {
          setPermissionDenied(true);
          setIsLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to get location',
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    requestLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  return { location, isLoading, error, permissionDenied };
};
