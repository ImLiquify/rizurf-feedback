import { useEffect, useState } from 'react';
import { ApiError, getEmployeeWall } from '../api';
import { Avatar } from '../components/Avatar';
import type { WallEmployee, WallReview } from '../types';

function stars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

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

  return (
    <div>
      <h1>Employee Wall</h1>
      <p className="muted">Every employee, with the feedback they've given and received.</p>

      <div className="wall-grid">
        {employees.map((employee) => (
          <div key={employee.id} className="wall-tile">
            <div className="wall-tile-header">
              <Avatar name={employee.name} photoUrl={employee.photoUrl} />
              <div className="wall-tile-identity">
                <div className="wall-tile-name">{employee.name}</div>
                <div className="muted">{employee.role}</div>
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
                  {employee.reviewsGiven.map((r) => (
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
                  {employee.reviewsReceived.map((r) => (
                    <ReviewLine key={r.id} review={r} counterpartLabel="from" counterpartName={r.authorName} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
