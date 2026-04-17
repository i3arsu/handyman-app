import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ClientTabParamList } from '@/types/navigation';

type ProfileScreenNavigationProp = BottomTabNavigationProp<ClientTabParamList, 'Settings'>;
interface ProfileScreenProps { navigation: ProfileScreenNavigationProp; }

// ─── Payment row ──────────────────────────────────────────────────────────────
interface PaymentRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
}
const PaymentRow = ({ icon, iconBg, iconColor, label, sub }: PaymentRowProps) => (
  <Pressable
    className="bg-surface-container-low p-4 rounded-lg flex-row items-center gap-x-4"
    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
  >
    <View className="p-3 rounded-md" style={{ backgroundColor: iconBg }}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
    <View className="flex-1">
      <Text className="font-extrabold text-on-surface">{label}</Text>
      <Text className="text-xs text-on-surface-variant font-semibold uppercase mt-0.5">{sub}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#74777f" />
  </Pressable>
);

// ─── Address row ──────────────────────────────────────────────────────────────
interface AddressRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  address: string;
}
const AddressRow = ({ icon, iconColor, label, address }: AddressRowProps) => (
  <View className="flex-row items-start gap-x-4">
    <Ionicons name={icon} size={22} color={iconColor} style={{ marginTop: 2 }} />
    <View className="flex-1">
      <Text className="font-extrabold text-on-surface">{label}</Text>
      <Text className="text-on-surface-variant leading-relaxed mt-0.5">{address}</Text>
    </View>
  </View>
);

// ─── Settings row ─────────────────────────────────────────────────────────────
interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}
const SettingsRow = ({ icon, label }: SettingsRowProps) => (
  <Pressable
    className="w-full bg-surface-container-lowest p-6 rounded-lg flex-row items-center justify-between"
    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
  >
    <View className="flex-row items-center gap-x-4">
      <Ionicons name={icon} size={22} color="#455f88" />
      <Text className="font-extrabold text-lg text-on-surface">{label}</Text>
    </View>
    <Ionicons name="arrow-forward" size={18} color="#74777f" />
  </Pressable>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const ClientProfileScreen = ({ navigation: _navigation }: ProfileScreenProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const email = profile?.email ?? user?.email ?? '';
  const displayName = profile?.full_name ?? email.split('@')[0] ?? 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : '—';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-xl font-extrabold text-primary tracking-tight">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar hero */}
        <View className="items-center mb-10 mt-2">
          <View className="relative mb-4">
            <View
              className="w-32 h-32 rounded-xl bg-primary items-center justify-center"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <Text className="text-on-primary text-4xl font-extrabold">{initials}</Text>
            </View>
            <Pressable
              className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-full"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Ionicons name="camera-outline" size={16} color="#ffffff" />
            </Pressable>
          </View>
          <Text className="text-3xl font-extrabold text-on-surface tracking-tight">{displayName}</Text>
          <Text className="text-on-surface-variant font-medium mt-1">Premium Member since {memberYear}</Text>
        </View>

        {/* Payment Methods */}
        <View
          className="bg-surface-container-lowest p-6 rounded-xl mb-5"
          style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
        >
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-xl font-extrabold tracking-tight text-on-surface">Payment Methods</Text>
            <Pressable className="flex-row items-center gap-x-1">
              <Ionicons name="add" size={16} color="#e98633" />
              <Text className="text-on-primary-container font-bold text-sm">Add New</Text>
            </Pressable>
          </View>
          <View className="gap-y-3">
            <PaymentRow
              icon="card-outline"
              iconBg="#572900"
              iconColor="#e98633"
              label="•••• •••• •••• 4242"
              sub="Expires 12/26"
            />
            <PaymentRow
              icon="wallet-outline"
              iconBg="#b6d0ff"
              iconColor="#3f5882"
              label="Apple Pay"
              sub="Default Method"
            />
          </View>
        </View>

        {/* Address Book */}
        <View className="bg-surface-container p-6 rounded-xl mb-5">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-xl font-extrabold tracking-tight text-on-surface">Address Book</Text>
            <Ionicons name="home-outline" size={20} color="#43474e" />
          </View>
          <View className="gap-y-5">
            <AddressRow
              icon="location-outline"
              iconColor="#371800"
              label="Home"
              address={'2482 Oakwood Ave, Suite 4B\nSan Francisco, CA 94110'}
            />
            <AddressRow
              icon="briefcase-outline"
              iconColor="#43474e"
              label="Office"
              address={'555 Market Street, 12th Floor\nSan Francisco, CA 94105'}
            />
          </View>
        </View>

        {/* Settings rows */}
        <View className="gap-y-3 mb-6">
          <SettingsRow icon="help-circle-outline" label="Help & Support" />
          <SettingsRow icon="shield-checkmark-outline" label="Account Settings" />
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

export default ClientProfileScreen;
