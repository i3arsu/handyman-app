import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthStackParamList } from '@/types/navigation';

type SignUpScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

interface SignUpScreenProps {
  navigation: SignUpScreenNavigationProp;
}

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 justify-center px-6">

        {/* Headline */}
        <View className="mb-12">
          <Text className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
            Welcome home.{'\n'}How can we help?
          </Text>
          <Text className="mt-3 text-lg text-on-surface-variant leading-relaxed">
            Choose your path to get started with the best local craftspeople.
          </Text>
        </View>

        {/* Role selector: Client */}
        <Pressable
          className="bg-surface-container-low rounded-xl overflow-hidden mb-6"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          onPress={() => navigation.navigate('Register', { role: 'client' })}
        >
          <View className="p-8">
            <View className="w-14 h-14 bg-primary rounded-full items-center justify-center mb-4">
              <Ionicons name="build-outline" size={28} color="#ffffff" />
            </View>
            <Text className="text-2xl font-extrabold text-primary">
              I need help with a repair
            </Text>
            <Text className="text-on-surface-variant mt-2">
              Find trusted professionals for your home projects.
            </Text>
          </View>
        </Pressable>

        {/* Role selector: Handyman */}
        <Pressable
          className="bg-tertiary-fixed rounded-xl overflow-hidden"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          onPress={() => navigation.navigate('Register', { role: 'handyman' })}
        >
          <View className="p-8">
            <View className="w-14 h-14 bg-on-tertiary-fixed-variant rounded-full items-center justify-center mb-4">
              <Ionicons name="construct-outline" size={28} color="#9ff5c1" />
            </View>
            <Text className="text-2xl font-extrabold text-on-tertiary-fixed">
              I'm looking for work
            </Text>
            <Text className="text-on-tertiary-fixed-variant mt-2">
              Join our network of elite independent contractors.
            </Text>
          </View>
        </Pressable>

        {/* Back to Login */}
        <Pressable
          className="mt-8 items-center"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-on-surface-variant text-sm">
            Already have an account?{' '}
            <Text className="text-primary font-semibold">Sign In</Text>
          </Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
};

export default SignUpScreen;
