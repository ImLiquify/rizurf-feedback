import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '../context/CurrentUserContext';
import { ApiError, listOpenFlags, resolveFlag, searchEmployees } from '../api';
import type { OpenFlagEntry } from '../types';

export function AdminFlagsPage() {
  const { currentUser } = useCurrentUser();
  const [flags, setFlags] = useState<OpenFlagEntry[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>(undefined);
  const [blocked, setBlocked] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setBlocked(undefined);
    try {
      const [employees, openFlags] = await Promise.all([searchEmployees(currentUser.id, ''), listOpenFlags(currentUser.id)]);
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
  }, [currentUser.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve(flagId: string, deleteReviewToo: boolean) {
    setError(undefined);
    try {
      await resolveFlag(currentUser.id, flagId, deleteReviewToo);
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
        <table className="flags-table">
          <thead>
            <tr>
              <th>Reason</th>
              <th>Review</th>
              <th>Author</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {flags.map(({ flag, review }) => (
              <tr key={flag.id}>
                <td>{flag.reason}</td>
                <td>&quot;{review.body}&quot;</td>
                <td>{authorNames[review.authorId] ?? 'Unknown'}</td>
                <td>
                  <button className="btn small secondary" onClick={() => handleResolve(flag.id, false)}>
                    Resolve
                  </button>{' '}
                  <button className="btn small danger" onClick={() => handleResolve(flag.id, true)}>
                    Resolve and delete review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
