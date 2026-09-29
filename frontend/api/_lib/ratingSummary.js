// Average, count and the 5→1 star distribution for one employee. Built from
// ALL their reviews, anonymous included: a rating number carries no identity
// (same reasoning as the directory's avgRating), only the review text and
// author are gated by visibility.js.
export function ratingSummary(reviews) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) counts[r.rating] += 1;
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : null;
  return { average, count, counts };
}
