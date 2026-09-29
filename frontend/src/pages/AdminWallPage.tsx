import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, getEmployeeWall } from '../api';
import { Avatar } from '../components/Avatar';
import { roleLabel } from '../utils';
import { IconSearch } from '../components/icons';
import type { WallEmployee, WallReview } from '../types';

function stars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

// The tile is a preview: the newest few each way; the detail page has them all.
const PREVIEW = 2;

function truncate(text: string, max = 90): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function ReviewLine({
  review,
  counterpartLabel,
  counterpartName,
}: {
  review: WallReview;
  counterpartLabel: string;
  counterpartName: string;
}) {
  return (
    <li className="wall-review-line">
      <span className="stars small">{stars(review.rating)}</span>
      <span className="wall-review-body">{truncate(review.body)}</span>
      <span className="wall-review-meta">
        {counterpartLabel} {counterpartName}
        {review.visibility === 'anonymous' && <span className="wall-anon-badge">anonymous</span>}
      </span>
    </li>
  );
}

export function AdminWallPage() {
  const [employees, setEmployees] = useState<WallEmployee[]>([]);
  const [blocked, setBlocked] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    getEmployeeWall()
      .then((data) => {
        if (!cancelled) setEmployees(data);
      })
      .catch((e) => {
        if (!cancelled) setBlocked(e instanceof ApiError ? e.message : 'Could not load the employee wall.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="muted">Loading…</p>;
  if (blocked) return <p>{blocked}</p>;

  const q = query.trim().toLowerCase();
  const shown = q ? employees.filter((e) => `${e.name} ${e.email}`.toLowerCase().includes(q)) : employees;

  return (
    <div>
      <h1>Employee Wall</h1>
      <p className="muted">Every employee, with the feedback they've given and received.</p>

      <div className="search-field">
        <IconSearch />
        <input
          id="search-input"
          type="search"
          aria-label="Quick find a coworker"
          placeholder="Quick find a coworker"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {shown.length === 0 && <div className="empty-state">No one matches “{query}”.</div>}

      <div className="wall-grid">
        {shown.map((employee) => (
          <div key={employee.id} className="wall-tile">
            <div className="wall-tile-header">
              <Avatar name={employee.name} photoUrl={employee.photoUrl} />
              <div className="wall-tile-identity">
                <Link to={`/admin/wall/${employee.id}`} className="wall-tile-name">
                  {employee.name}
                </Link>
                <div className="muted">{roleLabel(employee)}</div>
              </div>
              {employee.avgRating != null && (
                <span className="stars wall-tile-rating">
                  {stars(Math.round(employee.avgRating))} {employee.avgRating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="wall-section">
              <h2>Given ({employee.reviewsGiven.length})</h2>
              {employee.reviewsGiven.length === 0 ? (
                <p className="muted small">No reviews given yet.</p>
              ) : (
                <ul className="wall-review-list">
                  {employee.reviewsGiven.slice(0, PREVIEW).map((r) => (
                    <ReviewLine key={r.id} review={r} counterpartLabel="to" counterpartName={r.receiverName} />
                  ))}
                </ul>
              )}
            </div>

            <div className="wall-section">
              <h2>Received ({employee.reviewsReceived.length})</h2>
              {employee.reviewsReceived.length === 0 ? (
                <p className="muted small">No reviews received yet.</p>
              ) : (
                <ul className="wall-review-list">
                  {employee.reviewsReceived.slice(0, PREVIEW).map((r) => (
                    <ReviewLine key={r.id} review={r} counterpartLabel="from" counterpartName={r.authorName} />
                  ))}
                </ul>
              )}
            </div>

            <Link to={`/admin/wall/${employee.id}`} className="wall-tile-more">
              View details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
