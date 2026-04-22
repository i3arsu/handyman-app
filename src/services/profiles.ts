import { supabase } from '@/services/supabase';
import { Profile } from '@/types/database';

type ProfileLite = Partial<Profile> & { id: string };

// Module-level cache: keyed by "columns|id". A given column set is stable per
// callsite, so this is effectively a per-shape id→row cache that survives
// across hook remounts and realtime re-fetches.
const cache = new Map<string, ProfileLite>();

const keyFor = (columns: string, id: string): string => `${columns}|${id}`;

/**
 * Batch-resolve profile rows by id, returning a `{ [id]: row }` map.
 *
 * Caches by `columns` string so two callsites requesting different column sets
 * don't poison each other. Hits the network only for ids not already cached.
 */
export const fetchProfilesByIds = async <T extends ProfileLite = Profile>(
  ids: string[],
  columns = 'id, email, full_name, avatar_url, role, created_at',
): Promise<Record<string, T>> => {
  const unique = Array.from(new Set(ids));
  const missing = unique.filter(id => !cache.has(keyFor(columns, id)));

  if (missing.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select(columns)
      .in('id', missing);

    if (error) throw error;

    for (const row of (data ?? []) as unknown as ProfileLite[]) {
      cache.set(keyFor(columns, row.id), row);
    }
  }

  const out: Record<string, T> = {};
  for (const id of unique) {
    const row = cache.get(keyFor(columns, id));
    if (row) out[id] = row as T;
  }
  return out;
};

/** Drop cached entries — call on sign-out so a new user doesn't see stale names. */
export const clearProfilesCache = (): void => {
  cache.clear();
};

/** Invalidate a single profile id across all column variants (e.g. after edit). */
export const invalidateProfile = (id: string): void => {
  for (const key of Array.from(cache.keys())) {
    if (key.endsWith(`|${id}`)) cache.delete(key);
  }
};
