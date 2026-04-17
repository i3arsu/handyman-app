import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/services/supabase';
import { AuthStackParamList } from '@/types/navigation';

type HandymanVerificationScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'HandymanVerification'
>;
type HandymanVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'HandymanVerification'>;

interface HandymanVerificationScreenProps {
  navigation: HandymanVerificationScreenNavigationProp;
  route: HandymanVerificationScreenRouteProp;
}

interface VerificationStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel: string;
  actionVariant: 'primary' | 'secondary';
}

const VERIFICATION_STEPS: VerificationStep[] = [
  {
    icon: 'card-outline',
    title: 'Upload ID',
    description: "Valid Driver's License or Passport",
    actionLabel: 'Start',
    actionVariant: 'primary',
  },
  {
    icon: 'document-text-outline',
    title: 'Add License',
    description: 'Professional trade certification',
    actionLabel: 'Add',
    actionVariant: 'secondary',
  },
  {
    icon: 'shield-outline',
    title: 'Request Background Check',
    description: 'Powered by Checkr® Trust Systems',
    actionLabel: 'Request',
    actionVariant: 'secondary',
  },
];

const HandymanVerificationScreen = ({ route }: HandymanVerificationScreenProps) => {
  const { email, password } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const handleCompleteOnboarding = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: 'handyman' } },
      });

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
        return;
      }

      if (!data.session) {
        // Email confirmation is enabled in Supabase dashboard.
        Alert.alert(
          'Check your email',
          'We sent a confirmation link to ' + email + '. Verify it to access your account.',
        );
        return;
      }
      // Session exists → onAuthStateChange fires → RootNavigator routes to HandymanTabs.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-8 pb-12">

          {/* Verification chip */}
          <View className="flex-row items-center self-start bg-secondary-container px-4 py-1.5 rounded-full mb-6">
            <Ionicons name="shield-checkmark" size={14} color="#3f5882" style={{ marginRight: 6 }} />
            <Text className="text-on-secondary-container text-sm font-semibold">
              Verification Step
            </Text>
          </View>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-extrabold text-on-surface leading-tight">
              Build your trust score
            </Text>
            <Text className="text-on-surface-variant mt-3 leading-relaxed">
              To ensure the safety of our community, we require all pros to complete these trust benchmarks.
            </Text>
          </View>

          {/* Step cards */}
          <View className="gap-4 mb-8">
            {VERIFICATION_STEPS.map((step) => (
              <View
                key={step.title}
                className="flex-row items-center justify-between p-6 bg-surface-container-lowest rounded-lg"
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(196, 198, 207, 0.15)',
                  shadowColor: '#1a1c1e',
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="w-12 h-12 bg-surface-container-high rounded-full items-center justify-center mr-4">
                    <Ionicons name={step.icon} size={22} color="#43474e" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-on-surface">{step.title}</Text>
                    <Text className="text-sm text-on-surface-variant mt-0.5">
                      {step.description}
                    </Text>
                  </View>
                </View>
                <Pressable
                  className={`px-4 py-2 rounded-full ${
                    step.actionVariant === 'primary' ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <Text
                    className={`text-sm font-medium ${
                      step.actionVariant === 'primary' ? 'text-on-primary' : 'text-on-surface'
                    }`}
                  >
                    {step.actionLabel}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Complete Onboarding CTA */}
          <Pressable
            className="w-full bg-primary py-4 rounded-full flex-row items-center justify-center"
            style={({ pressed }) => ({
              opacity: pressed || isLoading ? 0.75 : 1,
              shadowColor: '#371800',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            })}
            onPress={handleCompleteOnboarding}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text className="text-on-primary text-lg font-extrabold mr-2">
                  Complete Onboarding
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </>
            )}
          </Pressable>

          {/* Privacy note */}
          <View className="mt-6 px-4">
            <Text className="text-center text-sm text-on-surface-variant leading-relaxed">
              Your data is encrypted and protected. By continuing you agree to our{' '}
              <Text
                className="underline font-semibold text-primary"
                onPress={() => Linking.openURL('https://handycraft.app/safety')}
              >
                Safety Protocols
              </Text>
              .
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HandymanVerificationScreen;
