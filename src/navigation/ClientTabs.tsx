import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '@/screens/client/DashboardScreen';
import ClientProfileScreen from '@/screens/client/ProfileScreen';
import PostJobStack from '@/navigation/PostJobStack';
import { ClientTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<ClientTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

const TabIcon = ({
  name,
  focusedName,
  focused,
  color,
}: {
  name: IoniconName;
  focusedName: IoniconName;
  focused: boolean;
  color: string;
}) => <Ionicons name={focused ? focusedName : name} size={22} color={color} />;

const ClientTabs = () => (
  <Tab.Navigator
    initialRouteName="Dashboard"
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#371800',
      tabBarInactiveTintColor: '#74777f',
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
      },
      tabBarStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderTopWidth: 0,
        elevation: 0,
        shadowColor: '#1a1c1e',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
        height: 80,
        paddingBottom: 16,
        paddingTop: 10,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        position: 'absolute',
      },
    }}
  >
    <Tab.Screen
      name="Explore"
      component={PostJobStack}
      options={{
        tabBarLabel: 'Explore',
        tabBarIcon: ({ focused, color }) => (
          <TabIcon
            name="search-outline"
            focusedName="search"
            focused={focused}
            color={color}
          />
        ),
      }}
    />

    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarLabel: 'Jobs',
        tabBarIcon: ({ focused, color }) => (
          <TabIcon
            name="construct-outline"
            focusedName="construct"
            focused={focused}
            color={color}
          />
        ),
      }}
    />

    <Tab.Screen
      name="Settings"
      component={ClientProfileScreen}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ focused, color }) => (
          <TabIcon
            name="person-outline"
            focusedName="person"
            focused={focused}
            color={color}
          />
        ),
      }}
    />
  </Tab.Navigator>
);

export default ClientTabs;
