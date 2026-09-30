import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import {
  deleteReview,
  editReview,
  flagReview,
  getEmployeeReviews,
  getMyGivenReviews,
  replyToReview,
  searchEmployees,
} from '../api';
import { Avatar } from '../components/Avatar';
import { roleLabel } from '../utils';
import { ReviewCard } from '../components/ReviewCard';
import { RatingSummaryCard } from '../components/RatingSummaryCard';
import { ReviewToolbar } from '../components/ReviewToolbar';
import { filterReviews, NO_FILTER } from '../reviewFilters';
import type { Employee, GivenReview, RatingSummary, ReviewView, Visibility } from '../types';
import { Skeleton } from '../components/Skeleton';
import { NOTIFICATIONS_ARRIVED } from '../components/NotificationsList';

type Tab = 'received' | 'given';
export const AWAITING_REPLY = 'rizurf:awaiting-reply';

// Everything about the signed-in person in one place: the reviews written
// about them (reply right here) and the ones they've written.
export function MePage() {
  const { currentUser } = useCurrentUser();
  const [tab, setTab] = useState<Tab>('received');
  const [received, setReceived] = useState<ReviewView[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [given, setGiven] = useState<GivenReview[]>([]);
  const [people, setPeople] = useState<Record<string, Employee>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(NO_FILTER);

  const loadReceived = useCallback(async () => {
    const data = await getEmployeeReviews(currentUser.id);
    setReceived(data.reviews);
    setSummary(data.summary);
  }, [currentUser.id]);

  const loadGiven = useCallback(async () => setGiven(await getMyGivenReviews()), []);

  useEffect(() => {
    Promise.all([searchEmployees(''), loadReceived(), loadGiven()])
      .then(([employees]) => setPeople(Object.fromEntries(employees.map((e) => [e.id, e]))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadReceived, loadGiven]);

  // New feedback about me, or a reply to mine, lands here without a refresh.
  useEffect(() => {
    const reload = () => Promise.all([loadReceived(), loadGiven()]).catch(() => {});
    window.addEventListener(NOTIFICATIONS_ARRIVED, reload);
    return () => window.removeEventListener(NOTIFICATIONS_ARRIVED, reload);
  }, [loadReceived, loadGiven]);

  // Keeps the sidebar's Me badge in step, e.g. right after I reply here.
  const awaitingReply = received.filter((r) => !r.reply).length;
  useEffect(() => {
    if (!loading) window.dispatchEvent(new CustomEvent(AWAITING_REPLY, { detail: awaitingReply }));
  }, [loading, awaitingReply]);

  if (loading) return <Skeleton variant="profile" />;

  const shownReceived = filterReviews(received, filter, (r) => (r.authorId ? (people[r.authorId]?.name ?? '') : ''));
  const shownGiven = filterReviews(given, filter, (r) => r.receiverName);
  const switchTab = (t: Tab) => {
    setTab(t);
    setFilter(NO_FILTER);
  };

  return (
    <div>
      <div className="profile-header">
        <Avatar name={currentUser.name} photoUrl={currentUser.photoUrl} size={56} />
        <div>
          <h1 className="name-line">
            {currentUser.name} {currentUser.department && <span className="dept-tag">{currentUser.department}</span>}
          </h1>
          <p className="muted">
            {currentUser.email} · {roleLabel(currentUser)}
          </p>
        </div>
      </div>

      {summary && <RatingSummaryCard summary={summary} title="Your rating" />}

      <div className="tabs" role="tablist" aria-label="Your reviews">
        <button role="tab" aria-selected={tab === 'received'} className="tab" onClick={() => switchTab('received')}>
          About me <span className="tab-count">{received.length}</span>
          {awaitingReply > 0 && (
            <span className="badge" title="Waiting for your reply">
              {awaitingReply}
            </span>
          )}
        </button>
        <button role="tab" aria-selected={tab === 'given'} className="tab" onClick={() => switchTab('given')}>
          I've given <span className="tab-count">{given.length}</span>
        </button>
      </div>

      {tab === 'received' ? (
        <div role="tabpanel">
          <ReviewToolbar reviews={received} filter={filter} onChange={setFilter} shown={shownReceived.length} />
          {received.length > 0 && shownReceived.length === 0 && (
            <div className="empty-state">No reviews match these filters.</div>
          )}
          {received.length === 0 && (
            <div className="empty-state">No one has reviewed you yet. Reviews written about you will show up here.</div>
          )}
          <div className="review-grid">
            {shownReceived.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                authorName={review.authorId ? (people[review.authorId]?.name ?? 'Unknown') : null}
                authorPhotoUrl={review.authorId ? people[review.authorId]?.photoUrl : null}
                canManage={false}
                canReply={!review.reply}
                onEdit={() => {}}
                onDelete={() => {}}
                onFlag={(reason) => flagReview(review.id, reason).then(loadReceived)}
                onReply={(body) => replyToReview(review.id, body).then(loadReceived)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div role="tabpanel">
          <ReviewToolbar reviews={given} filter={filter} onChange={setFilter} shown={shownGiven.length} />
          {given.length > 0 && shownGiven.length === 0 && (
            <div className="empty-state">No reviews match these filters.</div>
          )}
          {given.length === 0 && (
            <div className="empty-state">
              You haven't reviewed anyone yet. <Link to="/directory">Find a coworker</Link> to leave feedback.
            </div>
          )}
          <div className="review-grid">
            {shownGiven.map((review) => (
              <div key={review.id} className="given-item">
                <Link to={`/employees/${review.receiverId}`} className="given-to">
                  <Avatar name={review.receiverName} photoUrl={review.receiverPhotoUrl} size={26} />
                  <span>
                    To <b>{review.receiverName}</b>
                  </span>
                </Link>
                <ReviewCard
                  review={review}
                  authorName={null}
                  metaLabel={review.visibility === 'anonymous' ? 'Posted anonymously' : 'Posted with your name'}
                  canManage
                  canReply={false}
                  onEdit={(input: { rating: number; body: string; visibility: Visibility }) =>
                    editReview(review.id, input).then(loadGiven)
                  }
                  onDelete={() => deleteReview(review.id).then(loadGiven)}
                  onFlag={(reason) => flagReview(review.id, reason).then(loadGiven)}
                  onReply={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
