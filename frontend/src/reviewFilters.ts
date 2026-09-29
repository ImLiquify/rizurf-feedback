// Topic tags, search, star filter and sort for a list of reviews. Pure, so the
// profile and Me pages share it and it can be tested without a browser.

// ponytail: topics come from keywords in the review text, so existing reviews
// get tags with no extra input. If people need to tag explicitly, store a
// topics column and let the form set it.
export const TOPICS: Record<string, string[]> = {
  Communication: ['communicat', 'explain', 'clear', 'listen', 'update', 'heads-up', 'heads up', 'respond'],
  Teamwork: ['team', 'collaborat', 'help', 'support', 'together', 'unblock'],
  Leadership: ['lead', 'mentor', 'guid', 'ownership', 'initiative', 'decision'],
  Reliability: ['reliab', 'deadline', 'on time', 'late', 'consistent', 'dependable', 'follow through'],
  'Technical skill': ['code', 'technical', 'pr ', 'prs', 'bug', 'quality', 'skill', 'migration'],
  Attitude: ['attitude', 'positive', 'calm', 'friendly', 'respect', 'pressure', 'patient'],
};

export function topicsOf(text: string): string[] {
  const t = ` ${text.toLowerCase()} `;
  return Object.keys(TOPICS).filter((topic) => TOPICS[topic].some((word) => t.includes(word)));
}

export type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

export interface ReviewFilter {
  query: string;
  topic: string | null;
  stars: number | null;
  sort: SortKey;
}

export const NO_FILTER: ReviewFilter = { query: '', topic: null, stars: null, sort: 'newest' };

interface Filterable {
  body: string;
  rating: number;
  createdAt: string;
}

// `extraText` lets a search also match a name shown on the card.
export function filterReviews<T extends Filterable>(reviews: T[], f: ReviewFilter, extraText: (r: T) => string = () => ''): T[] {
  const q = f.query.trim().toLowerCase();
  const out = reviews.filter(
    (r) =>
      (!q || `${r.body} ${extraText(r)}`.toLowerCase().includes(q)) &&
      (!f.topic || topicsOf(r.body).includes(f.topic)) &&
      (!f.stars || r.rating === f.stars),
  );
  const time = (r: T) => new Date(r.createdAt).getTime();
  const by: Record<SortKey, (a: T, b: T) => number> = {
    newest: (a, b) => time(b) - time(a),
    oldest: (a, b) => time(a) - time(b),
    highest: (a, b) => b.rating - a.rating || time(b) - time(a),
    lowest: (a, b) => a.rating - b.rating || time(b) - time(a),
  };
  return out.sort(by[f.sort]);
}

// Topic chips with how many reviews mention each; only topics that appear.
export function topicCounts(reviews: Filterable[]): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of reviews) for (const t of topicsOf(r.body)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return Object.keys(TOPICS)
    .filter((t) => counts.has(t))
    .map((topic) => ({ topic, count: counts.get(topic)! }));
}
