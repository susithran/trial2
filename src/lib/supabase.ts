import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export interface WaterSettingsRow {
  id: number;
  enabled: boolean;
  interval_minutes: number;
  daily_goal_ml: number;
  updated_at: string;
}

export interface WaterLogRow {
  id: string;
  timestamp: string;
  amount_ml: number;
}

export interface PomodoroSettingsRow {
  id: number;
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  rounds_before_long_break: number;
  updated_at: string;
}

export interface PomodoroSessionRow {
  id: string;
  completed_at: string;
  duration_minutes: number;
}
