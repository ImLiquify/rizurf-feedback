import { topicCounts, type ReviewFilter, type SortKey } from '../reviewFilters';
import { IconSearch } from './icons';

interface Props {
  reviews: { body: string; rating: number; createdAt: string }[];
  filter: ReviewFilter;
  onChange: (f: ReviewFilter) => void;
  shown: number;
}

// Search, topic chips, star filter and sort above a list of reviews.
export function ReviewToolbar({ reviews, filter, onChange, shown }: Props) {
  const topics = topicCounts(reviews);
  const set = (patch: Partial<ReviewFilter>) => onChange({ ...filter, ...patch });
  const filtered = filter.query || filter.topic || filter.stars;

  if (reviews.length === 0) return null;

  return (
    <div className="review-toolbar">
      <div className="review-toolbar-row">
        <div className="review-search">
          <IconSearch width={15} height={15} />
          <input
            type="search"
            placeholder="Search reviews"
            aria-label="Search reviews"
            value={filter.query}
            onChange={(e) => set({ query: e.target.value })}
          />
        </div>
        <select aria-label="Filter by stars" value={filter.stars ?? ''} onChange={(e) => set({ stars: e.target.value ? Number(e.target.value) : null })}>
          <option value="">All stars</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? '' : 's'}
            </option>
          ))}
        </select>
        <select aria-label="Sort reviews" value={filter.sort} onChange={(e) => set({ sort: e.target.value as SortKey })}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>
      </div>

      {topics.length > 0 && (
        <div className="topic-chips" role="group" aria-label="Filter by what people mention">
          <span className="topic-chips-label">People often mention</span>
          {topics.map(({ topic, count, average }) => (
            <button
              key={topic}
              type="button"
              className={'topic-chip' + (average >= 4 ? ' good' : average <= 2 ? ' bad' : '')}
              title={`${count} review${count === 1 ? '' : 's'}, averaging ${average.toFixed(1)} stars`}
              aria-pressed={filter.topic === topic}
              onClick={() => set({ topic: filter.topic === topic ? null : topic })}
            >
              {topic} <span className="topic-chip-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      {filtered && (
        <p className="review-toolbar-status">
          Showing {shown} of {reviews.length}
          <button type="button" className="link-btn" onClick={() => onChange({ ...filter, query: '', topic: null, stars: null })}>
            Clear filters
          </button>
        </p>
      )}
    </div>
  );
}
