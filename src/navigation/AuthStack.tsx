import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/screens/auth/LoginScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import HandymanVerificationScreen from '@/screens/auth/HandymanVerificationScreen';
import { AuthStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <Stack.Navigator
    initialRouteName="Login"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="HandymanVerification" component={HandymanVerificationScreen} />
  </Stack.Navigator>
);

export default AuthStack;
