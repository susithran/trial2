import { useEffect, useRef, useState } from 'react';

const TOTAL_MS = (h: number, m: number) => h * 3600_000 + m * 60_000;

export function useWallClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function useCountdown(durationMs: number, running: boolean) {
  const [remaining, setRemaining] = useState(durationMs);
  const targetRef = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(durationMs);
    targetRef.current = null;
  }, [durationMs]);

  useEffect(() => {
    if (!running) {
      targetRef.current = null;
      return;
    }
    targetRef.current = Date.now() + remaining;
    const id = window.setInterval(() => {
      if (targetRef.current == null) return;
      const left = targetRef.current - Date.now();
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) {
        window.clearInterval(id);
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return [remaining, setRemaining] as const;
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export { TOTAL_MS };
