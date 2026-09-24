import { useState, type FormEvent } from 'react';
import type { Visibility } from '../types';

interface ReviewFormProps {
  onSubmit: (input: { rating: number; body: string; visibility: Visibility }) => void;
  error?: string;
  initial?: { rating: number; body: string; visibility: Visibility };
  submitLabel?: string;
  onCancel?: () => void;
}

export function ReviewForm({ onSubmit, error, initial, submitLabel = 'Post review', onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [body, setBody] = useState(initial?.body ?? '');
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? 'public');
  const isAnon = visibility === 'anonymous';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ rating, body, visibility });
    if (!initial) setBody('');
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>{submitLabel === 'Save changes' ? 'Edit review' : 'Leave a review'}</h2>

      <label>Rating</label>
      <div className="star-picker">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={'star-btn' + (n <= rating ? ' filled' : '')}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
      </div>

      <label htmlFor="review-body">Review</label>
      <textarea id="review-body" value={body} onChange={(e) => setBody(e.target.value)} />

      <label>Visibility</label>
      <div className="visibility-field">
        <button
          type="button"
          className={'switch' + (isAnon ? ' active' : '')}
          role="switch"
          aria-checked={isAnon}
          onClick={() => setVisibility(isAnon ? 'public' : 'anonymous')}
        >
          <span className="switch-knob" />
        </button>
        <span className="visibility-label">{isAnon ? 'Posting Anonymously' : 'Visible with your name'}</span>
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit" className="btn">
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}
