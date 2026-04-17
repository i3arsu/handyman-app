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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/services/supabase';
import { AuthStackParamList } from '@/types/navigation';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RegisterScreenRouteProp = RouteProp<AuthStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
  route: RegisterScreenRouteProp;
}

const ROLE_LABELS: Record<string, { headline: string; sub: string }> = {
  client:   { headline: 'Create client account', sub: 'Post jobs and hire trusted pros.' },
  handyman: { headline: 'Create pro account',    sub: "Join our network and start earning." },
};

const RegisterScreen = ({ navigation, route }: RegisterScreenProps) => {
  const { role } = route.params;
  const labels = ROLE_LABELS[role];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setError(null);
    setIsLoading(true);

    try {
      if (role === 'handyman') {
        // For handyman: navigate to verification FIRST, sign up happens there.
        navigation.navigate('HandymanVerification', {
          email: email.trim(),
          password,
        });
        return;
      }

      // For client: sign up immediately.
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { role } },
      });

      if (authError) { setError(authError.message); return; }

      if (!data.session) {
        // Supabase email confirmation is enabled — session won't exist yet.
        Alert.alert(
          'Check your email',
          'We sent a confirmation link to ' + email.trim() + '. Verify it to continue.',
        );
        return;
      }
      // Session exists → onAuthStateChange fires → RootNavigator routes to ClientTabs.
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

            {/* Back button */}
            <Pressable
              className="mb-8 self-start"
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color="#371800" />
            </Pressable>

            {/* Header */}
            <View className="mb-10">
              {/* Role badge */}
              <View className="self-start flex-row items-center gap-x-2 bg-surface-container-low px-4 py-1.5 rounded-full mb-5">
                <Ionicons
                  name={role === 'client' ? 'build-outline' : 'construct-outline'}
                  size={14}
                  color="#371800"
                />
                <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                  {role === 'client' ? 'Client' : 'Professional'}
                </Text>
              </View>
              <Text className="text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
                {labels.headline}
              </Text>
              <Text className="mt-2 text-on-surface-variant leading-relaxed">{labels.sub}</Text>
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
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#43474e80"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
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

            {/* CTA */}
            <Pressable
              className="w-full bg-primary py-4 rounded-full items-center justify-center mt-4"
              style={({ pressed }) => ({ opacity: pressed || isLoading ? 0.75 : 1 })}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-on-primary text-lg font-extrabold tracking-wide">
                  {role === 'handyman' ? 'Next' : 'Create Account'}
                </Text>
              )}
            </Pressable>

            <Text className="text-center mt-6 text-xs text-on-surface-variant px-4 leading-relaxed">
              By continuing you agree to our Terms of Service and Privacy Policy.
            </Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
