import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useOpenJobs } from '@/hooks/useOpenJobs';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSearchRadius } from '@/hooks/useSearchRadius';
import { getDistanceKm } from '@/utils/geo';
import { HandymanStackParamList } from '@/types/navigation';
import { Job } from '@/types/database';

type ListViewScreenNavigationProp = NativeStackNavigationProp<HandymanStackParamList, 'ListView'>;

interface ListViewScreenProps {
  navigation: ListViewScreenNavigationProp;
}

// ─── Category icon map ────────────────────────────────────────────────────────
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

const formatDate = (iso: string | null): string => {
  if (!iso) return 'Flexible';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

// ─── Job card ─────────────────────────────────────────────────────────────────
interface JobCardProps {
  job: Job;
  onPress: () => void;
  onAccept: () => void;
}

const JobCard = ({ job, onPress, onAccept }: JobCardProps) => {
  const catConfig = CATEGORY_ICONS[job.category] ?? CATEGORY_ICONS.General;

  return (
    <Pressable
      className="bg-surface-container-lowest rounded-xl p-5 mb-3"
      style={({ pressed }) => ({
        opacity: pressed ? 0.95 : 1,
        shadowColor: '#1a1c1e',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      })}
      onPress={onPress}
    >
      {/* Top row: icon + title + payout */}
      <View className="flex-row items-start gap-x-4 mb-3">
        <View
          className="w-12 h-12 rounded-lg items-center justify-center flex-shrink-0"
          style={{ backgroundColor: catConfig.bg }}
        >
          <Ionicons name={catConfig.icon} size={22} color="#703700" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-x-2 mb-1">
            {job.is_urgent && (
              <View className="bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
                <Text className="text-on-tertiary-fixed-variant text-xs font-bold uppercase tracking-wider">
                  Urgent
                </Text>
              </View>
            )}
            <Text className="text-on-surface-variant text-xs font-semibold">{job.category}</Text>
          </View>
          <Text className="text-on-surface font-extrabold text-base leading-tight" numberOfLines={2}>
            {job.title}
          </Text>
        </View>
        <View className="items-end flex-shrink-0">
          <Text className="text-xl font-extrabold text-on-primary-container">
            {job.payout > 0 ? `$${job.payout}` : '—'}
          </Text>
          <Text className="text-xs text-on-surface-variant">Payout</Text>
        </View>
      </View>

      {/* Meta row */}
      <View className="flex-row items-center gap-x-4 mb-4">
        {job.address ? (
          <View className="flex-row items-center gap-x-1 flex-1">
            <Ionicons name="location-outline" size={13} color="#43474e" />
            <Text className="text-on-surface-variant text-xs" numberOfLines={1}>{job.address}</Text>
          </View>
        ) : null}
        <View className="flex-row items-center gap-x-1">
          <Ionicons name="time-outline" size={13} color="#43474e" />
          <Text className="text-on-surface-variant text-xs">{formatDate(job.scheduled_start)}</Text>
        </View>
      </View>

      {/* Action row */}
      <View className="flex-row gap-x-3">
        <Pressable
          className="flex-1 py-3 rounded-full items-center justify-center bg-surface-container-high"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={onPress}
        >
          <Text className="text-on-surface font-bold text-sm">View Details</Text>
        </Pressable>
        <Pressable
          className="flex-1 py-3 rounded-full items-center justify-center"
          style={({ pressed }) => ({
            backgroundColor: '#371800',
            opacity: pressed ? 0.85 : 1,
            shadowColor: '#371800',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          })}
          onPress={onAccept}
        >
          <Text className="text-on-primary font-extrabold text-sm">Accept</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View className="items-center py-20 px-8">
    <View className="w-16 h-16 rounded-full bg-surface-container-low items-center justify-center mb-4">
      <Ionicons name="construct-outline" size={28} color="#43474e" />
    </View>
    <Text className="text-on-surface font-extrabold text-lg text-center">No open jobs</Text>
    <Text className="text-on-surface-variant text-sm text-center mt-2 leading-relaxed">
      New jobs from clients in your area will appear here.
    </Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const ListViewScreen = ({ navigation }: ListViewScreenProps) => {
  const { jobs, isLoading, error, refetch } = useOpenJobs();
  const { location } = useUserLocation();
  const { radiusKm } = useSearchRadius();

  useFocusEffect(useCallback(() => { refetch(); }, []));

  const filteredJobs = useMemo(() => {
    if (!location) return jobs;
    return jobs.filter((j) => {
      if (j.location_lat === null || j.location_lng === null) return true;
      return getDistanceKm(
        location.latitude,
        location.longitude,
        j.location_lat,
        j.location_lng,
      ) <= radiusKm;
    });
  }, [jobs, location, radiusKm]);

  const handleViewDetails = (job: Job) => {
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

  const handleAccept = (job: Job) => {
    navigation.navigate('PricingRouting', {
      jobId: job.id,
      jobTitle: job.title,
      jobAddress: job.address,
      category: job.category,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">

      {/* App bar */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
        <View className="flex-row items-center gap-x-3">
          <View className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center">
            <Ionicons name="location-outline" size={20} color="#371800" />
          </View>
          <Text className="text-xl font-extrabold text-primary tracking-tight">Reliant Home</Text>
        </View>
        <Pressable
          className="w-10 h-10 rounded-full bg-surface-container-low items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="notifications-outline" size={20} color="#43474e" />
        </Pressable>
      </View>

      {/* View toggle pill */}
      <View className="items-center mb-5">
        <View
          className="flex-row items-center gap-x-1 px-1.5 py-1.5 rounded-full bg-surface-container-lowest"
          style={{
            shadowColor: '#1a1c1e',
            shadowOpacity: 0.08,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Pressable
            className="flex-row items-center gap-x-2 px-6 py-2 rounded-full"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="map-outline" size={16} color="#43474e" />
            <Text className="text-on-surface-variant text-sm font-semibold">Map View</Text>
          </Pressable>
          <View className="flex-row items-center gap-x-2 bg-primary px-6 py-2 rounded-full">
            <Ionicons name="list" size={16} color="#ffffff" />
            <Text className="text-on-primary text-sm font-extrabold">List View</Text>
          </View>
        </View>
      </View>

      {/* Section header */}
      {!isLoading && !error && filteredJobs.length > 0 && (
        <View className="px-6 mb-4">
          <Text className="text-2xl font-extrabold text-on-surface">Open Jobs</Text>
          <Text className="text-on-surface-variant text-sm mt-1">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} within {radiusKm} km
          </Text>
        </View>
      )}

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
          {filteredJobs.length === 0 ? (
            <EmptyState />
          ) : (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => handleViewDetails(job)}
                onAccept={() => handleAccept(job)}
              />
            ))
          )}
        </ScrollView>
      )}

    </SafeAreaView>
  );
};

export default ListViewScreen;
