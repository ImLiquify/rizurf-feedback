import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import {
  ApiError,
  deleteReview,
  editReview,
  flagReview,
  getEmployeeReviews,
  postReview,
  replyToReview,
  searchEmployees,
} from '../api';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewCard } from '../components/ReviewCard';
import { IconChevronLeft } from '../components/icons';
import { Avatar } from '../components/Avatar';
import type { Employee, ReviewView, Visibility } from '../types';

export function EmployeeProfilePage() {
  const { employeeId = '' } = useParams();
  const { currentUser } = useCurrentUser();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [people, setPeople] = useState<Record<string, Employee>>({});
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(true);

  // First visit: the directory (for names/photos) and the reviews together.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([searchEmployees(''), getEmployeeReviews(employeeId)])
      .then(([employees, employeeReviews]) => {
        if (cancelled) return;
        setEmployee(employees.find((e) => e.id === employeeId) ?? null);
        setPeople(Object.fromEntries(employees.map((e) => [e.id, e])));
        setReviews(employeeReviews);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  // After posting, editing, replying etc. only the reviews can have changed.
  const load = useCallback(async () => {
    setReviews(await getEmployeeReviews(employeeId));
  }, [employeeId]);

  useEffect(() => {
    setShowReviewForm(true);
  }, [employeeId]);

  async function handlePostReview(input: { rating: number; body: string; visibility: Visibility }) {
    setError(undefined);
    try {
      await postReview({ receiverId: employeeId, ...input });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not post review.');
    }
  }

  async function handleEditReview(reviewId: string, input: { rating: number; body: string; visibility: Visibility }) {
    await editReview(reviewId, input);
    await load();
  }

  async function handleDeleteReview(reviewId: string) {
    await deleteReview(reviewId);
    await load();
  }

  async function handleFlag(reviewId: string, reason: string) {
    await flagReview(reviewId, reason);
    await load();
  }

  async function handleReply(reviewId: string, body: string) {
    await replyToReview(reviewId, body);
    await load();
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!employee) return <p>No employee with id {employeeId}.</p>;

  const isSelf = employee.id === currentUser.id;

  return (
    <div>
      <Link to="/" className="back-link">
        <IconChevronLeft width={16} height={16} />
        Directory
      </Link>

      <div className="profile-header">
        <Avatar name={employee.name} photoUrl={employee.photoUrl} size={56} />
        <div>
          <h1>{employee.name}</h1>
          <p className="muted">
            {employee.email} · {employee.role}
          </p>
        </div>
      </div>

      {isSelf ? (
        <p className="panel">You cannot review yourself.</p>
      ) : showReviewForm ? (
        <ReviewForm onSubmit={handlePostReview} error={error} onCancel={() => setShowReviewForm(false)} />
      ) : (
        <button type="button" className="link-btn" onClick={() => setShowReviewForm(true)}>
          Leave a review
        </button>
      )}

      <h2 style={{ marginTop: 28 }}>Reviews</h2>
      {reviews.length === 0 && <div className="empty-state">No reviews yet.</div>}
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          authorName={review.authorId ? people[review.authorId]?.name ?? 'Unknown' : null}
          authorPhotoUrl={review.authorId ? people[review.authorId]?.photoUrl : null}
          canManage={review.authorId === currentUser.id}
          canReply={review.receiverId === currentUser.id && !review.reply}
          onEdit={(input) => handleEditReview(review.id, input)}
          onDelete={() => handleDeleteReview(review.id)}
          onFlag={(reason) => handleFlag(review.id, reason)}
          onReply={(body) => handleReply(review.id, body)}
        />
      ))}
    </div>
  );
}
