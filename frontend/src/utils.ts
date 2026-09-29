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
