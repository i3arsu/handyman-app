import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/store/AuthContext';
import RootNavigator from '@/navigation/RootNavigator';

// ─── Inner shell ──────────────────────────────────────────────────────────────
// Separated so it can safely call useAuth() inside the AuthProvider tree.
const AppShell = () => {
  const { session, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9fd' }}>
        <ActivityIndicator size="large" color="#371800" />
      </View>
    );
  }

  return (
    <RootNavigator
      isAuthenticated={session !== null}
      userRole={role}
    />
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppShell />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

export default App;
