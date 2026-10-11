import { Employee, ShiftType, ShiftAssignment, ScheduleRevision } from '../types/schedule';

export const SHIFT_TYPES: ShiftType[] = [
  {
    id: 'shift-day-12',
    code: 'Д12',
    name: 'Дневная смена',
    category: 'work',
    startTime: '08:00',
    endTime: '20:00',
    durationHours: 12,
    crossesMidnight: false,
    colorGradient: 'from-blue-600 to-indigo-600',
    badgeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    textColor: 'text-white',
    borderColor: 'border-blue-400/50',
    description: '12 часов (08:00 – 20:00), дневной мониторинг и задачи',
  },
  {
    id: 'shift-night-12',
    code: 'Н12',
    name: 'Ночная смена',
    category: 'work',
    startTime: '20:00',
    endTime: '08:00',
    durationHours: 12,
    crossesMidnight: true,
    colorGradient: 'from-purple-600 to-violet-700',
    badgeBg: 'bg-gradient-to-r from-purple-600 to-violet-700 text-white',
    textColor: 'text-white',
    borderColor: 'border-purple-400/50',
    description: '12 часов (20:00 – 08:00 след. дня), дежурство повышенной бдительности',
  },
  {
    id: 'shift-daily-24',
    code: '24ч',
    name: 'Сутки 24ч',
    category: 'work',
    startTime: '08:00',
    endTime: '08:00',
    durationHours: 24,
    crossesMidnight: true,
    colorGradient: 'from-teal-600 to-emerald-700',
    badgeBg: 'bg-gradient-to-r from-teal-600 to-emerald-700 text-white',
    textColor: 'text-white',
    borderColor: 'border-emerald-400/50',
    description: 'Суточное дежурство (08:00 – 08:00 след. дня), обязателен отдых 72ч',
  },
  {
    id: 'shift-office-8',
    code: 'Д8',
    name: 'Офисная (8ч)',
    category: 'work',
    startTime: '09:00',
    endTime: '18:00',
    durationHours: 8,
    crossesMidnight: false,
    colorGradient: 'from-sky-500 to-cyan-600',
    badgeBg: 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white',
    textColor: 'text-white',
    borderColor: 'border-sky-400/50',
    description: '8 часов (09:00 – 18:00, 1ч обед), плановые регламентные работы',
  },
  {
    id: 'absence-vacation',
    code: 'ОТ',
    name: 'Ежегодный отпуск',
    category: 'absence',
    startTime: '00:00',
    endTime: '23:59',
    durationHours: 0,
    crossesMidnight: false,
    colorGradient: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
    textColor: 'text-white',
    borderColor: 'border-amber-400/60',
    description: 'Плановый оплачиваемый отпуск. Назначение рабочих смен заблокировано',
  },
  {
    id: 'absence-sick',
    code: 'БЛ',
    name: 'Больничный лист',
    category: 'absence',
    startTime: '00:00',
    endTime: '23:59',
    durationHours: 0,
    crossesMidnight: false,
    colorGradient: 'from-rose-500 to-red-600',
    badgeBg: 'bg-gradient-to-r from-rose-500 to-red-600 text-white',
    textColor: 'text-white',
    borderColor: 'border-rose-400/60',
    description: 'Временная нетрудоспособность (ЭЛН). Назначение смен запрещено',
  },
  {
    id: 'absence-dayoff',
    code: 'ВЫХ',
    name: 'Выходной / Отсыпной',
    category: 'off',
    startTime: '00:00',
    endTime: '23:59',
    durationHours: 0,
    crossesMidnight: false,
    colorGradient: 'from-slate-700 to-slate-800',
    badgeBg: 'bg-slate-800/90 text-slate-300',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-700',
    description: 'Плановый межсменный или календарный отдых',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Михаил Волков',
    role: 'Lead Engineer (L2)',
    department: 'Инфраструктура и DevOps',
    targetHoursMonth: 168,
    initials: 'МВ',
    badgeRoleColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'emp-2',
    name: 'Елена Кузнецова',
    role: 'Lead Engineer (L2)',
    department: 'Инфраструктура и DevOps',
    targetHoursMonth: 168,
    initials: 'ЕК',
    badgeRoleColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'emp-3',
    name: 'Дмитрий Соколов',
    role: 'DevOps / SysAdmin',
    department: 'Инфраструктура и DevOps',
    targetHoursMonth: 168,
    initials: 'ДС',
    badgeRoleColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'emp-4',
    name: 'Анна Морозова',
    role: 'Incident Manager',
    department: 'Поддержка 24/7',
    targetHoursMonth: 168,
    initials: 'АМ',
    badgeRoleColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  },
  {
    id: 'emp-5',
    name: 'Сергей Попов',
    role: 'Support Specialist (L1)',
    department: 'Поддержка 24/7',
    targetHoursMonth: 168,
    initials: 'СП',
    badgeRoleColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'emp-6',
    name: 'Ольга Лебедева',
    role: 'Support Specialist (L1)',
    department: 'Поддержка 24/7',
    targetHoursMonth: 168,
    initials: 'ОЛ',
    badgeRoleColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'emp-7',
    name: 'Артем Новиков',
    role: 'Support Specialist (L1)',
    department: 'Поддержка 24/7',
    targetHoursMonth: 168,
    initials: 'АН',
    badgeRoleColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'emp-8',
    name: 'Владимир Федоров',
    role: 'Warehouse Lead',
    department: 'Склад и логистика',
    targetHoursMonth: 168,
    initials: 'ВФ',
    badgeRoleColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'emp-9',
    name: 'Илья Медведев',
    role: 'Quality Inspector',
    department: 'Контроль качества',
    targetHoursMonth: 168,
    initials: 'ИМ',
    badgeRoleColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'emp-10',
    name: 'Мария Семенова',
    role: 'Quality Inspector',
    department: 'Контроль качества',
    targetHoursMonth: 168,
    initials: 'МС',
    badgeRoleColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
];

// Helper to generate initial demo assignments around current month
export function generateInitialAssignments(baseDate: Date): ShiftAssignment[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const assignments: ShiftAssignment[] = [];

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const makeDate = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

  // Cyclic schedule 2/2 and day/night for team
  // emp-1: Волков (Lead Engineer) - Day/Night/48 rotation
  for (let d = 1; d <= 28; d += 4) {
    assignments.push({
      id: `init-1-${d}`,
      employeeId: 'emp-1',
      date: makeDate(d),
      shiftTypeId: 'shift-day-12',
    });
    if (d + 1 <= 28) {
      assignments.push({
        id: `init-1-${d + 1}`,
        employeeId: 'emp-1',
        date: makeDate(d + 1),
        shiftTypeId: 'shift-night-12',
      });
    }
  }

  // emp-2: Кузнецова (Lead Engineer) - 2/2 offset
  for (let d = 3; d <= 28; d += 4) {
    assignments.push({
      id: `init-2-${d}`,
      employeeId: 'emp-2',
      date: makeDate(d),
      shiftTypeId: 'shift-day-12',
    });
    if (d + 1 <= 28) {
      assignments.push({
        id: `init-2-${d + 1}`,
        employeeId: 'emp-2',
        date: makeDate(d + 1),
        shiftTypeId: 'shift-night-12',
      });
    }
  }

  // emp-3: Соколов (DevOps) - Office 5/2 schedule (8h per working day)
  for (let d = 1; d <= 30; d++) {
    const cur = new Date(year, month, d);
    const dayOfWeek = cur.getDay(); // 0 is Sun, 6 is Sat
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      assignments.push({
        id: `init-3-${d}`,
        employeeId: 'emp-3',
        date: makeDate(d),
        shiftTypeId: 'shift-office-8',
      });
    }
  }

  // emp-4: Морозова (Incident Manager) - On approved Vacation from 12th to 18th
  for (let d = 12; d <= 18; d++) {
    assignments.push({
      id: `init-4-${d}`,
      employeeId: 'emp-4',
      date: makeDate(d),
      shiftTypeId: 'absence-vacation',
      note: 'Приказ №42-ОТ от 01.10',
    });
  }
  // Days before vacation for emp-4
  for (let d = 1; d <= 10; d += 2) {
    assignments.push({
      id: `init-4-w-${d}`,
      employeeId: 'emp-4',
      date: makeDate(d),
      shiftTypeId: 'shift-day-12',
    });
  }

  // emp-5: Попов (L1) - 2/2 rotation
  for (let d = 1; d <= 29; d += 4) {
    assignments.push({
      id: `init-5-${d}`,
      employeeId: 'emp-5',
      date: makeDate(d),
      shiftTypeId: 'shift-day-12',
    });
    if (d + 1 <= 30) {
      assignments.push({
        id: `init-5-${d + 1}`,
        employeeId: 'emp-5',
        date: makeDate(d + 1),
        shiftTypeId: 'shift-day-12',
      });
    }
  }

  // emp-6: Лебедева (L1) - Sick leave from 10th to 14th
  for (let d = 10; d <= 14; d++) {
    assignments.push({
      id: `init-6-sick-${d}`,
      employeeId: 'emp-6',
      date: makeDate(d),
      shiftTypeId: 'absence-sick',
      note: 'Больничный лист №9182371',
    });
  }
  // Working shifts for emp-6
  for (let d = 16; d <= 30; d += 4) {
    assignments.push({
      id: `init-6-${d}`,
      employeeId: 'emp-6',
      date: makeDate(d),
      shiftTypeId: 'shift-night-12',
    });
    if (d + 1 <= 30) {
      assignments.push({
        id: `init-6-${d + 1}`,
        employeeId: 'emp-6',
        date: makeDate(d + 1),
        shiftTypeId: 'shift-night-12',
      });
    }
  }

  // emp-7: Новиков (L1) - Night shifts
  for (let d = 2; d <= 28; d += 4) {
    assignments.push({
      id: `init-7-${d}`,
      employeeId: 'emp-7',
      date: makeDate(d),
      shiftTypeId: 'shift-night-12',
    });
  }

  // emp-8: Федоров (Warehouse) - 24h duty (Сутки через трое)
  for (let d = 2; d <= 29; d += 4) {
    assignments.push({
      id: `init-8-${d}`,
      employeeId: 'emp-8',
      date: makeDate(d),
      shiftTypeId: 'shift-daily-24',
    });
  }

  // emp-9: Медведев (Quality) - 2/2
  for (let d = 1; d <= 29; d += 4) {
    assignments.push({
      id: `init-9-${d}`,
      employeeId: 'emp-9',
      date: makeDate(d),
      shiftTypeId: 'shift-day-12',
    });
  }

  // emp-10: Семенова (Quality) - 2/2
  for (let d = 3; d <= 29; d += 4) {
    assignments.push({
      id: `init-10-${d}`,
      employeeId: 'emp-10',
      date: makeDate(d),
      shiftTypeId: 'shift-day-12',
    });
  }

  // INTENTIONAL DEMO VIOLATIONS (so user sees error prevention engine immediately in action):
  // 1. Rest violation: emp-7 Новиков has Night shift on 10th (ends 08:00 on 11th) AND a Day shift starting 12:00 on 11th (only 4 hours rest < 11 hours minimum)!
  assignments.push({
    id: `demo-rest-violation`,
    employeeId: 'emp-7',
    date: makeDate(11),
    shiftTypeId: 'shift-day-12',
    customStartTime: '12:00',
    customEndTime: '20:00',
    customHours: 8,
    note: 'Внеплановая замена (нарушение отдыха 4ч)',
  });

  // 2. Absence collision: emp-4 Морозова has vacation on 15th, and someone tried to put a Day shift on 15th!
  assignments.push({
    id: `demo-absence-collision`,
    employeeId: 'emp-4',
    date: makeDate(15),
    shiftTypeId: 'shift-day-12',
    note: 'Ошибочное назначение поверх отпуска!',
  });

  return assignments;
}

export const INITIAL_REVISIONS: ScheduleRevision[] = [
  {
    id: 'rev-1',
    timestamp: '2026-10-01 09:30',
    version: 1,
    author: 'Александр Громов (Нач. смены)',
    changesSummary: 'Инициализация производственного графика на текущий месяц (базовая ротация 2/2 и 5/2)',
    assignmentsCount: 94,
  },
  {
    id: 'rev-2',
    timestamp: '2026-10-05 14:15',
    version: 2,
    author: 'Александр Громов (Нач. смены)',
    changesSummary: 'Внесение утвержденных отпусков (Морозова) и листков нетрудоспособности',
    assignmentsCount: 98,
  },
];
