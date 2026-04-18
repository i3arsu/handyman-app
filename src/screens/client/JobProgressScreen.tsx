import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { useJob } from '@/hooks/useJob';
import { supabase } from '@/services/supabase';
import { ClientStackParamList } from '@/types/navigation';
import { Job, JobStatus } from '@/types/database';

type JobProgressNavigationProp = NativeStackNavigationProp<ClientStackParamList, 'JobProgress'>;
type JobProgressRouteProp = RouteProp<ClientStackParamList, 'JobProgress'>;

interface JobProgressScreenProps {
  navigation: JobProgressNavigationProp;
  route: JobProgressRouteProp;
}

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  Plumbing:    { icon: 'water-outline',       bg: '#ffdcc5' },
  Electrical:  { icon: 'flash-outline',        bg: '#9ff5c1' },
  HVAC:        { icon: 'thermometer-outline',  bg: '#9ff5c1' },
  Painting:    { icon: 'brush-outline',        bg: '#e9e7eb' },
  Locksmith:   { icon: 'key-outline',          bg: '#d6e3ff' },
  Tiling:      { icon: 'grid-outline',         bg: '#ffdcc5' },
  Carpentry:   { icon: 'hammer-outline',       bg: '#e9e7eb' },
  General:     { icon: 'construct-outline',    bg: '#e9e7eb' },
};

const STATUS_CONFIG: Record<JobStatus, { label: string; bg: string; text: string }> = {
  open:        { label: 'Awaiting Pro',  bg: '#e9e7eb', text: '#43474e' },
  accepted:    { label: 'Scheduled',     bg: '#b6d0ff', text: '#3f5882' },
  in_progress: { label: 'In Progress',   bg: '#9ff5c1', text: '#005231' },
  completed:   { label: 'Completed',     bg: '#e9e7eb', text: '#43474e' },
  cancelled:   { label: 'Cancelled',     bg: '#ffdad6', text: '#93000a' },
};

const formatDate = (iso: string | null): string => {
  if (!iso) return 'Flexible';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
};

const formatTime = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// ─── Progress stages ──────────────────────────────────────────────────────────
interface Stage {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
}

const STAGES: Stage[] = [
  { icon: 'checkmark-circle',  label: 'Accepted',            sub: 'Pro confirmed your request' },
  { icon: 'car-outline',       label: 'On the Way',          sub: 'Handyman is traveling to you' },
  { icon: 'hammer-outline',    label: 'Work in Progress',    sub: 'Estimated duration: 45–60 mins' },
  { icon: 'card-outline',      label: 'Completed & Payment', sub: 'Review and finalise the service' },
];

const statusToStage = (status: JobStatus): number => {
  switch (status) {
    case 'accepted':    return 1;
    case 'in_progress': return 2;
    case 'completed':   return 3;
    default:            return -1;
  }
};

// ─── Map canvas placeholder ───────────────────────────────────────────────────
const MapCanvas = ({ address }: { address: string | null }) => (
  <View className="rounded-xl overflow-hidden" style={{ height: 200 }}>
    <View className="flex-1 bg-surface-container-high">
      {[20, 40, 60, 80].map(p => (
        <View key={`h${p}`} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: 1, backgroundColor: 'rgba(196,198,207,0.4)' }} />
      ))}
      {[20, 40, 60, 80].map(p => (
        <View key={`v${p}`} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(196,198,207,0.4)' }} />
      ))}
      <View style={{ position: 'absolute', top: '35%', left: '5%', width: '45%', height: 7, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 4 }} />
      <View style={{ position: 'absolute', top: '55%', left: '30%', width: '60%', height: 7, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 4 }} />
      <View style={{ position: 'absolute', top: '15%', left: '62%', width: 7, height: '50%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 4 }} />

      {/* Moving car pin */}
      <View style={{ position: 'absolute', top: '33%', left: '54%', width: 36, height: 36, borderRadius: 18, backgroundColor: '#455f88', alignItems: 'center', justifyContent: 'center', shadowColor: '#455f88', shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }}>
        <Ionicons name="car" size={16} color="#ffffff" />
      </View>
      {/* Destination pin */}
      <View style={{ position: 'absolute', top: '52%', left: '22%' }}>
        <View style={{ position: 'absolute', top: -6, left: -6, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(55,24,0,0.12)' }} />
        <View style={{ padding: 9, borderRadius: 999, backgroundColor: '#371800', borderWidth: 2, borderColor: '#ffffff', shadowColor: '#371800', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
          <Ionicons name="home" size={14} color="#ffffff" />
        </View>
      </View>
    </View>

    {/* Address overlay */}
    {address ? (
      <View
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          backgroundColor: 'rgba(250,249,253,0.94)',
          borderRadius: 12,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Ionicons name="location-outline" size={16} color="#371800" />
        <View className="flex-1">
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
            Service Location
          </Text>
          <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>
    ) : null}
  </View>
);

// ─── Assigned pro card ────────────────────────────────────────────────────────
interface ProCardProps {
  name: string;
  initials: string;
  status: JobStatus;
  jobId: string;
  onChat: () => void;
}

const ProCard = ({ name, initials, status, onChat }: ProCardProps) => (
  <View
    className="bg-surface-container-lowest rounded-xl p-5 flex-row items-center gap-x-4"
    style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
  >
    <View className="relative">
      <View className="w-14 h-14 rounded-full bg-secondary items-center justify-center">
        <Text className="text-white font-extrabold text-base">{initials}</Text>
      </View>
      <View
        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white items-center justify-center"
        style={{ backgroundColor: '#9ff5c1' }}
      >
        <Ionicons name="checkmark" size={10} color="#005231" />
      </View>
    </View>

    <View className="flex-1">
      <Text className="font-extrabold text-base text-on-surface">{name}</Text>
      <Text className="text-xs text-on-surface-variant mt-0.5">
        {status === 'accepted'    ? 'En route • Est. 8 mins away' :
         status === 'in_progress' ? 'Currently working on site' :
         status === 'completed'   ? 'Job completed' : ''}
      </Text>
    </View>

    <View className="flex-row gap-x-2">
      <Pressable
        className="w-10 h-10 rounded-full bg-secondary-fixed items-center justify-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Ionicons name="call-outline" size={18} color="#3f5882" />
      </Pressable>
      <Pressable
        className="w-10 h-10 rounded-full bg-primary items-center justify-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, shadowColor: '#371800', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 })}
        onPress={onChat}
      >
        <Ionicons name="chatbubble-outline" size={17} color="#ffffff" />
      </Pressable>
    </View>
  </View>
);

// ─── Progress timeline ────────────────────────────────────────────────────────
const ProgressTimeline = ({ activeStage }: { activeStage: number }) => (
  <View className="bg-surface-container-low rounded-xl p-6">
    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-5">
      Job Progress
    </Text>
    <View style={{ position: 'relative' }}>
      <View style={{ position: 'absolute', left: 19, top: 20, bottom: 20, width: 2, backgroundColor: 'rgba(196,198,207,0.35)' }} />
      {STAGES.map((stage, idx) => {
        const isDone   = idx <= activeStage;
        const isActive = idx === activeStage;
        const isFuture = idx > activeStage;
        return (
          <View
            key={stage.label}
            style={{ flexDirection: 'row', gap: 20, paddingBottom: idx < STAGES.length - 1 ? 28 : 0 }}
          >
            {isDone && idx < activeStage && (
              <View style={{ position: 'absolute', left: 19, top: 20, height: 28, width: 2, backgroundColor: '#9ff5c1', zIndex: 0 }} />
            )}
            <View
              style={{
                zIndex: 1, width: 40, height: 40, borderRadius: 20,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 4, borderColor: '#f4f3f7',
                backgroundColor: isDone && !isActive ? '#9ff5c1' : isActive ? '#572900' : '#e3e2e6',
              }}
            >
              <Ionicons
                name={stage.icon}
                size={18}
                color={isDone && !isActive ? '#005231' : isActive ? '#e98633' : '#74777f'}
              />
            </View>
            <View style={{ paddingTop: 8, flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: isActive ? '#371800' : isFuture ? '#74777f' : '#1a1c1e', opacity: isFuture ? 0.5 : 1 }}>
                {stage.label}
              </Text>
              <Text style={{ fontSize: 12, color: '#43474e', marginTop: 2, opacity: isFuture ? 0.45 : 1, lineHeight: 18 }}>
                {stage.sub}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  </View>
);

// ─── Info tile ────────────────────────────────────────────────────────────────
const InfoTile = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
  <View className="flex-1 bg-surface-container-low rounded-xl p-4">
    <View className="w-7 h-7 rounded-full bg-surface-container items-center justify-center mb-2">
      <Ionicons name={icon} size={14} color="#455f88" />
    </View>
    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{label}</Text>
    <Text className="text-sm font-extrabold text-on-surface">{value}</Text>
  </View>
);

// ─── Awaiting state card ──────────────────────────────────────────────────────
const AwaitingCard = () => (
  <View
    className="rounded-xl p-5 flex-row items-center gap-x-4"
    style={{ backgroundColor: 'rgba(55,24,0,0.05)', borderLeftWidth: 3, borderLeftColor: '#371800' }}
  >
    <View className="w-10 h-10 rounded-full bg-surface-container-lowest items-center justify-center">
      <Ionicons name="search-outline" size={20} color="#371800" />
    </View>
    <View className="flex-1">
      <Text className="font-extrabold text-primary text-sm mb-0.5">Searching for a Pro</Text>
      <Text className="text-xs text-on-surface-variant leading-relaxed">
        Verified handymen in your area are being notified. You'll hear back soon.
      </Text>
    </View>
  </View>
);

// ─── Applicant row ────────────────────────────────────────────────────────────
interface ApplicantRowProps {
  name: string;
  initials: string;
  onChat: () => void;
  onAccept: () => void;
  isAccepting: boolean;
}

const ApplicantRow = ({ name, initials, onChat, onAccept, isAccepting }: ApplicantRowProps) => (
  <View
    className="bg-surface-container-lowest rounded-xl p-4 mb-3 flex-row items-center gap-x-3"
    style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
  >
    <View className="w-11 h-11 rounded-full bg-secondary items-center justify-center">
      <Text className="text-white font-extrabold text-sm">{initials}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-xs font-medium text-on-surface-variant leading-none mb-0.5">
        Handyman
      </Text>
      <Text className="text-sm font-extrabold text-on-surface" numberOfLines={1}>
        {name}
      </Text>
    </View>
    <Pressable
      className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      onPress={onChat}
    >
      <Ionicons name="chatbubble-outline" size={16} color="#371800" />
    </Pressable>
    <Pressable
      onPress={onAccept}
      disabled={isAccepting}
      style={({ pressed }) => ({
        opacity: pressed || isAccepting ? 0.85 : 1,
      })}
    >
      <View className="px-4 py-2.5 rounded-full bg-primary">
        {isAccepting ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text className="text-white text-sm font-extrabold">Accept</Text>
        )}
      </View>
    </Pressable>
  </View>
);

interface Applicant { handymanId: string; name: string; initials: string; }

const getApplicants = (job: Job): Applicant[] => {
  const apps = job.job_applications ?? [];
  return apps
    .filter(a => a.status === 'pending' && a.handyman?.id)
    .map<Applicant>(a => {
      const name = a.handyman?.full_name ?? 'Handyman';
      const initials = name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
      return { handymanId: a.handyman!.id, name, initials };
    });
};

// ─── Helper: extract accepted handyman from job ───────────────────────────────
const getHandyman = (job: Job): { name: string; initials: string } | null => {
  const apps = job.job_applications ?? [];
  const accepted = apps.find(a => a.status === 'accepted');
  const name = accepted?.handyman?.full_name ?? null;
  if (!name) return null;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return { name, initials };
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const JobProgressScreen = ({ navigation, route }: JobProgressScreenProps) => {
  const { jobId } = route.params;
  const { job, isLoading, error } = useJob(jobId);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleAcceptApplicant = async (handymanId: string) => {
    setAcceptingId(handymanId);
    try {
      const { error: appsError } = await supabase
        .from('job_applications')
        .update({ status: 'rejected' })
        .eq('job_id', jobId)
        .neq('handyman_id', handymanId);

      if (appsError) {
        Alert.alert('Error', appsError.message);
        return;
      }

      const { error: acceptError } = await supabase
        .from('job_applications')
        .update({ status: 'accepted' })
        .eq('job_id', jobId)
        .eq('handyman_id', handymanId);

      if (acceptError) {
        Alert.alert('Error', acceptError.message);
        return;
      }

      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'accepted', handyman_id: handymanId })
        .eq('id', jobId);

      if (jobError) {
        Alert.alert('Error', jobError.message);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleChatApplicant = (applicant: Applicant) => {
    navigation.navigate('Chat', {
      jobId,
      counterpartyName: applicant.name,
      counterpartyInitials: applicant.initials,
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Job',
      'Are you sure you want to cancel this request?',
      [
        { text: 'Keep Job', style: 'cancel' },
        {
          text: 'Cancel Job',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', jobId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#371800" />
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#ba1a1a" />
        <Text className="text-error text-center mt-3 font-medium">{error ?? 'Job not found.'}</Text>
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_CONFIG[job.status];
  const catConfig = CATEGORY_ICONS[job.category] ?? CATEGORY_ICONS.General;
  const handyman   = getHandyman(job);
  const applicants = getApplicants(job);
  const activeStage = statusToStage(job.status);
  const shortId = job.id.slice(0, 8).toUpperCase();
  const isActive = job.status === 'accepted' || job.status === 'in_progress';
  const canCancel = job.status === 'open' || job.status === 'accepted';

  return (
    <SafeAreaView className="flex-1 bg-surface">

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center gap-x-3">
          <Pressable
            className="p-2 rounded-full"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: pressed ? '#efedf1' : 'transparent' })}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#371800" />
          </Pressable>
          <Text className="text-lg font-extrabold text-primary tracking-tight">Job Details</Text>
        </View>
        <Pressable
          className="w-10 h-10 rounded-full bg-surface-container-low items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color="#371800" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <View className="mb-6">
          <View className="flex-row items-center gap-x-3 mb-4">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: statusCfg.bg }}>
              <Text className="text-xs font-extrabold uppercase tracking-wider" style={{ color: statusCfg.text }}>
                {statusCfg.label}
              </Text>
            </View>
            {job.is_urgent && (
              <View className="bg-tertiary-fixed px-3 py-1 rounded-full">
                <Text className="text-on-tertiary-fixed-variant text-xs font-extrabold uppercase tracking-wider">
                  Urgent
                </Text>
              </View>
            )}
            <Text className="text-on-surface-variant text-xs font-semibold">#{shortId}</Text>
          </View>

          <View className="flex-row items-start gap-x-4 mb-3">
            <View
              className="w-14 h-14 rounded-xl items-center justify-center flex-shrink-0"
              style={{ backgroundColor: catConfig.bg }}
            >
              <Ionicons name={catConfig.icon} size={24} color="#703700" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                {job.category}
              </Text>
              <Text className="text-3xl font-extrabold text-on-surface leading-tight tracking-tight">
                {job.title}
              </Text>
            </View>
          </View>

          {job.description ? (
            <Text className="text-on-surface-variant leading-relaxed text-sm mt-1">
              {job.description}
            </Text>
          ) : null}
        </View>

        {/* ── Map + address ──────────────────────────────────────────────── */}
        <View className="mb-5">
          <MapCanvas address={job.address} />
        </View>

        {/* ── Schedule tiles ─────────────────────────────────────────────── */}
        <View className="flex-row gap-x-3 mb-5">
          <InfoTile label="Date"    value={formatDate(job.scheduled_start)} icon="calendar-outline" />
          <InfoTile label="Arrival" value={formatTime(job.scheduled_start)} icon="time-outline" />
          <InfoTile label="Payout"  value={job.payout > 0 ? `$${job.payout}` : 'TBD'} icon="cash-outline" />
        </View>

        {/* ── Awaiting / Applicants state ────────────────────────────────── */}
        {job.status === 'open' && (
          <View className="mb-5">
            {applicants.length === 0 ? (
              <AwaitingCard />
            ) : (
              <>
                <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  {applicants.length} Applicant{applicants.length !== 1 ? 's' : ''}
                </Text>
                {applicants.map((a) => (
                  <ApplicantRow
                    key={a.handymanId}
                    name={a.name}
                    initials={a.initials}
                    onChat={() => handleChatApplicant(a)}
                    onAccept={() => handleAcceptApplicant(a.handymanId)}
                    isAccepting={acceptingId === a.handymanId}
                  />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── Assigned pro card ──────────────────────────────────────────── */}
        {handyman && isActive && (
          <View className="mb-5">
            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
              Your Pro
            </Text>
            <ProCard
              name={handyman.name}
              initials={handyman.initials}
              status={job.status}
              jobId={jobId}
              onChat={() =>
                navigation.navigate('Chat', {
                  jobId,
                  counterpartyName: handyman.name,
                  counterpartyInitials: handyman.initials,
                })
              }
            />
          </View>
        )}

        {/* ── Progress timeline (accepted / in_progress / completed) ─────── */}
        {activeStage >= 0 && (
          <View className="mb-5">
            <ProgressTimeline activeStage={activeStage} />
          </View>
        )}

        {/* ── Completed state ────────────────────────────────────────────── */}
        {job.status === 'completed' && (
          <View className="bg-tertiary-fixed rounded-xl p-5 flex-row items-center gap-x-4 mb-5">
            <View className="w-10 h-10 rounded-full bg-surface-container-lowest items-center justify-center">
              <Ionicons name="checkmark-circle" size={22} color="#005231" />
            </View>
            <View className="flex-1">
              <Text className="font-extrabold text-on-tertiary-fixed-variant mb-0.5">Job Completed</Text>
              <Text className="text-xs text-on-tertiary-fixed-variant leading-relaxed" style={{ opacity: 0.75 }}>
                Thank you for using Reliant Home. Your pro did great work!
              </Text>
            </View>
          </View>
        )}

        {/* ── Summary + actions ──────────────────────────────────────────── */}
        <View
          className="bg-surface-container-lowest rounded-xl p-6"
          style={{ shadowColor: '#1a1c1e', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
        >
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-on-surface-variant font-medium">Estimated Total</Text>
            <Text className="text-2xl font-extrabold text-on-surface">
              {job.payout > 0 ? `$${job.payout.toFixed(2)}` : 'TBD'}
            </Text>
          </View>

          <View className="flex-row gap-x-3">
            {canCancel ? (
              <Pressable
                className="flex-1 py-4 rounded-full bg-surface-container-high items-center justify-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                onPress={handleCancel}
              >
                <Text className="font-extrabold text-on-surface-variant">Cancel Job</Text>
              </Pressable>
            ) : (
              <View className="flex-1 py-4 rounded-full bg-surface-container-low items-center justify-center">
                <Text className="font-extrabold text-on-surface-variant opacity-40">
                  {job.status === 'completed' ? 'Job Closed' : 'Cancelled'}
                </Text>
              </View>
            )}

            <Pressable
              className="flex-1 py-4 rounded-full bg-primary items-center justify-center"
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                shadowColor: '#371800',
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
              })}
            >
              <Text className="font-extrabold text-white">Help Center</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default JobProgressScreen;
