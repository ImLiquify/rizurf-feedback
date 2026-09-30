import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchEmployees } from '../api';
import type { Employee } from '../types';
import { Avatar } from '../components/Avatar';
import { roleLabel } from '../utils';
import { IconSearch } from '../components/icons';
import { Skeleton } from '../components/Skeleton';

export function DirectoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for a pause in typing instead of one request per keystroke. A
    // failed search keeps the previous results on screen.
    let cancelled = false;
    const timer = setTimeout(
      () => {
        searchEmployees(query)
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
        <Skeleton variant="rows" />
      ) : results.length === 0 ? (
        <div className="empty-state">
          {q ? `No one matches “${q}”. Try a first name or a department.` : 'No one here yet.'}
        </div>
      ) : (
        <ul className="person-grid">
          {results.map((e) => (
            <li key={e.id}>
              <Link to={`/employees/${e.id}`} className="person-card">
                <Avatar name={e.name} photoUrl={e.photoUrl} size={76} />
                <div className="person-info">
                  <div className="person-name">{e.name}</div>
                  <div className="person-meta">{[roleLabel(e), e.department].filter(Boolean).join(' · ')}</div>
                </div>
                {e.avgRating != null ? (
                  <span
                    className="person-rating"
                    aria-label={`${e.avgRating.toFixed(1)} stars from ${e.reviewCount} reviews`}
                  >
                    <span className="person-rating-star" aria-hidden="true">
                      ★
                    </span>
                    {e.avgRating.toFixed(1)}
                    <span className="person-rating-count">{e.reviewCount}</span>
                  </span>
                ) : (
                  <span className="person-rating none">No reviews</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
