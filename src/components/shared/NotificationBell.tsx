import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBellProps {
  onPress: () => void;
  // Circle background — matches the app bar button styling where the bell sits.
  variant?: 'light' | 'tinted';
  iconColor?: string;
}

// Bell icon with a live unread-count badge. Subscribes to the notifications
// feed via useNotifications, so the badge updates in realtime whenever a new
// row is inserted for the current user.
export const NotificationBell = ({
  onPress,
  variant = 'light',
  iconColor = '#371800',
}: NotificationBellProps) => {
  const { unreadCount } = useNotifications();

  const wrapperStyle: ViewStyle =
    variant === 'tinted'
      ? {
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: 'rgba(244,243,247,0.92)',
          alignItems: 'center',
          justifyContent: 'center',
        }
      : {
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: '#f4f3f7',
          alignItems: 'center',
          justifyContent: 'center',
        };

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [wrapperStyle, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons name="notifications-outline" size={20} color={iconColor} />

      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: '#ba1a1a',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#ffffff',
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '800',
              lineHeight: 12,
            }}
          >
            {badgeLabel}
          </Text>
        </View>
      )}
    </Pressable>
  );
};
