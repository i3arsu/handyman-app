import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useClientJobs } from '@/hooks/useClientJobs';
import { useProfile } from '@/hooks/useProfile';
import { useUnreadByJob } from '@/hooks/useUnreadByJob';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { JobListCard } from '@/components/shared/JobListCard';
import { STATUS_BADGE } from '@/constants/jobs';
import { getInitials } from '@/utils/format';
import { ClientTabParamList, ClientStackParamList } from '@/types/navigation';
import { Job } from '@/types/database';

type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<ClientStackParamList>
>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}

// ─── Empty state ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  tab: 'active' | 'past';
  onPostJob: () => void;
}

const EmptyState = ({ tab, onPostJob }: EmptyStateProps) => (
  <View className="items-center py-16 px-8">
    <View className="w-16 h-16 rounded-full bg-surface-container-low items-center justify-center mb-4">
      <Ionicons name={tab === 'active' ? 'construct-outline' : 'time-outline'} size={28} color="#43474e" />
    </View>
    <Text className="text-on-surface font-extrabold text-lg text-center">
      {tab === 'active' ? 'No active jobs' : 'No past jobs'}
    </Text>
    <Text className="text-on-surface-variant text-sm text-center mt-2 leading-relaxed">
      {tab === 'active'
        ? 'Post your first job and get matched with a nearby pro.'
        : 'Your completed jobs will appear here.'}
    </Text>
    {tab === 'active' && (
      <Pressable
        className="mt-6 px-6 py-3 rounded-full bg-primary"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        onPress={onPostJob}
      >
        <Text className="text-on-primary font-extrabold text-sm">Post a Job</Text>
      </Pressable>
    )}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
type Tab = 'active' | 'past';

const resolveAssignedPro = (job: Job): string | null => {
  const accepted = job.job_applications?.find(a => a.status === 'accepted');
  return accepted?.handyman?.full_name ?? null;
};

const jobsWithPro = (jobs: Job[]): Job[] =>
  jobs.filter((j) => !!resolveAssignedPro(j));

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const { activeJobs, pastJobs, isLoading, error, refetch } = useClientJobs();
  const { profile } = useProfile();
  const chattableIds = jobsWithPro(activeJobs).map((j) => j.id);
  const unreadByJob = useUnreadByJob(chattableIds);

  // Refetch every time the tab comes into focus so newly posted jobs appear immediately.
  useFocusEffect(useCallback(() => { refetch(); }, []));

  const jobs = activeTab === 'active' ? activeJobs : pastJobs;

  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView className="flex-1 bg-surface">

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <Text className="text-xl font-extrabold text-primary tracking-tight">My Jobs</Text>
        <View className="flex-row items-center gap-x-3">
          <NotificationBell onPress={() => navigation.navigate('Notifications')} />
          <Pressable
            className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text className="text-xs font-extrabold text-white">{initials}</Text>
          </Pressable>
        </View>
      </View>

      {/* Segmented control */}
      <View className="mx-6 mb-6 bg-surface-container-low p-1.5 rounded-full flex-row">
        {(['active', 'past'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            className="flex-1 py-3 px-6 rounded-full items-center"
            style={({ pressed }) => ({
              backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
              opacity: pressed ? 0.8 : 1,
              shadowColor: '#1a1c1e',
              shadowOpacity: activeTab === tab ? 0.06 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: activeTab === tab ? 2 : 0,
            })}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className="text-sm font-bold capitalize"
              style={{ color: activeTab === tab ? '#371800' : '#43474e' }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
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
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {jobs.length === 0 ? (
            <EmptyState tab={activeTab} onPostJob={() => navigation.navigate('Explore')} />
          ) : (
            jobs.map((job) => {
              const proName = resolveAssignedPro(job);
              const isOpen = job.status === 'open';
              const goToJob = () => navigation.navigate('JobProgress', { jobId: job.id });
              const openChat = proName
                ? () =>
                    navigation.navigate('Chat', {
                      jobId: job.id,
                      counterpartyName: proName,
                      counterpartyInitials: getInitials(proName),
                    })
                : null;
              return (
                <JobListCard
                  key={job.id}
                  job={job}
                  badge={STATUS_BADGE[job.status]}
                  counterparty={proName ? { name: proName, label: 'Assigned Pro' } : null}
                  primaryAction={{
                    label: isOpen ? 'Details' : 'Manage',
                    onPress: goToJob,
                    variant: isOpen ? 'muted' : 'primary',
                  }}
                  secondaryAction={
                    openChat
                      ? {
                          icon: 'chatbubble-outline',
                          onPress: openChat,
                          accessibilityLabel: 'Open chat',
                          badgeCount: unreadByJob[job.id] ?? 0,
                        }
                      : undefined
                  }
                  onPress={goToJob}
                />
              );
            })
          )}
        </ScrollView>
      )}

    </SafeAreaView>
  );
};

export default DashboardScreen;
