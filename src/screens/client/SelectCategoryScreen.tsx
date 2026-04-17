import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

import { useProfile } from '@/hooks/useProfile';
import { PostJobStackParamList, ClientTabParamList } from '@/types/navigation';

type SelectCategoryNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<PostJobStackParamList, 'SelectCategory'>,
  BottomTabNavigationProp<ClientTabParamList>
>;

interface SelectCategoryScreenProps {
  navigation: SelectCategoryNavigationProp;
}

// ─── Category data ────────────────────────────────────────────────────────────
interface CategoryItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
}

const CATEGORIES: CategoryItem[] = [
  { label: 'Plumbing',     icon: 'water-outline',       bg: '#d6e3ff', iconColor: '#001b3c' },
  { label: 'Electrical',   icon: 'flash-outline',        bg: '#ffdcc5', iconColor: '#301400' },
  { label: 'HVAC',         icon: 'thermometer-outline',  bg: '#9ff5c1', iconColor: '#002111' },
  { label: 'Cleaning',     icon: 'sparkles-outline',     bg: '#efedf1', iconColor: '#43474e' },
  { label: 'Carpentry',    icon: 'hammer-outline',       bg: '#efedf1', iconColor: '#43474e' },
  { label: 'Painting',     icon: 'brush-outline',        bg: '#efedf1', iconColor: '#43474e' },
  { label: 'Roofing',      icon: 'home-outline',         bg: '#e9e7eb', iconColor: '#43474e' },
  { label: 'Landscaping',  icon: 'leaf-outline',         bg: '#e9e7eb', iconColor: '#43474e' },
  { label: 'General',      icon: 'construct-outline',    bg: '#efedf1', iconColor: '#43474e' },
];

// ─── Category card ────────────────────────────────────────────────────────────
interface CategoryCardProps {
  item: CategoryItem;
  onPress: () => void;
}

const CategoryCard = ({ item, onPress }: CategoryCardProps) => (
  <Pressable
    onPress={onPress}
    className="flex-1 bg-surface-container-lowest rounded-xl p-6 items-center"
    style={({ pressed }) => ({
      opacity: pressed ? 0.85 : 1,
      transform: [{ scale: pressed ? 0.97 : 1 }],
      shadowColor: '#1a1c1e',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    })}
  >
    <View
      className="w-16 h-16 rounded-full items-center justify-center mb-3"
      style={{ backgroundColor: item.bg }}
    >
      <Ionicons name={item.icon} size={28} color={item.iconColor} />
    </View>
    <Text className="font-semibold text-on-surface text-sm text-center">{item.label}</Text>
  </Pressable>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const SelectCategoryScreen = ({ navigation }: SelectCategoryScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useProfile();

  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'U';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const filtered = searchQuery.trim().length > 0
    ? CATEGORIES.filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : CATEGORIES;

  const rows: CategoryItem[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push(filtered.slice(i, i + 2));
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text className="text-xl font-extrabold text-primary tracking-tight">Post a Job</Text>
        <Pressable
          className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text className="text-xs font-extrabold text-white">{initials}</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View className="mb-8 mt-2">
          <Text className="text-4xl font-extrabold tracking-tight text-primary mb-3 leading-tight">
            What do you need{'\n'}help with?
          </Text>
          <Text className="text-on-surface-variant text-base leading-relaxed">
            Select a category below to find the right professional for your home project.
          </Text>
        </View>

        {/* Search bar */}
        <View
          className="flex-row items-center bg-surface-container-highest rounded-xl mb-8 px-4"
          style={{ height: 56 }}
        >
          <Ionicons name="search-outline" size={20} color="#74777f" />
          <TextInput
            className="flex-1 ml-3 text-base text-on-surface"
            placeholder="Search for a service…"
            placeholderTextColor="#74777f"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#74777f" />
            </Pressable>
          )}
        </View>

        {/* Category grid */}
        {filtered.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="search-outline" size={40} color="#74777f" />
            <Text className="text-on-surface-variant mt-3 font-medium">No categories match your search</Text>
          </View>
        ) : (
          <View className="gap-y-4">
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} className="flex-row gap-x-4">
                {row.map((item) => (
                  <CategoryCard
                    key={item.label}
                    item={item}
                    onPress={() => navigation.navigate('JobDetails', { category: item.label })}
                  />
                ))}
                {/* Fill empty slot if odd number */}
                {row.length === 1 && <View className="flex-1" />}
              </View>
            ))}
          </View>
        )}

        {/* Popular right now bento */}
        {searchQuery.length === 0 && (
          <View className="mt-10">
            <Text className="text-2xl font-extrabold tracking-tight text-on-surface mb-6">Popular Right Now</Text>
            <View className="gap-y-4">
              {/* Wide card */}
              <Pressable
                className="bg-primary-container p-7 rounded-xl overflow-hidden"
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                onPress={() => navigation.navigate('JobDetails', { category: 'HVAC' })}
              >
                <View
                  className="px-3 py-1 bg-tertiary-fixed rounded-full self-start mb-3"
                >
                  <Text className="text-xs font-extrabold text-on-tertiary-fixed-variant uppercase tracking-widest">TRENDING</Text>
                </View>
                <Text className="text-white text-2xl font-extrabold mb-1">Winter HVAC Tune-ups</Text>
                <Text className="text-white text-sm" style={{ opacity: 0.8 }}>
                  Ensure your heating system is ready with a certified checkup.
                </Text>
              </Pressable>

              {/* Two-column row */}
              <View className="flex-row gap-x-4">
                <Pressable
                  className="flex-1 bg-secondary-container p-6 rounded-xl items-center justify-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                  onPress={() => navigation.navigate('JobDetails', { category: 'General' })}
                >
                  <Ionicons name="shield-checkmark-outline" size={36} color="#3f5882" />
                  <Text className="text-on-secondary-container font-extrabold text-sm mt-2 text-center">
                    Background Checked Pros
                  </Text>
                  <Text className="text-on-secondary-container text-xs mt-1 text-center" style={{ opacity: 0.7 }}>
                    All craftsmen are vetted.
                  </Text>
                </Pressable>

                <Pressable
                  className="flex-1 bg-surface-container-high p-6 rounded-xl"
                  style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                  onPress={() => navigation.navigate('JobDetails', { category: 'General' })}
                >
                  <View className="w-11 h-11 rounded-full bg-surface-container-lowest items-center justify-center mb-3">
                    <Ionicons name="flash-outline" size={22} color="#371800" />
                  </View>
                  <Text className="font-extrabold text-on-surface">Emergency Repair</Text>
                  <Text className="text-on-surface-variant text-xs mt-1 leading-relaxed">
                    Get a pro on-site in under 2 hours.
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelectCategoryScreen;
