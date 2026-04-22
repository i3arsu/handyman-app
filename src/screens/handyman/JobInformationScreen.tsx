import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { useJob } from '@/hooks/useJob';
import { HandymanStackParamList } from '@/types/navigation';
import { JobStatus } from '@/types/database';

type JobInformationNavigationProp = NativeStackNavigationProp<HandymanStackParamList, 'JobInformation'>;
type JobInformationRouteProp = RouteProp<HandymanStackParamList, 'JobInformation'>;

interface JobInformationScreenProps {
  navigation: JobInformationNavigationProp;
  route: JobInformationRouteProp;
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
    weekday: 'short', month: 'short', day: 'numeric',
  });
};

const formatTime = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
};

// ─── Directions ──────────────────────────────────────────────────────────────
const openDirections = async (lat: number, lng: number, label?: string | null) => {
  const encodedLabel = encodeURIComponent(label ?? 'Job location');
  const primary =
    Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}&q=${encodedLabel}`
      : `google.navigation:q=${lat},${lng}`;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  try {
    const supported = await Linking.canOpenURL(primary);
    await Linking.openURL(supported ? primary : fallback);
  } catch {
    Linking.openURL(fallback).catch(() => {
      Alert.alert('Unable to open maps', 'No maps app is available on this device.');
    });
  }
};

// ─── Location map ────────────────────────────────────────────────────────────
interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  showDirections: boolean;
}

const LocationMap = ({ latitude, longitude, address, showDirections }: LocationMapProps) => {
  const hasCoords = latitude !== null && longitude !== null;

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', height: 200 }}>
      {hasCoords ? (
        <MapView
          style={{ flex: 1 }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker coordinate={{ latitude, longitude }}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  padding: 10,
                  borderRadius: 999,
                  backgroundColor: '#371800',
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  shadowColor: '#371800',
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 6,
                }}
              >
                <Ionicons name="location" size={16} color="#ffffff" />
              </View>
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#e9e7eb', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="location-outline" size={32} color="#74777f" />
          <Text style={{ color: '#74777f', fontSize: 13, marginTop: 8 }}>No location set</Text>
        </View>
      )}

      {/* Address overlay */}
      {address ? (
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            backgroundColor: 'rgba(250,249,253,0.94)',
            borderRadius: 12,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Ionicons name="location-outline" size={18} color="#371800" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#43474e', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
              Service Location
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1c1e' }} numberOfLines={1}>
              {address}
            </Text>
          </View>
          {showDirections && hasCoords && (
            <Pressable
              onPress={() => openDirections(latitude, longitude, address)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#371800',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="navigate-outline" size={14} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>
                Directions
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
};

// ─── Info tile ────────────────────────────────────────────────────────────────
const InfoTile = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
  <View style={{ flex: 1, backgroundColor: '#f4f3f7', borderRadius: 16, padding: 16 }}>
    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#efedf1', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
      <Ionicons name={icon} size={16} color="#455f88" />
    </View>
    <Text style={{ fontSize: 10, fontWeight: '700', color: '#43474e', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a1c1e' }}>{value}</Text>
  </View>
);

// ─── Lifecycle CTA config ─────────────────────────────────────────────────────
interface CtaConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  nextStatus?: JobStatus;
  confirmTitle?: string;
  confirmBody?: string;
  disabled?: boolean;
}

const OWNER_CTA: Partial<Record<JobStatus, CtaConfig>> = {
  accepted: {
    label: 'Start Job',
    icon: 'play-circle-outline',
    nextStatus: 'in_progress',
    confirmTitle: 'Start this job?',
    confirmBody: 'Mark the job as in progress. The client will be notified.',
  },
  in_progress: {
    label: 'Mark Complete',
    icon: 'checkmark-circle-outline',
    nextStatus: 'completed',
    confirmTitle: 'Mark job complete?',
    confirmBody: 'This finalises the job and notifies the client.',
  },
  completed: { label: 'Job Completed', icon: 'checkmark-done-outline', disabled: true },
  cancelled: { label: 'Job Cancelled', icon: 'close-circle-outline',  disabled: true },
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const JobInformationScreen = ({ navigation, route }: JobInformationScreenProps) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    jobId,
    jobTitle,
    jobDescription,
    jobAddress,
    locationLat,
    locationLng,
    category,
    isUrgent,
    payout,
    showUpFee,
    scheduledStart,
    createdAt,
  } = route.params;

  const { job, refetch } = useJob(jobId);
  const [isUpdating, setIsUpdating] = useState(false);

  const catConfig = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.General;
  const shortId = jobId.slice(0, 8).toUpperCase();

  const isOwner = !!job && !!user && job.handyman_id === user.id;
  const hasPendingApplication =
    !!user &&
    (job?.job_applications ?? []).some(
      (a) => a.status === 'pending' && a.handyman?.id === user.id,
    );
  const ownerCta = job && isOwner ? OWNER_CTA[job.status] : undefined;

  const handleApplyFlow = () => {
    navigation.navigate('PricingRouting', {
      jobId,
      jobTitle,
      jobAddress,
      category,
    });
  };

  const handleWithdraw = () => {
    if (!user) return;
    Alert.alert(
      'Withdraw application?',
      'This removes your application from the job. You can re-apply later if it is still open.',
      [
        { text: 'Keep Application', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const { error: deleteError } = await supabase
                .from('job_applications')
                .delete()
                .eq('job_id', jobId)
                .eq('handyman_id', user.id)
                .eq('status', 'pending');

              if (deleteError) {
                Alert.alert('Error', deleteError.message);
                return;
              }

              refetch();
              navigation.goBack();
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ],
    );
  };

  const handleLifecycleTransition = (cfg: CtaConfig) => {
    if (!cfg.nextStatus) return;

    Alert.alert(cfg.confirmTitle ?? 'Confirm', cfg.confirmBody ?? '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'default',
        onPress: async () => {
          setIsUpdating(true);
          try {
            const { error: updateError } = await supabase
              .from('jobs')
              .update({ status: cfg.nextStatus })
              .eq('id', jobId);

            if (updateError) {
              Alert.alert('Error', updateError.message);
            } else {
              refetch();
            }
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#faf9fd' }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: insets.top + 8, paddingBottom: 16, gap: 12 }}>
        <Pressable
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 999,
            opacity: pressed ? 0.7 : 1,
            backgroundColor: pressed ? '#efedf1' : 'transparent',
          })}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#371800" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#371800', letterSpacing: -0.3 }}>Job Details</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {isUrgent && (
              <View style={{ backgroundColor: '#9ff5c1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ color: '#005231', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  Urgent
                </Text>
              </View>
            )}
            <Text style={{ color: '#43474e', fontSize: 11, fontWeight: '600' }}>
              Job ID: #{shortId}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: catConfig.bg,
              }}
            >
              <Ionicons name={catConfig.icon} size={24} color="#703700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#43474e', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                {category}
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#1a1c1e', lineHeight: 30, letterSpacing: -0.5 }}>
                {jobTitle}
              </Text>
            </View>
          </View>

          {/* Payout chip */}
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, backgroundColor: '#f4f3f7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginTop: 8 }}>
            <Ionicons name="cash-outline" size={16} color="#371800" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#371800' }}>
              {payout > 0 ? `$${payout} payout` : 'Quote required'}
            </Text>
            {showUpFee > 0 && (
              <Text style={{ fontSize: 11, color: '#43474e', fontWeight: '500' }}>
                + ${showUpFee} show-up
              </Text>
            )}
          </View>
        </View>

        {/* Map + location */}
        <View style={{ marginBottom: 20 }}>
          <LocationMap
            latitude={locationLat}
            longitude={locationLng}
            address={jobAddress}
            showDirections={isOwner && (job?.status === 'accepted' || job?.status === 'in_progress')}
          />
        </View>

        {/* Photos */}
        {(job?.photo_urls ?? []).length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#43474e', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              Photos
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {(job?.photo_urls ?? []).map((url) => (
                <Image
                  key={url}
                  source={{ uri: url }}
                  style={{ width: 160, height: 160, borderRadius: 12, backgroundColor: '#e9e7eb' }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Description */}
        {jobDescription ? (
          <View style={{ backgroundColor: '#f4f3f7', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#efedf1', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="document-text-outline" size={18} color="#455f88" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1a1c1e' }}>Job Description</Text>
            </View>
            <Text style={{ color: '#43474e', lineHeight: 22, fontSize: 14 }}>
              {jobDescription}
            </Text>
          </View>
        ) : null}

        {/* Schedule info tiles */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <InfoTile label="Date" value={formatDate(scheduledStart)} icon="calendar-outline" />
          <InfoTile label="Arrival" value={formatTime(scheduledStart)} icon="time-outline" />
          <InfoTile label="Posted" value={formatDate(createdAt)} icon="add-circle-outline" />
        </View>

        {/* Guarantee card */}
        <View style={{ backgroundColor: '#9ff5c1', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shield-checkmark" size={20} color="#005231" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#005231', fontSize: 14, marginBottom: 2 }}>
              Show-Up Guaranteed
            </Text>
            <Text style={{ fontSize: 12, color: '#005231', lineHeight: 18, opacity: 0.75 }}>
              You earn ${showUpFee > 0 ? showUpFee : 50} just for showing up, regardless of the outcome.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          backgroundColor: '#faf9fd',
          shadowColor: '#1a1c1e',
          shadowOpacity: 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -6 },
          elevation: 10,
        }}
      >
        {ownerCta ? (
          <Pressable
            onPress={() => !ownerCta.disabled && handleLifecycleTransition(ownerCta)}
            disabled={ownerCta.disabled || isUpdating || !ownerCta.nextStatus}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: '100%',
                  height: 56,
                  borderRadius: 9999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: ownerCta.disabled ? '#e3e2e6' : '#371800',
                  opacity: pressed && !ownerCta.disabled ? 0.85 : 1,
                  transform: [{ scale: pressed && !ownerCta.disabled ? 0.98 : 1 }],
                  shadowColor: '#371800',
                  shadowOpacity: ownerCta.disabled ? 0 : 0.3,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: ownerCta.disabled ? 0 : 6,
                }}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons
                      name={ownerCta.icon}
                      size={20}
                      color={ownerCta.disabled ? '#74777f' : '#ffffff'}
                    />
                    <Text
                      style={{
                        color: ownerCta.disabled ? '#74777f' : '#ffffff',
                        fontWeight: '800',
                        fontSize: 17,
                      }}
                    >
                      {ownerCta.label}
                    </Text>
                  </>
                )}
              </View>
            )}
          </Pressable>
        ) : hasPendingApplication ? (
          <Pressable onPress={handleWithdraw} disabled={isUpdating}>
            {({ pressed }) => (
              <View
                style={{
                  width: '100%',
                  height: 56,
                  borderRadius: 9999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  borderWidth: 1.5,
                  borderColor: '#93000a',
                  backgroundColor: pressed ? '#ffdad6' : 'transparent',
                  opacity: isUpdating ? 0.7 : 1,
                }}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#93000a" />
                ) : (
                  <>
                    <Ionicons name="arrow-undo-outline" size={18} color="#93000a" />
                    <Text style={{ color: '#93000a', fontWeight: '800', fontSize: 16 }}>
                      Withdraw Application
                    </Text>
                  </>
                )}
              </View>
            )}
          </Pressable>
        ) : job && job.status !== 'open' ? (
          <View
            style={{
              width: '100%',
              height: 56,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              backgroundColor: '#e3e2e6',
            }}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#74777f" />
            <Text style={{ color: '#74777f', fontWeight: '800', fontSize: 17 }}>
              Unavailable
            </Text>
          </View>
        ) : (
          <Pressable onPress={handleApplyFlow}>
            {({ pressed }) => (
              <View
                style={{
                  width: '100%',
                  height: 56,
                  borderRadius: 9999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: '#371800',
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: '#371800',
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 17 }}>
                  Apply for this Job
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </View>
            )}
          </Pressable>
        )}
      </View>

    </View>
  );
};

export default JobInformationScreen;
