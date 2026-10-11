import React from 'react';
import { useOmi } from '../../context/OmiContext';
import { ActiveTab } from '../../types/omi';
import { Calendar, BarChart3, Palmtree, CalendarRange, Settings, Users } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useOmi();

  const items: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { tab: 'schedule', icon: <Calendar className="w-5 h-5 stroke-[1.75]" />, label: 'График' },
    { tab: 'analytics', icon: <BarChart3 className="w-5 h-5 stroke-[1.75]" />, label: 'Аналитика' },
    { tab: 'vacations2027', icon: <Palmtree className="w-5 h-5 stroke-[1.75]" />, label: 'Отпуска' },
    { tab: 'year', icon: <CalendarRange className="w-5 h-5 stroke-[1.75]" />, label: 'На год' },
    { tab: 'team', icon: <Users className="w-5 h-5 stroke-[1.75]" />, label: 'Команда' },
    { tab: 'settings', icon: <Settings className="w-5 h-5 stroke-[1.75]" />, label: 'Опции' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-3xl border-t border-white/10 px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {items.map((item) => {
        const isActive = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`min-h-[46px] flex flex-col items-center justify-center py-1 px-2 rounded-2xl text-[9.5px] font-semibold transition-all cursor-pointer ${
              isActive
                ? 'text-white bg-white/15 border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <div className={isActive ? 'text-white scale-105 transition-transform' : 'text-slate-400'}>
              {item.icon}
            </div>
            <span className="mt-1 leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
