import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SelectCategoryScreen from '@/screens/client/SelectCategoryScreen';
import JobDetailsScreen from '@/screens/client/JobDetailsScreen';
import ReviewPostScreen from '@/screens/client/ReviewPostScreen';
import { PostJobStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<PostJobStackParamList>();

const PostJobStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="SelectCategory" component={SelectCategoryScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="ReviewPost" component={ReviewPostScreen} />
  </Stack.Navigator>
);

export default PostJobStack;
