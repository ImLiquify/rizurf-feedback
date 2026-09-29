import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchEmployees } from '../api';
import type { Employee } from '../types';
import { Avatar } from '../components/Avatar';
import { IconSearch } from '../components/icons';

function stars(n: number): string {
  const rounded = Math.round(n);
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

export function DirectoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for a pause in typing instead of one request per keystroke. A
    // failed search keeps the previous results on screen.
    let cancelled = false;
    const timer = setTimeout(() => {
      searchEmployees(query)
        .then((r) => {
          if (!cancelled) setResults(r);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div>
      <h1>Find a coworker</h1>
      <p className="muted">Search by name or email, then leave feedback on their profile.</p>
      <div className="search-field">
        <IconSearch />
        <input
          id="search-input"
          aria-label="Search employees"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
        />
      </div>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <ul className="employee-list">
          {results.length === 0 && <li className="empty-state">No matches.</li>}
          {results.map((e) => (
            <li key={e.id} className="employee-row">
              <Link to={`/employees/${e.id}`} className="employee-row-link">
                <div className="employee-main">
                  <Avatar name={e.name} photoUrl={e.photoUrl} />
                  <div>
                    <div>{e.name}</div>
                    <div className="muted">{e.role}</div>
                  </div>
                </div>
                <div className="stars">
                  {e.avgRating != null ? (
                    <>
                      {stars(e.avgRating)} {e.avgRating.toFixed(1)}
                    </>
                  ) : (
                    <span className="muted">No reviews yet</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
