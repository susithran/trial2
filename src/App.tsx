import { LayoutDashboard, Droplet, Timer } from 'lucide-react';
import { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { WaterReminder } from '@/components/WaterReminder';
import { PomodoroTimer } from '@/components/PomodoroTimer';

type View = 'dashboard' | 'water' | 'pomodoro';

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'water', label: 'Water', icon: Droplet },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
];

function App() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900/40 p-4 sm:flex">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-rose-500 text-white">
            <Droplet size={18} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Hydrate &amp; Focus</p>
            <p className="text-xs text-slate-500">Wellness desktop</p>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <item.icon size={18} className={active ? 'text-sky-400' : ''} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <p className="px-2 text-xs text-slate-600">Settings save to this browser.</p>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-rose-500 text-white">
            <Droplet size={16} />
          </div>
          <span className="text-sm font-semibold">Hydrate &amp; Focus</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-8 sm:pt-10">
          {/* Mobile segmented nav */}
          <div className="mb-6 grid grid-cols-3 gap-2 sm:hidden">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition ${
                  view === item.id ? 'bg-slate-800 text-slate-100' : 'bg-slate-900/40 text-slate-400'
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </div>

          {view === 'dashboard' && <Dashboard />}
          {view === 'water' && <WaterReminder />}
          {view === 'pomodoro' && <PomodoroTimer />}
        </div>
      </main>
    </div>
  );
}

export default App;
