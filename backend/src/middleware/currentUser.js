import { findEmployeeById } from '../db/employees.js';
import { unauthorized } from '../errors.js';

// DEV-ONLY AUTH STAND-IN. There is no real gateway wired in yet, so the
// frontend's dev user-switcher sends the selected employee's id in this
// header instead of a real session. This entire file gets replaced by
// MICROAPP_AUTH.md's gateway token verification + session/introspect flow
// once the real gateway integration happens — never ship this as-is.
export async function currentUser(req, res, next) {
  const userId = req.header('X-Mock-User-Id');
  if (!userId) return next(unauthorized('X-Mock-User-Id header is required (dev-only auth stand-in).'));

  const employee = await findEmployeeById(userId);
  if (!employee) return next(unauthorized(`No employee with id ${userId}.`));

  req.user = employee;
  next();
}
