import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ClientStackParamList } from '@/types/navigation';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  ClientStackParamList,
  'Notifications'
>;

interface NotificationsScreenProps {
  navigation: NotificationsScreenNavigationProp;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type NotificationType = 'tracking' | 'message' | 'completed' | 'payment';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'tracking',
    title: 'Marcus Sterling is on his way',
    body: 'Your plumbing specialist is 10 minutes away for the master bathroom inspection.',
    timestamp: '2 mins ago',
    read: false,
    actionLabel: 'Track Pro',
  },
  {
    id: '2',
    type: 'message',
    title: 'New message from Elena',
    body: '"I\'ve attached the finalized quote for the kitchen lighting upgrade. Let me know if you have questions!"',
    timestamp: '15 mins ago',
    read: false,
    actionLabel: 'Reply',
  },
  {
    id: '3',
    type: 'completed',
    title: 'Job completed: Kitchen Sink',
    body: 'The leak repair is complete. Alex has verified the water pressure and cleaned the workspace.',
    timestamp: '2 hours ago',
    read: true,
    actionLabel: 'View Receipt',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment successful',
    body: 'Payment of $145.00 for "Drainage Maintenance" was processed successfully using Visa ending in 4242.',
    timestamp: '5 hours ago',
    read: true,
  },
];

// ─── Icon config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; bg: string; iconColor: string }
> = {
  tracking:  { icon: 'car-outline',              bg: '#d6e3ff', iconColor: '#3f5882' },
  message:   { icon: 'chatbubble-outline',        bg: '#ffdcc5', iconColor: '#703700' },
  completed: { icon: 'checkmark-circle-outline',  bg: '#9ff5c1', iconColor: '#005231' },
  payment:   { icon: 'card-outline',              bg: '#e9e7eb', iconColor: '#43474e' },
};

// ─── Notification card ────────────────────────────────────────────────────────
interface NotificationCardProps {
  notification: Notification;
}

const NotificationCard = ({ notification }: NotificationCardProps) => {
  const config = TYPE_CONFIG[notification.type];
  const isUnread = !notification.read;

  return (
    <Pressable
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
        backgroundColor: isUnread ? '#ffffff' : '#f4f3f7',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#1a1c1e',
        shadowOpacity: isUnread ? 0.05 : 0,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        elevation: isUnread ? 2 : 0,
      })}
    >
      {/* Unread dot */}
      {isUnread && (
        <View
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#572900',
          }}
        />
      )}

      <View className="flex-row gap-x-4">
        {/* Icon */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.bg }}
        >
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className="text-base font-extrabold text-on-surface leading-tight mb-1"
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <Text
            className="text-sm text-on-surface-variant leading-relaxed mb-3"
            numberOfLines={3}
          >
            {notification.body}
          </Text>
          <View className="flex-row items-center gap-x-3">
            <View className="bg-surface-container px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                {notification.timestamp}
              </Text>
            </View>
            {notification.actionLabel && (
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text className="text-sm font-bold" style={{ color: '#572900' }}>
                  {notification.actionLabel}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const NotificationsScreen = ({ navigation }: NotificationsScreenProps) => {
  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <View className="flex-row items-center gap-x-3">
          <Pressable
            className="w-10 h-10 rounded-full bg-surface-container-low items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#371800" />
          </Pressable>
          <Text className="text-xl font-extrabold text-primary tracking-tight">Alerts</Text>
        </View>
        {unreadCount > 0 && (
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#572900' }}>
            <Text className="text-xs font-extrabold text-white">{unreadCount} new</Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 mt-2">
          Recent
        </Text>

        {NOTIFICATIONS.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}

        {/* Upsell bento */}
        <View
          className="mt-6 p-8 rounded-xl overflow-hidden"
          style={{ backgroundColor: '#572900' }}
        >
          <Text
            className="text-2xl font-extrabold tracking-tight mb-2"
            style={{ color: '#ffb783' }}
          >
            Stay ahead of every job
          </Text>
          <Text className="text-sm font-medium leading-relaxed mb-5" style={{ color: '#ffdcc5' }}>
            Upgrade to Reliant Plus for priority alerts and 24/7 emergency support.
          </Text>
          <Pressable
            className="self-start px-6 py-3 rounded-full"
            style={({ pressed }) => ({
              backgroundColor: '#ffb783',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#372100' }}>
              Explore Plus
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
