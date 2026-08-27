/*
# Create wellness database tables (single-tenant, no auth)

1. New Tables
- `water_settings`: single-row settings for the water reminder
  - `id` (int, primary key, always 1)
  - `enabled` (boolean, default true) — whether reminders are active
  - `interval_minutes` (int, default 45) — minutes between reminders
  - `daily_goal_oz` (int, default 80) — daily hydration goal in ounces
  - `updated_at` (timestamptz)
- `water_log`: every glass of water logged
  - `id` (uuid, primary key)
  - `timestamp` (timestamptz, default now()) — when the water was consumed
  - `amount_oz` (int, not null) — ounces consumed in this entry
- `pomodoro_settings`: single-row settings for the pomodoro timer
  - `id` (int, primary key, always 1)
  - `focus_minutes` (int, default 25)
  - `short_break_minutes` (int, default 5)
  - `long_break_minutes` (int, default 15)
  - `rounds_before_long_break` (int, default 4)
  - `updated_at` (timestamptz)
- `pomodoro_sessions`: each completed focus session
  - `id` (uuid, primary key)
  - `completed_at` (timestamptz, default now()) — when the session finished
  - `duration_minutes` (int, not null) — length of the focus session

2. Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` because this is a single-tenant
  app with no sign-in screen; the anon-key frontend must be able to read
  and write its own data. `USING (true)` / `WITH CHECK (true)` is acceptable
  here because the data is intentionally shared (single user, no accounts).

3. Important Notes
- This migration is idempotent: safe to re-run.
- A default settings row is inserted for both water_settings and pomodoro_settings.
*/

-- Water settings
CREATE TABLE IF NOT EXISTS water_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  interval_minutes int NOT NULL DEFAULT 45,
  daily_goal_oz int NOT NULL DEFAULT 80,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE water_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_water_settings" ON water_settings;
CREATE POLICY "anon_select_water_settings" ON water_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_water_settings" ON water_settings;
CREATE POLICY "anon_insert_water_settings" ON water_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_water_settings" ON water_settings;
CREATE POLICY "anon_update_water_settings" ON water_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_water_settings" ON water_settings;
CREATE POLICY "anon_delete_water_settings" ON water_settings
  FOR DELETE TO anon, authenticated USING (true);

INSERT INTO water_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- Water log
CREATE TABLE IF NOT EXISTS water_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  amount_oz int NOT NULL
);

ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_water_log" ON water_log;
CREATE POLICY "anon_select_water_log" ON water_log
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_water_log" ON water_log;
CREATE POLICY "anon_insert_water_log" ON water_log
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_water_log" ON water_log;
CREATE POLICY "anon_delete_water_log" ON water_log
  FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS water_log_timestamp_idx ON water_log (timestamp DESC);

-- Pomodoro settings
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  focus_minutes int NOT NULL DEFAULT 25,
  short_break_minutes int NOT NULL DEFAULT 5,
  long_break_minutes int NOT NULL DEFAULT 15,
  rounds_before_long_break int NOT NULL DEFAULT 4,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pomodoro_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "anon_select_pomodoro_settings" ON pomodoro_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "anon_insert_pomodoro_settings" ON pomodoro_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "anon_update_pomodoro_settings" ON pomodoro_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "anon_delete_pomodoro_settings" ON pomodoro_settings
  FOR DELETE TO anon, authenticated USING (true);

INSERT INTO pomodoro_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- Pomodoro sessions
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completed_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes int NOT NULL
);

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pomodoro_sessions" ON pomodoro_sessions;
CREATE POLICY "anon_select_pomodoro_sessions" ON pomodoro_sessions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pomodoro_sessions" ON pomodoro_sessions;
CREATE POLICY "anon_insert_pomodoro_sessions" ON pomodoro_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pomodoro_sessions" ON pomodoro_sessions;
CREATE POLICY "anon_delete_pomodoro_sessions" ON pomodoro_sessions
  FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS pomodoro_sessions_completed_at_idx ON pomodoro_sessions (completed_at DESC);
