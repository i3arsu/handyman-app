export const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  const initials = name
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return initials || '?';
};

export const formatJobDate = (iso: string | null, fallback = 'Flexible'): string => {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
