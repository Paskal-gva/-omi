import React, { useState } from 'react';
import { useOmi } from '../../context/OmiContext';
import { MONTHS, WD } from '../../data/omiConstants';
import { 
  getWorkingDaysOfMonth, 
  isHoliday, 
  isWorkingDay,
  getShiftBadgeStyle 
} from '../../utils/omiAlgorithm';
import { ShiftPopover } from './ShiftPopover';
import { DutyPopover } from './DutyPopover';
import { SmartSuggestModal } from './SmartSuggestModal';
import { exportScheduleToExcel } from '../../utils/excelExport';
import { ShiftCode } from '../../types/omi';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  FileSpreadsheet, 
  Printer, 
  Layers,
  LayoutGrid,
  ListFilter,
  UserCheck,
  Plus,
  User,
  Users,
  ArrowRight,
  Shield,
  Sparkles,
  CheckCircle2,
  Clock,
  CalendarDays
} from 'lucide-react';

interface ScheduleViewProps {
  onOpenIcsModal: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onOpenIcsModal }) => {
  const {
    state,
    changeMonth,
    toggleViewMonths,
    setShift,
    setDuty,
    filterEmpId,
    setFilterEmpId,
  } = useOmi();

  const [mobileMode, setMobileMode] = useState<'calendar' | 'feed' | 'employees'>('calendar');

  const [y, m] = state.currentMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  // Selected day for Advanced Mobile Calendar
  const [selectedDayNum, setSelectedDayNum] = useState<number>(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return ym === state.currentMonth ? now.getDate() : 1;
  });

  // Popover state for shift
  const [popoverState, setPopoverState] = useState<{
    ym: string;
    empId: number;
    date: string;
    pos: { x: number; y: number };
  } | null>(null);

  // Popover state for duty officer
  const [dutyPopoverState, setDutyPopoverState] = useState<{
    ym: string;
    date: string;
    currentDutyId?: number;
    pos: { x: number; y: number };
  } | null>(null);

  // State for AI Smart Suggest Modal
  const [smartSuggestState, setSmartSuggestState] = useState<{
    isOpen: boolean;
    date?: string;
    shiftCode?: string;
  }>({ isOpen: false });

  const openSmartSuggest = (date?: string, shiftCode?: string) => {
    const targetDate = date || `${state.currentMonth}-${String(selectedDayNum || 1).padStart(2, '0')}`;
    setSmartSuggestState({
      isOpen: true,
      date: targetDate,
      shiftCode: shiftCode || 'ост',
    });
  };

  const handleCellClick = (
    ym: string,
    empId: number,
    date: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDutyPopoverState(null);
    setPopoverState({
      ym,
      empId,
      date,
      pos: { x: e.clientX, y: e.clientY },
    });
  };

  const handleDutyClick = (
    ym: string,
    date: string,
    currentDutyId: number | undefined,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setPopoverState(null);
    setDutyPopoverState({
      ym,
      date,
      currentDutyId,
      pos: { x: e.clientX, y: e.clientY },
    });
  };

  const handleShiftSelect = (code: ShiftCode) => {
    if (popoverState) {
      setShift(popoverState.ym, popoverState.empId, popoverState.date, code);
      setPopoverState(null);
    }
  };

  const handleDutySelect = (empId: number | null) => {
    if (dutyPopoverState) {
      setDuty(dutyPopoverState.ym, dutyPopoverState.date, empId);
      setDutyPopoverState(null);
    }
  };

  // Filtered employees for display
  const selectedEmployee = state.employees.find((e) => e.id === filterEmpId);

  // Compute stats for selected employee
  const currentMonthData = state.schedule[state.currentMonth] || { res: {}, duty: {} };
  const workingDaysThisMonth = getWorkingDaysOfMonth(state.currentMonth);
  
  let myShiftsCount = 0;
  let myDutyCount = 0;
  let nextShiftStr = '';

  if (selectedEmployee) {
    const res = currentMonthData.res?.[selectedEmployee.id] || {};
    const duty = currentMonthData.duty || {};
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (const d of workingDaysThisMonth) {
      const fd = `${state.currentMonth}-${String(d).padStart(2, '0')}`;
      const code = res[fd];
      if (code === 'ост' || code === 'кор' || code === 'искра') {
        myShiftsCount++;
        if (!nextShiftStr && fd >= todayStr) {
          nextShiftStr = `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')} (${code.toUpperCase()})`;
        }
      }
      if (duty[fd] === selectedEmployee.id) {
        myDutyCount++;
      }
    }
  }

  // Desktop Single Month Table
  const renderSingleMonthTable = (ym: string) => {
    const [year, month] = ym.split('-').map(Number);
    const workingDays = getWorkingDaysOfMonth(ym);
    const sch = state.schedule[ym] || { res: {}, duty: {} };
    const res = sch.res || {};
    const duty = sch.duty || {};
    const isLocked = Boolean(state.locked[ym]);

    return (
      <div key={ym} className="space-y-3">
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <span>
              {MONTHS[month - 1]} {year}
            </span>
            {isLocked && (
              <span className="text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                🔒 Зафиксирован
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 shadow-inner">
          <table className="w-full border-collapse text-xs select-none">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="sticky left-0 z-20 bg-black/95 backdrop-blur-md px-4 py-3 text-left font-semibold text-slate-300 min-w-[130px] border-r border-white/10">
                  Сотрудник
                </th>
                {workingDays.map((d) => {
                  const dt = new Date(year, month - 1, d);
                  const dayOfWeek = WD[dt.getDay()];
                  return (
                    <th
                      key={d}
                      className="px-2 py-2.5 text-center font-medium text-slate-400 min-w-[48px] border-r border-white/5"
                    >
                      <div className="font-mono tabular-nums text-white font-bold">
                        {String(d).padStart(2, '0')}.{String(month).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {dayOfWeek}
                      </div>
                    </th>
                  );
                })}
                <th className="px-3 py-3 text-center font-bold text-slate-300 min-w-[60px]">
                  Всего
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-mono">
              {state.employees.map((emp) => {
                let totalWorkShifts = 0;
                const isFocused = filterEmpId === null || filterEmpId === emp.id;

                return (
                  <tr
                    key={emp.id}
                    className={`transition-all ${
                      isFocused ? 'hover:bg-white/[0.04]' : 'opacity-35 hover:opacity-75'
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-black/95 backdrop-blur-md px-4 py-2.5 text-left font-sans font-bold text-slate-100 border-r border-white/10 flex items-center justify-between">
                      <span>{emp.name}</span>
                      {filterEmpId === emp.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                      )}
                    </td>

                    {workingDays.map((d) => {
                      const fullDate = `${ym}-${String(d).padStart(2, '0')}`;
                      const val = (res[emp.id] || {})[fullDate] || '';
                      const vRec = state.vacations.find(
                        (v) => v.empId === emp.id && fullDate >= v.from && fullDate <= v.to
                      );

                      let codeToDisplay: ShiftCode = val;
                      if (vRec) {
                        codeToDisplay = vRec.desc.toLowerCase().includes('бол')
                          ? 'sick'
                          : 'vac';
                      }

                      if (
                        codeToDisplay === 'ост' ||
                        codeToDisplay === 'кор' ||
                        codeToDisplay === 'искра'
                      ) {
                        totalWorkShifts++;
                      }

                      const badge = getShiftBadgeStyle(codeToDisplay);

                      return (
                        <td
                          key={fullDate}
                          className="px-1 py-1 text-center border-r border-white/5"
                        >
                          <button
                            onClick={(e) => handleCellClick(ym, emp.id, fullDate, e)}
                            className={`w-full py-1.5 px-1 rounded-lg text-xs transition-transform active:scale-95 flex items-center justify-center cursor-pointer ${badge.className}`}
                            title={`${emp.name}: ${badge.label} (${fullDate})`}
                          >
                            {badge.label}
                          </button>
                        </td>
                      );
                    })}

                    <td className="px-2 py-2 text-center font-bold text-white bg-white/[0.02]">
                      {totalWorkShifts}
                    </td>
                  </tr>
                );
              })}

              {/* Duty Row with Direct Click to Edit */}
              <tr className="bg-white/[0.03] font-sans font-semibold border-t-2 border-white/10">
                <td className="sticky left-0 z-10 bg-black/95 backdrop-blur-md px-4 py-2.5 text-left text-slate-300 border-r border-white/10 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Дежурный</span>
                </td>
                {workingDays.map((d) => {
                  const fullDate = `${ym}-${String(d).padStart(2, '0')}`;
                  const dutyId = duty[fullDate];
                  const dutyEmp = state.employees.find((e) => e.id === dutyId);
                  const isDutyHighlighted = filterEmpId ? dutyId === filterEmpId : false;

                  return (
                    <td
                      key={`duty-${fullDate}`}
                      className="px-1 py-1.5 text-center text-xs border-r border-white/5"
                    >
                      <button
                        onClick={(e) => handleDutyClick(ym, fullDate, dutyId, e)}
                        className={`w-full py-1 px-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                          isDutyHighlighted
                            ? 'text-white bg-emerald-500 ring-2 ring-white shadow-md'
                            : dutyEmp
                            ? 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 shadow-sm'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-dashed border-white/10'
                        }`}
                        title="Нажмите для смены или назначения дежурного"
                      >
                        {dutyEmp ? dutyEmp.name : <Plus className="w-3 h-3 text-slate-500" />}
                      </button>
                    </td>
                  );
                })}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ADVANCED MOBILE CALENDAR (Продвинутый интерактивный календарь со смарт-инспектором дня)
  const renderAdvancedMobileCalendar = () => {
    const ym = state.currentMonth;
    const [year, month] = ym.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const sch = state.schedule[ym] || { res: {}, duty: {} };
    const res = sch.res || {};
    const duty = sch.duty || {};

    const now = new Date();
    const todayNum = now.getDate();
    const isCurrentActualMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` === ym;

    // Keep selectedDayNum bounded
    const currentSelectedDay = Math.min(Math.max(1, selectedDayNum), daysInMonth);

    // Selected Day Data for Inspector
    const selectedFd = `${ym}-${String(currentSelectedDay).padStart(2, '0')}`;
    const selectedDt = new Date(year, month - 1, currentSelectedDay);
    const isSelectedWorking = isWorkingDay(selectedDt);
    const selectedDayOfWeekName = WD[selectedDt.getDay()];
    const selectedDutyId = duty[selectedFd];
    const selectedDutyEmp = state.employees.find((e) => e.id === selectedDutyId);

    const handlePrevDay = () => {
      setSelectedDayNum((prev) => (prev > 1 ? prev - 1 : daysInMonth));
    };

    const handleNextDay = () => {
      setSelectedDayNum((prev) => (prev < daysInMonth ? prev + 1 : 1));
    };

    return (
      <div className="space-y-4">
        {/* 1. Monthly Calendar Grid Card */}
        <div className="bg-white/[0.03] border border-white/15 rounded-3xl p-3.5 sm:p-4 text-white font-sans shadow-2xl backdrop-blur-2xl">
          {/* Calendar Header with Fast Month Switcher & Jump to Today */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-sm sm:text-base text-white px-1">
                {MONTHS[month - 1]} {year}
              </span>

              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {isCurrentActualMonth && (
              <button
                onClick={() => setSelectedDayNum(todayNum)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  currentSelectedDay === todayNum
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Сегодня ({todayNum})</span>
              </button>
            )}
          </div>

          {/* Calendar Weekday Headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 border-b border-white/10 pb-2 mb-2">
            <div>Пн</div>
            <div>Вт</div>
            <div>Ср</div>
            <div>Чт</div>
            <div>Пт</div>
            <div className="text-rose-400">Сб</div>
            <div className="text-rose-400">Вс</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading days */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[60px]" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dt = new Date(year, month - 1, d);
              const wd = dt.getDay();
              const isHol = isHoliday(dt) || wd === 0 || wd === 6;
              const fd = `${ym}-${String(d).padStart(2, '0')}`;

              const isSelected = currentSelectedDay === d;
              const isToday = isCurrentActualMonth && todayNum === d;

              const dutyId = duty[fd];
              const dutyEmp = state.employees.find((e) => e.id === dutyId);
              const isMyDuty = filterEmpId && dutyId === filterEmpId;

              // Count working shifts on this day
              let workShiftsCount = 0;
              state.employees.forEach((emp) => {
                const val = (res[emp.id] || {})[fd];
                if (val === 'ост' || val === 'кор' || val === 'искра') {
                  workShiftsCount++;
                }
              });

              return (
                <div
                  key={d}
                  onClick={() => setSelectedDayNum(d)}
                  className={`min-h-[64px] p-1.5 rounded-2xl flex flex-col justify-between text-left text-xs transition-all cursor-pointer border active:scale-95 relative ${
                    isSelected
                      ? 'ring-2 ring-white bg-white/15 border-white shadow-[0_0_18px_rgba(255,255,255,0.18)] z-10'
                      : isToday
                      ? 'bg-white/10 border-white/30 text-white'
                      : isHol
                      ? 'bg-rose-950/15 border-rose-500/20 text-rose-300'
                      : 'bg-white/[0.02] border-white/5 text-slate-200 hover:border-white/20'
                  }`}
                >
                  {/* Top: Day Number & Today indicator */}
                  <div className="flex items-center justify-between leading-none">
                    <span
                      className={`font-mono text-xs font-extrabold ${
                        isToday ? 'text-white underline decoration-white decoration-2' : isHol ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {d}
                    </span>

                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                    )}
                  </div>

                  {/* Middle: Duty Officer Tag */}
                  {dutyEmp && (
                    <div className="mt-1">
                      <span
                        className={`inline-block px-1 py-0.5 rounded-[5px] text-[8px] font-black uppercase tracking-tight truncate max-w-full ${
                          isMyDuty
                            ? 'bg-emerald-400 text-black shadow-sm ring-1 ring-emerald-300'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                        title={`Дежурный: ${dutyEmp.name}`}
                      >
                        {dutyEmp.name.split(' ')[0]}
                      </span>
                    </div>
                  )}

                  {/* Bottom: Micro Shift Indicators */}
                  <div className="space-y-0.5 mt-0.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {state.employees.map((emp) => {
                        const val = (res[emp.id] || {})[fd] || '';
                        const vRec = state.vacations.find(
                          (v) => v.empId === emp.id && fd >= v.from && fd <= v.to
                        );

                        if (!val && !vRec) return null;

                        let dotColor = 'bg-slate-400';
                        if (vRec || val === 'vac') dotColor = 'bg-amber-400';
                        else if (val === 'sick') dotColor = 'bg-rose-400';
                        else if (val === 'ост') dotColor = 'bg-emerald-400';
                        else if (val === 'кор') dotColor = 'bg-blue-400';
                        else if (val === 'искра') dotColor = 'bg-purple-400';

                        return (
                          <span
                            key={emp.id}
                            className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                            title={`${emp.name}: ${val || 'Отпуск'}`}
                          />
                        );
                      })}
                    </div>

                    {workShiftsCount > 0 && (
                      <div className="text-[8px] font-mono text-slate-400 font-semibold leading-none">
                        {workShiftsCount}см
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Day Inspector Card (Инспектор выбранного дня) */}
        <div className="bg-white/[0.04] border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 backdrop-blur-2xl animate-in fade-in duration-150">
          {/* Day Inspector Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Предыдущий день"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h3 className="font-mono text-base font-extrabold text-white">
                  {currentSelectedDay} {MONTHS[month - 1]} {year}
                </h3>
                <span className="text-xs font-bold text-slate-300">
                  ({selectedDayOfWeekName})
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                {isSelectedWorking ? (
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    ● Рабочий день
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-400 font-semibold">
                    ● Праздник / Выходной
                  </span>
                )}
                {isCurrentActualMonth && todayNum === currentSelectedDay && (
                  <span className="px-1.5 py-0.2 rounded bg-white text-black text-[9px] font-extrabold uppercase">
                    Сегодня
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Следующий день"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Duty Officer Section in Inspector with 1-tap change */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Дежурный инженер на день:
                </span>
                <div className="font-bold text-sm text-white flex items-center gap-2 truncate">
                  <span className="truncate">{selectedDutyEmp ? selectedDutyEmp.name : 'Не назначен'}</span>
                  {selectedDutyEmp && (
                    <span className="text-[10px] text-emerald-400 font-normal shrink-0">
                      ({selectedDutyEmp.role})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => openSmartSuggest(selectedFd, 'duty')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title="AI подбор дежурного"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">AI Подбор</span>
              </button>

              <button
                onClick={(e) => handleDutyClick(ym, selectedFd, selectedDutyId, e)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-slate-200 transition-all cursor-pointer shadow-md"
              >
                {selectedDutyEmp ? 'Сменить' : '+ Назначить'}
              </button>

              {selectedDutyEmp && (
                <button
                  onClick={() => setDuty(ym, selectedFd, null)}
                  className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
                  title="Снять дежурного"
                >
                  <span className="text-xs font-bold px-1">✕</span>
                </button>
              )}
            </div>
          </div>

          {/* Shift Lineup for this day */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Смены команды на {currentSelectedDay} {MONTHS[month - 1].slice(0, 3)}:
              </span>
              <button
                onClick={() => openSmartSuggest(selectedFd, 'ост')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                title="AI рекомендация сотрудника на смену"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Smart Suggest</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {state.employees.map((emp) => {
                const val = (res[emp.id] || {})[selectedFd] || '';
                const vRec = state.vacations.find(
                  (v) => v.empId === emp.id && selectedFd >= v.from && selectedFd <= v.to
                );

                let codeToDisplay: ShiftCode = val;
                if (vRec) {
                  codeToDisplay = vRec.desc.toLowerCase().includes('бол')
                    ? 'sick'
                    : 'vac';
                }

                const badge = getShiftBadgeStyle(codeToDisplay);
                const isDuty = selectedDutyId === emp.id;

                return (
                  <div
                    key={emp.id}
                    onClick={(e) => handleCellClick(ym, emp.id, selectedFd, e)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {emp.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{emp.name}</span>
                          {isDuty && (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-semibold shrink-0">
                              Деж.
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {emp.role}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-transform active:scale-95 shrink-0 ${badge.className}`}
                    >
                      {badge.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Day Feed (Лента смен по дням с 1-tap назначением дежурного)
  const renderMobileDayFeed = () => {
    const ym = state.currentMonth;
    const [year, month] = ym.split('-').map(Number);
    const workingDays = getWorkingDaysOfMonth(ym);
    const sch = state.schedule[ym] || { res: {}, duty: {} };
    const res = sch.res || {};
    const duty = sch.duty || {};

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    return (
      <div className="space-y-2.5">
        {workingDays.map((d) => {
          const dt = new Date(year, month - 1, d);
          const fd = `${ym}-${String(d).padStart(2, '0')}`;
          const isToday = fd === todayStr;
          const dayName = WD[dt.getDay()];
          const dutyId = duty[fd];
          const dutyEmp = state.employees.find((e) => e.id === dutyId);
          const isMyDuty = filterEmpId && dutyId === filterEmpId;

          return (
            <div
              key={fd}
              className={`p-3.5 rounded-2xl border transition-all ${
                isToday
                  ? 'bg-white/10 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'bg-white/[0.03] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-white">
                    {String(d).padStart(2, '0')} {MONTHS[month - 1].slice(0, 3)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    ({dayName})
                  </span>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-black shadow-sm">
                      Сегодня
                    </span>
                  )}
                </div>

                {/* Interactive Duty Officer Button */}
                <button
                  onClick={(e) => handleDutyClick(ym, fd, dutyId, e)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    isMyDuty
                      ? 'text-white bg-emerald-500 border-white ring-2 ring-emerald-400'
                      : dutyEmp
                      ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'text-slate-400 bg-white/5 border-dashed border-white/15 hover:border-white/30'
                  }`}
                  title="Нажмите для смены дежурного"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {dutyEmp ? `Дежурный: ${dutyEmp.name}` : '+ Назначить дежурного'}
                  </span>
                </button>
              </div>

              {/* Employees Shifts Chips for this Day */}
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                {state.employees
                  .filter((emp) => filterEmpId === null || filterEmpId === emp.id)
                  .map((emp) => {
                    const val = (res[emp.id] || {})[fd] || '';
                    const vRec = state.vacations.find(
                      (v) => v.empId === emp.id && fd >= v.from && fd <= v.to
                    );

                    let codeToDisplay: ShiftCode = val;
                    if (vRec) {
                      codeToDisplay = vRec.desc.toLowerCase().includes('бол')
                        ? 'sick'
                        : 'vac';
                    }

                    const badge = getShiftBadgeStyle(codeToDisplay);

                    return (
                      <button
                        key={emp.id}
                        onClick={(e) => handleCellClick(ym, emp.id, fd, e)}
                        className={`flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer text-left ${
                          filterEmpId === emp.id ? 'ring-1 ring-white/30 bg-white/5' : ''
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {emp.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Mobile Employee View (Сводные карточки сотрудников с дежурствами и сменами)
  const renderMobileEmployeeCards = () => {
    const ym = state.currentMonth;
    const [year, month] = ym.split('-').map(Number);
    const workingDays = getWorkingDaysOfMonth(ym);
    const sch = state.schedule[ym] || { res: {}, duty: {} };
    const res = sch.res || {};
    const duty = sch.duty || {};

    const filteredEmployees = filterEmpId
      ? state.employees.filter((e) => e.id === filterEmpId)
      : state.employees;

    return (
      <div className="space-y-3">
        {filteredEmployees.map((emp) => {
          const empRes = res[emp.id] || {};
          let shiftCount = 0;
          let dutyCount = 0;
          const assignedDays: { day: number; code: ShiftCode; isDuty: boolean }[] = [];

          workingDays.forEach((d) => {
            const fd = `${ym}-${String(d).padStart(2, '0')}`;
            const code = empRes[fd] || '';
            const isDuty = duty[fd] === emp.id;
            const vRec = state.vacations.find(
              (v) => v.empId === emp.id && fd >= v.from && fd <= v.to
            );

            let effectiveCode: ShiftCode = code;
            if (vRec) {
              effectiveCode = vRec.desc.toLowerCase().includes('бол') ? 'sick' : 'vac';
            }

            if (effectiveCode === 'ост' || effectiveCode === 'кор' || effectiveCode === 'искра') {
              shiftCount++;
            }
            if (isDuty) {
              dutyCount++;
            }

            if (effectiveCode || isDuty) {
              assignedDays.push({ day: d, code: effectiveCode, isDuty });
            }
          });

          const isFocused = filterEmpId === emp.id;

          return (
            <div
              key={emp.id}
              className={`p-4 rounded-3xl border transition-all ${
                isFocused
                  ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {emp.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2 truncate">
                      <span>{emp.name}</span>
                      {isFocused && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-white text-black shrink-0">
                          Выбран
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{emp.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setFilterEmpId(isFocused ? null : emp.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {isFocused ? 'Сбросить' : 'Мой график'}
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    Рабочих смен
                  </span>
                  <span className="font-mono text-base font-extrabold text-white">
                    {shiftCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase block">
                    Дежурств в месяце
                  </span>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    {dutyCount}
                  </span>
                </div>
              </div>

              {/* Shift timeline chips for this employee */}
              <div className="mt-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  График дежурств и смен:
                </span>

                {assignedDays.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">Нет назначенных смен в этом месяце</p>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {assignedDays.map(({ day, code, isDuty }) => {
                      const fd = `${ym}-${String(day).padStart(2, '0')}`;
                      const badge = getShiftBadgeStyle(code);

                      return (
                        <div
                          key={day}
                          className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl p-1 pr-1.5 text-xs"
                        >
                          <span className="font-mono font-bold text-slate-200 px-1.5 py-0.5 rounded bg-white/5 text-[11px]">
                            {String(day).padStart(2, '0')}.{String(month).padStart(2, '0')}
                          </span>

                          {isDuty && (
                            <button
                              onClick={(e) => handleDutyClick(ym, fd, emp.id, e)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500 text-black flex items-center gap-0.5 cursor-pointer"
                              title="Дежурный инженер (нажмите для смены)"
                            >
                              <UserCheck className="w-2.5 h-2.5" />
                              <span>Деж</span>
                            </button>
                          )}

                          {code && (
                            <button
                              onClick={(e) => handleCellClick(ym, emp.id, fd, e)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${badge.className}`}
                              title={`${badge.label} (нажмите для смены)`}
                            >
                              {badge.label}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Personal Filter Ribbon ("Мой график") */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 px-1">
            <User className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Фильтр:</span>
          </span>

          <button
            onClick={() => setFilterEmpId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterEmpId === null
                ? 'bg-white text-black shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            Все сотрудники
          </button>

          {state.employees.map((emp) => {
            const isSelected = filterEmpId === emp.id;
            return (
              <button
                key={emp.id}
                onClick={() => setFilterEmpId(isSelected ? null : emp.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-black shadow-md'
                    : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
              >
                {emp.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Personal Mode Summary Badge (if an engineer is chosen) */}
      {selectedEmployee && (
        <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-extrabold flex items-center justify-center text-xs">
              {selectedEmployee.name.slice(0, 2)}
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                Персональный график: {selectedEmployee.name} ({selectedEmployee.role})
              </div>
              <div className="text-slate-300 text-[11px] flex items-center gap-3 mt-0.5 flex-wrap">
                <span>Рабочих смен: <strong className="text-white font-mono">{myShiftsCount}</strong></span>
                <span>Дежурств: <strong className="text-emerald-300 font-mono">{myDutyCount}</strong></span>
                {nextShiftStr && (
                  <span>Ближайшая смена: <strong className="text-white font-mono">{nextShiftStr}</strong></span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setFilterEmpId(null)}
            className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer self-start sm:self-auto"
          >
            Сбросить фильтр
          </button>
        </div>
      )}

      {/* Schedule Header and Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              График сменности
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Нажмите на ячейку смены или дежурного для изменения.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* AI Smart Suggest Button */}
          <button
            onClick={() => openSmartSuggest()}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500/20 via-white/10 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 text-white border border-emerald-500/40 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Интеллектуальный подбор кандидата на смену"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Smart Suggest</span>
          </button>

          {/* Month Navigator */}
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Предыдущий месяц"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs sm:text-sm font-bold text-white min-w-[120px] text-center font-sans">
              {MONTHS[m - 1]} {y}
            </span>

            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Следующий месяц"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Mode Switcher (Продвинутый календарь, Список дежурств, По сотрудникам) */}
      <div className="flex md:hidden p-1 bg-black/60 border border-white/10 rounded-2xl gap-1">
        <button
          onClick={() => setMobileMode('calendar')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileMode === 'calendar'
              ? 'bg-white text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Календарь</span>
        </button>

        <button
          onClick={() => setMobileMode('feed')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileMode === 'feed'
              ? 'bg-white text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Список дежурств</span>
        </button>

        <button
          onClick={() => setMobileMode('employees')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileMode === 'employees'
              ? 'bg-white text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>По сотрудникам</span>
        </button>
      </div>

      {/* Desktop Multi-Month Tables */}
      <div className="hidden md:flex flex-col gap-8">
        {renderSingleMonthTable(state.currentMonth)}

        {state.viewMonths >= 2 && (() => {
          let nextM = m + 1;
          let nextY = y;
          if (nextM > 12) {
            nextM = 1;
            nextY++;
          }
          return renderSingleMonthTable(`${nextY}-${String(nextM).padStart(2, '0')}`);
        })()}

        {state.viewMonths === 3 && (() => {
          let nextM = m + 2;
          let nextY = y;
          if (nextM > 12) {
            nextM -= 12;
            nextY++;
          }
          return renderSingleMonthTable(`${nextY}-${String(nextM).padStart(2, '0')}`);
        })()}
      </div>

      {/* Mobile Optimized Views */}
      <div className="md:hidden">
        {mobileMode === 'calendar' && renderAdvancedMobileCalendar()}
        {mobileMode === 'feed' && renderMobileDayFeed()}
        {mobileMode === 'employees' && renderMobileEmployeeCards()}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 flex-wrap">
        {/* Legend */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500 text-black">
            Ост
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500 text-white">
            Кор
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500 text-white">
            Иск
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500 text-black">
            Отп
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500 text-white">
            Бол
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={toggleViewMonths}
            className="hidden sm:flex px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Вид: {state.viewMonths} мес.</span>
          </button>

          <button
            onClick={onOpenIcsModal}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>В календарь</span>
          </button>

          <button
            onClick={() =>
              exportScheduleToExcel(
                state.currentMonth,
                state.employees,
                state.schedule[state.currentMonth] || { res: {}, duty: {} },
                state.vacations
              )
            }
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Печать</span>
          </button>
        </div>
      </div>

      {/* Popovers */}
      {popoverState && (
        <ShiftPopover
          position={popoverState.pos}
          onSelect={handleShiftSelect}
          onSmartSuggest={() => openSmartSuggest(popoverState.date, 'ост')}
          onClose={() => setPopoverState(null)}
        />
      )}

      {dutyPopoverState && (
        <DutyPopover
          ym={dutyPopoverState.ym}
          date={dutyPopoverState.date}
          currentDutyId={dutyPopoverState.currentDutyId}
          position={dutyPopoverState.pos}
          onSelect={handleDutySelect}
          onSmartSuggest={() => openSmartSuggest(dutyPopoverState.date, 'duty')}
          onClose={() => setDutyPopoverState(null)}
        />
      )}

      {/* AI Smart Suggest Modal */}
      <SmartSuggestModal
        isOpen={smartSuggestState.isOpen}
        initialDate={smartSuggestState.date}
        initialShiftCode={smartSuggestState.shiftCode}
        onClose={() => setSmartSuggestState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
