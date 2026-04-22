import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';

import { useHandymanJobs } from '@/hooks/useHandymanJobs';
import { useUnreadByJob } from '@/hooks/useUnreadByJob';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { JobListCard } from '@/components/shared/JobListCard';
import { STATUS_BADGE, APPLIED_BADGE } from '@/constants/jobs';
import { getInitials } from '@/utils/format';
import { HandymanTabParamList, HandymanStackParamList } from '@/types/navigation';
import { Job } from '@/types/database';

type MyJobsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<HandymanTabParamList, 'MyJobs'>,
  NativeStackNavigationProp<HandymanStackParamList>
>;

interface MyJobsScreenProps { navigation: MyJobsNavigationProp; }

type Tab = 'applied' | 'active' | 'past';

// ─── Empty state ──────────────────────────────────────────────────────────────
interface EmptyStateProps { tab: Tab; onBrowse: () => void; }

const EMPTY_COPY: Record<Tab, { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }> = {
  applied: {
    icon: 'paper-plane-outline',
    title: 'No pending applications',
    body: "Apply for an open job and it'll show up here until the client decides.",
  },
  active: {
    icon: 'briefcase-outline',
    title: 'No active jobs',
    body: 'Accepted jobs will appear here. Browse open jobs to find your next gig.',
  },
  past: {
    icon: 'archive-outline',
    title: 'No past jobs',
    body: 'Completed and cancelled jobs will appear here.',
  },
};

const EmptyState = ({ tab, onBrowse }: EmptyStateProps) => {
  const copy = EMPTY_COPY[tab];
  return (
    <View className="items-center py-20 px-8">
      <View className="w-16 h-16 rounded-full bg-surface-container-low items-center justify-center mb-4">
        <Ionicons name={copy.icon} size={28} color="#43474e" />
      </View>
      <Text className="text-on-surface font-extrabold text-lg text-center">{copy.title}</Text>
      <Text className="text-on-surface-variant text-sm text-center mt-2 leading-relaxed">
        {copy.body}
      </Text>
      {tab !== 'past' && (
        <Pressable
          className="mt-6 px-6 py-3 rounded-full bg-primary"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          onPress={onBrowse}
        >
          <Text className="text-on-primary font-extrabold text-sm">Browse Jobs</Text>
        </Pressable>
      )}
    </View>
  );
};

// ─── Segmented control ────────────────────────────────────────────────────────
interface SegmentedProps { tab: Tab; onChange: (t: Tab) => void; }

const Segmented = ({ tab, onChange }: SegmentedProps) => (
  <View className="bg-surface-container-low p-1.5 rounded-full flex-row mb-6">
    {(['applied', 'active', 'past'] as const).map((t) => {
      const isActive = tab === t;
      return (
        <Pressable
          key={t}
          className="flex-1 py-3 rounded-full items-center"
          style={({ pressed }) => ({
            backgroundColor: isActive ? '#ffffff' : 'transparent',
            opacity: pressed ? 0.8 : 1,
            shadowColor: isActive ? '#1a1c1e' : 'transparent',
            shadowOpacity: isActive ? 0.06 : 0,
            shadowRadius: 4,
            elevation: isActive ? 1 : 0,
          })}
          onPress={() => onChange(t)}
        >
          <Text
            className="text-sm font-extrabold capitalize"
            style={{ color: isActive ? '#371800' : '#43474e' }}
          >
            {t}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const MyJobsScreen = ({ navigation }: MyJobsScreenProps) => {
  const { appliedJobs, activeJobs, pastJobs, isLoading, error, refetch } = useHandymanJobs();
  const [tab, setTab] = useState<Tab>('active');
  const chattableIds = [...appliedJobs, ...activeJobs].map((j) => j.id);
  const unreadByJob = useUnreadByJob(chattableIds);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const jobs =
    tab === 'applied' ? appliedJobs :
    tab === 'active'  ? activeJobs  :
    pastJobs;

  const handleManage = (job: Job) => {
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
  };

  const handleChat = (job: Job) => {
    const clientName = job.client?.full_name ?? 'Client';
    navigation.navigate('Chat', {
      jobId: job.id,
      counterpartyName: clientName,
      counterpartyInitials: getInitials(clientName),
    });
  };

  const handleBrowse = () => {
    navigation.navigate('MapView');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* App bar */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
        <Text className="text-2xl font-extrabold text-primary tracking-tight">My Jobs</Text>
        <NotificationBell
          iconColor="#43474e"
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>

      <View className="px-6">
        <Segmented tab={tab} onChange={setTab} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#371800" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={32} color="#ba1a1a" />
          <Text className="text-error text-sm text-center mt-3">{error}</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {jobs.length === 0 ? (
            <EmptyState tab={tab} onBrowse={handleBrowse} />
          ) : (
            jobs.map((job) => {
              const applied = tab === 'applied';
              const showChat = tab === 'active' || tab === 'applied';
              const clientName = job.client?.full_name ?? 'Client';
              return (
                <JobListCard
                  key={job.id}
                  job={job}
                  badge={applied ? APPLIED_BADGE : STATUS_BADGE[job.status]}
                  counterparty={{ name: clientName, label: 'Client' }}
                  primaryAction={{
                    label: 'Manage',
                    onPress: () => handleManage(job),
                  }}
                  secondaryAction={
                    showChat
                      ? {
                          icon: 'chatbubble-outline',
                          onPress: () => handleChat(job),
                          accessibilityLabel: 'Open chat',
                          badgeCount: unreadByJob[job.id] ?? 0,
                        }
                      : undefined
                  }
                />
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MyJobsScreen;
