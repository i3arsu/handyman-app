import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getCategoryIcon, StatusBadgeConfig } from '@/constants/jobs';
import { formatJobDate, getInitials } from '@/utils/format';
import { Job } from '@/types/database';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface JobListCardCounterparty {
  name: string | null;
  label: string;
}

export interface JobListCardAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'muted';
}

export interface JobListCardIconAction {
  icon: IoniconName;
  onPress: () => void;
  accessibilityLabel?: string;
  badgeCount?: number;
}

interface JobListCardProps {
  job: Job;
  badge: StatusBadgeConfig;
  counterparty?: JobListCardCounterparty | null;
  primaryAction: JobListCardAction;
  secondaryAction?: JobListCardIconAction;
  onPress?: () => void;
}

const SearchingCounterparty = () => (
  <View className="flex-row items-center gap-x-3 flex-1">
    <View className="w-9 h-9 rounded-full bg-surface-container items-center justify-center">
      <Ionicons name="search-outline" size={16} color="#43474e" />
    </View>
    <View className="flex-1">
      <Text className="text-xs font-medium text-on-surface-variant leading-none mb-0.5">
        Searching...
      </Text>
      <Text className="text-sm font-extrabold text-on-surface">Assigning soon</Text>
    </View>
  </View>
);

export const JobListCard = ({
  job,
  badge,
  counterparty,
  primaryAction,
  secondaryAction,
  onPress,
}: JobListCardProps) => {
  const cat = getCategoryIcon(job.category);
  const hasCounterpartyName = !!counterparty?.name;
  const primaryMuted = primaryAction.variant === 'muted';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="bg-surface-container-lowest rounded-xl p-5 mb-4"
      style={({ pressed }) => ({
        opacity: pressed && onPress ? 0.95 : 1,
        shadowColor: '#1a1c1e',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      })}
    >
      {/* Header row */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-start gap-x-3 flex-1 pr-2">
          <View
            className="w-12 h-12 rounded-lg items-center justify-center"
            style={{ backgroundColor: cat.bg }}
          >
            <Ionicons name={cat.icon} size={22} color="#703700" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-on-surface leading-tight" numberOfLines={2}>
              {job.title}
            </Text>
            <View className="flex-row items-center gap-x-1 mt-1">
              <Ionicons name="calendar-outline" size={12} color="#43474e" />
              <Text className="text-xs text-on-surface-variant font-medium">
                {formatJobDate(job.scheduled_start, 'No date set')}
              </Text>
            </View>
          </View>
        </View>
        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: badge.bg }}>
          <Text
            className="text-xs font-extrabold uppercase tracking-wider"
            style={{ color: badge.fg }}
          >
            {badge.label}
          </Text>
        </View>
      </View>

      {/* Footer row */}
      <View className="flex-row items-center justify-between pt-4 border-t border-surface-container">
        {counterparty && hasCounterpartyName ? (
          <View className="flex-row items-center gap-x-3 flex-1">
            <View className="w-9 h-9 rounded-full bg-secondary items-center justify-center">
              <Text className="text-white font-extrabold text-xs">
                {getInitials(counterparty.name)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-on-surface-variant leading-none mb-0.5">
                {counterparty.label}
              </Text>
              <Text className="text-sm font-extrabold text-on-surface" numberOfLines={1}>
                {counterparty.name}
              </Text>
            </View>
          </View>
        ) : (
          <SearchingCounterparty />
        )}

        <View className="flex-row gap-x-2">
          {secondaryAction && (
            <Pressable
              className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              onPress={secondaryAction.onPress}
              accessibilityLabel={secondaryAction.accessibilityLabel}
            >
              <Ionicons name={secondaryAction.icon} size={16} color="#371800" />
              {secondaryAction.badgeCount && secondaryAction.badgeCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    borderRadius: 9,
                    backgroundColor: '#ba1a1a',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>
                    {secondaryAction.badgeCount > 9 ? '9+' : secondaryAction.badgeCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )}
          <Pressable
            onPress={primaryAction.onPress}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: '#371800',
              shadowOpacity: primaryMuted ? 0 : 0.15,
              shadowRadius: 6,
              elevation: primaryMuted ? 0 : 2,
            })}
          >
            <View
              className="px-5 py-2.5 rounded-full"
              style={{ backgroundColor: primaryMuted ? '#f4f3f7' : '#371800' }}
            >
              <Text
                className="text-sm font-extrabold"
                style={{ color: primaryMuted ? '#1a1c1e' : '#ffffff' }}
              >
                {primaryAction.label}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};
