import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { supabase } from '@/services/supabase';
import { useJob } from '@/hooks/useJob';
import { fetchPlacesAutocomplete, PlaceSuggestion, PlaceCoords } from '@/services/places';
import { getErrorMessage } from '@/utils/errors';
import { ClientStackParamList } from '@/types/navigation';

type EditJobNavigationProp = NativeStackNavigationProp<ClientStackParamList, 'EditJob'>;
type EditJobRouteProp = RouteProp<ClientStackParamList, 'EditJob'>;

// ─── Address suggestion row ───────────────────────────────────────────────────
interface SuggestionRowProps {
  suggestion: PlaceSuggestion;
  onPress: (s: PlaceSuggestion) => void;
  isLast: boolean;
}

const SuggestionRow = ({ suggestion, onPress, isLast }: SuggestionRowProps) => (
  <Pressable
    className="flex-row items-center gap-x-3 px-4 py-3"
    style={({ pressed }) => ({
      backgroundColor: pressed ? '#f4f3f7' : '#ffffff',
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: 'rgba(196,198,207,0.3)',
    })}
    onPress={() => onPress(suggestion)}
  >
    <View className="w-8 h-8 rounded-full bg-surface-container items-center justify-center flex-shrink-0">
      <Ionicons name="location-outline" size={15} color="#43474e" />
    </View>
    <View className="flex-1">
      <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>
        {suggestion.mainText}
      </Text>
      <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={1}>
        {suggestion.secondaryText}
      </Text>
    </View>
  </Pressable>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const EditJobScreen = () => {
  const navigation = useNavigation<EditJobNavigationProp>();
  const route = useRoute<EditJobRouteProp>();
  const { jobId } = route.params;

  const { job, isLoading: jobLoading, refetch } = useJob(jobId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [coords, setCoords] = useState<PlaceCoords | null>(null);
  const [addressDirty, setAddressDirty] = useState(false);

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed form once the job loads.
  useEffect(() => {
    if (!job) return;
    setTitle(job.title);
    setDescription(job.description ?? '');
    setAddress(job.address ?? '');
    setIsUrgent(job.is_urgent);
    setCoords(
      job.location_lat != null && job.location_lng != null
        ? { latitude: job.location_lat, longitude: job.location_lng }
        : null,
    );
  }, [job]);

  // Prevent editing once the client (or anyone) has moved past 'open'.
  useEffect(() => {
    if (job && job.status !== 'open') {
      Alert.alert('Can’t edit', 'This job has already been accepted and can no longer be edited.');
      navigation.goBack();
    }
  }, [job, navigation]);

  const canSave =
    title.trim().length > 0 &&
    address.trim().length > 0 &&
    !isSaving;

  const handleAddressChange = (text: string) => {
    setAddress(text);
    setAddressDirty(true);
    setCoords(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoadingPlaces(true);
      const results = await fetchPlacesAutocomplete(text);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsLoadingPlaces(false);
    }, 400);
  };

  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    setAddress(s.description);
    setCoords({ latitude: s.latitude, longitude: s.longitude });
    setSuggestions([]);
    setShowSuggestions(false);
    setAddressDirty(true);
    Keyboard.dismiss();
  };

  const handleSave = async () => {
    if (!canSave || !job) return;

    // If the user typed a new address but didn't pick an autocomplete result,
    // force them to confirm one — otherwise we'd drop the coords and break
    // proximity search for handymen.
    if (addressDirty && !coords) {
      Alert.alert('Confirm address', 'Pick an address from the suggestions so we can place your job on the map.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          address: address.trim(),
          location_lat: coords?.latitude ?? job.location_lat,
          location_lng: coords?.longitude ?? job.location_lng,
          is_urgent: isUrgent,
        })
        .eq('id', jobId)
        .eq('status', 'open');

      if (error) {
        Alert.alert('Save failed', error.message);
        return;
      }
      refetch();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save failed', getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (jobLoading || !job) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#371800" />
      </SafeAreaView>
    );
  }

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
          <Text className="text-lg font-extrabold text-primary tracking-tight">Edit Job</Text>
        </View>
        <View className="px-3 py-1 bg-primary-fixed rounded-full">
          <Text className="text-xs font-extrabold text-on-primary-fixed-variant">{job.category}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 mt-2">
            <Text className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 leading-tight">
              Update the details
            </Text>
            <Text className="text-on-surface-variant text-base leading-relaxed">
              You can refine your job until a handyman accepts it.
            </Text>
          </View>

          <View className="gap-y-7">
            {/* Job Title */}
            <View>
              <Text className="text-sm font-bold text-on-surface mb-2 ml-1">Job Title</Text>
              <TextInput
                className="bg-surface-container-highest rounded-xl px-5 text-base font-medium text-on-surface"
                style={{ height: 56 }}
                placeholder="e.g., Leaky Kitchen Faucet"
                placeholderTextColor="#74777f"
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
              />
            </View>

            {/* Description */}
            <View>
              <Text className="text-sm font-bold text-on-surface mb-2 ml-1">Problem Description</Text>
              <TextInput
                className="bg-surface-container-highest rounded-xl px-5 py-4 text-base text-on-surface"
                placeholder="Tell us what's happening. When did it start? Any specific details?"
                placeholderTextColor="#74777f"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
              />
            </View>

            {/* Address */}
            <View>
              <Text className="text-sm font-bold text-on-surface mb-2 ml-1">Job Location</Text>
              <View
                className="bg-surface-container-low rounded-xl overflow-hidden"
                style={{ borderWidth: 1, borderColor: 'rgba(196,198,207,0.3)' }}
              >
                <View
                  className="flex-row items-center px-4 py-3 gap-x-3"
                >
                  <Ionicons name="home-outline" size={20} color="#43474e" />
                  <TextInput
                    className="flex-1 text-sm font-medium text-on-surface"
                    placeholder="Enter your full address"
                    placeholderTextColor="#74777f"
                    value={address}
                    onChangeText={handleAddressChange}
                    returnKeyType="done"
                    onSubmitEditing={() => setShowSuggestions(false)}
                    autoCorrect={false}
                  />
                  {isLoadingPlaces ? (
                    <ActivityIndicator size="small" color="#74777f" />
                  ) : coords && !addressDirty ? (
                    <Ionicons name="checkmark-circle" size={18} color="#005231" />
                  ) : null}
                </View>

                {showSuggestions && (
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(196,198,207,0.3)' }}>
                    {suggestions.map((s, i) => (
                      <SuggestionRow
                        key={s.placeId}
                        suggestion={s}
                        onPress={handleSelectSuggestion}
                        isLast={i === suggestions.length - 1}
                      />
                    ))}
                  </View>
                )}
              </View>
              {addressDirty && !coords && (
                <Text className="text-xs text-error mt-2 ml-1 font-medium">
                  Pick an address from the suggestions to keep your job on the map.
                </Text>
              )}
            </View>

            {/* Urgency */}
            <Pressable
              className="flex-row items-center justify-between bg-surface-container-low px-5 py-4 rounded-xl"
              onPress={() => setIsUrgent(v => !v)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <View className="flex-row items-center gap-x-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: isUrgent ? '#ffdcc5' : '#efedf1' }}
                >
                  <Ionicons name="flash" size={18} color={isUrgent ? '#703700' : '#74777f'} />
                </View>
                <View>
                  <Text className="font-extrabold text-on-surface text-sm">Emergency / Urgent</Text>
                  <Text className="text-xs text-on-surface-variant mt-0.5">Get a pro on-site faster</Text>
                </View>
              </View>
              <View
                className="w-12 h-6 rounded-full relative"
                style={{ backgroundColor: isUrgent ? '#ffdcc5' : '#c4c6cf' }}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: isUrgent ? undefined : 4,
                    right: isUrgent ? 4 : undefined,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: isUrgent ? '#703700' : '#ffffff',
                  }}
                />
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA */}
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
        <Pressable onPress={handleSave} disabled={!canSave}>
          {({ pressed }) => (
            <View
              className="w-full h-16 rounded-full flex-row items-center justify-center gap-x-3"
              style={{
                backgroundColor: canSave ? '#371800' : '#c4c6cf',
                opacity: pressed && canSave ? 0.9 : 1,
                transform: [{ scale: pressed && canSave ? 0.98 : 1 }],
                shadowColor: '#371800',
                shadowOpacity: canSave ? 0.25 : 0,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: canSave ? 6 : 0,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text
                    className="font-extrabold text-lg"
                    style={{ color: canSave ? '#ffffff' : '#74777f' }}
                  >
                    Save Changes
                  </Text>
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={canSave ? '#ffffff' : '#74777f'}
                  />
                </>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default EditJobScreen;
