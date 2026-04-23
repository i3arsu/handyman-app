import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as usePlusJakartaSans,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { AuthProvider, useAuth } from '@/store/AuthContext';
import { ThemeProvider, useTheme } from '@/store/ThemeContext';
import RootNavigator from '@/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore — splash may already be hidden in dev reloads */
});

const AppShell = () => {
  const { session, role, isLoading } = useAuth();
  const { t, isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface }}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: t.surface,
      card: t.surfaceContainerLowest,
      text: t.onSurface,
      border: t.surfaceContainerHighest,
      primary: t.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator isAuthenticated={session !== null} userRole={role} />
    </NavigationContainer>
  );
};

const App = () => {
  const [pjsLoaded, pjsError] = usePlusJakartaSans({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [splashHidden, setSplashHidden] = useState(false);

  const fontsReady = pjsLoaded || !!pjsError;

  const onReady = useCallback(async () => {
    if (!fontsReady || splashHidden) return;
    try {
      await SplashScreen.hideAsync();
    } catch {
      /* noop */
    }
    setSplashHidden(true);
  }, [fontsReady, splashHidden]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onReady}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
