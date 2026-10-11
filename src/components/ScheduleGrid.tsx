import React, { useMemo } from 'react';
import { 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  Plus, 
  Sun, 
  Moon, 
  CheckCircle2, 
  XCircle,
  Sparkles
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { getDaysForView, formatDayHeader, formatDateIso } from '../utils/dateUtils';
import { ShiftAssignment, ShiftType, Employee } from '../types/schedule';

interface ScheduleGridProps {
  onSelectCell: (employeeId: string, date: string) => void;
  onOpenConflictDetails: (employeeId: string, date: string) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  onSelectCell,
  onOpenConflictDetails,
}) => {
  const {
    employees,
    shiftTypes,
    assignments,
    currentDate,
    viewMode,
    departmentFilter,
    searchQuery,
    validation,
    activeTool,
    assignShift,
    removeAssignmentsForCell,
  } = useSchedule();

  const days = useMemo(() => {
    return getDaysForView(currentDate, viewMode);
  }, [currentDate, viewMode]);

  const shiftTypesMap = useMemo(() => {
    return new Map<string, ShiftType>(shiftTypes.map((st) => [st.id, st]));
  }, [shiftTypes]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [employees, departmentFilter, searchQuery]);

  // Quick lookup for assignments by cell: employeeId_date
  const assignmentsByCell = useMemo(() => {
    const map = new Map<string, ShiftAssignment[]>();
    for (const a of assignments) {
      const key = `${a.employeeId}_${a.date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [assignments]);

  // Handle cell click (either apply active tool or open detail modal)
  const handleCellClick = (employeeId: string, dateIso: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeTool === 'eraser') {
      removeAssignmentsForCell(employeeId, dateIso);
      return;
    }

    if (activeTool) {
      assignShift(employeeId, dateIso, activeTool);
      return;
    }

    onSelectCell(employeeId, dateIso);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
      
      {/* Scrollable table container */}
      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse text-left select-none">
          
          {/* Header Row: Days */}
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-20">
              
              {/* Employee Column Header */}
              <th className="sticky left-0 z-30 bg-slate-950/95 px-4 py-3.5 w-72 min-w-[280px] border-r border-slate-800 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Сотрудник / Роль
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    Норма / Факт
                  </span>
                </div>
              </th>

              {/* Day Headers */}
              {days.map((day) => {
                const { dayNumber, dayOfWeek, isWeekendDay, isCurrentDay } = formatDayHeader(day);
                const dateIso = formatDateIso(day);

                return (
                  <th
                    key={dateIso}
                    className={`px-1.5 py-2.5 text-center min-w-[58px] border-r border-slate-800/80 transition-colors ${
                      isCurrentDay
                        ? 'bg-indigo-950/60 ring-1 ring-indigo-500/50'
                        : isWeekendDay
                        ? 'bg-slate-950/80'
                        : 'bg-slate-950/50'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[10px] font-bold tracking-tight ${
                          isWeekendDay ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {dayOfWeek}
                      </span>
                      <span
                        className={`text-sm font-extrabold font-mono tabular-nums leading-none mt-0.5 ${
                          isCurrentDay
                            ? 'text-indigo-400 font-black scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                            : 'text-slate-200'
                        }`}
                      >
                        {dayNumber}
                      </span>
                      {isCurrentDay && (
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body: Employees */}
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={days.length + 1} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-600" />
                    <span>Сотрудники не найдены по заданным фильтрам</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, empIdx) => {
                const stats = validation.employeeStats.get(emp.id) || {
                  totalHours: 0,
                  overtimeHours: 0,
                  undertimeHours: 0,
                };

                const diff = stats.totalHours - emp.targetHoursMonth;
                const isOvertimeCritical = diff > 20;
                const isOvertimeModerate = diff > 8 && diff <= 20;
                const isNormal = diff >= -12 && diff <= 8;

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors group ${
                      empIdx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/20'
                    } hover:bg-slate-800/40`}
                  >
                    {/* Employee Fixed Column */}
                    <td className="sticky left-0 z-10 bg-slate-950/90 group-hover:bg-slate-900/90 px-4 py-2.5 border-r border-slate-800 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar Initials */}
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0 shadow-inner">
                            {emp.initials}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 truncate text-[13px]">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                              <span>{emp.role}</span>
                            </div>
                          </div>
                        </div>

                        {/* Hours indicator */}
                        <div className="text-right shrink-0">
                          <div className="font-mono tabular-nums text-xs font-bold text-slate-200">
                            {stats.totalHours} / {emp.targetHoursMonth}ч
                          </div>
                          <div className="text-[10px] font-mono tabular-nums font-semibold">
                            {diff > 0 ? (
                              <span
                                className={`px-1.5 py-0.2 rounded ${
                                  isOvertimeCritical
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : isOvertimeModerate
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                +{diff}ч
                              </span>
                            ) : diff < -12 ? (
                              <span className="text-sky-400">{diff}ч</span>
                            ) : (
                              <span className="text-emerald-400 font-medium">Норма</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Day Cells */}
                    {days.map((day) => {
                      const dateIso = formatDateIso(day);
                      const cellKey = `${emp.id}_${dateIso}`;
                      const cellAssignments = assignmentsByCell.get(cellKey) || [];
                      const cellIssues = validation.issuesByCellKey.get(cellKey) || [];
                      const hasCriticalConflict = cellIssues.some((i) => i.severity === 'critical');
                      const hasWarningConflict = cellIssues.some((i) => i.severity === 'warning');

                      const { isWeekendDay, isCurrentDay } = formatDayHeader(day);

                      return (
                        <td
                          key={dateIso}
                          onClick={(e) => handleCellClick(emp.id, dateIso, e)}
                          className={`p-1 text-center border-r border-slate-800/60 relative cursor-pointer transition-all duration-150 ${
                            isCurrentDay
                              ? 'bg-indigo-950/20 hover:bg-indigo-900/30'
                              : isWeekendDay
                              ? 'bg-slate-950/30 hover:bg-slate-800/60'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="min-h-[46px] flex flex-col items-center justify-center rounded-lg p-0.5 relative">
                            {/* Empty state hover indicator */}
                            {cellAssignments.length === 0 && (
                              <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                            )}

                            {/* Render Shifts */}
                            {cellAssignments.map((a) => {
                              const st = shiftTypesMap.get(a.shiftTypeId);
                              if (!st) return null;

                              return (
                                <div
                                  key={a.id}
                                  className={`w-full py-1 px-1 rounded-md text-[11px] font-bold tracking-tight shadow-sm transition-transform hover:scale-[1.03] flex flex-col items-center justify-center relative overflow-hidden ${
                                    st.badgeBg
                                  } ${st.textColor} border ${st.borderColor}`}
                                  title={`${st.name}: ${a.customStartTime || st.startTime}–${
                                    a.customEndTime || st.endTime
                                  } (${a.customHours ?? st.durationHours}ч)${
                                    a.note ? `\nЗаметка: ${a.note}` : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-1 leading-none">
                                    <span className="font-extrabold font-mono">{st.code}</span>
                                    {st.id === 'shift-night-12' && <Moon className="w-2.5 h-2.5 opacity-90" />}
                                    {st.id === 'shift-day-12' && <Sun className="w-2.5 h-2.5 opacity-90" />}
                                  </div>
                                  <span className="text-[9px] font-mono opacity-90 font-normal leading-tight mt-0.5">
                                    {a.customHours ?? st.durationHours}ч
                                  </span>
                                </div>
                              );
                            })}

                            {/* Neon Conflict Badge Alert */}
                            {hasCriticalConflict && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenConflictDetails(emp.id, dateIso);
                                }}
                                className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-[0_0_10px_#f43f5e] animate-bounce ring-1 ring-white"
                                title={`Конфликт правил! Кликните для информации: ${cellIssues[0]?.title}`}
                              >
                                <ShieldAlert className="w-2.5 h-2.5" />
                              </button>
                            )}

                            {!hasCriticalConflict && hasWarningConflict && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenConflictDetails(emp.id, dateIso);
                                }}
                                className="absolute -top-1 -right-1 z-10 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-[0_0_8px_#f59e0b] ring-1 ring-white"
                                title={`Предупреждение: ${cellIssues[0]?.title}`}
                              >
                                <AlertCircle className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer: Headcount Coverage Per Day */}
          <tfoot>
            <tr className="border-t-2 border-slate-700 bg-slate-950 sticky bottom-0 z-20">
              <td className="sticky left-0 z-30 bg-slate-950 px-4 py-3 border-r border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Укомплектованность смен
                  </span>
                  <span className="text-[10px] text-slate-400">
                    День (мин. 2) / Ночь (мин. 2 + L2)
                  </span>
                </div>
              </td>

              {days.map((day) => {
                const dateIso = formatDateIso(day);
                const cov = validation.dateCoverage.get(dateIso) || {
                  dayCount: 0,
                  nightCount: 0,
                  daily24Count: 0,
                  totalWorkers: 0,
                  hasLeadDay: false,
                  hasLeadNight: false,
                };

                const isMissingLeadNight = cov.nightCount > 0 && !cov.hasLeadNight;
                const isUnderstaffedDay = cov.dayCount < 2 && cov.totalWorkers > 0;

                return (
                  <td
                    key={`foot-${dateIso}`}
                    className="px-1 py-2 text-center border-r border-slate-800 text-[10px] font-mono tabular-nums"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sky-300" title="Дневная смена">
                          Д:{cov.dayCount}
                        </span>
                        <span className="text-purple-300" title="Ночная смена">
                          Н:{cov.nightCount}
                        </span>
                      </div>

                      {/* Status indicator icon */}
                      {isMissingLeadNight ? (
                        <span
                          className="text-amber-400 font-bold flex items-center gap-0.5 text-[9px]"
                          title="В ночную смену отсутствует старший инженер L2!"
                        >
                          <AlertCircle className="w-2.5 h-2.5" />
                          !L2
                        </span>
                      ) : cov.totalWorkers >= 3 ? (
                        <span title="Смена полностью укомплектована">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </span>
                      ) : cov.totalWorkers > 0 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>

        </table>
      </div>

    </div>
  );
};
