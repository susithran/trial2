import { Droplet, Timer, Target, Flame, TrendingUp, Download } from 'lucide-react';
import { useWallClock } from '@/hooks/useTimers';
import { useExportData, usePomodoroSessions, usePomodoroSettings, useWaterLog, useWaterSettings } from '@/hooks/useSupabase';
import { downloadXls } from '@/lib/export';

function formatLitres(ml: number): string {
  return `${(ml / 1000).toFixed(2)} L`;
}

export function Dashboard() {
  const now = useWallClock();
  const today = new Date(now);
  const dayKey = today.toDateString();
  const exportData = useExportData();

  const { settings: waterSettings } = useWaterSettings();
  const { log: waterLog } = useWaterLog();
  const { settings: pomodoroSettings } = usePomodoroSettings();
  const { todayCount: completedFocus } = usePomodoroSessions();

  const todayWater = waterLog.filter((e) => new Date(e.timestamp).toDateString() === dayKey);
  const consumedMl = todayWater.reduce((sum, e) => sum + e.amountMl, 0);
  const waterPct = Math.min(100, Math.round((consumedMl / Math.max(1, waterSettings.dailyGoalMl)) * 100));

  const focusMinutesToday = completedFocus * pomodoroSettings.focusMinutes;
  const focusGoalMinutes = pomodoroSettings.focusMinutes * pomodoroSettings.roundsBeforeLongBreak;
  const focusPct = Math.min(100, Math.round((focusMinutesToday / Math.max(1, focusGoalMinutes)) * 100));

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return d.toDateString();
  });
  const activeDays = new Set(waterLog.map((e) => new Date(e.timestamp).toDateString()));
  const streak = last7.filter((dk) => activeDays.has(dk)).length;

  const roundsDone = completedFocus % pomodoroSettings.roundsBeforeLongBreak;
  const roundsRemaining =
    roundsDone === 0 ? pomodoroSettings.roundsBeforeLongBreak : pomodoroSettings.roundsBeforeLongBreak - roundsDone;

  const cards = [
    {
      label: 'Water today',
      value: formatLitres(consumedMl),
      sub: `${waterPct}% of ${formatLitres(waterSettings.dailyGoalMl)} goal`,
      icon: Droplet,
      tint: 'bg-sky-500/15 text-sky-400',
      barPct: waterPct,
      barColor: 'bg-sky-500',
    },
    {
      label: 'Focus sessions',
      value: `${completedFocus}`,
      sub: `${focusMinutesToday} min focused today`,
      icon: Timer,
      tint: 'bg-rose-500/15 text-rose-400',
      barPct: focusPct,
      barColor: 'bg-rose-500',
    },
    {
      label: 'Hydration streak',
      value: `${streak} day${streak === 1 ? '' : 's'}`,
      sub: 'Active in the past week',
      icon: Flame,
      tint: 'bg-amber-500/15 text-amber-400',
      barPct: Math.round((streak / 7) * 100),
      barColor: 'bg-amber-500',
    },
    {
      label: 'Next long break',
      value: `${roundsRemaining}`,
      sub: 'Focus rounds remaining',
      icon: Target,
      tint: 'bg-emerald-500/15 text-emerald-400',
      barPct: Math.round((roundsDone / pomodoroSettings.roundsBeforeLongBreak) * 100),
      barColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
            <p className="text-sm text-slate-400">Your wellness at a glance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-slate-100">
              {today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-slate-500">{today.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
          <button
            onClick={() => downloadXls(exportData.waterLog, exportData.waterSettings, exportData.pomodoroSessions, exportData.pomodoroSettings)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
          >
            <Download size={14} /> Export .xls
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.tint}`}>
                <c.icon size={18} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-100">{c.value}</p>
            <p className="text-sm text-slate-400">{c.label}</p>
            <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${c.barColor} transition-all duration-500`}
                style={{ width: `${c.barPct}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Quick reference</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Stat label="Water interval" value={`${waterSettings.intervalMinutes} min`} />
          <Stat label="Daily water goal" value={formatLitres(waterSettings.dailyGoalMl)} />
          <Stat label="Focus length" value={`${pomodoroSettings.focusMinutes} min`} />
          <Stat label="Long break length" value={`${pomodoroSettings.longBreakMinutes} min`} />
        </dl>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-800/40 p-4">
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-100">{value}</dd>
    </div>
  );
}
