import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  Palmtree, 
  Clock, 
  ShieldCheck, 
  ShieldAlert,
  Moon,
  Sun
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { formatDateIso } from '../utils/dateUtils';

interface StatsCardsProps {
  onOpenConflicts: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ onOpenConflicts }) => {
  const { validation, currentDate, assignments, employees } = useSchedule();

  const todayIso = formatDateIso(currentDate);
  const todayCoverage = validation.dateCoverage.get(todayIso) || {
    dayCount: 0,
    nightCount: 0,
    daily24Count: 0,
    totalWorkers: 0,
    hasLeadDay: false,
    hasLeadNight: false,
  };

  // Calculate understaffed days across current month
  let deficitDaysCount = 0;
  for (const [, cov] of validation.dateCoverage.entries()) {
    if (cov.nightCount > 0 && !cov.hasLeadNight) {
      deficitDaysCount += 1;
    } else if (cov.dayCount < 2 && cov.totalWorkers > 0) {
      deficitDaysCount += 1;
    }
  }

  // Count employees in vacation or sick leave this month
  let onAbsenceCount = 0;
  for (const [, stats] of validation.employeeStats.entries()) {
    if (stats.absencesCount > 0) {
      onAbsenceCount += 1;
    }
  }

  // Total overtime hours
  let totalOvertimeHours = 0;
  let overtimeEmployeesCount = 0;
  for (const [, stats] of validation.employeeStats.entries()) {
    if (stats.overtimeHours > 0) {
      totalOvertimeHours += stats.overtimeHours;
      overtimeEmployeesCount += 1;
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
      
      {/* 1. Выходов на сегодня */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 backdrop-blur-md p-4 shadow-xl shadow-indigo-950/20 transition-all hover:border-indigo-500/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Выходов на сегодня
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono tabular-nums">
            {todayCoverage.totalWorkers}
          </span>
          <span className="text-xs text-slate-400">сотрудников</span>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-slate-300 pt-2 border-t border-indigo-500/10">
          <span className="inline-flex items-center gap-1 text-sky-300">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <strong className="font-mono tabular-nums">{todayCoverage.dayCount}</strong> день
          </span>
          <span className="inline-flex items-center gap-1 text-purple-300">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <strong className="font-mono tabular-nums">{todayCoverage.nightCount}</strong> ночь
          </span>
          {todayCoverage.daily24Count > 0 && (
            <span className="inline-flex items-center gap-1 text-teal-300">
              <strong className="font-mono tabular-nums">{todayCoverage.daily24Count}</strong> 24ч
            </span>
          )}
        </div>
      </div>

      {/* 2. Дефицит смен (недоукомплектованные слоты) */}
      <div 
        onClick={deficitDaysCount > 0 ? onOpenConflicts : undefined}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-orange-950/40 border border-amber-500/20 backdrop-blur-md p-4 shadow-xl shadow-amber-950/20 transition-all ${
          deficitDaysCount > 0 ? 'cursor-pointer hover:border-amber-400/50 hover:bg-slate-900/70' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Дефицит покрытия
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-200 tracking-tight font-mono tabular-nums">
            {deficitDaysCount}
          </span>
          <span className="text-xs text-slate-400">дней с дефицитом</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-amber-500/10">
          <span className="text-amber-200/90 truncate">
            {deficitDaysCount === 0 ? 'Все ключевые слоты укомплектованы' : 'Требуется Lead L2 на ночные слоты'}
          </span>
        </div>
      </div>

      {/* 3. Отпуска / больничные */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-rose-950/40 border border-purple-500/20 backdrop-blur-md p-4 shadow-xl shadow-purple-950/20 transition-all hover:border-purple-500/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
            Отпуска / Больничные
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
            <Palmtree className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-200 tracking-tight font-mono tabular-nums">
            {onAbsenceCount}
          </span>
          <span className="text-xs text-slate-400">чел. в текущем месяце</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-rose-500/10">
          <span className="text-slate-400">
            Смены заблокированы по ТК РФ
          </span>
        </div>
      </div>

      {/* 4. Часы переработки за период */}
      <div 
        onClick={totalOvertimeHours > 0 ? onOpenConflicts : undefined}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-teal-950/40 border border-emerald-500/20 backdrop-blur-md p-4 shadow-xl shadow-emerald-950/20 transition-all ${
          totalOvertimeHours > 0 ? 'cursor-pointer hover:border-emerald-400/50 hover:bg-slate-900/70' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Переработка за месяц
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 tracking-tight font-mono tabular-nums">
            +{totalOvertimeHours}
          </span>
          <span className="text-xs text-slate-400">ч сверх нормы</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-emerald-500/10">
          <span className="text-slate-400">
            {overtimeEmployeesCount > 0 ? `У ${overtimeEmployeesCount} сотрудников` : 'Все сотрудники в пределах нормы'}
          </span>
          {validation.criticalCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              {validation.criticalCount} алертов
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Нормы ОК
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
