import React, { useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import { supabase } from '@/services/supabase';
import { invalidateProfile } from '@/services/profiles';
import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/hooks/useProfile';

// ─── Field ────────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
}
const Field = ({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: FieldProps) => (
  <View className="mb-5">
    <Text className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
      {label}
    </Text>
    <View
      className="bg-surface-container-low rounded-xl"
      style={{ paddingHorizontal: 18, paddingVertical: 4 }}
    >
      <TextInput
        className="text-base font-semibold text-on-surface"
        style={{ paddingVertical: 14 }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#74777f"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
      />
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile, isLoading, refetch } = useProfile();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName.length > 0 ? trimmedName : null,
          phone: trimmedPhone.length > 0 ? trimmedPhone : null,
        })
        .eq('id', user.id);

      if (updateError) {
        Alert.alert('Error', updateError.message);
        return;
      }

      invalidateProfile(user.id);
      refetch();
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-3">
        <View className="flex-row items-center gap-x-3">
          <Pressable
            className="p-2 rounded-full"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: pressed ? '#efedf1' : 'transparent' })}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#371800" />
          </Pressable>
          <Text className="text-lg font-extrabold text-primary tracking-tight">Edit Profile</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading && !profile ? (
            <View className="items-center py-20">
              <ActivityIndicator color="#371800" />
            </View>
          ) : (
            <>
              {/* Read-only email */}
              <View className="mb-5">
                <Text className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </Text>
                <View className="bg-surface-container rounded-xl px-[18px] py-4 flex-row items-center gap-x-2">
                  <Ionicons name="lock-closed-outline" size={14} color="#74777f" />
                  <Text className="text-base font-semibold text-on-surface-variant flex-1" numberOfLines={1}>
                    {profile?.email ?? user?.email ?? '—'}
                  </Text>
                </View>
                <Text className="text-xs text-on-surface-variant mt-1.5 ml-1">
                  Your email is managed by your login and can't be changed here.
                </Text>
              </View>

              <Field
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                autoCapitalize="words"
              />

              <Field
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
              />
            </>
          )}
        </ScrollView>

        {/* Save CTA */}
        <View
          className="px-6 pt-4 pb-6 bg-surface"
          style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 8 }}
        >
          <Pressable
            onPress={handleSave}
            disabled={isSaving || isLoading}
            style={({ pressed }) => ({
              backgroundColor: '#371800',
              opacity: pressed || isSaving || isLoading ? 0.85 : 1,
              transform: [{ scale: pressed && !isSaving ? 0.98 : 1 }],
              height: 56,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#371800',
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            })}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#ffffff" />
                <Text className="text-white font-extrabold text-lg">Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
