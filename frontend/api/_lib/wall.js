// The employee wall's grouping logic, pulled out of the route handler so
// it's testable on its own (SS-15: business logic separate from the web
// framework). Never filtered by visibility — routes/admin.js only calls
// this after confirming the caller is admin/hr.
export function buildWall(employees, reviews) {
  const given = new Map();
  const received = new Map();

  for (const review of reviews) {
    const givenList = given.get(review.authorId) ?? [];
    givenList.push(review);
    given.set(review.authorId, givenList);

    const receivedList = received.get(review.receiverId) ?? [];
    receivedList.push(review);
    received.set(review.receiverId, receivedList);
  }

  return employees.map((employee) => ({
    ...employee,
    reviewsGiven: given.get(employee.id) ?? [],
    reviewsReceived: received.get(employee.id) ?? [],
  }));
}
