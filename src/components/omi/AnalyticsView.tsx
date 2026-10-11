import React, { useState } from 'react';
import { useOmi } from '../../context/OmiContext';
import { MONTHS } from '../../data/omiConstants';
import { isWorkingDay } from '../../utils/omiAlgorithm';

export const AnalyticsView: React.FC = () => {
  const { state } = useOmi();
  const [selectedYear, setSelectedYear] = useState<number>(2027);
  const [selectedMonth, setSelectedMonth] = useState<number>(11); // Ноябрь

  const ym = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const [y, m] = ym.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const res = (state.schedule[ym] || {}).res || {};

  let ostCount = 0;
  let korCount = 0;
  let iskraCount = 0;
  let totalShifts = 0;
  let vacationsCount = 0;
  let sickCount = 0;

  const empWorkload: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(y, m - 1, d);
    const fd = `${ym}-${String(d).padStart(2, '0')}`;
    const working = isWorkingDay(dt);

    state.employees.forEach((emp) => {
      const val = (res[emp.id] || {})[fd] || '';
      const isVac = state.vacations.some(
        (v) => v.empId === emp.id && fd >= v.from && fd <= v.to
      );

      if (isVac || val === 'vac') vacationsCount++;
      if (val === 'sick') sickCount++;

      if (working) {
        if (val === 'ост') {
          ostCount++;
          empWorkload[emp.id] = (empWorkload[emp.id] || 0) + 1;
          totalShifts++;
        } else if (val === 'кор') {
          korCount++;
          empWorkload[emp.id] = (empWorkload[emp.id] || 0) + 1;
          totalShifts++;
        } else if (val === 'искра') {
          iskraCount++;
          empWorkload[emp.id] = (empWorkload[emp.id] || 0) + 1;
          totalShifts++;
        }
      }
    });
  }

  const avgLoad = state.employees.length > 0 ? (totalShifts / state.employees.length).toFixed(1) : '0';

  // Donut chart math
  const donutTotal = ostCount + korCount + iskraCount || 1;
  const ostPct = Math.round((ostCount / donutTotal) * 100);
  const korPct = Math.round((korCount / donutTotal) * 100);
  const iskraPct = Math.max(0, 100 - ostPct - korPct);

  // SVG Circumference
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          Аналитика и Дашборд
        </h2>
        <p className="text-xs text-slate-400">
          Фильтрация статистики и баланса смен по выбранному периоду.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white/[0.03] p-3 sm:p-4 rounded-2xl border border-white/10 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-300">Год:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-white"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-300">Месяц:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-white"
          >
            {MONTHS.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            Всего рабочих смен
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1.5">
            {totalShifts}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
            За {MONTHS[selectedMonth - 1]} {selectedYear}
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            Ср. нагрузка на инженера
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1.5">
            {avgLoad}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
            Смен на сотрудника
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            Дней в отпусках
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono mt-1.5">
            {vacationsCount}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
            Запланированные периоды
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            Дней на больничных
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-300 font-mono mt-1.5">
            {sickCount}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
            Листки нетрудоспособности
          </span>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-2">
        {/* Donut Chart: Shift Types */}
        <div className="bg-black/40 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col">
          <h3 className="text-xs sm:text-sm font-bold text-white text-center mb-5">
            Распределение типов смен
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
            {/* SVG Ring Chart */}
            <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="18"
                />
                {/* Ост (Green) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#30d158"
                  strokeWidth="18"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (ostCount / donutTotal) * circumference}
                  strokeLinecap="round"
                />
                {/* Кор (Blue) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#0a84ff"
                  strokeWidth="18"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (korCount / donutTotal) * circumference}
                  style={{
                    transform: `rotate(${(ostCount / donutTotal) * 360}deg)`,
                    transformOrigin: '80px 80px',
                  }}
                  strokeLinecap="round"
                />
                {/* Искра (Purple / Light Slate) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#a78bfa"
                  strokeWidth="18"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (iskraCount / donutTotal) * circumference}
                  style={{
                    transform: `rotate(${((ostCount + korCount) / donutTotal) * 360}deg)`,
                    transformOrigin: '80px 80px',
                  }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {totalShifts}
                </span>
                <span className="text-[10px] text-slate-400">смен</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-2.5 text-xs w-full max-w-[200px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Ост (Основа)</span>
                </div>
                <span className="font-bold font-mono text-white">
                  {ostCount} ({ostPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-slate-300">Кор (Четверг)</span>
                </div>
                <span className="font-bold font-mono text-white">
                  {korCount} ({korPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span className="text-slate-300">Искра (Среда)</span>
                </div>
                <span className="font-bold font-mono text-white">
                  {iskraCount} ({iskraPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Employee Workload */}
        <div className="bg-black/40 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col">
          <h3 className="text-xs sm:text-sm font-bold text-white text-center mb-5">
            Нагрузка по инженерам (Смен в месяце)
          </h3>

          <div className="space-y-3.5 my-auto">
            {state.employees.map((emp) => {
              const count = empWorkload[emp.id] || 0;
              const maxPossible = Math.max(...Object.values(empWorkload), 10);
              const barPercent = Math.min(100, Math.round((count / maxPossible) * 100));

              return (
                <div key={emp.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">{emp.name}</span>
                    <span className="font-mono font-bold text-white">
                      {count} смен
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-[1px]">
                    <div
                      style={{ width: `${barPercent}%` }}
                      className="h-full bg-white rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 text-center text-xs text-slate-400">
            Средний норматив по подразделению: <strong className="text-white">{avgLoad} смен</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
