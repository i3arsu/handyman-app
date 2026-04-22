import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage-backed last-read timestamp per job chat.
// Client-only — cross-device state isn't worth a server round-trip for MVP.
const KEY_PREFIX = '@chatRead:';

type Listener = (jobId: string) => void;
const listeners = new Set<Listener>();

export const markChatRead = async (jobId: string): Promise<void> => {
  await AsyncStorage.setItem(`${KEY_PREFIX}${jobId}`, new Date().toISOString());
  listeners.forEach((l) => l(jobId));
};

export const getChatReadAt = async (jobId: string): Promise<string | null> =>
  AsyncStorage.getItem(`${KEY_PREFIX}${jobId}`);

export const subscribeChatReads = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
