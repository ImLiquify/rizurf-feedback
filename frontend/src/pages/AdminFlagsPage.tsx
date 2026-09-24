import { useCallback, useEffect, useState } from 'react';
import { ApiError, listOpenFlags, resolveFlag, searchEmployees } from '../api';
import type { OpenFlagEntry } from '../types';
import { IconFlag, IconTrash } from '../components/icons';

export function AdminFlagsPage() {
  const [flags, setFlags] = useState<OpenFlagEntry[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>(undefined);
  const [blocked, setBlocked] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setBlocked(undefined);
    try {
      const [employees, openFlags] = await Promise.all([searchEmployees(''), listOpenFlags()]);
      const nameMap: Record<string, string> = {};
      employees.forEach((e) => {
        nameMap[e.id] = e.name;
      });
      setAuthorNames(nameMap);
      setFlags(openFlags);
    } catch (e) {
      setBlocked(e instanceof ApiError ? e.message : 'Could not load flags.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve(flagId: string, deleteReviewToo: boolean) {
    setError(undefined);
    try {
      await resolveFlag(flagId, deleteReviewToo);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resolve flag.');
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
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
              <span className="flag-reason">
                <IconFlag width={14} height={14} />
                {flag.reason}
              </span>
              <p className="flag-review-body">
                &quot;{review.body}&quot; — {authorNames[review.authorId] ?? 'Unknown'}
              </p>
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
