import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useHandymanJobs } from '@/hooks/useHandymanJobs';
import { useSearchRadius, RADIUS_OPTIONS, RadiusOption } from '@/hooks/useSearchRadius';
import { getInitials } from '@/utils/format';
import { HandymanStackParamList, HandymanTabParamList } from '@/types/navigation';

type HandymanProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<HandymanTabParamList, 'Profile'>,
  NativeStackNavigationProp<HandymanStackParamList>
>;
interface HandymanProfileScreenProps { navigation: HandymanProfileNavigationProp; }

const formatCurrency = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCompact = (n: number): string =>
  `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

// ─── Screen ───────────────────────────────────────────────────────────────────
const HandymanProfileScreen = ({ navigation }: HandymanProfileScreenProps) => {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const { activeJobs, appliedJobs, pastJobs, refetch: refetchJobs } = useHandymanJobs();
  const { radiusKm, setRadiusKm } = useSearchRadius();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useFocusEffect(useCallback(() => {
    refetchProfile();
    refetchJobs();
  }, [refetchProfile, refetchJobs]));

  const email = profile?.email ?? user?.email ?? '';
  const displayName = profile?.full_name ?? email.split('@')[0] ?? 'Pro';
  const initials = getInitials(displayName);

  // Derive earnings + counts from real job rows.
  const stats = useMemo(() => {
    const completed = pastJobs.filter((j) => j.status === 'completed');
    const totalEarnings = completed.reduce((sum, j) => sum + (j.payout ?? 0), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEarnings = completed
      .filter((j) => new Date(j.created_at) >= monthStart)
      .reduce((sum, j) => sum + (j.payout ?? 0), 0);

    return {
      totalEarnings,
      monthEarnings,
      completedCount: completed.length,
      activeCount: activeJobs.length + appliedJobs.length,
    };
  }, [pastJobs, activeJobs.length, appliedJobs.length]);

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
          <View
            className="w-32 h-32 rounded-xl bg-on-tertiary-fixed-variant items-center justify-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
          >
            <Text className="text-tertiary-fixed text-4xl font-extrabold">{initials}</Text>
          </View>

          <View className="items-center gap-y-1">
            <Text className="text-3xl font-extrabold text-on-surface tracking-tight">{displayName}</Text>
            <Text className="text-sm font-medium text-on-surface-variant">
              {stats.completedCount === 0
                ? 'No completed jobs yet'
                : `${stats.completedCount} ${stats.completedCount === 1 ? 'project' : 'projects'} completed`}
            </Text>
          </View>
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
                  className="flex-1"
                  onPress={() => setRadiusKm(option as RadiusOption)}
                >
                  {({ pressed }) => (
                    <View
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: isActive ? '#371800' : '#f4f3f7',
                        opacity: pressed ? 0.8 : 1,
                      }}
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
                    </View>
                  )}
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
              <Text className="text-3xl font-extrabold text-white mt-1">
                {formatCurrency(stats.totalEarnings)}
              </Text>
            </View>
            <View
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Ionicons name="cash-outline" size={28} color="#ffffff" />
            </View>
          </View>

          {/* Two-column row */}
          <View className="flex-row gap-x-3">
            <View className="flex-1 bg-surface-container-high p-5 rounded-xl">
              <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">This Month</Text>
              <Text className="text-xl font-extrabold text-on-surface mt-1">
                {formatCompact(stats.monthEarnings)}
              </Text>
            </View>
            <View className="flex-1 bg-surface-container-high p-5 rounded-xl">
              <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Active Leads</Text>
              <Text className="text-xl font-extrabold text-on-surface mt-1">
                {stats.activeCount}
              </Text>
            </View>
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
