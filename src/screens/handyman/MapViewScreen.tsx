import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';

import BottomJobSheet from '@/components/handyman/BottomJobSheet';
import { useOpenJobs } from '@/hooks/useOpenJobs';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSearchRadius } from '@/hooks/useSearchRadius';
import { getDistanceKm } from '@/utils/geo';
import { HandymanTabParamList, HandymanStackParamList } from '@/types/navigation';
import { Job } from '@/types/database';

type MapViewScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<HandymanTabParamList, 'MapView'>,
  NativeStackNavigationProp<HandymanStackParamList>
>;

interface MapViewScreenProps {
  navigation: MapViewScreenNavigationProp;
}

// ─── Category pin styling ────────────────────────────────────────────────────
const CATEGORY_PINS: Record<string, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  Plumbing:   { icon: 'water-outline',      bg: '#455f88' },
  Electrical: { icon: 'flash-outline',       bg: '#455f88' },
  HVAC:       { icon: 'thermometer-outline', bg: '#455f88' },
  Painting:   { icon: 'brush-outline',       bg: '#455f88' },
  Locksmith:  { icon: 'key-outline',         bg: '#455f88' },
  Tiling:     { icon: 'grid-outline',        bg: '#455f88' },
  Carpentry:  { icon: 'hammer-outline',      bg: '#455f88' },
  General:    { icon: 'construct-outline',   bg: '#455f88' },
};

const SELECTED_PIN_BG = '#371800';

// Default region when location is unavailable (roughly center of US)
const DEFAULT_REGION: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

// ─── Custom marker component ─────────────────────────────────────────────────
interface JobMarkerProps {
  job: Job;
  isSelected: boolean;
}

const JobMarker = ({ job, isSelected }: JobMarkerProps) => {
  const pinConfig = CATEGORY_PINS[job.category] ?? CATEGORY_PINS.General;
  const bg = isSelected ? SELECTED_PIN_BG : pinConfig.bg;

  return (
    <View style={{ alignItems: 'center' }}>
      {isSelected && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(55,24,0,0.15)',
          }}
        />
      )}
      <View
        style={{
          padding: 8,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: 2,
          borderColor: '#ffffff',
          transform: isSelected ? [{ scale: 1.2 }] : [],
          shadowColor: bg,
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Ionicons name={pinConfig.icon} size={16} color="#ffffff" />
      </View>
    </View>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const MapViewScreen = ({ navigation }: MapViewScreenProps) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { jobs, isLoading, refetch } = useOpenJobs();
  const { location, isLoading: locationLoading, permissionDenied } = useUserLocation();
  const { radiusKm } = useSearchRadius();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useFocusEffect(useCallback(() => { refetch(); }, []));

  // Animate to user location once it resolves
  const hasCenteredOnUser = useRef(false);
  useEffect(() => {
    if (location && !hasCenteredOnUser.current && mapRef.current) {
      hasCenteredOnUser.current = true;
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        600,
      );
    }
  }, [location]);

  // Filter jobs with valid coordinates, then by proximity to user
  const mappableJobs = useMemo(() => {
    const withCoords = jobs.filter(
      (j) => j.location_lat !== null && j.location_lng !== null,
    );

    // If we don't have user location yet, show all jobs with coords
    if (!location) return withCoords;

    return withCoords.filter((j) => {
      const distance = getDistanceKm(
        location.latitude,
        location.longitude,
        j.location_lat!,
        j.location_lng!,
      );
      return distance <= radiusKm;
    });
  }, [jobs, location, radiusKm]);

  // Guard: when a marker is tapped, the map's onPress also fires on iOS.
  // We use a ref to skip the map press that immediately follows a marker press.
  const justTappedMarker = useRef(false);

  const handleMarkerPress = (job: Job) => {
    justTappedMarker.current = true;
    setSelectedJob(job);

    // Animate to the selected marker
    if (mapRef.current && job.location_lat !== null && job.location_lng !== null) {
      mapRef.current.animateToRegion(
        {
          latitude: job.location_lat,
          longitude: job.location_lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        350,
      );
    }

    // Reset after a tick so the next genuine map tap can dismiss the sheet
    setTimeout(() => {
      justTappedMarker.current = false;
    }, 300);
  };

  const handleMapPress = () => {
    if (justTappedMarker.current) return;
    setSelectedJob(null);
  };

  const handleViewDetails = () => {
    if (!selectedJob) return;
    navigation.navigate('JobInformation', {
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      jobDescription: selectedJob.description,
      jobAddress: selectedJob.address,
      locationLat: selectedJob.location_lat,
      locationLng: selectedJob.location_lng,
      category: selectedJob.category,
      isUrgent: selectedJob.is_urgent,
      payout: selectedJob.payout,
      showUpFee: selectedJob.show_up_fee,
      scheduledStart: selectedJob.scheduled_start,
      createdAt: selectedJob.created_at,
    });
  };

  const handleAccept = () => {
    if (!selectedJob) return;
    navigation.navigate('PricingRouting', {
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      jobAddress: selectedJob.address,
      category: selectedJob.category,
    });
  };

  const handleRecenter = () => {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      350,
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={!permissionDenied}
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={handleMapPress}
        mapPadding={{ top: insets.top + 120, right: 0, bottom: 200, left: 0 }}
      >
        {mappableJobs.map((job) => {
          const isSelected = selectedJob?.id === job.id;
          return (
            <Marker
              key={job.id}
              coordinate={{
                latitude: job.location_lat!,
                longitude: job.location_lng!,
              }}
              onPress={() => handleMarkerPress(job)}
              tracksViewChanges={isSelected}
            >
              <JobMarker job={job} isSelected={isSelected} />
            </Marker>
          );
        })}
      </MapView>

      {/* Header overlay */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: insets.top + 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#371800', letterSpacing: -0.5 }}>
          Reliant Home
        </Text>
        <Pressable
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: 'rgba(244,243,247,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.75 : 1,
          })}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color="#43474e" />
        </Pressable>
      </View>

      {/* View toggle pill */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: insets.top + 72,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 6,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.92)',
            shadowColor: '#1a1c1e',
            shadowOpacity: 0.08,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#371800',
              paddingHorizontal: 24,
              paddingVertical: 8,
              borderRadius: 999,
            }}
          >
            <Ionicons name="map" size={16} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>Map View</Text>
          </View>
          <Pressable
            style={({ pressed }) => ({
              paddingHorizontal: 24,
              paddingVertical: 8,
              borderRadius: 999,
              opacity: pressed ? 0.65 : 1,
            })}
            onPress={() => navigation.navigate('ListView')}
          >
            <Text style={{ color: '#43474e', fontSize: 13, fontWeight: '600' }}>List View</Text>
          </Pressable>
        </View>
      </View>

      {/* Radius badge + Recenter button */}
      <View
        style={{
          position: 'absolute',
          right: 24,
          bottom: selectedJob ? insets.bottom + 340 : insets.bottom + 100,
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Radius indicator */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            shadowColor: '#1a1c1e',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Ionicons name="locate-outline" size={14} color="#371800" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#371800' }}>
            {radiusKm} km
          </Text>
        </View>

        {/* Recenter */}
        <Pressable
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.95)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.75 : 1,
            shadowColor: '#1a1c1e',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          })}
          onPress={handleRecenter}
        >
          <Ionicons name="navigate" size={20} color="#371800" />
        </Pressable>
      </View>

      {/* Loading state */}
      {(isLoading || locationLoading) && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 148, alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              shadowColor: '#1a1c1e',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <ActivityIndicator size="small" color="#371800" />
            <Text style={{ color: '#371800', fontSize: 13, fontWeight: '600' }}>
              {locationLoading ? 'Getting your location…' : 'Loading jobs…'}
            </Text>
          </View>
        </View>
      )}

      {/* Permission denied banner */}
      {permissionDenied && !locationLoading && (
        <View
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            top: insets.top + 130,
            backgroundColor: '#ffdad6',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Ionicons name="location-outline" size={18} color="#93000a" />
          <Text style={{ flex: 1, color: '#93000a', fontSize: 13, fontWeight: '600' }}>
            Location access denied. Enable it in Settings to see nearby jobs.
          </Text>
        </View>
      )}

      {/* Bottom job sheet — shows when a marker is tapped */}
      {!isLoading && selectedJob && (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 84 }}>
          <BottomJobSheet
            key={selectedJob.id}
            job={selectedJob}
            onViewDetails={handleViewDetails}
            onAccept={handleAccept}
            onDismiss={() => setSelectedJob(null)}
          />
        </View>
      )}

      {/* No jobs state */}
      {!isLoading && !locationLoading && jobs.length === 0 && (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom + 84,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#1a1c1e',
            shadowOpacity: 0.1,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -8 },
            elevation: 12,
          }}
        >
          <Ionicons name="search-outline" size={32} color="#43474e" />
          <Text style={{ fontWeight: '800', fontSize: 16, color: '#1a1c1e', marginTop: 12 }}>
            No open jobs within {radiusKm} km
          </Text>
          <Text style={{ color: '#43474e', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            Try increasing your search radius in Profile, or check back later.
          </Text>
        </View>
      )}
    </View>
  );
};

export default MapViewScreen;
