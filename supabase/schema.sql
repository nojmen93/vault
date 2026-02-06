-- Vault Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (synced from Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table with encryption and embeddings
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  encrypted_content TEXT NOT NULL,
  iv TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX notes_user_id_idx ON notes(user_id, created_at DESC);
CREATE INDEX notes_embedding_idx ON notes
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own notes" ON notes
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- User thinking profiles (for AI personalization)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL,
  note_count_at_generation INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for quick profile lookup
CREATE INDEX user_profiles_user_id_idx ON user_profiles(user_id);

-- Row Level Security for profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own profile" ON user_profiles
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Similarity search function
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id text
)
RETURNS TABLE (
  id uuid,
  user_id text,
  title text,
  encrypted_content text,
  iv text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.user_id,
    notes.title,
    notes.encrypted_content,
    notes.iv,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM notes
  WHERE notes.user_id = filter_user_id
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Project kits (generated starter kits from ideas)
CREATE TABLE project_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_note_ids UUID[] DEFAULT '{}',
  project_name TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  files JSONB NOT NULL,
  analysis JSONB,
  tech_stack JSONB,
  github_repo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for project kits
CREATE INDEX project_kits_user_id_idx ON project_kits(user_id, created_at DESC);

-- Row Level Security for project kits
ALTER TABLE project_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own project kits" ON project_kits
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Add GitHub access token to users (encrypted)
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username TEXT;

-- Discovery sessions (stores user's discovery answers and generated suggestions)
CREATE TABLE discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  persona TEXT,
  suggestions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for discovery sessions
CREATE INDEX discovery_sessions_user_idx ON discovery_sessions(user_id, created_at DESC);

-- Row Level Security for discovery sessions
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own discovery sessions" ON discovery_sessions
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Saved suggestions (ideas user wants to keep or has acted upon)
CREATE TABLE saved_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discovery_session_id UUID REFERENCES discovery_sessions(id) ON DELETE SET NULL,
  suggestion JSONB NOT NULL,
  status TEXT DEFAULT 'saved', -- 'saved', 'incubated', 'dismissed'
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL, -- if converted to note
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for saved suggestions
CREATE INDEX saved_suggestions_user_idx ON saved_suggestions(user_id, status, created_at DESC);

-- Row Level Security for saved suggestions
ALTER TABLE saved_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own saved suggestions" ON saved_suggestions
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));
