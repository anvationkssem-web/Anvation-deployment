-- Anvation production registration storage.
-- Safe to run more than once in the Vercel/Prisma Postgres SQL console.

CREATE TABLE IF NOT EXISTS registrations (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  team_name_key TEXT NOT NULL UNIQUE,
  leader_email TEXT NOT NULL,
  preferred_track TEXT NOT NULL,
  team_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_participants (
  participant_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES registrations(team_id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  usn TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  participant_json JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS registrations_created_at_idx
  ON registrations (created_at);

CREATE INDEX IF NOT EXISTS registration_participants_team_id_idx
  ON registration_participants (team_id);

CREATE TABLE IF NOT EXISTS admin_state (
  state_key TEXT PRIMARY KEY,
  state_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_state (
  state_key TEXT PRIMARY KEY,
  state_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);