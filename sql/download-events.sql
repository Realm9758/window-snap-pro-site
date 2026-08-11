-- Download tracking — run this once in the Supabase SQL editor.
--
-- Adds the table behind the Downloads tiles and chart on /admin/licenses.
-- Safe to run more than once: every statement is IF NOT EXISTS.
--
-- These same statements are also part of sql/schema.sql. This file exists so
-- an existing project can add download tracking without re-reading the whole
-- schema looking for the new parts.

CREATE TABLE IF NOT EXISTS download_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT,          -- which button: 'hero', 'download-page', …
  user_agent  TEXT,
  referer     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Every dashboard query filters on a date window, so this is the only index needed.
CREATE INDEX IF NOT EXISTS idx_download_events_created_at
  ON download_events (created_at);

-- The API writes with the service role key, which bypasses RLS. Turning RLS on
-- with no policies therefore keeps the API working while denying the anon key,
-- which is what the browser would use.
ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;
