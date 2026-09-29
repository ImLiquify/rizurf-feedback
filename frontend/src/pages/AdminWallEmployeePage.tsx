import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, getEmployeeWall } from '../api';
import { Avatar } from '../components/Avatar';
import { ReviewToolbar } from '../components/ReviewToolbar';
import { IconChevronLeft } from '../components/icons';
import { filterReviews, NO_FILTER } from '../reviewFilters';
import { fullDate, roleLabel, timeAgo } from '../utils';
import type { WallEmployee, WallReview } from '../types';

type Tab = 'received' | 'given';

// Admin/HR only: one employee's full feedback both ways, with the other
// person named on every review, anonymous ones included (that is what the
// wall is for; the API refuses anyone else).
export function AdminWallEmployeePage() {
  const { employeeId = '' } = useParams();
  const [everyone, setEveryone] = useState<WallEmployee[]>([]);
  const [blocked, setBlocked] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('received');
  const [filter, setFilter] = useState(NO_FILTER);

  useEffect(() => {
    getEmployeeWall()
      .then(setEveryone)
      .catch((e) => setBlocked(e instanceof ApiError ? e.message : 'Could not load the employee wall.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading…</p>;
  if (blocked) return <p>{blocked}</p>;

  const employee = everyone.find((e) => e.id === employeeId);
  if (!employee) return <p>No employee with id {employeeId}.</p>;

  const byId = new Map(everyone.map((e) => [e.id, e]));
  const list = tab === 'received' ? employee.reviewsReceived : employee.reviewsGiven;
  const other = (r: WallReview) => (tab === 'received' ? r.authorId : r.receiverId);
  const otherName = (r: WallReview) => (tab === 'received' ? r.authorName : r.receiverName);
  const shown = filterReviews(list, filter, otherName);
  const switchTab = (t: Tab) => {
    setTab(t);
    setFilter(NO_FILTER);
  };

  return (
    <div>
      <Link to="/admin/wall" className="back-link">
        <IconChevronLeft width={16} height={16} />
        Employee Wall
      </Link>

      <div className="profile-header">
        <Avatar name={employee.name} photoUrl={employee.photoUrl} size={56} />
        <div>
          <h1>{employee.name}</h1>
          <p className="muted">
            {employee.email} · {roleLabel(employee)}
            {employee.avgRating != null && (
              <>
                {' · '}
                <span className="stars">★</span> {employee.avgRating.toFixed(1)} from {employee.reviewCount} review
                {employee.reviewCount === 1 ? '' : 's'}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label={`${employee.name}'s feedback`}>
        <button role="tab" aria-selected={tab === 'received'} className="tab" onClick={() => switchTab('received')}>
          Received <span className="tab-count">{employee.reviewsReceived.length}</span>
        </button>
        <button role="tab" aria-selected={tab === 'given'} className="tab" onClick={() => switchTab('given')}>
          Given <span className="tab-count">{employee.reviewsGiven.length}</span>
        </button>
      </div>

      <div role="tabpanel">
        <ReviewToolbar reviews={list} filter={filter} onChange={setFilter} shown={shown.length} />
        {list.length === 0 && (
          <div className="empty-state">
            {tab === 'received' ? `No one has reviewed ${employee.name} yet.` : `${employee.name} hasn't reviewed anyone yet.`}
          </div>
        )}
        {list.length > 0 && shown.length === 0 && <div className="empty-state">No reviews match these filters.</div>}

        <ul className="wall-detail-list">
          {shown.map((r) => {
            const person = byId.get(other(r));
            return (
              <li key={r.id} className="review-card">
                <div className="wall-detail-who">
                  <Avatar name={otherName(r)} photoUrl={person?.photoUrl} size={30} />
                  <span>
                    {tab === 'received' ? 'From ' : 'To '}
                    <Link to={`/admin/wall/${other(r)}`}>{otherName(r)}</Link>
                  </span>
                  {r.visibility === 'anonymous' && <span className="wall-anon-badge">anonymous</span>}
                  <time className="wall-detail-date" dateTime={r.createdAt} title={fullDate(r.createdAt)}>
                    {timeAgo(r.createdAt)}
                  </time>
                </div>
                <span className="stars">
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </span>
                <p className="review-body">{r.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
