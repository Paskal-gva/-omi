import { 
  addDays, 
  eachDayOfInterval, 
  isWeekend 
} from 'date-fns';
import { ShiftAssignment, ShiftType } from '../types/schedule';
import { formatDateIso } from './dateUtils';

export interface RotationPattern {
  id: string;
  name: string;
  description: string;
  // sequence of shift type ids or null for off
  sequence: (string | null)[];
}

export const ROTATION_PATTERNS: RotationPattern[] = [
  {
    id: 'pattern-2-2-day',
    name: 'График 2/2 (Дневные смены)',
    description: '2 дневные смены по 12ч (08:00–20:00) / 2 выходных',
    sequence: ['shift-day-12', 'shift-day-12', null, null],
  },
  {
    id: 'pattern-day-night-48',
    name: 'График День / Ночь / 48ч (Отсыпной + Выходной)',
    description: '1 день (12ч) → 1 ночь (12ч) → отсыпной (24ч) → выходной (24ч)',
    sequence: ['shift-day-12', 'shift-night-12', null, null],
  },
  {
    id: 'pattern-daily-24-72',
    name: 'График Сутки через трое (1/3)',
    description: 'Суточное дежурство (24ч) / 3 дня межсменного отдыха',
    sequence: ['shift-daily-24', null, null, null],
  },
  {
    id: 'pattern-2-2-night',
    name: 'График 2/2 (Ночные смены)',
    description: '2 ночные смены по 12ч (20:00–08:00) / 2 выходных',
    sequence: ['shift-night-12', 'shift-night-12', null, null],
  },
  {
    id: 'pattern-5-2-office',
    name: 'Классический график 5/2 (8ч)',
    description: 'С понедельника по пятницу (09:00–18:00), сб-вс выходные',
    sequence: ['shift-office-8'], // dynamically applied on weekdays
  },
];

export interface AutoFillParams {
  employeeIds: string[];
  patternId: string;
  startDate: Date;
  endDate: Date;
  existingAssignments: ShiftAssignment[];
  shiftTypes: ShiftType[];
  respectAbsences: boolean;
  cycleOffset?: number; // start at step N of sequence
}

export function generateCyclicSchedule(params: AutoFillParams): ShiftAssignment[] {
  const {
    employeeIds,
    patternId,
    startDate,
    endDate,
    existingAssignments,
    shiftTypes,
    respectAbsences = true,
    cycleOffset = 0,
  } = params;

  const pattern = ROTATION_PATTERNS.find((p) => p.id === patternId);
  if (!pattern) return existingAssignments;

  const shiftTypesMap = new Map<string, ShiftType>(shiftTypes.map((s) => [s.id, s]));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Map existing absences by employee and date
  const absencesSet = new Set<string>();
  for (const a of existingAssignments) {
    const st = shiftTypesMap.get(a.shiftTypeId);
    if (st && st.category === 'absence') {
      absencesSet.add(`${a.employeeId}_${a.date}`);
    }
  }

  // Filter out existing assignments within the selected range for target employees
  // unless they are absences and we are respecting them!
  const targetEmpSet = new Set(employeeIds);
  const startIso = formatDateIso(startDate);
  const endIso = formatDateIso(endDate);

  const retainedAssignments = existingAssignments.filter((a) => {
    if (!targetEmpSet.has(a.employeeId)) return true;
    if (a.date < startIso || a.date > endIso) return true;
    // Inside range: retain only if it's an absence and we respect absences
    const st = shiftTypesMap.get(a.shiftTypeId);
    if (respectAbsences && st && st.category === 'absence') {
      return true;
    }
    return false;
  });

  const newGenerated: ShiftAssignment[] = [];

  for (let empIdx = 0; empIdx < employeeIds.length; empIdx++) {
    const empId = employeeIds[empIdx];
    // Stagger rotation across employees if multiple selected
    const employeeStagger = empIdx * (pattern.sequence.length > 2 ? 2 : 1);

    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const curDate = days[dayIdx];
      const dateIso = formatDateIso(curDate);
      const cellKey = `${empId}_${dateIso}`;

      // If absence exists and we respect absences, do not override
      if (respectAbsences && absencesSet.has(cellKey)) {
        continue;
      }

      if (patternId === 'pattern-5-2-office') {
        // Weekday 5/2 logic
        if (!isWeekend(curDate)) {
          newGenerated.push({
            id: `fill-${empId}-${dateIso}-${Date.now().toString(36)}-${dayIdx}`,
            employeeId: empId,
            date: dateIso,
            shiftTypeId: 'shift-office-8',
          });
        }
      } else {
        // Modulo cyclic sequence
        const seqIndex = (dayIdx + cycleOffset + employeeStagger) % pattern.sequence.length;
        const targetShiftId = pattern.sequence[seqIndex];

        if (targetShiftId) {
          newGenerated.push({
            id: `fill-${empId}-${dateIso}-${Date.now().toString(36)}-${dayIdx}`,
            employeeId: empId,
            date: dateIso,
            shiftTypeId: targetShiftId,
          });
        }
      }
    }
  }

  return [...retainedAssignments, ...newGenerated];
}
