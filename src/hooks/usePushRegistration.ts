import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

// Foreground handler: show a heads-up banner while the app is open so the
// user notices new notifications without opening the Alerts tab.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Registers the device's Expo push token on the signed-in user's profile.
// Does nothing on simulators (Expo won't issue tokens) and no-ops if the
// user has disabled push in Settings.
export const usePushRegistration = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const register = async () => {
      if (!Device.isDevice) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') return;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

      const tokenRes = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      const token = tokenRes.data;
      if (cancelled || !token) return;

      await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', user.id);
    };

    register().catch(() => {
      // Swallow — push is additive; in-app inbox still works.
    });

    return () => {
      cancelled = true;
    };
  }, [user]);
};
