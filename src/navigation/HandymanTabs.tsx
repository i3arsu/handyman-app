import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MapViewScreen from '@/screens/handyman/MapViewScreen';
import ListViewScreen from '@/screens/handyman/ListViewScreen';
import HandymanProfileScreen from '@/screens/handyman/ProfileScreen';
import { HandymanTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<HandymanTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  name: IoniconName;
  focusedName: IoniconName;
  focused: boolean;
  color: string;
}

const TabIcon = ({ name, focusedName, focused, color }: TabIconProps) => (
  <Ionicons name={focused ? focusedName : name} size={22} color={color} />
);

const HandymanTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="MapView"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#371800',
        tabBarInactiveTintColor: '#43474e',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#1a1c1e',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.06,
          shadowRadius: 32,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          position: 'absolute',
        },
      }}
    >
      <Tab.Screen
        name="MapView"
        component={MapViewScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="map-outline" focusedName="map" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ListView"
        component={ListViewScreen}
        options={{
          tabBarLabel: 'My Jobs',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="construct-outline" focusedName="construct" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={HandymanProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person-outline" focusedName="person" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default HandymanTabs;
