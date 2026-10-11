import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Search, 
  Eraser, 
  Sparkles,
  Filter,
  X
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { formatMonthYear } from '../utils/dateUtils';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { CalendarViewMode } from '../types/schedule';

interface ToolbarProps {
  onOpenAutoFill: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenAutoFill }) => {
  const {
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    departmentFilter,
    setDepartmentFilter,
    searchQuery,
    setSearchQuery,
    shiftTypes,
    activeTool,
    setActiveTool,
  } = useSchedule();

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'two-weeks') setCurrentDate(subDays(currentDate, 14));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'two-weeks') setCurrentDate(addDays(currentDate, 14));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    // Current demo anchor is October 2026
    setCurrentDate(new Date(2026, 9, 11));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-4 flex flex-col gap-4">
      
      {/* Top row: View Switcher, Date Navigator, Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: View Mode Segmented Control & Date Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented View Mode */}
          <div className="flex items-center p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
            {(['month', 'two-weeks', 'week'] as CalendarViewMode[]).map((mode) => {
              const labels: Record<CalendarViewMode, string> = {
                month: 'Месяц',
                'two-weeks': '2 недели',
                week: 'Неделя',
              };
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-xl px-2 py-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Предыдущий период"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-200 px-2 min-w-[120px] text-center font-sans">
              {formatMonthYear(currentDate)}
            </span>

            <button
              onClick={handleNext}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Следующий период"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="ml-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/60"
            >
              Сегодня
            </button>
          </div>
        </div>

        {/* Right: Department Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="pl-8 pr-8 py-1.5 text-xs font-medium bg-slate-950/70 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Все отделы</option>
              <option value="Инфраструктура и DevOps">Инфраструктура и DevOps</option>
              <option value="Поддержка 24/7">Поддержка 24/7</option>
              <option value="Склад и логистика">Склад и логистика</option>
              <option value="Контроль качества">Контроль качества</option>
            </select>
          </div>

          {/* Search Employee */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск сотрудника или роли..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs bg-slate-950/70 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors w-44 sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Shift Palette ("Кисть смен") */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Палитра быстрой расстановки:</span>
          </div>

          {shiftTypes.map((st) => {
            const isSelected = activeTool === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActiveTool(isSelected ? null : st.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? `${st.badgeBg} ring-2 ring-white/50 scale-105 shadow-md`
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                title={`${st.name} (${st.startTime}–${st.endTime}). Кликните для режима штамповки по ячейкам`}
              >
                <span className="font-bold font-mono">{st.code}</span>
                <span className="hidden sm:inline text-[11px] opacity-90">{st.name}</span>
              </button>
            );
          })}

          {/* Eraser */}
          <button
            onClick={() => setActiveTool(activeTool === 'eraser' ? null : 'eraser')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              activeTool === 'eraser'
                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-white/50 scale-105'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-800'
            }`}
            title="Ластик: кликните по ячейке для удаления смены"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Ластик</span>
          </button>
        </div>

        {activeTool && (
          <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
            <span>Режим быстрой расстановки активен: кликайте на ячейки</span>
            <button
              onClick={() => setActiveTool(null)}
              className="text-indigo-400 hover:text-white text-xs underline"
            >
              Отключить
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
