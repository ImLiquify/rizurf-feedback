CREATE DATABASE IF NOT EXISTS pulsefeedback;
USE pulsefeedback;

CREATE USER IF NOT EXISTS 'pulseuser'@'localhost' IDENTIFIED BY 'pulsepassword';
CREATE USER IF NOT EXISTS 'pulseuser'@'127.0.0.1' IDENTIFIED BY 'pulsepassword';
GRANT ALL PRIVILEGES ON pulsefeedback.* TO 'pulseuser'@'localhost';
GRANT ALL PRIVILEGES ON pulsefeedback.* TO 'pulseuser'@'127.0.0.1';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  picture VARCHAR(500) NULL,
  department VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id VARCHAR(50) PRIMARY KEY,
  sender_id VARCHAR(50) NOT NULL,
  target_id VARCHAR(50) NOT NULL,
  target_name VARCHAR(160) NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_feedback_target (target_id),
  INDEX idx_feedback_sender (sender_id),
  INDEX idx_feedback_created (created_at)
);

CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(60) PRIMARY KEY,
  feedback_id VARCHAR(50) NOT NULL,
  parent_id VARCHAR(60) NULL,
  sender_id VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_feedback FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_comments_feedback (feedback_id)
);

CREATE TABLE IF NOT EXISTS reactions (
  user_id VARCHAR(50) NOT NULL,
  feedback_id VARCHAR(50) NOT NULL,
  reaction VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, feedback_id, reaction),
  CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_reactions_feedback FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS private_remarks (
  id VARCHAR(60) PRIMARY KEY,
  author_id VARCHAR(50) NOT NULL,
  target_id VARCHAR(50) NOT NULL,
  content VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_remarks_author FOREIGN KEY (author_id) REFERENCES users(id),
  CONSTRAINT fk_remarks_target FOREIGN KEY (target_id) REFERENCES users(id),
  INDEX idx_remarks_owner_target (author_id, target_id)
);