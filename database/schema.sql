-- Rizurf Feedback — canonical schema
-- Matches docs/superpowers/specs/2026-09-18-feedback-system-design.md
--
-- `employees` is synced from the Rizurf gateway on login (id = gateway `sub`)
-- plus a periodic sync from the company roster service — see spec section
-- "Employee directory". Nothing here stores a password; auth is the
-- gateway's job. `role` mirrors the gateway's own four roles exactly
-- (MICROAPP_AUTH.md) — never invent a fifth value here.

CREATE DATABASE IF NOT EXISTS rizurf_feedback
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE rizurf_feedback;

CREATE TABLE employees (
  id         VARCHAR(64) PRIMARY KEY,      -- the gateway's `sub` claim
  email      VARCHAR(255) NOT NULL UNIQUE,
  name       VARCHAR(255) NOT NULL,
  role       ENUM('user', 'admin', 'hr', 'supervisor') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id           VARCHAR(36) PRIMARY KEY,
  author_id    VARCHAR(64) NOT NULL,       -- always stored, even for anonymous reviews;
                                            -- anonymity is an access-control rule the API
                                            -- enforces on read, not missing data
  receiver_id  VARCHAR(64) NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  body         TEXT NOT NULL,
  visibility   ENUM('public', 'anonymous') NOT NULL DEFAULT 'public',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_author   FOREIGN KEY (author_id)   REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_receiver FOREIGN KEY (receiver_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating  CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT chk_reviews_not_self CHECK (author_id <> receiver_id),
  INDEX idx_reviews_receiver (receiver_id),
  INDEX idx_reviews_author (author_id)
) ENGINE=InnoDB;

CREATE TABLE review_replies (
  id         VARCHAR(36) PRIMARY KEY,
  review_id  VARCHAR(36) NOT NULL UNIQUE,  -- UNIQUE enforces one reply per review
  author_id  VARCHAR(64) NOT NULL,         -- must equal reviews.receiver_id for that review;
                                            -- enforced by the API, not the schema
  body       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_replies_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_replies_author FOREIGN KEY (author_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE review_flags (
  id          VARCHAR(36) PRIMARY KEY,
  review_id   VARCHAR(36) NOT NULL,
  flagged_by  VARCHAR(64) NOT NULL,
  reason      TEXT NOT NULL,
  status      ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_flags_review FOREIGN KEY (review_id)  REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_flags_author FOREIGN KEY (flagged_by) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_flags_status (status)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id         VARCHAR(36) PRIMARY KEY,
  user_id    VARCHAR(64) NOT NULL,         -- recipient
  type       ENUM('review_received', 'reply_received', 'flag_resolved') NOT NULL,
  message    VARCHAR(255) NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, created_at)
) ENGINE=InnoDB;
