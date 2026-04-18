import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ClientTabs from '@/navigation/ClientTabs';
import JobProgressScreen from '@/screens/client/JobProgressScreen';
import ChatScreen from '@/screens/shared/ChatScreen';
import NotificationsScreen from '@/screens/client/NotificationsScreen';
import { ClientStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<ClientStackParamList>();

const ClientStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={ClientTabs} />
    <Stack.Screen
      name="JobProgress"
      component={JobProgressScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </Stack.Navigator>
);

export default ClientStack;
