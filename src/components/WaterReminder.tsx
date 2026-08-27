import { useEffect, useMemo, useRef } from 'react';
import { Droplet, Minus, Bell, BellOff, Trash2, Clock, ChevronDown, Calendar, Download } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';
import { formatClock, useWallClock } from '@/hooks/useTimers';
import { useExportData, useWaterLog, useWaterSettings } from '@/hooks/useSupabase';
import { downloadXls } from '@/lib/export';

const PRESET_ML = [100, 200, 250, 500];

function formatLitres(ml: number): string {
  return `${(ml / 1000).toFixed(2)} L`;
}

interface DayGroup {
  date: Date;
  key: string;
  entries: { id: string; timestamp: number; amountMl: number }[];
  totalMl: number;
}

export function WaterReminder() {
  const now = useWallClock();
  const { settings, update } = useWaterSettings();
  const { log, addEntry, deleteEntry, deleteEntriesForDay, removeLast } = useWaterLog();
  const exportData = useExportData();
  const { permission, requestPermission, notify } = useNotification();
  const lastReminderRef = useRef<number>(Date.now());

  const today = new Date(now);
  const dayKey = today.toDateString();
  const todayLog = useMemo(
    () => log.filter((e) => new Date(e.timestamp).toDateString() === dayKey),
    [log, dayKey],
  );
  const consumedMl = todayLog.reduce((sum, e) => sum + e.amountMl, 0);
  const goalPct = Math.min(100, Math.round((consumedMl / Math.max(1, settings.dailyGoalMl)) * 100));

  useEffect(() => {
    if (!settings.enabled) return;
    const intervalMs = settings.intervalMinutes * 60_000;
    if (now - lastReminderRef.current >= intervalMs) {
      lastReminderRef.current = now;
      notify('Time to hydrate', `Take a sip — you're at ${formatLitres(consumedMl)} of ${formatLitres(settings.dailyGoalMl)} today.`);
    }
  }, [now, settings.enabled, settings.intervalMinutes, settings.dailyGoalMl, consumedMl, notify]);

  const nextReminderMs = settings.intervalMinutes * 60_000 - (now - lastReminderRef.current);
  const nextReminderMin = Math.max(0, Math.round(nextReminderMs / 60_000));

  const history = useMemo<DayGroup[]>(() => {
    const map = new Map<string, { id: string; timestamp: number; amountMl: number }[]>();
    for (const entry of log) {
      const key = new Date(entry.timestamp).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(entry);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([key, entries]) => ({
        key,
        date: new Date(entries[0].timestamp),
        entries: entries.sort((a, b) => a.timestamp - b.timestamp),
        totalMl: entries.reduce((sum, e) => sum + e.amountMl, 0),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [log]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/15 text-sky-400">
            <Droplet size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Water Reminder</h1>
            <p className="text-sm text-slate-400">Stay hydrated all day</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums text-slate-100">{formatClock(today)}</p>
          <p className="text-xs text-slate-500">{today.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
          <RingProgress percent={goalPct} consumedMl={consumedMl} goalMl={settings.dailyGoalMl} />
          <div className="flex-1 space-y-4 sm:pl-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRESET_ML.map((ml) => (
                <button
                  key={ml}
                  onClick={() => {
                    addEntry(ml);
                    lastReminderRef.current = Date.now();
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-800/60 py-3 text-sm font-medium text-slate-200 transition hover:border-sky-500/60 hover:bg-sky-500/10 hover:text-sky-300 active:scale-95"
                >
                  +{ml}ml
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={removeLast}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                <Minus size={16} /> Undo last
              </button>
              <button
                onClick={() => deleteEntriesForDay(dayKey)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 size={16} /> Clear today
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Reminder Settings</h2>
          <button
            onClick={() => update({ enabled: !settings.enabled })}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              settings.enabled
                ? 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {settings.enabled ? <Bell size={16} /> : <BellOff size={16} />}
            {settings.enabled ? 'Reminders on' : 'Reminders off'}
          </button>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="flex items-center justify-between text-sm text-slate-300">
              <span>Reminder interval</span>
              <span className="tabular-nums text-slate-400">{settings.intervalMinutes} min</span>
            </span>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={settings.intervalMinutes}
              onChange={(e) => update({ intervalMinutes: Number(e.target.value) })}
              className="w-full accent-sky-500"
            />
          </label>
          <label className="space-y-2">
            <span className="flex items-center justify-between text-sm text-slate-300">
              <span>Daily goal</span>
              <span className="tabular-nums text-slate-400">{formatLitres(settings.dailyGoalMl)}</span>
            </span>
            <input
              type="range"
              min={1000}
              max={5000}
              step={100}
              value={settings.dailyGoalMl}
              onChange={(e) => update({ dailyGoalMl: Number(e.target.value) })}
              className="w-full accent-sky-500"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-800/40 p-4 text-sm">
          <Clock size={16} className="text-sky-400" />
          {settings.enabled ? (
            <span className="text-slate-300">
              Next reminder in ~<span className="font-semibold text-slate-100">{nextReminderMin}</span> min
            </span>
          ) : (
            <span className="text-slate-400">Reminders are paused.</span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-slate-400">Notifications: {permission}</span>
            {permission !== 'granted' && (
              <button
                onClick={requestPermission}
                className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-500/30"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Today's Log</h2>
          <button
            onClick={() => downloadXls(exportData.waterLog, exportData.waterSettings, exportData.pomodoroSessions, exportData.pomodoroSettings)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
          >
            <Download size={14} /> Export .xls
          </button>
        </div>
        {todayLog.length === 0 ? (
          <p className="text-sm text-slate-500">No entries yet — log your first glass above.</p>
        ) : (
          <ul className="space-y-2">
            {todayLog
              .slice()
              .reverse()
              .map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-2.5 text-sm"
                >
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <Droplet size={14} className="text-sky-400" />
                    {e.amountMl} ml
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-slate-500">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="text-slate-600 transition hover:text-rose-400"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <HistorySection history={history} dailyGoalMl={settings.dailyGoalMl} todayKey={dayKey} onDeleteEntry={deleteEntry} />
    </div>
  );
}

function RingProgress({ percent, consumedMl, goalMl }: { percent: number; consumedMl: number; goalMl: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgb(30 41 59)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgb(14 165 233)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-100">{percent}%</span>
        <span className="text-xs text-slate-400">{formatLitres(consumedMl)} / {formatLitres(goalMl)}</span>
      </div>
    </div>
  );
}

function HistorySection({
  history,
  dailyGoalMl,
  todayKey,
  onDeleteEntry,
}: {
  history: DayGroup[];
  dailyGoalMl: number;
  todayKey: string;
  onDeleteEntry: (id: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Calendar size={16} className="text-sky-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Date-wise History</h2>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No history yet — start logging water to build your record.</p>
      ) : (
        <div className="space-y-3">
          {history.map((day) => {
            const pct = Math.min(100, Math.round((day.totalMl / Math.max(1, dailyGoalMl)) * 100));
            const isToday = day.key === todayKey;
            return (
              <div key={day.key} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
                <div className="flex w-full items-center gap-4 px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-200">
                      {isToday ? 'Today' : day.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-slate-500">
                      {day.entries.length} entr{day.entries.length === 1 ? 'y' : 'ies'}
                    </span>
                  </div>

                  <div className="flex-1 px-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-sm font-semibold tabular-nums text-slate-100">{formatLitres(day.totalMl)}</span>
                  <span className="text-xs tabular-nums text-slate-500">{pct}%</span>
                  <ChevronDown size={16} className="text-slate-500" />
                </div>

                <ul className="space-y-1.5 border-t border-slate-800 px-4 py-3">
                  {day.entries
                    .slice()
                    .reverse()
                    .map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-sm"
                      >
                        <span className="inline-flex items-center gap-2 text-slate-300">
                          <Droplet size={13} className="text-sky-400" />
                          {e.amountMl} ml
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums text-slate-500">
                            {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => onDeleteEntry(e.id)}
                            className="text-slate-600 transition hover:text-rose-400"
                            aria-label="Delete entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
