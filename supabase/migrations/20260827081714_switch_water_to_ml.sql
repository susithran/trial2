/*
# Switch water measurements from ounces to millilitres

1. Changes
- `water_log`: add `amount_ml` (int, default 250) column alongside existing `amount_oz`.
- `water_settings`: add `daily_goal_ml` (int, default 2500) column alongside existing `daily_goal_oz`.
- Backfill new columns from old oz values using 1 oz = 29.5735 ml (rounded).
- Old oz columns are retained to preserve any existing data; the app now reads/writes ml only.

2. Security
- No policy changes. Existing RLS policies already cover all columns.

3. Important Notes
- This migration is idempotent and safe to re-run.
- Column additions use DO $$ IF NOT EXISTS guards.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'water_log' AND column_name = 'amount_ml') THEN
    ALTER TABLE water_log ADD COLUMN amount_ml int;
  END IF;
END $$;

UPDATE water_log SET amount_ml = ROUND(amount_oz * 29.5735) WHERE amount_ml IS NULL AND amount_oz IS NOT NULL;
UPDATE water_log SET amount_ml = 250 WHERE amount_ml IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'water_settings' AND column_name = 'daily_goal_ml') THEN
    ALTER TABLE water_settings ADD COLUMN daily_goal_ml int;
  END IF;
END $$;

UPDATE water_settings SET daily_goal_ml = ROUND(daily_goal_oz * 29.5735) WHERE daily_goal_ml IS NULL AND daily_goal_oz IS NOT NULL;
UPDATE water_settings SET daily_goal_ml = 2500 WHERE daily_goal_ml IS NULL;

ALTER TABLE water_log ALTER COLUMN amount_ml SET NOT NULL;
ALTER TABLE water_settings ALTER COLUMN daily_goal_ml SET NOT NULL;
