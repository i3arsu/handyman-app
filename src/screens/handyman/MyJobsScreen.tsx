import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';

import { useHandymanJobs } from '@/hooks/useHandymanJobs';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { HandymanTabParamList, HandymanStackParamList } from '@/types/navigation';
import { Job, JobStatus } from '@/types/database';

type MyJobsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<HandymanTabParamList, 'MyJobs'>,
  NativeStackNavigationProp<HandymanStackParamList>
>;

interface MyJobsScreenProps { navigation: MyJobsNavigationProp; }

type Tab = 'applied' | 'active' | 'past';

const CATEGORY_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  Plumbing:    { icon: 'water-outline',       bg: '#ffdcc5' },
  Electrical:  { icon: 'flash-outline',        bg: '#9ff5c1' },
  HVAC:        { icon: 'thermometer-outline',  bg: '#9ff5c1' },
  Painting:    { icon: 'brush-outline',        bg: '#e9e7eb' },
  Locksmith:   { icon: 'key-outline',          bg: '#d6e3ff' },
  Tiling:      { icon: 'grid-outline',         bg: '#ffdcc5' },
  Carpentry:   { icon: 'hammer-outline',       bg: '#e9e7eb' },
  General:     { icon: 'construct-outline',    bg: '#e9e7eb' },
};

const STATUS_BADGE: Record<JobStatus, { label: string; bg: string; fg: string }> = {
  open:        { label: 'Open',        bg: '#e9e7eb', fg: '#43474e' },
  accepted:    { label: 'Scheduled',   bg: '#b6d0ff', fg: '#2d476f' },
  in_progress: { label: 'In Progress', bg: '#9ff5c1', fg: '#005231' },
  completed:   { label: 'Completed',   bg: '#e9e7eb', fg: '#43474e' },
  cancelled:   { label: 'Cancelled',   bg: '#ffdad6', fg: '#93000a' },
};

const APPLIED_BADGE = { label: 'Awaiting Reply', bg: '#ffdcc5', fg: '#703700' };

const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';

const formatDate = (iso: string | null): string => {
  if (!iso) return 'Flexible';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

// ─── Job card ─────────────────────────────────────────────────────────────────
interface JobCardProps {
  job: Job;
  onManage: () => void;
  onChat?: () => void;
  showChat: boolean;
  applied?: boolean;
}

const JobCard = ({ job, onManage, onChat, showChat, applied }: JobCardProps) => {
  const cat = CATEGORY_ICONS[job.category] ?? CATEGORY_ICONS.General;
  const badge = applied ? APPLIED_BADGE : STATUS_BADGE[job.status];
  const clientName = job.client?.full_name ?? 'Client';
  const clientInitials = getInitials(clientName);

  return (
    <View
      className="bg-surface-container-lowest rounded-xl p-5 mb-4"
      style={{
        shadowColor: '#1a1c1e',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* Header row */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-start gap-x-3 flex-1 pr-2">
          <View
            className="w-12 h-12 rounded-lg items-center justify-center"
            style={{ backgroundColor: cat.bg }}
          >
            <Ionicons name={cat.icon} size={22} color="#703700" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-on-surface leading-tight" numberOfLines={2}>
              {job.title}
            </Text>
            <View className="flex-row items-center gap-x-1 mt-1">
              <Ionicons name="calendar-outline" size={12} color="#43474e" />
              <Text className="text-xs text-on-surface-variant font-medium">
                {formatDate(job.scheduled_start)}
              </Text>
            </View>
          </View>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: badge.bg }}
        >
          <Text
            className="text-xs font-extrabold uppercase tracking-wider"
            style={{ color: badge.fg }}
          >
            {badge.label}
          </Text>
        </View>
      </View>

      {/* Footer row */}
      <View className="flex-row items-center justify-between pt-4 border-t border-surface-container">
        <View className="flex-row items-center gap-x-3 flex-1">
          <View className="w-9 h-9 rounded-full bg-secondary items-center justify-center">
            <Text className="text-white font-extrabold text-xs">{clientInitials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-medium text-on-surface-variant leading-none mb-0.5">
              Client
            </Text>
            <Text className="text-sm font-extrabold text-on-surface" numberOfLines={1}>
              {clientName}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-x-2">
          {showChat && (
            <Pressable
              className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              onPress={onChat}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#371800" />
            </Pressable>
          )}
          <Pressable
            onPress={onManage}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: '#371800',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 2,
            })}
          >
            <View
              className="px-5 py-2.5 rounded-full"
              style={{ backgroundColor: '#371800' }}
            >
              <Text className="text-white text-sm font-extrabold">Manage</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

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
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                applied={tab === 'applied'}
                showChat={tab === 'active' || tab === 'applied'}
                onManage={() => handleManage(job)}
                onChat={() => handleChat(job)}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MyJobsScreen;
