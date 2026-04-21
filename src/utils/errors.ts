// Supabase's `PostgrestError` is a plain object, not an `Error` subclass, so
// `err instanceof Error` returns false and `err.message` is untyped. This
// helper normalizes any thrown or returned error shape into a user-facing
// string.

interface PostgrestLike {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
}

export const getErrorMessage = (
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (!err) return fallback;
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string') return err || fallback;

  if (typeof err === 'object') {
    const obj = err as PostgrestLike;
    if (typeof obj.message === 'string' && obj.message) return obj.message;
    if (typeof obj.details === 'string' && obj.details) return obj.details;
    if (typeof obj.hint === 'string' && obj.hint) return obj.hint;
  }

  return fallback;
};
