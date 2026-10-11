import React from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { getDaysForView, formatDayHeader, formatDateIso, formatMonthYear } from '../utils/dateUtils';
import { ShiftType } from '../types/schedule';

export const PrintView: React.FC = () => {
  const { employees, assignments, shiftTypes, currentDate, revisions, status } = useSchedule();

  const days = getDaysForView(currentDate, 'month');
  const shiftTypesMap = new Map<string, ShiftType>(shiftTypes.map((st) => [st.id, st]));

  const assignmentsByCell = new Map<string, string>();
  for (const a of assignments) {
    const st = shiftTypesMap.get(a.shiftTypeId);
    if (st) {
      assignmentsByCell.set(`${a.employeeId}_${a.date}`, st.code);
    }
  }

  const latestRev = revisions[0];

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider">
            График сменности сотрудников
          </h1>
          <p className="text-sm font-semibold mt-1">
            Период: {formatMonthYear(currentDate)}
          </p>
          <p className="text-xs text-neutral-600">
            Статус: {status === 'published' ? 'Утвержден и опубликован' : 'Проект (черновик)'} · Редакция: v{revisions.length}.0 ({latestRev?.timestamp})
          </p>
        </div>

        <div className="text-right text-xs">
          <p className="font-bold">«УТВЕРЖДАЮ»</p>
          <p className="mt-1">Руководитель службы эксплуатации</p>
          <p className="mt-4">________________ / ________________</p>
          <p className="text-[10px] text-neutral-500">«___» _____________ 2026 г.</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-black text-[10px]">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-black p-1 text-left w-48 font-bold">
              Сотрудник / Должность
            </th>
            <th className="border border-black p-1 text-center w-12 font-bold">
              Норма
            </th>
            <th className="border border-black p-1 text-center w-12 font-bold">
              Факт
            </th>
            {days.map((d) => {
              const { dayNumber, dayOfWeek, isWeekendDay } = formatDayHeader(d);
              return (
                <th
                  key={dayNumber}
                  className={`border border-black p-0.5 text-center ${
                    isWeekendDay ? 'bg-neutral-200 font-bold' : ''
                  }`}
                >
                  <div className="text-[8px] leading-tight text-neutral-600">{dayOfWeek}</div>
                  <div className="font-bold">{dayNumber}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            let totalHours = 0;
            return (
              <tr key={emp.id}>
                <td className="border border-black p-1">
                  <div className="font-bold">{emp.name}</div>
                  <div className="text-[8px] text-neutral-600 truncate">{emp.role}</div>
                </td>
                <td className="border border-black p-1 text-center font-mono">
                  {emp.targetHoursMonth}ч
                </td>
                <td className="border border-black p-1 text-center font-bold font-mono">
                  {/* Calculate fact hours */}
                  {(() => {
                    let fact = 0;
                    for (const d of days) {
                      const dateIso = formatDateIso(d);
                      const asg = assignments.find(
                        (a) => a.employeeId === emp.id && a.date === dateIso
                      );
                      if (asg) {
                        const st = shiftTypesMap.get(asg.shiftTypeId);
                        if (st && st.category === 'work') {
                          fact += asg.customHours ?? st.durationHours;
                        }
                      }
                    }
                    return `${fact}ч`;
                  })()}
                </td>
                {days.map((d) => {
                  const dateIso = formatDateIso(d);
                  const code = assignmentsByCell.get(`${emp.id}_${dateIso}`) || '';
                  const isWeekendDay = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <td
                      key={dateIso}
                      className={`border border-black p-0.5 text-center font-bold font-mono ${
                        isWeekendDay && !code ? 'bg-neutral-50' : ''
                      }`}
                    >
                      {code}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend & Signatures */}
      <div className="mt-4 pt-4 border-t border-neutral-300 flex justify-between items-end text-[10px]">
        <div>
          <p className="font-bold mb-1">Условные обозначения:</p>
          <div className="flex flex-wrap gap-3">
            <span><strong>Д12</strong> — Дневная смена (08:00–20:00, 12ч)</span>
            <span><strong>Н12</strong> — Ночная смена (20:00–08:00, 12ч)</span>
            <span><strong>24ч</strong> — Суточное дежурство (24ч)</span>
            <span><strong>Д8</strong> — Офисная смена (8ч)</span>
            <span><strong>ОТ</strong> — Ежегодный отпуск</span>
            <span><strong>БЛ</strong> — Листок нетрудоспособности</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-neutral-500 text-[9px]">
            Сформировано в системе ShiftMatrix · Соответствует ТК РФ
          </p>
        </div>
      </div>

    </div>
  );
};
