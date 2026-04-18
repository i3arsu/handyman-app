import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSearchRadius, RADIUS_OPTIONS, RadiusOption } from '@/hooks/useSearchRadius';
import { HandymanStackParamList, HandymanTabParamList } from '@/types/navigation';

type HandymanProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<HandymanTabParamList, 'Profile'>,
  NativeStackNavigationProp<HandymanStackParamList>
>;
interface HandymanProfileScreenProps { navigation: HandymanProfileNavigationProp; }

const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';

// ─── Skill pill ───────────────────────────────────────────────────────────────
interface SkillPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}
const SkillPill = ({ icon, label }: SkillPillProps) => (
  <View
    className="bg-surface-container-lowest px-5 py-3 rounded-xl flex-row items-center gap-x-3"
    style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
  >
    <Ionicons name={icon} size={18} color="#3f5882" />
    <Text className="font-medium text-sm text-on-surface">{label}</Text>
  </View>
);

// ─── Review card ──────────────────────────────────────────────────────────────
interface ReviewCardProps {
  author: string;
  initials: string;
  avatarColor: string;
  text: string;
  timeAgo: string;
  align: 'left' | 'right';
}
const ReviewCard = ({ author, initials, avatarColor, text, timeAgo, align }: ReviewCardProps) => (
  <View style={{ marginLeft: align === 'left' ? 16 : 0, marginRight: align === 'right' ? 16 : 0 }}>
    <View className="bg-surface-container-low p-6 rounded-xl relative">
      {/* Floating avatar */}
      <View
        style={{
          position: 'absolute',
          top: 24,
          left: align === 'left' ? -20 : undefined,
          right: align === 'right' ? -20 : undefined,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: avatarColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: '#faf9fd',
          zIndex: 1,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{initials}</Text>
      </View>

      <View style={{ marginLeft: align === 'left' ? 20 : 0, marginRight: align === 'right' ? 20 : 0 }}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-extrabold text-on-surface">{align === 'right' ? '' : author}</Text>
          <Text className="text-xs font-bold text-outline uppercase">{align === 'left' ? timeAgo : author}</Text>
        </View>
        <Text
          className="text-sm text-on-surface-variant leading-relaxed"
          style={{ fontStyle: 'italic', textAlign: align === 'right' ? 'right' : 'left' }}
        >
          {text}
        </Text>
      </View>
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const HandymanProfileScreen = ({ navigation }: HandymanProfileScreenProps) => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { radiusKm, setRadiusKm } = useSearchRadius();
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const email = profile?.email ?? user?.email ?? '';
  const displayName = profile?.full_name ?? email.split('@')[0] ?? 'Pro';
  const initials = getInitials(displayName);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text className="text-lg font-extrabold text-primary tracking-tight">Profile</Text>
        <Pressable
          className="p-2 rounded-full"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: pressed ? '#efedf1' : 'transparent' })}
          onPress={() => navigation.navigate('EditProfile')}
          accessibilityLabel="Edit profile"
        >
          <Ionicons name="create-outline" size={22} color="#371800" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar hero */}
        <View className="items-center mb-8 mt-2 gap-y-4">
          <View className="relative">
            <View
              className="w-32 h-32 rounded-xl bg-on-tertiary-fixed-variant items-center justify-center"
              style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
            >
              <Text className="text-tertiary-fixed text-4xl font-extrabold">{initials}</Text>
            </View>
            {/* VERIFIED badge */}
            <View
              className="absolute -bottom-2 -right-2 bg-tertiary-fixed px-3 py-1 rounded-full flex-row items-center gap-x-1"
              style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
            >
              <Ionicons name="checkmark-circle" size={12} color="#005231" />
              <Text className="text-on-tertiary-fixed-variant text-xs font-extrabold">VERIFIED</Text>
            </View>
          </View>

          <View className="items-center gap-y-1">
            <Text className="text-3xl font-extrabold text-on-surface tracking-tight">{displayName}</Text>
            <View className="flex-row items-center gap-x-2">
              <View className="flex-row items-center gap-x-1">
                <Ionicons name="star" size={14} color="#e98633" />
                <Text className="text-sm font-extrabold text-on-primary-container">4.9</Text>
              </View>
              <Text className="text-outline-variant">•</Text>
              <Text className="text-sm font-medium text-on-surface-variant">128 Projects Completed</Text>
            </View>
          </View>

          {/* Availability toggle */}
          <Pressable
            className="bg-surface-container-low px-6 py-3 rounded-full flex-row items-center justify-between w-full"
            onPress={() => setIsAvailable(v => !v)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text className="text-sm font-semibold text-on-surface-variant">Accepting New Work</Text>
            <View
              className="w-12 h-6 rounded-full relative"
              style={{ backgroundColor: isAvailable ? '#9ff5c1' : '#c4c6cf' }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  left: isAvailable ? undefined : 4,
                  right: isAvailable ? 4 : undefined,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                }}
              />
            </View>
          </Pressable>
        </View>

        {/* Job Search Radius */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-x-2">
              <Ionicons name="locate-outline" size={18} color="#371800" />
              <Text className="text-base font-extrabold text-on-surface">Job Search Radius</Text>
            </View>
            <Text className="text-sm font-bold text-primary">{radiusKm} km</Text>
          </View>
          <View className="flex-row gap-x-2">
            {RADIUS_OPTIONS.map((option) => {
              const isActive = option === radiusKm;
              return (
                <Pressable
                  key={option}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={({ pressed }) => ({
                    backgroundColor: isActive ? '#371800' : '#f4f3f7',
                    opacity: pressed ? 0.8 : 1,
                  })}
                  onPress={() => setRadiusKm(option as RadiusOption)}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: isActive ? '#ffffff' : '#43474e' }}
                  >
                    {option}
                  </Text>
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#74777f' }}
                  >
                    km
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Earnings bento grid */}
        <View className="gap-y-3 mb-8">
          {/* Total earnings — full width */}
          <View
            className="bg-primary p-6 rounded-xl flex-row justify-between items-center overflow-hidden"
            style={{ shadowColor: '#371800', shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 }}
          >
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-white opacity-70">Total Earnings</Text>
              <Text className="text-3xl font-extrabold text-white mt-1">$14,280.50</Text>
            </View>
            <View
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Ionicons name="card-outline" size={28} color="#ffffff" />
            </View>
          </View>

          {/* Two-column row */}
          <View className="flex-row gap-x-3">
            <View className="flex-1 bg-surface-container-high p-5 rounded-xl">
              <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">This Month</Text>
              <Text className="text-xl font-extrabold text-on-surface mt-1">$3,120</Text>
            </View>
            <View className="flex-1 bg-surface-container-high p-5 rounded-xl">
              <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Active Leads</Text>
              <Text className="text-xl font-extrabold text-on-surface mt-1">12</Text>
            </View>
          </View>
        </View>

        {/* Skills & Services */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-extrabold tracking-tight text-on-surface">Skills & Services</Text>
            <Pressable
              className="px-4 py-1 rounded-full bg-primary-fixed"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-sm font-extrabold text-on-primary-fixed-variant">Edit</Text>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <SkillPill icon="water-outline" label="Plumbing" />
            <SkillPill icon="flash-outline" label="Electrical" />
            <SkillPill icon="hammer-outline" label="Carpentry" />
            <SkillPill icon="brush-outline" label="Interior Painting" />
          </View>
        </View>

        {/* Tools & Equipment */}
        <View
          className="p-8 rounded-xl mb-8"
          style={{ backgroundColor: 'rgba(214, 227, 255, 0.3)' }}
        >
          <Text className="text-xl font-extrabold tracking-tight text-on-surface mb-1">Tools & Equipment</Text>
          <Text className="text-sm text-on-surface-variant mb-5">Fully equipped for heavy-duty residential tasks.</Text>
          <View className="gap-y-4">
            {[
              { title: 'Pro-Grade Power Suite', sub: 'Drills, circular saws, and sanders by Milwaukee.' },
              { title: 'Diagnostic Tools', sub: 'Thermal imaging and circuit testing equipment.' },
              { title: 'Service Truck', sub: 'Full stock of plumbing joints and electrical fixtures.' },
            ].map((item) => (
              <View key={item.title} className="flex-row items-start gap-x-4">
                <View className="w-2 h-2 rounded-full bg-on-surface mt-1.5" />
                <View className="flex-1">
                  <Text className="font-extrabold text-sm text-on-surface">{item.title}</Text>
                  <Text className="text-xs text-on-surface-variant mt-0.5">{item.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Client Feedback */}
        <View className="mb-8">
          <Text className="text-xl font-extrabold tracking-tight text-on-surface mb-6">
            Recent Client Feedback
          </Text>
          <View className="gap-y-5">
            <ReviewCard
              align="left"
              author="Sarah Jenkins"
              initials="SJ"
              avatarColor="#455f88"
              timeAgo="2 Days Ago"
              text='"Marcus fixed our leaking pipe in record time. Very professional and left the kitchen cleaner than he found it!"'
            />
            <ReviewCard
              align="right"
              author="David Thorne"
              initials="DT"
              avatarColor="#371800"
              timeAgo=""
              text='"Excellent craftsmanship on the custom shelving units. High attention to detail."'
            />
          </View>
        </View>

        {/* Logout */}
        <Pressable
          className="w-full py-5 rounded-full bg-error-container flex-row items-center justify-center gap-x-2"
          style={({ pressed }) => ({ opacity: pressed || isSigningOut ? 0.75 : 1 })}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#93000a" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#93000a" />
              <Text className="text-on-error-container font-extrabold text-base">Logout</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HandymanProfileScreen;
