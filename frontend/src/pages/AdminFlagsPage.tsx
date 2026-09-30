import { useCallback, useEffect, useState } from 'react';
import { ApiError, listOpenFlags, resolveFlag, searchEmployees } from '../api';
import type { Employee, OpenFlagEntry } from '../types';
import { IconFlag, IconTrash } from '../components/icons';
import { Skeleton } from '../components/Skeleton';
import { Avatar } from '../components/Avatar';
import { fullDate, timeAgo } from '../utils';

// Admin/hr only, so anonymous authors are shown here (the one place besides
// the wall where they are), marked as anonymous.
function Person({ person, fallback = 'Unknown' }: { person?: Employee; fallback?: string }) {
  return (
    <span className="flag-person">
      <Avatar name={person?.name ?? fallback} photoUrl={person?.photoUrl} size={24} />
      <b>{person?.name ?? fallback}</b>
    </span>
  );
}

export const OPEN_FLAGS = 'rizurf:open-flags';

export function AdminFlagsPage() {
  const [flags, setFlags] = useState<OpenFlagEntry[]>([]);
  const [people, setPeople] = useState<Record<string, Employee>>({});
  const [error, setError] = useState<string | undefined>(undefined);
  const [blocked, setBlocked] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setBlocked(undefined);
    try {
      const [employees, openFlags] = await Promise.all([searchEmployees(''), listOpenFlags()]);
      setPeople(Object.fromEntries(employees.map((e) => [e.id, e])));
      setFlags(openFlags);
    } catch (e) {
      setBlocked(e instanceof ApiError ? e.message : 'Could not load flags.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keeps the sidebar's Flags badge in step, e.g. right after resolving one.
  useEffect(() => {
    if (!loading && !blocked) window.dispatchEvent(new CustomEvent(OPEN_FLAGS, { detail: flags.length }));
  }, [loading, blocked, flags.length]);

  async function handleResolve(flagId: string, deleteReviewToo: boolean) {
    setError(undefined);
    try {
      await resolveFlag(flagId, deleteReviewToo);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resolve flag.');
    }
  }

  if (loading) return <Skeleton variant="rows" />;
  if (blocked) return <p>{blocked}</p>;

  return (
    <div>
      <h1>Open flags</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {flags.length === 0 && <p className="empty-state">No open flags.</p>}
      {flags.length > 0 && (
        <ul className="flag-list">
          {flags.map(({ flag, review }) => (
            <li key={flag.id} className="flag-row">
              <div className="flag-head">
                <Person person={people[flag.flaggedBy]} />
                <span className="muted small">
                  flagged this{' '}
                  <time dateTime={flag.createdAt} title={fullDate(flag.createdAt)}>
                    {timeAgo(flag.createdAt)}
                  </time>
                </span>
              </div>
              <p className="flag-reason">
                <IconFlag width={14} height={14} />
                {flag.reason}
              </p>
              <blockquote className="flag-review">
                <div className="flag-route">
                  <Person person={people[review.authorId]} />
                  {review.visibility === 'anonymous' && <span className="anon-tag">Anonymous</span>}
                  <span className="flag-arrow" aria-label="reviewed">→</span>
                  <Person person={people[review.receiverId]} />
                  <span className="stars" aria-label={`${review.rating} of 5 stars`}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="flag-review-body">{review.body}</p>
              </blockquote>
              <div className="flag-actions">
                <button className="btn small secondary" onClick={() => handleResolve(flag.id, false)}>
                  Resolve
                </button>
                <button className="btn small danger" onClick={() => handleResolve(flag.id, true)}>
                  <IconTrash width={14} height={14} /> Resolve &amp; delete review
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
