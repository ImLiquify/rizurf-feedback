import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import type { Employee, ReviewView, Visibility } from '../types';

export function EmployeeProfilePage() {
  const { employeeId = '' } = useParams();
  const { currentUser } = useCurrentUser();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [employees, employeeReviews] = await Promise.all([
      searchEmployees(currentUser.id, ''),
      getEmployeeReviews(currentUser.id, employeeId),
    ]);
    setEmployee(employees.find((e) => e.id === employeeId) ?? null);
    const nameMap: Record<string, string> = {};
    employees.forEach((e) => {
      nameMap[e.id] = e.name;
    });
    setAuthorNames(nameMap);
    setReviews(employeeReviews);
    setLoading(false);
  }, [currentUser.id, employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePostReview(input: { rating: number; body: string; visibility: Visibility }) {
    setError(undefined);
    try {
      await postReview(currentUser.id, { receiverId: employeeId, ...input });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not post review.');
    }
  }

  async function handleEditReview(reviewId: string, input: { rating: number; body: string; visibility: Visibility }) {
    await editReview(currentUser.id, reviewId, input);
    await load();
  }

  async function handleDeleteReview(reviewId: string) {
    await deleteReview(currentUser.id, reviewId);
    await load();
  }

  async function handleFlag(reviewId: string, reason: string) {
    await flagReview(currentUser.id, reviewId, reason);
    await load();
  }

  async function handleReply(reviewId: string, body: string) {
    await replyToReview(currentUser.id, reviewId, body);
    await load();
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!employee) return <p>No employee with id {employeeId}.</p>;

  const isSelf = employee.id === currentUser.id;

  return (
    <div>
      <h1>{employee.name}</h1>
      <p className="muted">
        {employee.email} · {employee.role}
      </p>

      {isSelf ? <p className="panel">You cannot review yourself.</p> : <ReviewForm onSubmit={handlePostReview} error={error} />}

      <h2 style={{ marginTop: 28 }}>Reviews</h2>
      {reviews.length === 0 && <div className="empty-state">No reviews yet.</div>}
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          authorName={review.authorId ? authorNames[review.authorId] ?? 'Unknown' : null}
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
