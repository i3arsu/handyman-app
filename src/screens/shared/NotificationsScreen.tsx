import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '@/services/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { useProfile } from '@/hooks/useProfile';
import { Job, Notification, NotificationType } from '@/types/database';

// ─── Icon config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; bg: string; iconColor: string }
> = {
  application_received:  { icon: 'person-add-outline',       bg: '#d6e3ff', iconColor: '#3f5882' },
  application_accepted:  { icon: 'checkmark-circle-outline', bg: '#9ff5c1', iconColor: '#005231' },
  application_rejected:  { icon: 'close-circle-outline',     bg: '#ffdad6', iconColor: '#8c1d18' },
  application_withdrawn: { icon: 'arrow-undo-outline',       bg: '#ffdad6', iconColor: '#8c1d18' },
  job_started:           { icon: 'play-circle-outline',      bg: '#ffdcc5', iconColor: '#703700' },
  job_completed:         { icon: 'checkmark-done-outline',   bg: '#9ff5c1', iconColor: '#005231' },
  job_cancelled:         { icon: 'ban-outline',              bg: '#ffdad6', iconColor: '#8c1d18' },
  new_message:           { icon: 'chatbubble-outline',       bg: '#ffdcc5', iconColor: '#703700' },
  new_nearby_job:        { icon: 'hammer-outline',           bg: '#d6e3ff', iconColor: '#3f5882' },
};

// ─── Relative time ────────────────────────────────────────────────────────────
const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
};

// ─── Notification card ────────────────────────────────────────────────────────
interface NotificationCardProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
  const config = TYPE_CONFIG[notification.type];
  const isUnread = !notification.read;

  return (
    <Pressable
      onPress={() => onPress(notification)}
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
        <View
          className="w-12 h-12 rounded-full items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.bg }}
        >
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>

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
          <View className="bg-surface-container px-3 py-1 rounded-full self-start">
            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {formatRelative(notification.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
// Lives under both ClientStack and HandymanStack (route name "Notifications").
// Navigation typings differ between stacks, so we use a loose navigator here.
const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const { profile } = useProfile();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handlePress = async (n: Notification) => {
    if (!n.read) {
      markAsRead(n.id);
    }

    if (!n.job_id) return;

    // Clients deep-link to their JobProgress view.
    if (profile?.role === 'client') {
      navigation.navigate('JobProgress', { jobId: n.job_id });
      return;
    }

    // Handymen deep-link to JobInformation, which needs the full job row.
    if (profile?.role === 'handyman') {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', n.job_id)
        .maybeSingle();
      if (error || !data) return;
      const job = data as Job;
      navigation.navigate('JobInformation', {
        jobId: job.id,
        jobTitle: job.title,
        jobDescription: job.description,
        jobAddress: job.address,
        locationLat: job.location_lat,
        locationLng: job.location_lng,
        category: job.category,
        isUrgent: job.is_urgent,
        payout: job.payout,
        showUpFee: job.show_up_fee,
        scheduledStart: job.scheduled_start,
        createdAt: job.created_at,
      });
    }
  };

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

        <View className="flex-row items-center gap-x-2">
          {unreadCount > 0 && (
            <>
              <Pressable
                onPress={markAllAsRead}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#572900' }}>
                  Mark all read
                </Text>
              </Pressable>
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#572900' }}>
                <Text className="text-xs font-extrabold text-white">{unreadCount} new</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#371800" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: '#f4f3f7' }}
          >
            <Ionicons name="notifications-off-outline" size={32} color="#43474e" />
          </View>
          <Text className="text-lg font-extrabold text-on-surface mb-2 text-center">
            You're all caught up
          </Text>
          <Text className="text-sm text-on-surface-variant text-center leading-relaxed">
            New alerts will appear here when there's activity on your jobs.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 mt-2">
            Recent
          </Text>
          {notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} onPress={handlePress} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
