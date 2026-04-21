import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { getErrorMessage } from '@/utils/errors';
import { PostJobStackParamList, ClientTabParamList } from '@/types/navigation';

type ReviewPostNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<PostJobStackParamList, 'ReviewPost'>,
  BottomTabNavigationProp<ClientTabParamList>
>;
type ReviewPostRouteProp = RouteProp<PostJobStackParamList, 'ReviewPost'>;

interface ReviewPostScreenProps {
  navigation: ReviewPostNavigationProp;
  route: ReviewPostRouteProp;
}

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  Plumbing:    { icon: 'water-outline',      bg: '#d6e3ff' },
  Electrical:  { icon: 'flash-outline',       bg: '#ffdcc5' },
  HVAC:        { icon: 'thermometer-outline', bg: '#9ff5c1' },
  Cleaning:    { icon: 'sparkles-outline',    bg: '#efedf1' },
  Carpentry:   { icon: 'hammer-outline',      bg: '#efedf1' },
  Painting:    { icon: 'brush-outline',       bg: '#efedf1' },
  Roofing:     { icon: 'home-outline',        bg: '#e9e7eb' },
  Landscaping: { icon: 'leaf-outline',        bg: '#e9e7eb' },
  General:     { icon: 'construct-outline',   bg: '#efedf1' },
};

// ─── Progress stepper ─────────────────────────────────────────────────────────
const ProgressStepper = ({ step, total }: { step: number; total: number }) => (
  <View className="flex-row items-center gap-x-3 mb-8">
    <View className="flex-row gap-x-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 8,
            width: i === step - 1 ? 48 : 32,
            borderRadius: 4,
            backgroundColor: i < step ? '#371800' : '#e9e7eb',
          }}
        />
      ))}
    </View>
    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
      Step {step} of {total}
    </Text>
  </View>
);

// ─── Detail row ───────────────────────────────────────────────────────────────
interface DetailRowProps {
  label: string;
  value: string;
}
const DetailRow = ({ label, value }: DetailRowProps) => (
  <View className="gap-y-1">
    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{label}</Text>
    <Text className="text-base text-on-surface font-medium leading-snug">{value}</Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const ReviewPostScreen = ({ navigation, route }: ReviewPostScreenProps) => {
  const { user } = useAuth();
  const { category, title, description, address, latitude, longitude, isUrgent } = route.params;
  const [isPosting, setIsPosting] = useState(false);

  const catConfig = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.General;

  const handlePost = async () => {
    if (!user) return;

    setIsPosting(true);
    let posted = false;

    try {
      const { error } = await supabase.from('jobs').insert({
        client_id: user.id,
        title,
        description: description || null,
        category,
        address,
        location_lat: latitude ?? null,
        location_lng: longitude ?? null,
        status: 'open',
        is_urgent: isUrgent,
        payout: 0,
        show_up_fee: 0,
      });

      if (error) {
        Alert.alert(
          'Error posting job',
          `${getErrorMessage(error, 'Unknown database error.')}\n\nCode: ${error.code ?? '—'}`,
        );
        return;
      }

      posted = true;
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setIsPosting(false);
    }

    // Navigate only after a confirmed successful insert — outside try/catch so
    // a navigation error can never be confused with a database error.
    if (posted) {
      navigation.navigate('Dashboard');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
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
          <Text className="text-lg font-extrabold text-primary tracking-tight">Review Job</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <ProgressStepper step={3} total={3} />

        {/* Hero */}
        <View className="mb-8">
          <View className="flex-row items-center gap-x-3 mb-3">
            <View className="px-3 py-1 bg-tertiary-fixed rounded-full">
              <Text className="text-xs font-extrabold text-on-tertiary-fixed-variant uppercase tracking-widest">
                Post Job
              </Text>
            </View>
            <View className="flex-row items-center gap-x-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(214, 227, 255, 0.5)' }}>
              <Ionicons name="shield-checkmark" size={12} color="#455f88" />
              <Text className="text-xs font-semibold text-on-secondary-fixed-variant">Verified Handymen Only</Text>
            </View>
          </View>
          <Text className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 leading-tight">
            Review your{'\n'}request details
          </Text>
          <Text className="text-on-surface-variant text-base leading-relaxed">
            Your job will be broadcast to local professionals who have passed our background check.
          </Text>
        </View>

        {/* Summary card */}
        <View
          className="bg-surface-container-low rounded-xl p-7 mb-5"
          style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}
        >
          {/* Category */}
          <View className="flex-row items-center gap-x-3 mb-6">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: catConfig.bg }}
            >
              <Ionicons name={catConfig.icon} size={22} color="#371800" />
            </View>
            <View>
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Category</Text>
              <Text className="text-lg font-extrabold text-on-surface">{category}</Text>
            </View>
          </View>

          <View className="gap-y-5">
            <DetailRow label="Job Title" value={title} />
            {description.length > 0 && (
              <DetailRow label="Description" value={description} />
            )}
          </View>
        </View>

        {/* Location card */}
        <View className="bg-surface-container-high rounded-xl mb-5 overflow-hidden">
          {/* Mini map placeholder */}
          <View className="h-28 bg-surface-container items-center justify-center relative">
            {[25, 50, 75].map(pct => (
              <View key={`h-${pct}`} style={{ position: 'absolute', left: 0, right: 0, top: `${pct}%`, height: 1, backgroundColor: 'rgba(196,198,207,0.5)' }} />
            ))}
            {[25, 50, 75].map(pct => (
              <View key={`v-${pct}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct}%`, width: 1, backgroundColor: 'rgba(196,198,207,0.5)' }} />
            ))}
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center" style={{ shadowColor: '#371800', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 }}>
              <Ionicons name="location" size={18} color="#ffffff" />
            </View>
          </View>
          <View className="flex-row items-start gap-x-3 p-5">
            <Ionicons name="location-outline" size={18} color="#371800" style={{ marginTop: 1 }} />
            <View className="flex-1">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Location</Text>
              <Text className="text-sm font-semibold text-on-surface">{address}</Text>
            </View>
            <Pressable
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              onPress={() => navigation.goBack()}
            >
              <Text className="text-sm font-extrabold text-primary">Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* Urgency badge (if set) */}
        {isUrgent && (
          <View className="flex-row items-center gap-x-3 bg-primary-fixed px-5 py-4 rounded-xl mb-5">
            <Ionicons name="flash" size={18} color="#703700" />
            <Text className="font-extrabold text-on-primary-fixed-variant text-sm">
              Marked as Emergency / Urgent
            </Text>
          </View>
        )}

        {/* Security card */}
        <View
          className="bg-surface-container-lowest rounded-xl p-6 mb-5 flex-row items-start gap-x-4"
          style={{ borderWidth: 1, borderColor: 'rgba(196, 198, 207, 0.2)' }}
        >
          <View className="w-10 h-10 rounded-full bg-tertiary-fixed items-center justify-center">
            <Ionicons name="shield-checkmark" size={18} color="#005231" />
          </View>
          <View className="flex-1">
            <Text className="font-extrabold text-on-surface mb-1">Secure Connection</Text>
            <Text className="text-xs text-on-surface-variant leading-relaxed">
              Your contact details are encrypted. Only the handyman you select will receive your full address.
            </Text>
          </View>
        </View>

        {/* Info notice */}
        <View
          className="rounded-xl p-5 flex-row items-start gap-x-3"
          style={{ backgroundColor: 'rgba(55,24,0,0.06)', borderLeftWidth: 3, borderLeftColor: '#371800' }}
        >
          <Ionicons name="information-circle-outline" size={20} color="#371800" style={{ marginTop: 1 }} />
          <View className="flex-1">
            <Text className="font-extrabold text-primary mb-1">Ready to publish?</Text>
            <Text className="text-sm text-on-surface-variant leading-relaxed">
              By posting, you allow verified handymen within 10 miles of your location to view this job and submit quotes.
            </Text>
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
            backgroundColor: '#371800',
            opacity: pressed || isPosting ? 0.85 : 1,
            transform: [{ scale: pressed && !isPosting ? 0.98 : 1 }],
            shadowColor: '#371800',
            shadowOpacity: 0.3,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          })}
          onPress={handlePost}
          disabled={isPosting}
        >
          {isPosting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text className="font-extrabold text-lg text-white">Post Job</Text>
              <Ionicons name="send-outline" size={20} color="#ffffff" />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ReviewPostScreen;
