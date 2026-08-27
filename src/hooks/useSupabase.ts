import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  PomodoroSessionRow,
  PomodoroSettingsRow,
  WaterLogRow,
  WaterSettingsRow,
} from '@/lib/supabase';

export interface WaterSettings {
  enabled: boolean;
  intervalMinutes: number;
  dailyGoalMl: number;
}

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  roundsBeforeLongBreak: number;
}

export interface WaterLogEntry {
  id: string;
  timestamp: number;
  amountMl: number;
}

function rowToSettings(row: WaterSettingsRow): WaterSettings {
  return {
    enabled: row.enabled,
    intervalMinutes: row.interval_minutes,
    dailyGoalMl: row.daily_goal_ml,
  };
}

function rowToPomodoroSettings(row: PomodoroSettingsRow): PomodoroSettings {
  return {
    focusMinutes: row.focus_minutes,
    shortBreakMinutes: row.short_break_minutes,
    longBreakMinutes: row.long_break_minutes,
    roundsBeforeLongBreak: row.rounds_before_long_break,
  };
}

function rowToLogEntry(row: WaterLogRow): WaterLogEntry {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp).getTime(),
    amountMl: row.amount_ml,
  };
}

const DEFAULT_WATER_SETTINGS: WaterSettings = {
  enabled: true,
  intervalMinutes: 45,
  dailyGoalMl: 2500,
};

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  roundsBeforeLongBreak: 4,
};

export function useWaterSettings() {
  const [settings, setSettings] = useState<WaterSettings>(DEFAULT_WATER_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('water_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(rowToSettings(data));
        setLoaded(true);
      });
  }, []);

  const update = useCallback((next: Partial<WaterSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      supabase
        .from('water_settings')
        .upsert({
          id: 1,
          enabled: merged.enabled,
          interval_minutes: merged.intervalMinutes,
          daily_goal_ml: merged.dailyGoalMl,
          updated_at: new Date().toISOString(),
        })
        .then();
      return merged;
    });
  }, []);

  return { settings, update, loaded };
}

export function useWaterLog() {
  const [log, setLog] = useState<WaterLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('water_log')
      .select('*')
      .order('timestamp', { ascending: true })
      .then(({ data }) => {
        if (data) setLog(data.map(rowToLogEntry));
        setLoaded(true);
      });
  }, []);

  const addEntry = useCallback((amountMl: number) => {
    supabase
      .from('water_log')
      .insert({ amount_ml: amountMl })
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) setLog((prev) => [...prev, rowToLogEntry(data)]);
      });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    supabase.from('water_log').delete().eq('id', id).then();
    setLog((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const deleteEntriesForDay = useCallback((dayKey: string) => {
    const ids = log
      .filter((e) => new Date(e.timestamp).toDateString() === dayKey)
      .map((e) => e.id);
    if (ids.length > 0) {
      supabase.from('water_log').delete().in('id', ids).then();
    }
    setLog((prev) => prev.filter((e) => new Date(e.timestamp).toDateString() !== dayKey));
  }, [log]);

  const removeLast = useCallback(() => {
    setLog((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      supabase.from('water_log').delete().eq('id', last.id).then();
      return prev.slice(0, -1);
    });
  }, []);

  return { log, addEntry, deleteEntry, deleteEntriesForDay, removeLast, loaded };
}

export function usePomodoroSettings() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('pomodoro_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(rowToPomodoroSettings(data));
        setLoaded(true);
      });
  }, []);

  const update = useCallback((next: Partial<PomodoroSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      supabase
        .from('pomodoro_settings')
        .upsert({
          id: 1,
          focus_minutes: merged.focusMinutes,
          short_break_minutes: merged.shortBreakMinutes,
          long_break_minutes: merged.longBreakMinutes,
          rounds_before_long_break: merged.roundsBeforeLongBreak,
          updated_at: new Date().toISOString(),
        })
        .then();
      return merged;
    });
  }, []);

  return { settings, update, loaded };
}

export function usePomodoroSessions() {
  const [sessions, setSessions] = useState<PomodoroSessionRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('pomodoro_sessions')
      .select('*')
      .order('completed_at', { ascending: true })
      .then(({ data }) => {
        if (data) setSessions(data);
        setLoaded(true);
      });
  }, []);

  const addSession = useCallback((durationMinutes: number) => {
    supabase
      .from('pomodoro_sessions')
      .insert({ duration_minutes: durationMinutes })
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) setSessions((prev) => [...prev, data]);
      });
  }, []);

  const todayCount = (() => {
    const todayKey = new Date().toDateString();
    return sessions.filter((s) => new Date(s.completed_at).toDateString() === todayKey).length;
  })();

  return { sessions, todayCount, addSession, loaded };
}

export function useExportData() {
  const { settings: waterSettings } = useWaterSettings();
  const { log: waterLog } = useWaterLog();
  const { settings: pomodoroSettings } = usePomodoroSettings();
  const { sessions: pomodoroSessions } = usePomodoroSessions();

  return { waterLog, waterSettings, pomodoroSessions, pomodoroSettings };
}
