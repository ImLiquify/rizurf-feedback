import { useState, type FormEvent } from 'react';
import type { Employee, Visibility } from '../types';
import { Avatar } from './Avatar';

const RATING_WORDS = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

interface ReviewFormProps {
  onSubmit: (input: { rating: number; body: string; visibility: Visibility }) => void;
  error?: string;
  initial?: { rating: number; body: string; visibility: Visibility };
  submitLabel?: string;
  onCancel?: () => void;
  me?: Employee; // shown beside the stars, like Google Maps' "Rate and review"
}

// Google-Maps-style: a row of empty stars first; the text box and the rest
// only open once a star is picked. Editing opens straight to the full form.
export function ReviewForm({ onSubmit, error, initial, submitLabel = 'Post review', onCancel, me }: ReviewFormProps) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(initial?.body ?? '');
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? 'public');
  const isAnon = visibility === 'anonymous';
  const expanded = Boolean(initial) || rating > 0;
  const shownRating = hover || rating;

  function reset() {
    setRating(0);
    setBody('');
    setVisibility('public');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rating) return;
    onSubmit({ rating, body, visibility });
    if (!initial) reset();
  }

  return (
    <form className={'panel review-form' + (expanded ? ' expanded' : '')} onSubmit={handleSubmit}>
      <div className="review-form-head">
        {me && <Avatar name={me.name} photoUrl={me.photoUrl} size={40} />}
        <div>
          <h2>{initial ? 'Edit your review' : 'Rate and review'}</h2>
          {me && !initial && <p className="muted small">{isAnon ? 'Posting anonymously' : `Posting as ${me.name}`}</p>}
        </div>
      </div>

      <div className="star-picker" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === rating}
            aria-label={`${n} star${n === 1 ? '' : 's'}: ${RATING_WORDS[n]}`}
            className={'star-btn' + (n <= shownRating ? ' filled' : '')}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9z" />
            </svg>
          </button>
        ))}
        <span className="star-hint" aria-live="polite">
          {shownRating ? RATING_WORDS[shownRating] : ''}
        </span>
      </div>

      {expanded && (
        <div className="review-form-more">
          <label htmlFor="review-body" className="visually-hidden">
            Review
          </label>
          <textarea
            id="review-body"
            autoFocus={!initial}
            placeholder="Share details of your experience working with them"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <div className="visibility-field">
            {/* From Uiverse.io by catraco */}
            <label className="eye-toggle" title="Toggle anonymous">
              <input
                type="checkbox"
                checked={isAnon}
                onChange={(e) => setVisibility(e.target.checked ? 'anonymous' : 'public')}
                aria-label="Post anonymously"
              />
              <svg className="eye" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" />
              </svg>
              <svg className="eye-slash" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512">
                <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z" />
              </svg>
            </label>
            <span className="visibility-label">{isAnon ? 'Posting Anonymously' : 'Visible with your name'}</span>
          </div>

          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="review-form-actions">
            <button type="button" className="btn secondary" onClick={initial ? onCancel : reset}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={!rating || !body.trim()}>
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
