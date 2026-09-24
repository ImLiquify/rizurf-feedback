// The single source of truth for who may see a review and whether its
// author is included in what they see. Every read path routes through
// this — never a separate "public view" vs "admin view" query.

export function isAdminRole(role) {
  return role === 'admin' || role === 'hr';
}

export function viewReviewFor(review, requester) {
  if (review.visibility === 'public') {
    return { ...review };
  }
  // Anonymous: the receiver sees it with the author stripped. The author
  // themselves and any admin/hr see it with the author included — you
  // already know your own identity, so revealing it to yourself breaks
  // nothing about the anonymity guarantee, which is about hiding it from
  // everyone ELSE.
  if (review.receiverId === requester.id) {
    return { ...review, authorId: null };
  }
  if (review.authorId === requester.id || isAdminRole(requester.role)) {
    return { ...review };
  }
  return null;
}

export function viewReviewsFor(reviews, requester) {
  return reviews.map((review) => viewReviewFor(review, requester)).filter((review) => review !== null);
}
