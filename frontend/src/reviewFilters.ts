// Topic tags, search, star filter and sort for a list of reviews. Pure, so the
// profile and Me pages share it and it can be tested without a browser.

// ponytail: tags come from keywords in the review text, so existing reviews
// get tags with no extra input. Keywords match whole words; a trailing * also
// matches longer forms ("help*" → helpful, helped). If people need to tag
// explicitly, store a topics column and let the form set it.
export const TOPICS: Record<string, string[]> = {
  'Great work': ['excellent', 'amazing', 'best work', 'great work', 'good work', 'goat*', 'legend*', 'talented', 'skilled'],
  'Poor performance': ['worst', 'bad job', 'useless', 'terrible*', 'incompetent', 'poor*', 'cooked', 'cant even do', "can't even do", 'properly'],
  Friendly: ['friendly', 'kind', 'nice', 'chill', 'sweet', 'welcoming', 'approachable', 'great person'],
  'Mean / rude': ['mean', 'meanest', 'bad attitude', 'worst attitude', 'rude*', 'toxic', 'arrogant', 'disrespect*', 'hostile', "isn't a good person", 'not a good person'],
  Helpful: ['help*', 'support*', 'assist*', 'unblock*'],
  Hardworking: ['hardworking', 'hard working', 'hard-working', 'dedicated', 'diligent', 'committed', 'hustle*'],
  Lazy: ['lazy', 'slack*', 'even does', 'is he doing', 'is she doing', 'he even do', 'she even do'],
  Communication: ['communicat*', 'explain*', 'listen*', 'respond*', 'responsive', 'clear*', 'update*', 'heads-up', 'heads up'],
  Talkative: ['yap*', 'talk*', 'chatty', 'gossip*'],
  'As HR': ['hr', 'human resources'],
  Leadership: ['lead*', 'mentor*', 'guid*', 'ownership', 'initiative'],
  Reliability: ['reliab*', 'deadline*', 'on time', 'always late', 'consistent', 'dependable', 'punctual'],
  'Needs to improve': ['improve', 'do better', 'get better', 'learn to', 'needs work'],
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MATCHERS = Object.entries(TOPICS).map(([topic, words]) => {
  const alts = words.map((w) => (w.endsWith('*') ? `${escapeRe(w.slice(0, -1))}\\w*` : escapeRe(w)));
  return [topic, new RegExp(`\\b(?:${alts.join('|')})\\b`, 'i')] as const;
});

export function topicsOf(text: string): string[] {
  return MATCHERS.filter(([, re]) => re.test(text)).map(([topic]) => topic);
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

// "People often mention": tags with how many reviews mention each and those
// reviews' average rating, most mentioned first; only tags that appear.
export function topicCounts(reviews: Filterable[]): { topic: string; count: number; average: number }[] {
  const tally = new Map<string, { count: number; sum: number }>();
  for (const r of reviews)
    for (const t of topicsOf(r.body)) {
      const e = tally.get(t) ?? { count: 0, sum: 0 };
      tally.set(t, { count: e.count + 1, sum: e.sum + r.rating });
    }
  return Object.keys(TOPICS)
    .filter((t) => tally.has(t))
    .map((topic) => ({ topic, count: tally.get(topic)!.count, average: tally.get(topic)!.sum / tally.get(topic)!.count }))
    .sort((a, b) => b.count - a.count);
}
