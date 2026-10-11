import { Employee, MonthScheduleData, VacationPeriod } from '../types/omi';
import { isWorkingDay } from './omiAlgorithm';

export function generateIcsForEmployee(
  emp: Employee,
  ym: string,
  scheduleData: MonthScheduleData,
  vacations: VacationPeriod[]
): { success: boolean; eventCount: number; blobUrl?: string; fileName?: string } {
  const [y, m] = ym.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const res = scheduleData?.res || {};

  let icsContent =
    'BEGIN:VCALENDAR\r\n' +
    'VERSION:2.0\r\n' +
    'PRODID:-//OMI Workspace//RU\r\n' +
    'CALSCALE:GREGORIAN\r\n';

  let eventCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(y, m - 1, d);
    if (!isWorkingDay(dt)) continue;

    const fd = `${ym}-${String(d).padStart(2, '0')}`;
    const val = (res[emp.id] || {})[fd] || '';
    const isVac = vacations.some((v) => v.empId === emp.id && fd >= v.from && fd <= v.to);

    let sName = '';
    if (isVac || val === 'vac') sName = 'Отпуск';
    else if (val === 'ост') sName = 'Смена: Ост';
    else if (val === 'кор') sName = 'Смена: Кор';
    else if (val === 'искра') sName = 'Смена: Искра';
    else if (val === 'sick') sName = 'Больничный';

    if (sName) {
      eventCount++;
      const dStr = fd.replace(/-/g, '');
      icsContent +=
        'BEGIN:VEVENT\r\n' +
        `UID:omi-${emp.id}-${dStr}@workspace.omi\r\n` +
        `DTSTAMP:${dStr}T000000Z\r\n` +
        `SUMMARY:${sName}\r\n` +
        `DTSTART;TZID=Europe/Moscow:${dStr}T090000\r\n` +
        `DTEND;TZID=Europe/Moscow:${dStr}T180000\r\n` +
        'BEGIN:VALARM\r\n' +
        'ACTION:DISPLAY\r\n' +
        `DESCRIPTION:Напоминание: завтра ${sName}\r\n` +
        'TRIGGER:-PT15H\r\n' +
        'END:VALARM\r\n' +
        'END:VEVENT\r\n';
    }
  }

  icsContent += 'END:VCALENDAR\r\n';

  if (eventCount === 0) {
    return { success: false, eventCount: 0 };
  }

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const fileName = `График_${emp.name}_${ym}.ics`;

  return { success: true, eventCount, blobUrl, fileName };
}
