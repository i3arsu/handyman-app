import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useJobMessages } from '@/hooks/useJobMessages';
import { useJob } from '@/hooks/useJob';
import { useAuth } from '@/store/AuthContext';
import { ClientStackParamList, HandymanStackParamList } from '@/types/navigation';
import { Message, JobStatus } from '@/types/database';

// Works under either stack — both have a "Chat" route with identical params.
type ChatRouteParams =
  | RouteProp<ClientStackParamList, 'Chat'>
  | RouteProp<HandymanStackParamList, 'Chat'>;

// ─── Category → icon ──────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  Plumbing:   { icon: 'water-outline',      tint: '#3f5882' },
  Electrical: { icon: 'flash-outline',       tint: '#005231' },
  HVAC:       { icon: 'thermometer-outline', tint: '#005231' },
  Painting:   { icon: 'brush-outline',       tint: '#43474e' },
  Locksmith:  { icon: 'key-outline',         tint: '#3f5882' },
  Tiling:     { icon: 'grid-outline',        tint: '#703700' },
  Carpentry:  { icon: 'hammer-outline',      tint: '#43474e' },
  General:    { icon: 'construct-outline',   tint: '#43474e' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const isSameDay = (a: string, b: string): boolean =>
  new Date(a).toDateString() === new Date(b).toDateString();

const formatDateLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const STATUS_COPY: Record<JobStatus, { label: string; color: string }> = {
  open:        { label: 'Awaiting acceptance', color: '#e98633' },
  accepted:    { label: 'Job accepted',        color: '#005231' },
  in_progress: { label: 'Work in progress',    color: '#005231' },
  completed:   { label: 'Completed',           color: '#43474e' },
  cancelled:   { label: 'Cancelled',           color: '#ba1a1a' },
};

// ─── Bubble ───────────────────────────────────────────────────────────────────
interface BubbleProps {
  message: Message;
  isMine: boolean;
}

const Bubble = ({ message, isMine }: BubbleProps) => (
  <View
    style={{
      alignSelf: isMine ? 'flex-end' : 'flex-start',
      maxWidth: '82%',
      marginBottom: 16,
    }}
  >
    <View
      style={{
        padding: 14,
        borderRadius: 18,
        borderTopLeftRadius: isMine ? 18 : 4,
        borderTopRightRadius: isMine ? 4 : 18,
        backgroundColor: isMine ? '#371800' : '#ffffff',
        shadowColor: '#1a1c1e',
        shadowOpacity: isMine ? 0.15 : 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: isMine ? 3 : 1,
      }}
    >
      <Text style={{ fontSize: 15, lineHeight: 22, color: isMine ? '#ffffff' : '#1a1c1e' }}>
        {message.content}
      </Text>
    </View>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        marginRight: isMine ? 2 : 0,
        marginLeft: isMine ? 0 : 2,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#74777f', textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {formatTime(message.created_at)}
      </Text>
      {isMine && (
        <Ionicons name="checkmark-done" size={13} color="#83d8a6" />
      )}
    </View>
  </View>
);

// ─── Date divider ─────────────────────────────────────────────────────────────
const DateDivider = ({ label }: { label: string }) => (
  <View className="items-center my-6">
    <View className="px-4 py-1 bg-surface-container rounded-full">
      <Text className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest">{label}</Text>
    </View>
  </View>
);

// ─── Context card ─────────────────────────────────────────────────────────────
interface ContextCardProps {
  jobId: string;
  jobTitle: string | null;
  category: string | null;
  status: JobStatus | null;
}

const ContextCard = ({ jobId, jobTitle, category, status }: ContextCardProps) => {
  const cat = CATEGORY_ICONS[category ?? 'General'] ?? CATEGORY_ICONS.General;
  const statusInfo = status ? STATUS_COPY[status] : null;

  return (
    <View className="bg-surface-container-low p-5 rounded-xl my-6">
      <View className="flex-row items-center gap-x-3 mb-4">
        <View className="w-12 h-12 bg-secondary-container rounded-xl items-center justify-center" style={{ opacity: 0.7 }}>
          <Ionicons name={cat.icon} size={22} color={cat.tint} />
        </View>
        <View className="flex-1">
          <Text className="font-extrabold text-on-surface" numberOfLines={1}>
            {jobTitle ?? 'Active Job'}
          </Text>
          <Text className="text-sm text-on-surface-variant">ID: #{jobId.slice(0, 8).toUpperCase()}</Text>
        </View>
      </View>
      <View className="flex-row gap-x-3">
        <View className="flex-1 bg-surface-container-lowest p-3 rounded-lg">
          <Text className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Category</Text>
          <Text className="text-sm font-extrabold text-on-surface">{category ?? '—'}</Text>
        </View>
        <View className="flex-1 bg-surface-container-lowest p-3 rounded-lg">
          <Text className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Status</Text>
          <Text
            className="text-sm font-extrabold"
            style={{ color: statusInfo?.color ?? '#43474e' }}
          >
            {statusInfo?.label ?? '—'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ChatRouteParams>();
  const { jobId, counterpartyName, counterpartyInitials } = route.params;

  const { user } = useAuth();
  const { job } = useJob(jobId);
  const { messages, isLoading, error: chatError, sendMessage } = useJobMessages(jobId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (chatError) {
      Alert.alert('Chat error', chatError);
    }
  }, [chatError]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || !user) return;
    const content = draft;
    setDraft('');
    await sendMessage(content, user.id);
  };

  const firstName = counterpartyName.split(' ')[0];

  const renderMessages = () => {
    const elements: React.ReactNode[] = [];
    messages.forEach((msg, idx) => {
      const prevMsg = messages[idx - 1];
      if (!prevMsg || !isSameDay(prevMsg.created_at, msg.created_at)) {
        elements.push(<DateDivider key={`date-${msg.id}`} label={formatDateLabel(msg.created_at)} />);
      }
      elements.push(
        <Bubble key={msg.id} message={msg} isMine={msg.sender_id === user?.id} />,
      );
    });
    return elements;
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-6 py-4 bg-surface"
        style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
      >
        <View className="flex-row items-center gap-x-3">
          <Pressable
            className="p-2 rounded-full"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: pressed ? '#efedf1' : 'transparent' })}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#371800" />
          </Pressable>
          <View className="relative">
            <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center" style={{ borderWidth: 2, borderColor: '#9ff5c1' }}>
              <Text className="text-white font-extrabold text-sm">{counterpartyInitials}</Text>
            </View>
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary-fixed border-2 border-white" />
          </View>
          <View>
            <Text className="font-extrabold text-lg text-primary tracking-tight">{counterpartyName}</Text>
            <View className="flex-row items-center gap-x-1.5">
              <View className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
              <Text className="text-xs font-semibold text-on-tertiary-container">Online Now</Text>
            </View>
          </View>
        </View>
        <View className="flex-row gap-x-2">
          <Pressable
            className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="call-outline" size={18} color="#371800" />
          </Pressable>
          <Pressable
            className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#371800" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#371800" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            className="flex-1 px-5"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ContextCard
              jobId={jobId}
              jobTitle={job?.title ?? null}
              category={job?.category ?? null}
              status={job?.status ?? null}
            />

            {messages.length === 0 ? (
              <View className="items-center py-12">
                <View className="w-16 h-16 rounded-full bg-surface-container items-center justify-center mb-4">
                  <Ionicons name="chatbubbles-outline" size={28} color="#74777f" />
                </View>
                <Text className="font-extrabold text-on-surface text-center">No messages yet</Text>
                <Text className="text-on-surface-variant text-sm text-center mt-1">
                  Send a message to {firstName}
                </Text>
              </View>
            ) : (
              renderMessages()
            )}
          </ScrollView>
        )}

        {/* Input bar */}
        <View
          className="flex-row items-center gap-x-3 px-5 py-4 bg-surface"
          style={{ paddingBottom: Platform.OS === 'ios' ? 8 : 12, shadowColor: '#1a1c1e', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 4 }}
        >
          <Pressable
            className="w-12 h-12 rounded-full bg-surface-container-highest items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}
          >
            <Ionicons name="add" size={22} color="#371800" />
          </Pressable>

          <View className="flex-1 bg-surface-container-highest rounded-full px-5 justify-center" style={{ height: 48 }}>
            <TextInput
              placeholder={`Message ${firstName}…`}
              placeholderTextColor="#74777f"
              className="text-sm text-on-surface"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline={false}
            />
          </View>

          <Pressable
            className="w-12 h-12 rounded-full bg-primary items-center justify-center"
            style={({ pressed }) => ({
              opacity: pressed || !draft.trim() ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.9 : 1 }],
              shadowColor: '#371800',
              shadowOpacity: draft.trim() ? 0.25 : 0,
              shadowRadius: 8,
              elevation: draft.trim() ? 3 : 0,
            })}
            onPress={handleSend}
            disabled={!draft.trim()}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
