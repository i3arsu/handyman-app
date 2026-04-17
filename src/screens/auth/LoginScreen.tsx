import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/services/supabase';
import { AuthStackParamList } from '@/types/navigation';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
      }
      // On success, onAuthStateChange fires in AuthContext → RootNavigator
      // routes to the correct app automatically — no explicit navigation needed.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-12">

            {/* Brand lockup */}
            <View className="mb-12">
              <Text className="text-4xl font-extrabold text-primary tracking-tight leading-tight">
                HandyCraft
              </Text>
              <Text className="mt-3 text-lg text-on-surface-variant leading-relaxed">
                Sign in to your account.
              </Text>
            </View>

            {/* Email field */}
            <View className="bg-surface-container-highest rounded-md px-5 pt-3 pb-3 mb-4">
              <Text className="text-xs text-on-surface-variant font-semibold mb-1">Email</Text>
              <View className="flex-row items-center">
                <Ionicons name="mail-outline" size={16} color="#43474e" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-on-surface text-base"
                  placeholder="you@example.com"
                  placeholderTextColor="#43474e80"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password field */}
            <View className="bg-surface-container-highest rounded-md px-5 pt-3 pb-3 mb-4">
              <Text className="text-xs text-on-surface-variant font-semibold mb-1">Password</Text>
              <View className="flex-row items-center">
                <Ionicons name="lock-closed-outline" size={16} color="#43474e" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-on-surface text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#43474e80"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword(prev => !prev)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#43474e"
                  />
                </Pressable>
              </View>
            </View>

            {/* Error message */}
            {error && (
              <View className="flex-row items-center gap-x-2 mb-4 px-1">
                <Ionicons name="alert-circle-outline" size={15} color="#ba1a1a" />
                <Text className="text-error text-sm flex-1">{error}</Text>
              </View>
            )}

            {/* Forgot password */}
            <Pressable className="items-end mb-8">
              <Text className="text-primary text-sm font-semibold">Forgot password?</Text>
            </Pressable>

            {/* Sign In CTA */}
            <Pressable
              className="w-full bg-primary py-4 rounded-full items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed || isLoading ? 0.75 : 1 })}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-on-primary text-lg font-extrabold tracking-wide">
                  Sign In
                </Text>
              )}
            </Pressable>

            {/* Navigate to Sign Up */}
            <Pressable
              className="mt-6 items-center"
              onPress={() => navigation.navigate('SignUp')}
              disabled={isLoading}
            >
              <Text className="text-on-surface-variant text-sm">
                Don't have an account?{' '}
                <Text className="text-primary font-semibold">Sign Up</Text>
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
