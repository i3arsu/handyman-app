import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { PostJobStackParamList } from '@/types/navigation';
import { fetchPlacesAutocomplete, PlaceSuggestion, PlaceCoords } from '@/services/places';

type JobDetailsNavigationProp = NativeStackNavigationProp<PostJobStackParamList, 'JobDetails'>;
type JobDetailsRouteProp = RouteProp<PostJobStackParamList, 'JobDetails'>;

interface JobDetailsScreenProps {
  navigation: JobDetailsNavigationProp;
  route: JobDetailsRouteProp;
}

// ─── Progress stepper ─────────────────────────────────────────────────────────
const ProgressStepper = ({ step, total }: { step: number; total: number }) => (
  <View className="flex-row items-center gap-x-3 mb-10">
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

// ─── Location confirmed card ──────────────────────────────────────────────────
interface LocationConfirmedProps {
  mainText: string;
  secondaryText: string;
  onClear: () => void;
}

const LocationConfirmed = ({ mainText, secondaryText, onClear }: LocationConfirmedProps) => (
  <View
    className="mx-4 my-3 rounded-xl p-4 flex-row items-center gap-x-3"
    style={{ backgroundColor: '#f4fff9' }}
  >
    <View
      className="w-10 h-10 rounded-full items-center justify-center flex-shrink-0"
      style={{ backgroundColor: '#9ff5c1' }}
    >
      <Ionicons name="checkmark" size={20} color="#005231" />
    </View>
    <View className="flex-1">
      <Text className="text-sm font-extrabold text-on-surface" numberOfLines={1}>
        {mainText}
      </Text>
      <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={1}>
        {secondaryText}
      </Text>
    </View>
    <Pressable
      onPress={onClear}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      hitSlop={8}
    >
      <Ionicons name="close-circle" size={20} color="#74777f" />
    </Pressable>
  </View>
);

// ─── Map area (placeholder when no address confirmed) ─────────────────────────
const MapPlaceholder = () => (
  <View className="h-28 bg-surface-container items-center justify-center gap-y-1">
    {[25, 50, 75].map(pct => (
      <View
        key={`h-${pct}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${pct}%`,
          height: 1,
          backgroundColor: 'rgba(196,198,207,0.45)',
        }}
      />
    ))}
    {[25, 50, 75].map(pct => (
      <View
        key={`v-${pct}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${pct}%`,
          width: 1,
          backgroundColor: 'rgba(196,198,207,0.45)',
        }}
      />
    ))}
    <Ionicons name="location-outline" size={26} color="#c4c6cf" />
    <Text className="text-xs text-on-surface-variant font-medium">
      Start typing to find your address
    </Text>
  </View>
);

// ─── Suggestion row ───────────────────────────────────────────────────────────
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
const JobDetailsScreen = ({ navigation, route }: JobDetailsScreenProps) => {
  const { category } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmedCoords, setConfirmedCoords] = useState<PlaceCoords | null>(null);
  const [confirmedMainText, setConfirmedMainText] = useState('');
  const [confirmedSecondaryText, setConfirmedSecondaryText] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canContinue = title.trim().length > 0 && address.trim().length > 0;

  // ─── Address input ────────────────────────────────────────────────────────
  const handleAddressChange = (text: string) => {
    setAddress(text);
    setConfirmedCoords(null);
    setConfirmedMainText('');
    setConfirmedSecondaryText('');

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

  const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
    setAddress(suggestion.description);
    setConfirmedCoords({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setConfirmedMainText(suggestion.mainText);
    setConfirmedSecondaryText(suggestion.secondaryText);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleClearAddress = () => {
    setAddress('');
    setConfirmedCoords(null);
    setConfirmedMainText('');
    setConfirmedSecondaryText('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleContinue = () => {
    navigation.navigate('ReviewPost', {
      category,
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      latitude: confirmedCoords?.latitude ?? null,
      longitude: confirmedCoords?.longitude ?? null,
      isUrgent,
    });
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
          <Text className="text-lg font-extrabold text-primary tracking-tight">Job Details</Text>
        </View>
        <View className="px-3 py-1 bg-primary-fixed rounded-full">
          <Text className="text-xs font-extrabold text-on-primary-fixed-variant">{category}</Text>
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
          <ProgressStepper step={1} total={3} />

          <View className="mb-8">
            <Text className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 leading-tight">
              Describe the issue
            </Text>
            <Text className="text-on-surface-variant text-base leading-relaxed">
              The more details you provide, the better our craftsmen can prepare.
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

            {/* Job Location */}
            <View>
              <Text className="text-sm font-bold text-on-surface mb-2 ml-1">Job Location</Text>
              <View
                className="bg-surface-container-low rounded-xl overflow-hidden"
                style={{ borderWidth: 1, borderColor: 'rgba(196,198,207,0.3)' }}
              >
                {/* Map area */}
                {confirmedCoords ? (
                  <LocationConfirmed
                    mainText={confirmedMainText}
                    secondaryText={confirmedSecondaryText}
                    onClear={handleClearAddress}
                  />
                ) : (
                  <MapPlaceholder />
                )}

                {/* Address input row — hidden once a suggestion is confirmed */}
                {!confirmedCoords && (
                  <View
                    className="flex-row items-center px-4 py-3 gap-x-3"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(196,198,207,0.3)',
                    }}
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
                    ) : address.length > 0 ? (
                      <Pressable onPress={handleClearAddress} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color="#74777f" />
                      </Pressable>
                    ) : null}
                  </View>
                )}

                {/* Autocomplete suggestions */}
                {showSuggestions && (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(196,198,207,0.3)',
                    }}
                  >
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
            </View>

            {/* Urgency toggle */}
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
        <Pressable
          className="w-full h-16 rounded-full flex-row items-center justify-center gap-x-3"
          style={({ pressed }) => ({
            backgroundColor: canContinue ? '#371800' : '#c4c6cf',
            opacity: pressed && canContinue ? 0.9 : 1,
            transform: [{ scale: pressed && canContinue ? 0.98 : 1 }],
            shadowColor: '#371800',
            shadowOpacity: canContinue ? 0.25 : 0,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: canContinue ? 6 : 0,
          })}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text
            className="font-extrabold text-lg"
            style={{ color: canContinue ? '#ffffff' : '#74777f' }}
          >
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={canContinue ? '#ffffff' : '#74777f'}
          />
        </Pressable>
        <Text className="text-center text-on-surface-variant text-xs mt-3 font-medium">
          Estimated quote arrival: <Text className="text-primary font-bold">Within 30 mins</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default JobDetailsScreen;
