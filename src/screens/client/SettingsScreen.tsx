import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { ClientTabParamList, ClientStackParamList } from '@/types/navigation';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'Settings'>,
  NativeStackNavigationProp<ClientStackParamList>
>;
interface SettingsScreenProps { navigation: SettingsScreenNavigationProp; }

// ─── Section header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  trailing?: React.ReactNode;
}
const SectionHeader = ({ icon, title, trailing }: SectionHeaderProps) => (
  <View className="flex-row items-center justify-between mb-4 mt-6 first:mt-0">
    <View className="flex-row items-center gap-x-3">
      <Ionicons name={icon} size={22} color="#371800" />
      <Text className="text-xl font-extrabold text-primary tracking-tight">{title}</Text>
    </View>
    {trailing}
  </View>
);

// ─── Account row ──────────────────────────────────────────────────────────────
interface AccountRowProps {
  label: string;
  value: string;
  onPress?: () => void;
  isFirst?: boolean;
}
const AccountRow = ({ label, value, onPress, isFirst }: AccountRowProps) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
    <View
      className={`px-5 py-4 flex-row items-center justify-between ${
        isFirst ? '' : 'border-t border-outline-variant/30'
      }`}
    >
      <View className="flex-1 mr-3">
        <Text className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
          {label}
        </Text>
        <Text className="text-base font-semibold text-on-surface" numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#74777f" />
    </View>
  </Pressable>
);

// ─── Toggle row ───────────────────────────────────────────────────────────────
interface ToggleRowProps {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isFirst?: boolean;
}
const ToggleRow = ({ title, subtitle, value, onValueChange, isFirst }: ToggleRowProps) => (
  <View
    className={`px-5 py-4 flex-row items-center justify-between ${
      isFirst ? '' : 'border-t border-outline-variant/30'
    }`}
  >
    <View className="flex-1 mr-4">
      <Text className="text-base font-semibold text-on-surface">{title}</Text>
      <Text className="text-xs text-on-surface-variant mt-0.5">{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#c4c6cf', true: '#572900' }}
      thumbColor="#ffffff"
      ios_backgroundColor="#c4c6cf"
    />
  </View>
);

// ─── Security card ────────────────────────────────────────────────────────────
interface SecurityCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress?: () => void;
}
const SecurityCard = ({ icon, title, body, onPress }: SecurityCardProps) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })} className="flex-1">
    <View className="bg-surface-container-low rounded-xl p-5">
      <Ionicons name={icon} size={22} color="#371800" />
      <Text className="text-base font-extrabold text-on-surface mt-3">{title}</Text>
      <Text className="text-xs text-on-surface-variant mt-1 leading-relaxed">{body}</Text>
    </View>
  </Pressable>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { preferences, setPreference } = useNotificationPreferences();

  const [isSigningOut, setIsSigningOut] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const email = profile?.email ?? user?.email ?? '—';
  const displayName = profile?.full_name ?? email.split('@')[0] ?? 'User';
  const phone = profile?.phone ?? 'Not set';

  const goToEditProfile = () => navigation.navigate('EditProfile');

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View className="mb-8 mt-2">
          <Text className="text-4xl font-extrabold text-primary tracking-tight">Settings</Text>
          <Text className="text-on-surface-variant text-base mt-1">
            Manage your account preferences and security
          </Text>
        </View>

        {/* Account */}
        <SectionHeader icon="person-outline" title="Account" />
        <View className="bg-surface-container-low rounded-xl overflow-hidden">
          <AccountRow label="Full Name" value={displayName} onPress={goToEditProfile} isFirst />
          <AccountRow label="Email Address" value={email} />
          <AccountRow label="Phone Number" value={phone} onPress={goToEditProfile} />
          <AccountRow label="Password" value="••••••••••••" />
        </View>

        {/* Notifications */}
        <SectionHeader icon="notifications-outline" title="Notifications" />
        <View className="bg-surface-container-low rounded-xl overflow-hidden">
          <ToggleRow
            title="Push Notifications"
            subtitle="Job alerts and service updates"
            value={preferences?.notif_push ?? true}
            onValueChange={(v) => setPreference('notif_push', v)}
            isFirst
          />
          <ToggleRow
            title="Email Marketing"
            subtitle="Newsletters and special offers"
            value={preferences?.notif_email_marketing ?? false}
            onValueChange={(v) => setPreference('notif_email_marketing', v)}
          />
          <ToggleRow
            title="SMS Alerts"
            subtitle="Immediate scheduling notifications"
            value={preferences?.notif_sms ?? true}
            onValueChange={(v) => setPreference('notif_sms', v)}
          />
        </View>

        {/* Privacy & Security */}
        <SectionHeader icon="shield-checkmark-outline" title="Privacy & Security" />
        <View className="flex-row gap-x-3">
          <SecurityCard
            icon="lock-closed-outline"
            title="Two-Factor Auth"
            body="Add an extra layer of security to your account."
          />
          <SecurityCard
            icon="eye-outline"
            title="Data Sharing"
            body="Control what information is shared with service partners."
          />
        </View>

        {/* Logout */}
        <Pressable
          className="w-full py-5 rounded-xl bg-error-container/60 flex-row items-center justify-center gap-x-2 mt-8"
          style={({ pressed }) => ({ opacity: pressed || isSigningOut ? 0.75 : 1 })}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#93000a" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#93000a" />
              <Text className="text-on-error-container font-extrabold text-base">
                Logout from Reliant Home
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
