import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HandymanTabs from '@/navigation/HandymanTabs';
import JobInformationScreen from '@/screens/handyman/JobInformationScreen';
import ListViewScreen from '@/screens/handyman/ListViewScreen';
import PricingRoutingScreen from '@/screens/handyman/PricingRoutingScreen';
import NotificationsScreen from '@/screens/client/NotificationsScreen';
import ChatScreen from '@/screens/shared/ChatScreen';
import EditProfileScreen from '@/screens/shared/EditProfileScreen';
import { SearchRadiusProvider } from '@/hooks/useSearchRadius';
import { HandymanStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<HandymanStackParamList>();

const HandymanStack = () => (
  <SearchRadiusProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={HandymanTabs} />
      <Stack.Screen
        name="ListView"
        component={ListViewScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="JobInformation"
        component={JobInformationScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PricingRouting"
        component={PricingRoutingScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  </SearchRadiusProvider>
);

export default HandymanStack;
