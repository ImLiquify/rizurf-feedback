import type { RatingSummary } from '../types';

function verdict(average: number): { label: string; tone: 'ok' | 'warn' | 'down' } {
  if (average >= 4.5) return { label: 'Excellent', tone: 'ok' };
  if (average >= 4) return { label: 'Very good', tone: 'ok' };
  if (average >= 3) return { label: 'Good', tone: 'warn' };
  if (average >= 2) return { label: 'Fair', tone: 'warn' };
  return { label: 'Needs work', tone: 'down' };
}

// Average, stars, count and the 5→1 distribution, like a store rating panel.
export function RatingSummaryCard({ summary, title }: { summary: RatingSummary; title?: string }) {
  const { average, count, counts } = summary;
  const v = average != null ? verdict(average) : null;

  return (
    <section className="rating-summary" aria-label="Rating summary">
      <div className="rating-summary-head">
        <div>
          {title && <h2 className="rating-summary-title">{title}</h2>}
          <div className="rating-summary-score">
            <span className="rating-summary-average">{average != null ? average.toFixed(1) : '–'}</span>
            <span className="stars rating-summary-stars" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={average != null && n <= Math.round(average) ? 'on' : 'off'}>★</span>
              ))}
            </span>
          </div>
          <p className="muted">
            {count === 0 ? 'No reviews yet' : `Based on ${count} review${count === 1 ? '' : 's'}`}
          </p>
        </div>
        {v && <span className={`status-pill status-pill-${v.tone}`}>{v.label}</span>}
      </div>

      <ul className="rating-bars">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const pct = count ? Math.round((counts[star] / count) * 100) : 0;
          return (
            <li key={star} className="rating-bar-row">
              <span className="rating-bar-label">{star} ★</span>
              <span className="rating-bar-track" role="img" aria-label={`${star} stars: ${pct}%`}>
                <span className="rating-bar-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="rating-bar-pct">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
