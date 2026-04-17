import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { HandymanStackParamList } from '@/types/navigation';

type PricingRoutingScreenNavigationProp = NativeStackNavigationProp<HandymanStackParamList, 'PricingRouting'>;
type PricingRoutingScreenRouteProp = RouteProp<HandymanStackParamList, 'PricingRouting'>;

interface PricingRoutingScreenProps {
  navigation: PricingRoutingScreenNavigationProp;
  route: PricingRoutingScreenRouteProp;
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

// ─── Map canvas placeholder ───────────────────────────────────────────────────
const MapCanvas = ({ address }: { address: string | null }) => (
  <View
    className="rounded-xl overflow-hidden"
    style={{ height: 220 }}
  >
    {/* Grid background */}
    <View className="flex-1 bg-surface-container-high">
      {[20, 40, 60, 80].map((pct) => (
        <View
          key={`h${pct}`}
          style={{ position: 'absolute', top: `${pct}%`, left: 0, right: 0, height: 1, backgroundColor: 'rgba(196,198,207,0.4)' }}
        />
      ))}
      {[20, 40, 60, 80].map((pct) => (
        <View
          key={`v${pct}`}
          style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(196,198,207,0.4)' }}
        />
      ))}
      {/* Roads */}
      <View style={{ position: 'absolute', top: '35%', left: '5%', width: '90%', height: 7, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 4 }} />
      <View style={{ position: 'absolute', top: '55%', left: '30%', width: '60%', height: 7, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 4 }} />
      <View style={{ position: 'absolute', top: '15%', left: '60%', width: 7, height: '50%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 4 }} />

      {/* Route line */}
      <View style={{ position: 'absolute', top: '34%', left: '15%', width: '45%', height: 9, backgroundColor: 'rgba(55,24,0,0.25)', borderRadius: 5 }} />

      {/* Destination pin */}
      <View style={{ position: 'absolute', top: '20%', left: '55%' }}>
        <View style={{ position: 'absolute', top: -6, left: -6, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(55,24,0,0.12)' }} />
        <View style={{ padding: 8, borderRadius: 999, backgroundColor: '#371800', borderWidth: 2, borderColor: '#ffffff', shadowColor: '#371800', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 }}>
          <Ionicons name="home" size={14} color="#ffffff" />
        </View>
      </View>

      {/* You pin */}
      <View style={{ position: 'absolute', top: '32%', left: '13%' }}>
        <View style={{ padding: 7, borderRadius: 999, backgroundColor: '#455f88', borderWidth: 2, borderColor: '#ffffff', shadowColor: '#455f88', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 }}>
          <Ionicons name="navigate" size={13} color="#ffffff" />
        </View>
      </View>
    </View>

    {/* ETA chip */}
    <View
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        shadowColor: '#1a1c1e',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}
    >
      <Ionicons name="navigate-outline" size={14} color="#455f88" />
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1c1e' }}>ETA shown after acceptance</Text>
    </View>

    {/* Destination card */}
    {address ? (
      <View
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          shadowColor: '#1a1c1e',
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <View className="w-10 h-10 rounded-full bg-secondary-container items-center justify-center">
          <Ionicons name="home-outline" size={18} color="#3f5882" />
        </View>
        <View className="flex-1">
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#43474e', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Destination
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1c1e' }} numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>
    ) : null}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const PricingRoutingScreen = ({ navigation, route }: PricingRoutingScreenProps) => {
  const { user } = useAuth();
  const { jobId, jobTitle, jobAddress, category } = route.params;

  const [estimate, setEstimate] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const catConfig = CATEGORY_ICONS[category ?? 'General'] ?? CATEGORY_ICONS.General;
  const estimateNum = parseFloat(estimate);
  const isValid = !isNaN(estimateNum) && estimateNum > 0;

  const handleConfirm = async () => {
    if (!user || !isValid) return;

    setIsConfirming(true);

    try {
      // Insert job application marking this handyman as accepted
      const { error: appError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          handyman_id: user.id,
          status: 'accepted',
        });

      if (appError) {
        // Ignore unique constraint violation — handyman already applied
        if (appError.code !== '23505') {
          Alert.alert('Error', appError.message ?? 'Failed to submit application.');
          return;
        }
      }

      // Update the job: mark as accepted, assign this handyman, store price in payout
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          status: 'accepted',
          handyman_id: user.id,
          payout: estimateNum,
        })
        .eq('id', jobId);

      if (jobError) {
        Alert.alert('Error', jobError.message ?? 'Failed to update job.');
        return;
      }

      // Navigate back to the Tabs root — job is now accepted
      navigation.navigate('Tabs');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center gap-x-3">
            <Pressable
              className="p-2 rounded-full"
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                backgroundColor: pressed ? '#efedf1' : 'transparent',
              })}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#371800" />
            </Pressable>
            <Text className="text-lg font-extrabold text-primary tracking-tight">Reliant Home</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Map routing section */}
          <MapCanvas address={jobAddress} />

          <View className="h-6" />

          {/* Pricing form */}
          <View
            className="bg-surface-container-low rounded-xl p-6 mb-5"
            style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}
          >
            <Text className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">
              Price Estimate
            </Text>
            <Text className="text-on-surface-variant text-sm mb-5 leading-relaxed">
              Provide a ballpark figure for the client's approval before starting the commute.
            </Text>

            {/* Minimum show-up fee badge */}
            <View className="flex-row items-center gap-x-3 bg-tertiary-fixed px-4 py-3 rounded-full mb-5">
              <Ionicons name="shield-checkmark" size={18} color="#005231" />
              <Text className="text-sm font-bold text-on-tertiary-fixed-variant">
                Minimum Show-Up Fee ($50)
              </Text>
            </View>

            {/* Estimate input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-on-surface-variant mb-2 ml-1">
                Estimated Job Cost ($)
              </Text>
              <View
                className="flex-row items-center bg-surface-container-highest rounded-xl overflow-hidden"
                style={{ paddingHorizontal: 20, paddingVertical: 4 }}
              >
                <Text className="text-2xl font-extrabold text-on-surface-variant mr-1">$</Text>
                <TextInput
                  className="flex-1 text-2xl font-extrabold text-on-surface"
                  style={{ paddingVertical: 16 }}
                  value={estimate}
                  onChangeText={setEstimate}
                  placeholder="0.00"
                  placeholderTextColor="#74777f"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Info notice */}
            <View
              className="bg-surface-container-lowest rounded-xl p-4 flex-row items-start gap-x-3"
            >
              <Ionicons name="information-circle-outline" size={18} color="#e98633" style={{ marginTop: 1 }} />
              <Text className="text-xs text-on-surface-variant leading-relaxed flex-1">
                Final billing will occur on-site. This estimate helps the client manage expectations and ensures you are compensated for your travel.
              </Text>
            </View>
          </View>

          {/* Job summary */}
          <View
            className="bg-surface rounded-xl p-6 mb-5"
            style={{
              borderTopWidth: 2,
              borderTopColor: '#efedf1',
              shadowColor: '#1a1c1e',
              shadowOpacity: 0.02,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Job Summary
              </Text>
              <Text className="text-xs font-medium text-secondary">
                ID: #{jobId.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View className="flex-row items-center gap-x-4">
              <View
                className="w-12 h-12 rounded-lg items-center justify-center flex-shrink-0"
                style={{ backgroundColor: catConfig.bg }}
              >
                <Ionicons name={catConfig.icon} size={22} color="#703700" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-on-surface" numberOfLines={2}>
                  {jobTitle}
                </Text>
                {jobAddress ? (
                  <Text className="text-sm text-on-surface-variant mt-0.5" numberOfLines={1}>
                    {jobAddress}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom action bar */}
        <View
          className="px-6 pb-8 pt-4 bg-surface"
          style={{
            shadowColor: '#1a1c1e',
            shadowOpacity: 0.06,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
          }}
        >
          <Pressable
            className="w-full h-16 rounded-full flex-row items-center justify-center gap-x-3"
            style={({ pressed }) => ({
              backgroundColor: isValid ? '#371800' : '#e9e7eb',
              opacity: pressed || isConfirming ? 0.85 : 1,
              transform: [{ scale: pressed && !isConfirming ? 0.98 : 1 }],
              shadowColor: '#371800',
              shadowOpacity: isValid ? 0.3 : 0,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: isValid ? 6 : 0,
            })}
            onPress={handleConfirm}
            disabled={!isValid || isConfirming}
          >
            {isConfirming ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons
                  name="navigate"
                  size={20}
                  color={isValid ? '#ffffff' : '#74777f'}
                />
                <Text
                  className="font-extrabold text-lg"
                  style={{ color: isValid ? '#ffffff' : '#74777f' }}
                >
                  Confirm &amp; Start Navigation
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PricingRoutingScreen;
