export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// What to call someone: their Intern API title when we have it, otherwise
// the gateway role. Display only; permissions always use `role`.
export function roleLabel(e: { role: string; title?: string | null }): string {
  return e.title || e.role;
}

// "just now", "5 min ago", "3 h ago", "2 days ago", then a date: 12 Mar 2026
// (the year only once it isn't this year). Used for reviews and notifications.
export function timeAgo(iso: string): string {
  const date = new Date(iso);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  if (mins < 7 * 1440) return `${Math.round(mins / 1440)} day${mins < 2 * 1440 ? '' : 's'} ago`;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

// Full date and time for a hover tooltip.
export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
