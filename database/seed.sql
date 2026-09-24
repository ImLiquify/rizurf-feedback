-- Local test data only — NOT for the production database handoff.
-- Loaded into the XAMPP MySQL instance for local development/testing.

USE rizurf_feedback;

INSERT INTO employees (id, email, name, role) VALUES
  ('emp-1', 'alice@rizurf.local', 'Alice Nguyen', 'user'),
  ('emp-2', 'bob@rizurf.local', 'Bob Santos', 'user'),
  ('emp-3', 'carla@rizurf.local', 'Carla Cruz', 'user'),
  ('emp-4', 'diego@rizurf.local', 'Diego Reyes', 'supervisor'),
  ('emp-5', 'erika@rizurf.local', 'Erika Flores', 'admin');

INSERT INTO reviews (id, author_id, receiver_id, rating, body, visibility, created_at, updated_at) VALUES
  ('rev-1', 'emp-2', 'emp-1', 5, 'Alice is always quick to help unblock the team.', 'public', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
  ('rev-2', 'emp-3', 'emp-1', 3, 'Communication could be clearer during handoffs.', 'anonymous', '2026-09-05 09:00:00', '2026-09-05 09:00:00');
