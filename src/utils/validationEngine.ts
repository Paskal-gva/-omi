import { 
  Employee, 
  ShiftType, 
  ShiftAssignment, 
  ValidationIssue 
} from '../types/schedule';

export interface ShiftInterval {
  assignmentId: string;
  employeeId: string;
  shiftTypeId: string;
  shiftType: ShiftType;
  date: string;
  startTimestamp: number;
  endTimestamp: number;
  durationHours: number;
  isWork: boolean;
  isAbsence: boolean;
  note?: string;
}

export function buildInterval(
  assignment: ShiftAssignment, 
  shiftTypesMap: Map<string, ShiftType>
): ShiftInterval | null {
  const shiftType = shiftTypesMap.get(assignment.shiftTypeId);
  if (!shiftType) return null;

  const [yearStr, monthStr, dayStr] = assignment.date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const startTimeStr = assignment.customStartTime || shiftType.startTime;
  const endTimeStr = assignment.customEndTime || shiftType.endTime;

  const [startH, startM] = startTimeStr.split(':').map((v) => parseInt(v, 10));
  const [endH, endM] = endTimeStr.split(':').map((v) => parseInt(v, 10));

  const startDate = new Date(year, month, day, startH, startM, 0, 0);
  let endDate = new Date(year, month, day, endH, endM, 0, 0);

  const crossesMidnight = shiftType.crossesMidnight || endDate <= startDate;
  if (crossesMidnight) {
    endDate = new Date(year, month, day + 1, endH, endM, 0, 0);
  }

  const durationHours = assignment.customHours ?? shiftType.durationHours;

  return {
    assignmentId: assignment.id,
    employeeId: assignment.employeeId,
    shiftTypeId: assignment.shiftTypeId,
    shiftType,
    date: assignment.date,
    startTimestamp: startDate.getTime(),
    endTimestamp: endDate.getTime(),
    durationHours,
    isWork: shiftType.category === 'work',
    isAbsence: shiftType.category === 'absence',
    note: assignment.note,
  };
}

export interface EmployeePeriodStats {
  totalHours: number;
  dayShiftsCount: number;
  nightShiftsCount: number;
  daily24Count: number;
  absencesCount: number;
  overtimeHours: number;
  undertimeHours: number;
}

export interface DateCoverageStats {
  dayCount: number;
  nightCount: number;
  daily24Count: number;
  totalWorkers: number;
  hasLeadDay: boolean;
  hasLeadNight: boolean;
}

export interface ValidationSummary {
  issues: ValidationIssue[];
  issuesByAssignmentId: Map<string, ValidationIssue[]>;
  issuesByCellKey: Map<string, ValidationIssue[]>; // key: `${employeeId}_${date}`
  criticalCount: number;
  warningCount: number;
  employeeStats: Map<string, EmployeePeriodStats>;
  dateCoverage: Map<string, DateCoverageStats>;
}

export function validateSchedule(
  employees: Employee[],
  assignments: ShiftAssignment[],
  shiftTypes: ShiftType[],
  monthDate: Date
): ValidationSummary {
  const issues: ValidationIssue[] = [];
  const shiftTypesMap = new Map<string, ShiftType>(shiftTypes.map((st) => [st.id, st]));
  const employeesMap = new Map<string, Employee>(employees.map((e) => [e.id, e]));

  const issuesByAssignmentId = new Map<string, ValidationIssue[]>();
  const issuesByCellKey = new Map<string, ValidationIssue[]>();

  const addIssue = (
    issue: ValidationIssue, 
    assignmentIds: string[], 
    cellKeys: string[]
  ) => {
    issues.push(issue);
    for (const aId of assignmentIds) {
      if (!issuesByAssignmentId.has(aId)) {
        issuesByAssignmentId.set(aId, []);
      }
      issuesByAssignmentId.get(aId)!.push(issue);
    }
    for (const ck of cellKeys) {
      if (!issuesByCellKey.has(ck)) {
        issuesByCellKey.set(ck, []);
      }
      issuesByCellKey.get(ck)!.push(issue);
    }
  };

  // 1. Group assignments by employee
  const assignmentsByEmp = new Map<string, ShiftAssignment[]>();
  for (const emp of employees) {
    assignmentsByEmp.set(emp.id, []);
  }
  for (const a of assignments) {
    if (assignmentsByEmp.has(a.employeeId)) {
      assignmentsByEmp.get(a.employeeId)!.push(a);
    }
  }

  // Employee monthly stats tracker
  const targetYear = monthDate.getFullYear();
  const targetMonth = monthDate.getMonth();
  const employeeStats = new Map<string, EmployeePeriodStats>();

  // Date coverage tracker
  const dateCoverage = new Map<string, DateCoverageStats>();

  for (const emp of employees) {
    employeeStats.set(emp.id, {
      totalHours: 0,
      dayShiftsCount: 0,
      nightShiftsCount: 0,
      daily24Count: 0,
      absencesCount: 0,
      overtimeHours: 0,
      undertimeHours: 0,
    });
  }

  // Check per-employee constraints
  for (const emp of employees) {
    const empAssignments = assignmentsByEmp.get(emp.id) || [];
    const intervals: ShiftInterval[] = [];

    for (const a of empAssignments) {
      const interval = buildInterval(a, shiftTypesMap);
      if (interval) {
        intervals.push(interval);

        // Calculate hours for current month
        const [aYear, aMonth] = a.date.split('-').map(Number);
        if (aYear === targetYear && aMonth - 1 === targetMonth) {
          const stats = employeeStats.get(emp.id)!;
          if (interval.isWork) {
            stats.totalHours += interval.durationHours;
            if (interval.shiftType.id === 'shift-day-12' || interval.shiftType.id === 'shift-office-8') {
              stats.dayShiftsCount += 1;
            } else if (interval.shiftType.id === 'shift-night-12') {
              stats.nightShiftsCount += 1;
            } else if (interval.shiftType.id === 'shift-daily-24') {
              stats.daily24Count += 1;
            }
          } else if (interval.isAbsence) {
            stats.absencesCount += 1;
          }
        }
      }
    }

    // Sort intervals by start time
    intervals.sort((a, b) => a.startTimestamp - b.startTimestamp);

    // Rule: Double Shift on Same Day & Absence Collisions on same day
    const byDate = new Map<string, ShiftInterval[]>();
    for (const inv of intervals) {
      if (!byDate.has(inv.date)) byDate.set(inv.date, []);
      byDate.get(inv.date)!.push(inv);
    }

    for (const [dateStr, dayInvs] of byDate.entries()) {
      const workShifts = dayInvs.filter((i) => i.isWork);
      const absenceShifts = dayInvs.filter((i) => i.isAbsence);

      // 1. Absence collision (Hard Constraint #3): Work shift on approved absence
      if (absenceShifts.length > 0 && workShifts.length > 0) {
        const absenceName = absenceShifts[0].shiftType.name;
        addIssue(
          {
            id: `err-abs-${emp.id}-${dateStr}`,
            type: 'ABSENCE_COLLISION',
            severity: 'critical',
            employeeId: emp.id,
            employeeName: emp.name,
            date: dateStr,
            title: 'Конфликт: Смена поверх отсутствия',
            message: `Сотрудник ${emp.name} находится в статусе «${absenceName}» ${dateStr}. Назначение рабочих смен запрещено ТК РФ.`,
            ruleExplanation: 'Приоритет блокировки: утвержденные отпуска и больничные листы исключают нахождение на смене.',
          },
          [...workShifts.map((w) => w.assignmentId), ...absenceShifts.map((a) => a.assignmentId)],
          [`${emp.id}_${dateStr}`]
        );
      }

      // 2. Double Booking / Multiple shifts same day (Hard Constraint #1 & #4)
      if (workShifts.length > 1) {
        addIssue(
          {
            id: `err-double-${emp.id}-${dateStr}`,
            type: 'DOUBLE_SHIFT_SAME_DAY',
            severity: 'critical',
            employeeId: emp.id,
            employeeName: emp.name,
            date: dateStr,
            title: 'Назначено несколько смен в один день',
            message: `Для ${emp.name} назначено ${workShifts.length} рабочих смен на ${dateStr}.`,
            ruleExplanation: 'Запрет двойного бронирования: сотрудник не может параллельно нести две смены.',
          },
          workShifts.map((w) => w.assignmentId),
          [`${emp.id}_${dateStr}`]
        );
      }
    }

    // Interval comparisons (Overlaps & Rest violations < 11h)
    const workIntervals = intervals.filter((i) => i.isWork);
    for (let i = 0; i < workIntervals.length - 1; i++) {
      const cur = workIntervals[i];
      const next = workIntervals[i + 1];

      // Direct interval overlap
      if (cur.startTimestamp < next.endTimestamp && next.startTimestamp < cur.endTimestamp) {
        addIssue(
          {
            id: `err-overlap-${cur.assignmentId}-${next.assignmentId}`,
            type: 'OVERLAPPING_SHIFTS',
            severity: 'critical',
            employeeId: emp.id,
            employeeName: emp.name,
            date: cur.date,
            title: 'Наложение интервалов смен',
            message: `Пересечение смены ${cur.shiftType.name} (${cur.date}) и ${next.shiftType.name} (${next.date}).`,
            ruleExplanation: 'Временные интервалы дежурств одного сотрудника не могут пересекаться.',
          },
          [cur.assignmentId, next.assignmentId],
          [`${emp.id}_${cur.date}`, `${emp.id}_${next.date}`]
        );
      } else if (cur.endTimestamp <= next.startTimestamp) {
        // Rest duration between shifts
        const restDurationMs = next.startTimestamp - cur.endTimestamp;
        const restDurationHours = restDurationMs / (1000 * 3600);

        if (restDurationHours < 11) {
          const formattedRest = restDurationHours.toFixed(1);
          addIssue(
            {
              id: `err-rest-${cur.assignmentId}-${next.assignmentId}`,
              type: 'REST_VIOLATION',
              severity: 'critical',
              employeeId: emp.id,
              employeeName: emp.name,
              date: next.date,
              title: `Нарушение нормы отдыха: ${formattedRest} ч (норма ≥ 11 ч)`,
              message: `Между сменой ${cur.date} (${cur.shiftType.name}) и ${next.date} (${next.shiftType.name}) отдых составляет всего ${formattedRest} ч вместо минимальных 11 ч.`,
              ruleExplanation: 'ТК РФ ст. 110: Ежедневный межсменный отдых должен быть не менее двойной продолжительности смены или минимум 11 часов.',
            },
            [cur.assignmentId, next.assignmentId],
            [`${emp.id}_${cur.date}`, `${emp.id}_${next.date}`]
          );
        }
      }

      // Max consecutive hours check (> 24h)
      if (cur.durationHours > 24) {
        addIssue(
          {
            id: `err-maxh-${cur.assignmentId}`,
            type: 'MAX_HOURS_EXCEEDED',
            severity: 'critical',
            employeeId: emp.id,
            employeeName: emp.name,
            date: cur.date,
            title: 'Превышен максимум продолжительности смены',
            message: `Смена ${cur.shiftType.name} составляет ${cur.durationHours} ч (максимум 24 ч).`,
            ruleExplanation: 'Предотвращение переутомления: непрерывная смена не может превышать 24 часа.',
          },
          [cur.assignmentId],
          [`${emp.id}_${cur.date}`]
        );
      }
    }

    // Monthly hours check (Soft Constraint)
    const empStat = employeeStats.get(emp.id)!;
    const diff = empStat.totalHours - emp.targetHoursMonth;
    if (diff > 0) {
      empStat.overtimeHours = diff;
      if (diff > 20) {
        addIssue(
          {
            id: `warn-overtime-crit-${emp.id}`,
            type: 'MONTHLY_OVERTIME',
            severity: 'critical',
            employeeId: emp.id,
            employeeName: emp.name,
            title: `Критическая переработка: +${diff} ч`,
            message: `У сотрудника ${emp.name} запланировано ${empStat.totalHours} ч при норме ${emp.targetHoursMonth} ч (+${diff} ч).`,
            ruleExplanation: 'Превышение месячной нормы свыше 20 часов требует перераспределения смен в ротации.',
          },
          [],
          []
        );
      } else if (diff > 8) {
        addIssue(
          {
            id: `warn-overtime-mod-${emp.id}`,
            type: 'MONTHLY_OVERTIME',
            severity: 'warning',
            employeeId: emp.id,
            employeeName: emp.name,
            title: `Переработка: +${diff} ч`,
            message: `У сотрудника ${emp.name} запланировано ${empStat.totalHours} ч при норме ${emp.targetHoursMonth} ч.`,
            ruleExplanation: 'Контроль балансировки фонда рабочего времени.',
          },
          [],
          []
        );
      }
    } else if (diff < -20) {
      empStat.undertimeHours = Math.abs(diff);
      addIssue(
        {
          id: `info-undertime-${emp.id}`,
          type: 'MONTHLY_UNDERTIME',
          severity: 'info',
          employeeId: emp.id,
          employeeName: emp.name,
          title: `Недоработка нормы: -${Math.abs(diff)} ч`,
          message: `У сотрудника ${emp.name} запланировано ${empStat.totalHours} ч при норме ${emp.targetHoursMonth} ч.`,
          ruleExplanation: 'Недостаточное количество рабочих смен по производственному календарю.',
        },
        [],
        []
      );
    }
  }

  // Check Daily Coverage & Min Headcount (Soft Constraint)
  for (const a of assignments) {
    const shift = shiftTypesMap.get(a.shiftTypeId);
    const emp = employeesMap.get(a.employeeId);
    if (!shift || !emp || shift.category !== 'work') continue;

    if (!dateCoverage.has(a.date)) {
      dateCoverage.set(a.date, {
        dayCount: 0,
        nightCount: 0,
        daily24Count: 0,
        totalWorkers: 0,
        hasLeadDay: false,
        hasLeadNight: false,
      });
    }

    const cov = dateCoverage.get(a.date)!;
    cov.totalWorkers += 1;

    const isLead = emp.role.includes('Lead') || emp.role.includes('L2');

    if (shift.id === 'shift-day-12' || shift.id === 'shift-office-8') {
      cov.dayCount += 1;
      if (isLead) cov.hasLeadDay = true;
    } else if (shift.id === 'shift-night-12') {
      cov.nightCount += 1;
      if (isLead) cov.hasLeadNight = true;
    } else if (shift.id === 'shift-daily-24') {
      cov.daily24Count += 1;
      cov.dayCount += 1;
      cov.nightCount += 1;
      if (isLead) {
        cov.hasLeadDay = true;
        cov.hasLeadNight = true;
      }
    }
  }

  // Check coverage gaps for dates in the view
  for (const [dateStr, cov] of dateCoverage.entries()) {
    if (cov.nightCount > 0 && !cov.hasLeadNight) {
      addIssue(
        {
          id: `warn-nolead-night-${dateStr}`,
          type: 'MISSING_ROLE_LEAD',
          severity: 'warning',
          date: dateStr,
          title: `В ночную смену ${dateStr} нет старшего инженера L2`,
          message: `В ночь ${dateStr} задействовано ${cov.nightCount} чел., но отсутствует дежурный Lead Engineer (L2).`,
          ruleExplanation: 'Требование регламента: на каждой ночной смене должен присутствовать минимум 1 квалифицированный L2 инженер.',
        },
        [],
        []
      );
    }
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    issues,
    issuesByAssignmentId,
    issuesByCellKey,
    criticalCount,
    warningCount,
    employeeStats,
    dateCoverage,
  };
}
