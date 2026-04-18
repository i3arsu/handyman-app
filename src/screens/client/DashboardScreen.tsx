import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useClientJobs } from '@/hooks/useClientJobs';
import { useProfile } from '@/hooks/useProfile';
import { ClientTabParamList, ClientStackParamList } from '@/types/navigation';
import { Job, JobStatus } from '@/types/database';

type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<ClientStackParamList>
>;


interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, { icon: string; bg: string }> = {
  Plumbing:   { icon: 'water-outline',          bg: '#ffdcc5' },
  Electrical: { icon: 'flash-outline',           bg: '#9ff5c1' },
  Painting:   { icon: 'brush-outline',           bg: '#e9e7eb' },
  Locksmith:  { icon: 'key-outline',             bg: '#d6e3ff' },
  Tiling:     { icon: 'grid-outline',            bg: '#ffdcc5' },
  Carpentry:  { icon: 'hammer-outline',          bg: '#e9e7eb' },
  HVAC:       { icon: 'thermometer-outline',     bg: '#9ff5c1' },
  General:    { icon: 'construct-outline',       bg: '#e9e7eb' },
};

const STATUS_CONFIG: Record<JobStatus, { label: string; bg: string; text: string }> = {
  open:        { label: 'Awaiting Pro',  bg: '#e9e7eb', text: '#43474e' },
  accepted:    { label: 'Scheduled',     bg: '#b6d0ff', text: '#3f5882' },
  in_progress: { label: 'In Progress',   bg: '#9ff5c1', text: '#005231' },
  completed:   { label: 'Completed',     bg: '#e9e7eb', text: '#43474e' },
  cancelled:   { label: 'Cancelled',     bg: '#ffdad6', text: '#93000a' },
};

const formatDate = (iso: string | null): string => {
  if (!iso) return 'No date set';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

// ─── Job card ─────────────────────────────────────────────────────────────────
interface JobCardProps {
  job: Job;
  onPress: () => void;
}

const JobCard = ({ job, onPress }: JobCardProps) => {
  const status = STATUS_CONFIG[job.status];
  const catConfig = CATEGORY_ICONS[job.category] ?? CATEGORY_ICONS.General;

  const applications = (job as Job & {
    job_applications?: Array<{
      status: string;
      handyman: { id: string; full_name: string | null } | null;
    }>;
  }).job_applications ?? [];

  const acceptedApp = applications.find(a => a.status === 'accepted');
  const handymanName = acceptedApp?.handyman?.full_name ?? null;
  const handymanInitials = handymanName
    ? handymanName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : null;

  const isOpen = job.status === 'open';

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface-container-lowest rounded-xl p-6 mb-5"
      style={({ pressed }) => ({
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
        shadowColor: '#1a1c1e',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      })}
    >
      {/* Top row */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row gap-x-4 flex-1 mr-3">
          <View
            className="w-14 h-14 rounded-lg items-center justify-center"
            style={{ backgroundColor: catConfig.bg }}
          >
            <Ionicons
              name={catConfig.icon as keyof typeof Ionicons.glyphMap}
              size={28}
              color="#703700"
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-on-surface leading-tight" numberOfLines={2}>
              {job.title}
            </Text>
            <View className="flex-row items-center gap-x-1.5 mt-1">
              <Ionicons name="calendar-outline" size={13} color="#43474e" />
              <Text className="text-sm text-on-surface-variant font-medium">
                {formatDate(job.scheduled_start)}
              </Text>
            </View>
          </View>
        </View>
        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: status.bg }}>
          <Text className="text-xs font-extrabold uppercase tracking-wider" style={{ color: status.text }}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-surface-container mb-4" />

      {/* Bottom row */}
      <View className="flex-row items-center justify-between">
        {handymanName ? (
          <View className="flex-row items-center gap-x-3">
            <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center">
              <Text className="text-xs font-extrabold text-white">{handymanInitials}</Text>
            </View>
            <View>
              <Text className="text-xs text-on-surface-variant font-medium leading-none mb-1">
                Assigned Pro
              </Text>
              <Text className="text-sm font-extrabold text-on-surface">{handymanName}</Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-x-3">
            <View className="w-8 h-8 rounded-full bg-surface-container items-center justify-center">
              <Ionicons name="search-outline" size={16} color="#43474e" />
            </View>
            <View>
              <Text className="text-xs text-on-surface-variant font-medium leading-none mb-1">
                Searching...
              </Text>
              <Text className="text-sm font-extrabold text-on-surface">Assigning soon</Text>
            </View>
          </View>
        )}

        <Pressable
          className="px-6 py-2 rounded-full"
          style={({ pressed }) => ({
            backgroundColor: isOpen ? '#f4f3f7' : '#371800',
            opacity: pressed ? 0.85 : 1,
            shadowColor: '#371800',
            shadowOpacity: isOpen ? 0 : 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: isOpen ? 0 : 3,
          })}
          onPress={onPress}
        >
          <Text className="text-sm font-extrabold" style={{ color: isOpen ? '#1a1c1e' : '#ffffff' }}>
            {isOpen ? 'Details' : 'Manage'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ tab }: { tab: 'active' | 'past' }) => (
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
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
type Tab = 'active' | 'past';

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const { activeJobs, pastJobs, isLoading, error, refetch } = useClientJobs();
  const { profile } = useProfile();

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
          <Pressable
            className="w-10 h-10 rounded-full bg-surface-container-low items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color="#371800" />
          </Pressable>
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
            <EmptyState tab={activeTab} />
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => navigation.navigate('JobProgress', { jobId: job.id })}
              />
            ))
          )}
        </ScrollView>
      )}

    </SafeAreaView>
  );
};

export default DashboardScreen;
