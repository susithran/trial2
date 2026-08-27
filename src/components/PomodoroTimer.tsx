import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Timer as TimerIcon } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';
import { formatCountdown, useCountdown } from '@/hooks/useTimers';
import { usePomodoroSessions, usePomodoroSettings } from '@/hooks/useSupabase';

type Phase = 'focus' | 'short' | 'long';

const PHASE_LABEL: Record<Phase, string> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
};

const PHASE_COLOR: Record<Phase, string> = {
  focus: 'text-rose-400',
  short: 'text-emerald-400',
  long: 'text-sky-400',
};

const PHASE_STROKE: Record<Phase, string> = {
  focus: 'rgb(244 63 94)',
  short: 'rgb(16 185 129)',
  long: 'rgb(14 165 233)',
};

export function PomodoroTimer() {
  const { settings, update } = usePomodoroSettings();
  const { todayCount, addSession } = usePomodoroSessions();
  const [phase, setPhase] = useState<Phase>('focus');
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const { notify } = useNotification();

  const durationMs = useMemo(() => {
    const mins =
      phase === 'focus'
        ? settings.focusMinutes
        : phase === 'short'
          ? settings.shortBreakMinutes
          : settings.longBreakMinutes;
    return mins * 60_000;
  }, [phase, settings]);

  const [remaining, setRemaining] = useCountdown(durationMs, running);

  const progress = durationMs > 0 ? 1 - remaining / durationMs : 0;
  const stroke = PHASE_STROKE[phase];

  const advance = (completed: boolean) => {
    if (phase === 'focus' && completed) {
      addSession(settings.focusMinutes);
      if ((todayCount + 1) % settings.roundsBeforeLongBreak === 0) {
        setPhase('long');
      } else {
        setPhase('short');
      }
    } else if (phase === 'focus') {
      setPhase('short');
    } else {
      setPhase('focus');
      setRound((r) => r + 1);
    }
    setRunning(false);
  };

  useEffect(() => {
    if (running && remaining <= 0) {
      if (phase === 'focus') {
        notify('Focus session complete', 'Time for a break.');
      } else {
        notify('Break finished', 'Ready to focus again?');
      }
      advance(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  const reset = () => {
    setRunning(false);
    setRemaining(durationMs);
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-500/15 text-rose-400">
            <TimerIcon size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Pomodoro Timer</h1>
            <p className="text-sm text-slate-400">Focus in structured sprints</p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-800/60 px-4 py-2 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500">Today</p>
          <p className="text-lg font-semibold text-slate-100">{todayCount} sessions</p>
        </div>
      </header>

      <div className="flex gap-2">
        {(['focus', 'short', 'long'] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPhase(p);
              setRunning(false);
            }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              phase === p
                ? 'bg-slate-800 text-slate-100 ring-1 ring-slate-600'
                : 'bg-slate-900/40 text-slate-500 hover:text-slate-300'
            }`}
          >
            {PHASE_LABEL[p]}
          </button>
        ))}
      </div>

      <section className="grid place-items-center rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
        <div className="relative h-56 w-56">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="rgb(30 41 59)" strokeWidth="12" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={stroke}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.3s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xs font-medium uppercase tracking-wider ${PHASE_COLOR[phase]}`}>
              {PHASE_LABEL[phase]}
            </span>
            <span className="mt-1 text-5xl font-bold tabular-nums text-slate-100">
              {formatCountdown(remaining)}
            </span>
            <span className="mt-1 text-xs text-slate-500">Round {round}</span>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 active:scale-95"
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-700 bg-slate-800/60 text-slate-300 transition hover:bg-slate-800"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => advance(false)}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-700 bg-slate-800/60 text-slate-300 transition hover:bg-slate-800"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">Timer Durations</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField
            label="Focus (min)"
            value={settings.focusMinutes}
            min={1}
            max={90}
            onChange={(v) => update({ focusMinutes: v })}
          />
          <NumberField
            label="Short break (min)"
            value={settings.shortBreakMinutes}
            min={1}
            max={30}
            onChange={(v) => update({ shortBreakMinutes: v })}
          />
          <NumberField
            label="Long break (min)"
            value={settings.longBreakMinutes}
            min={1}
            max={60}
            onChange={(v) => update({ longBreakMinutes: v })}
          />
          <NumberField
            label="Rounds before long break"
            value={settings.roundsBeforeLongBreak}
            min={1}
            max={12}
            onChange={(v) => update({ roundsBeforeLongBreak: v })}
          />
        </div>
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/60">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-3 py-2.5 text-slate-400 transition hover:text-slate-200"
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-full bg-transparent text-center text-sm font-medium text-slate-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-3 py-2.5 text-slate-400 transition hover:text-slate-200"
          aria-label={`increase ${label}`}
        >
          +
        </button>
      </div>
    </label>
  );
}
