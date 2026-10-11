import React from 'react';
import { 
  Calendar, 
  BarChart3, 
  Palmtree, 
  CalendarRange, 
  Settings, 
  Clock,
  Users 
} from 'lucide-react';
import { useOmi } from '../../context/OmiContext';
import { ActiveTab } from '../../types/omi';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, liveClock, isCloudActive, cloudStatusText } = useOmi();

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      tab: 'schedule',
      label: 'График',
      icon: <Calendar className="w-5 h-5 stroke-[1.75]" />,
    },
    {
      tab: 'analytics',
      label: 'Аналитика',
      icon: <BarChart3 className="w-5 h-5 stroke-[1.75]" />,
    },
    {
      tab: 'vacations2027',
      label: 'Отпуска',
      icon: <Palmtree className="w-5 h-5 stroke-[1.75]" />,
    },
    {
      tab: 'year',
      label: 'Планирование на год',
      icon: <CalendarRange className="w-5 h-5 stroke-[1.75]" />,
    },
    {
      tab: 'team',
      label: 'Команда',
      icon: <Users className="w-5 h-5 stroke-[1.75]" />,
    },
    {
      tab: 'settings',
      label: 'Настройки',
      icon: <Settings className="w-5 h-5 stroke-[1.75]" />,
    },
  ];

  return (
    <aside className="w-72 bg-black/80 dark:bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-2xl shrink-0 hidden md:flex">
      <div className="space-y-7">
        {/* Strict Monochrome Brand Block */}
        <div className="flex items-center gap-3.5 px-2">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 p-[1px] shadow-lg shadow-white/5 flex items-center justify-center">
            <span className="font-extrabold text-sm tracking-wider text-white">
              ОМ
            </span>
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white">
              ОМИ Workspace
            </div>
            <div className="text-xs text-slate-400 font-medium">v43.0 Pro</div>
          </div>
        </div>

        {/* Navigation - Translucent White Active State */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`relative px-4 py-3 rounded-2xl font-medium text-sm flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/25 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-[18%] h-[64%] w-1 bg-white rounded-r shadow-[0_0_10px_#ffffff]" />
                )}
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Cloud & Mini-clock status */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isCloudActive
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
            }`}
          />
          <span className="truncate max-w-[130px] font-medium">{cloudStatusText}</span>
        </div>
        <div className="flex items-center gap-1 font-mono font-bold text-white">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{liveClock.mini}</span>
        </div>
      </div>
    </aside>
  );
};
