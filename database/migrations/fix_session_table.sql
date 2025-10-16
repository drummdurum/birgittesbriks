-- Migration script to fix session table primary key issue
-- Run this if you get "multiple primary keys" error

-- Drop existing session table and recreate it properly
DROP TABLE IF EXISTS session;

-- Recreate session table with proper primary key
CREATE TABLE session (
    sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

-- Create index on expire column for cleanup
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);