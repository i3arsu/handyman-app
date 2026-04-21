import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthStack from './AuthStack';
import ClientStack from './ClientStack';
import HandymanStack from './HandymanStack';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { UserRole } from '@/types/auth';
import { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated: boolean;
  userRole: UserRole | null;
}

/**
 * Single root navigator that conditionally renders screens based on auth state.
 * React Navigation requires ONE navigator with conditional screens — not
 * conditionally returned navigator trees. Swapping navigator trees caused the
 * Reanimated v4 boolean/string type mismatch.
 *
 * Auth flow:
 *   unauthenticated  → "Auth"       → AuthStack  (Login, SignUp)
 *   client           → "ClientApp"  → ClientTabs (Dashboard, Profile)
 *   handyman         → "HandymanApp"→ HandymanTabs (MapView, ListView, Profile)
 */
const RootNavigator = ({ isAuthenticated, userRole }: RootNavigatorProps) => {
  usePushRegistration();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : userRole === 'client' ? (
        <Stack.Screen name="ClientApp" component={ClientStack} />
      ) : (
        <Stack.Screen name="HandymanApp" component={HandymanStack} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
