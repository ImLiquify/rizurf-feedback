import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDirectory } from '../api';
import type { DirectoryEmployee } from '../types';
import { Avatar } from '../components/Avatar';
import { fullDate, roleLabel, timeAgo } from '../utils';
import { topicCounts } from '../reviewFilters';
import { IconSearch } from '../components/icons';
import { Skeleton } from '../components/Skeleton';

export function DirectoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DirectoryEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for a pause in typing instead of one request per keystroke. A
    // failed search keeps the previous results on screen.
    let cancelled = false;
    const timer = setTimeout(
      () => {
        getDirectory(query)
          .then((r) => {
            if (!cancelled) setResults(r);
          })
          .catch(() => {})
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      },
      query ? 250 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const q = query.trim();

  return (
    <div>
      <div className="dir-head">
        <div>
          <h1>Directory</h1>
          <p className="muted">
            {loading
              ? 'Loading people…'
              : q
                ? `${results.length} match${results.length === 1 ? '' : 'es'} for “${q}”`
                : `${results.length} people · pick someone to leave feedback`}
          </p>
        </div>
        <div className="search-field">
          <IconSearch />
          <input
            id="search-input"
            type="search"
            aria-label="Search employees"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or department"
          />
        </div>
      </div>
      {loading ? (
        <Skeleton variant="tiles" />
      ) : results.length === 0 ? (
        <div className="empty-state">
          {q ? `No one matches “${q}”. Try a first name or a department.` : 'No one here yet.'}
        </div>
      ) : (
        <ul className="wall-grid directory-grid">
          {results.map((e) => (
            <li key={e.id}>
              <PersonTile person={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function truncate(text: string, max = 120): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

// A preview of how people see this person: rating, what reviews keep
// mentioning, and the newest review you're allowed to read.
function PersonTile({ person }: { person: DirectoryEmployee }) {
  const tags = topicCounts(person.reviews).slice(0, 3);
  const latest = person.reviews[0];

  return (
    <Link to={`/employees/${person.id}`} className="wall-tile person-tile">
      <div className="wall-tile-header">
        <Avatar name={person.name} photoUrl={person.photoUrl} size={44} />
        <div className="wall-tile-identity">
          <div className="wall-tile-name">{person.name}</div>
          <div className="person-meta">{[roleLabel(person), person.department].filter(Boolean).join(' · ')}</div>
        </div>
        {person.avgRating != null ? (
          <span
            className="person-rating"
            aria-label={`${person.avgRating.toFixed(1)} stars from ${person.reviewCount} reviews`}
          >
            <span className="person-rating-star" aria-hidden="true">
              ★
            </span>
            {person.avgRating.toFixed(1)}
            <span className="person-rating-count">{person.reviewCount}</span>
          </span>
        ) : (
          <span className="person-rating none">No reviews</span>
        )}
      </div>

      {tags.length > 0 && (
        <div className="person-tags" aria-label="People often mention">
          {tags.map(({ topic, count, average }) => (
            <span key={topic} className={'topic-chip' + (average >= 4 ? ' good' : average <= 2 ? ' bad' : '')}>
              {topic} <span className="topic-chip-count">{count}</span>
            </span>
          ))}
        </div>
      )}

      {latest ? (
        <figure className="person-quote">
          <blockquote>{truncate(latest.body)}</blockquote>
          <figcaption>
            <span className="stars small" aria-label={`${latest.rating} of 5 stars`}>
              {'★'.repeat(latest.rating)}
              {'☆'.repeat(5 - latest.rating)}
            </span>
            <time dateTime={latest.createdAt} title={fullDate(latest.createdAt)}>
              {timeAgo(latest.createdAt)}
            </time>
          </figcaption>
        </figure>
      ) : (
        <p className="person-empty">No reviews yet. Be the first to leave one.</p>
      )}
    </Link>
  );
}
