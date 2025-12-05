-- Create database
CREATE DATABASE ai_tutor;

-- Connect to database
\c ai_tutor;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table will be created automatically by Hibernate
-- Sessions table will be created automatically by Hibernate
-- Session results table will be created automatically by Hibernate

-- Optional: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_organizer ON sessions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_session_results_session ON session_results(session_id);
CREATE INDEX IF NOT EXISTS idx_session_results_student ON session_results(student_id);

