import { HOLIDAYS } from '../data/omiConstants';
import { MonthScheduleData, VacationPeriod, ShiftCode } from '../types/omi';

export function isHoliday(dateObj: Date): boolean {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return HOLIDAYS.includes(`${d}.${m}.${y}`);
}

export function isWorkingDay(dateObj: Date): boolean {
  const day = dateObj.getDay();
  return day !== 0 && day !== 6 && !isHoliday(dateObj);
}

export function getWorkDayIndex(targetDate: Date): number {
  let count = 0;
  // Starting reference from 2026-10-01 matching OMI Workspace algorithm
  const d = new Date(2026, 9, 1);
  while (d <= targetDate) {
    if (d.getDay() !== 0 && d.getDay() !== 6 && !isHoliday(d)) {
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function getWorkingDaysOfMonth(ym: string): number[] {
  const [y, m] = ym.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const workingDays: number[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(y, m - 1, d);
    if (isWorkingDay(dt)) {
      workingDays.push(d);
    }
  }

  return workingDays;
}

export function generateMonthSchedule(
  ym: string,
  vacations: VacationPeriod[]
): MonthScheduleData {
  const [y, m] = ym.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const sch: MonthScheduleData = { res: {}, duty: {} };
  const ostQueue = [4, 1, 2]; // Илья, Олег, Вадим

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(y, m - 1, d);
    const wd = dt.getDay();
    const fd = `${ym}-${String(d).padStart(2, '0')}`;

    if (!isWorkingDay(dt)) continue;

    const wIndex = getWorkDayIndex(dt);
    const sashaVac = vacations.some((v) => v.empId === 3 && fd >= v.from && fd <= v.to);
    const vadimVac = vacations.some((v) => v.empId === 2 && fd >= v.from && fd <= v.to);

    let korAssignee: number | null = null;
    let iskraAssignee: number | null = null;

    if (wd === 3 && !sashaVac) {
      iskraAssignee = 3;
    } else if (wd === 4) {
      if (!sashaVac) korAssignee = 3;
      else if (!vadimVac) korAssignee = 2;
    }

    let assignedOst = ostQueue[wIndex % 3];
    const assignedOstVac = vacations.some((v) => v.empId === assignedOst && fd >= v.from && fd <= v.to);

    if (assignedOstVac) {
      if (!sashaVac && korAssignee !== 3 && iskraAssignee !== 3) {
        assignedOst = 3;
      } else {
        const nextIndex = (wIndex + 1) % 3;
        let nextAssignee = ostQueue[nextIndex];
        if (nextAssignee === 2 && korAssignee === 2) {
          nextAssignee = ostQueue[(nextIndex + 1) % 3];
        }
        assignedOst = nextAssignee;
      }
    }

    if (assignedOst === 2 && korAssignee === 2) {
      assignedOst = ostQueue[(wIndex + 1) % 3];
      if (vacations.some((v) => v.empId === assignedOst && fd >= v.from && fd <= v.to)) {
        assignedOst = ostQueue[(wIndex + 2) % 3];
      }
    }

    if (iskraAssignee) {
      if (!sch.res[iskraAssignee]) sch.res[iskraAssignee] = {};
      sch.res[iskraAssignee][fd] = 'искра';
    }

    if (korAssignee) {
      if (!sch.res[korAssignee]) sch.res[korAssignee] = {};
      sch.res[korAssignee][fd] = 'кор';
    }

    if (assignedOst) {
      if (!sch.res[assignedOst]) sch.res[assignedOst] = {};
      sch.res[assignedOst][fd] = 'ост';
      sch.duty[fd] = assignedOst;
    }
  }

  return sch;
}

export function getShiftBadgeStyle(code: ShiftCode): {
  label: string;
  className: string;
  hex: string;
  textColor: string;
} {
  switch (code) {
    case 'ост':
      return {
        label: 'Ост',
        className: 'bg-emerald-500 text-black font-semibold',
        hex: '#30d158',
        textColor: '#000000',
      };
    case 'кор':
      return {
        label: 'Кор',
        className: 'bg-blue-500 text-white font-semibold',
        hex: '#0a84ff',
        textColor: '#ffffff',
      };
    case 'искра':
      return {
        label: 'Иск',
        className: 'bg-purple-500 text-white font-semibold',
        hex: '#bf5af2',
        textColor: '#ffffff',
      };
    case 'vac':
      return {
        label: 'Отп',
        className: 'bg-amber-500 text-black font-semibold',
        hex: '#ff9f0a',
        textColor: '#000000',
      };
    case 'sick':
      return {
        label: 'Бол',
        className: 'bg-rose-500 text-white font-semibold',
        hex: '#ff453a',
        textColor: '#ffffff',
      };
    default:
      return {
        label: '+',
        className: 'bg-white/5 text-slate-500 border border-dashed border-white/10 hover:border-white/30',
        hex: 'rgba(255,255,255,0.1)',
        textColor: '#8e8e93',
      };
  }
}
