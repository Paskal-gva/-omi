import React from 'react';
import { 
  Plus, 
  Lock, 
  Unlock, 
  RotateCcw, 
  RotateCw, 
  CalendarDays 
} from 'lucide-react';
import { useOmi } from '../../context/OmiContext';

export const TopBar: React.FC = () => {
  const { 
    state, 
    generateCurrentMonthAndUpcoming, 
    toggleLock, 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    jumpToToday 
  } = useOmi();

  const isCurrentLocked = Boolean(state.locked[state.currentMonth]);

  return (
    <header className="flex items-center justify-between gap-2.5 flex-wrap pb-3 border-b border-white/10">
      {/* Left primary actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={generateCurrentMonthAndUpcoming}
          disabled={isCurrentLocked}
          className="px-4 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Сгенерировать месяц</span>
        </button>

        {/* Jump to Today Button */}
        <button
          onClick={jumpToToday}
          className="px-3.5 py-2 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
          title="Перейти к сегодняшней дате"
        >
          <CalendarDays className="w-3.5 h-3.5 text-slate-300" />
          <span>Сегодня</span>
        </button>
      </div>

      {/* Right actions: Undo/Redo, Lock toggle */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo controls */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Отменить действие (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Повторить действие (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lock Toggle */}
        <button
          onClick={() => toggleLock()}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
            isCurrentLocked
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
          }`}
          title="Зафиксировать месяц от случайных изменений"
        >
          {isCurrentLocked ? (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Зафиксировано</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Открыто</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
