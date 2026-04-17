import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Job } from '@/types/database';

interface BottomJobSheetProps {
  job: Job;
  onViewDetails: () => void;
  onAccept: () => void;
  onDismiss?: () => void;
  isAccepting?: boolean;
}

const DISMISS_THRESHOLD = 80;

const formatWindow = (iso: string | null): string => {
  if (!iso) return 'Flexible';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const BottomJobSheet = ({
  job,
  onViewDetails,
  onAccept,
  onDismiss,
  isAccepting = false,
}: BottomJobSheetProps) => {
  const translateY = useSharedValue(200);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 480,
      easing: Easing.out(Easing.cubic),
    });
  }, [translateY]);

  const dismiss = () => {
    onDismiss?.();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow dragging down
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        // Swipe far enough — dismiss
        translateY.value = withTiming(400, { duration: 250 }, () => {
          runOnJS(dismiss)();
        });
      } else {
        // Snap back
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <View
          className="bg-surface-container-lowest rounded-xl p-6"
          style={{
            shadowColor: '#1a1c1e',
            shadowOffset: { width: 0, height: -12 },
            shadowOpacity: 0.12,
            shadowRadius: 48,
            elevation: 16,
          }}
        >
          {/* Drag handle */}
          <View className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-6 opacity-40" />

          {/* Header row */}
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-4">
              <View className="flex-row items-center gap-x-2 mb-1">
                {job.is_urgent && (
                  <View className="bg-tertiary-fixed px-3 py-1 rounded-full">
                    <Text className="text-on-tertiary-fixed-variant text-xs font-bold uppercase tracking-wider">
                      Urgent
                    </Text>
                  </View>
                )}
                <Text className="text-on-surface-variant text-xs font-semibold">
                  {job.category}
                </Text>
              </View>
              <Text className="text-xl font-extrabold text-on-surface leading-tight" numberOfLines={2}>
                {job.title}
              </Text>
              {job.address ? (
                <View className="flex-row items-center gap-x-1 mt-1">
                  <Ionicons name="location-outline" size={14} color="#43474e" />
                  <Text className="text-on-surface-variant text-sm font-medium" numberOfLines={1}>
                    {job.address}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="items-end">
              <Text className="text-2xl font-extrabold text-on-primary-container">
                ${job.payout > 0 ? job.payout : '—'}
              </Text>
              <Text className="text-xs text-on-surface-variant font-medium">Est. Payout</Text>
            </View>
          </View>

          {/* Info cards */}
          <View className="flex-row gap-x-4 mb-6">
            <View className="flex-1 bg-surface-container-low p-3 rounded-lg flex-row items-center gap-x-3">
              <View className="w-8 h-8 rounded-full bg-surface-container-highest items-center justify-center">
                <Ionicons name="time-outline" size={18} color="#455f88" />
              </View>
              <View>
                <Text className="text-xs text-on-surface-variant font-semibold leading-none mb-1">
                  Scheduled
                </Text>
                <Text className="text-xs font-bold text-on-surface">{formatWindow(job.scheduled_start)}</Text>
              </View>
            </View>

            <View className="flex-1 bg-surface-container-low p-3 rounded-lg flex-row items-center gap-x-3">
              <View className="w-8 h-8 rounded-full bg-surface-container-highest items-center justify-center">
                <Ionicons name="shield-checkmark-outline" size={18} color="#455f88" />
              </View>
              <View>
                <Text className="text-xs text-on-surface-variant font-semibold leading-none mb-1">
                  Show-up
                </Text>
                <Text className="text-xs font-bold text-on-surface">
                  ${job.show_up_fee} guaranteed
                </Text>
              </View>
            </View>
          </View>

          {/* CTA row */}
          <View className="flex-row gap-x-3">
            <Pressable
              className="flex-1 py-4 rounded-full items-center justify-center bg-surface-container-high"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              onPress={onViewDetails}
            >
              <Text className="text-on-surface font-extrabold text-base">View Details</Text>
            </Pressable>

            <Pressable
              className="flex-1 py-4 rounded-full items-center justify-center"
              style={({ pressed }) => ({
                backgroundColor: '#371800',
                opacity: pressed || isAccepting ? 0.85 : 1,
                shadowColor: '#371800',
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              })}
              onPress={onAccept}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-on-primary font-extrabold text-base">Accept</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default BottomJobSheet;
