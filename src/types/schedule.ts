export type ShiftCategoryId = 'work' | 'absence' | 'off';

export interface ShiftType {
  id: string;
  code: string;
  name: string;
  category: ShiftCategoryId;
  startTime: string; // "08:00"
  endTime: string;   // "20:00"
  durationHours: number;
  crossesMidnight: boolean;
  colorGradient: string; // e.g. "from-cyan-500 to-blue-600"
  badgeBg: string;       // e.g. "bg-gradient-to-r from-cyan-500/90 to-blue-600/90"
  textColor: string;     // e.g. "text-white"
  borderColor: string;   // e.g. "border-cyan-400/40"
  description: string;
}

export type EmployeeRole = 
  | 'Lead Engineer (L2)'
  | 'DevOps / SysAdmin'
  | 'Support Specialist (L1)'
  | 'Incident Manager'
  | 'Warehouse Lead'
  | 'Quality Inspector';

export type Department = 
  | 'Инфраструктура и DevOps'
  | 'Поддержка 24/7'
  | 'Склад и логистика'
  | 'Контроль качества';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  department: Department;
  targetHoursMonth: number; // e.g. 168
  avatarUrl?: string;
  initials: string;
  badgeRoleColor: string;
  requiresLeadOnShift?: boolean;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  shiftTypeId: string;
  customStartTime?: string;
  customEndTime?: string;
  customHours?: number;
  note?: string;
}

export type ConstraintSeverity = 'critical' | 'warning' | 'info';

export type ConstraintType = 
  | 'OVERLAPPING_SHIFTS'       // Наложение смен
  | 'REST_VIOLATION'           // Менее 11 часов отдыха
  | 'ABSENCE_COLLISION'        // Смена поверх отпуска/больничного
  | 'DOUBLE_SHIFT_SAME_DAY'    // Две смены в один день
  | 'MAX_HOURS_EXCEEDED'       // Более 24 часов подряд
  | 'MONTHLY_OVERTIME'         // Превышение нормы часов (переработка)
  | 'MONTHLY_UNDERTIME'        // Недоработка нормы
  | 'MIN_HEADCOUNT_DEFICIT'    // Дефицит дежурных сотрудников
  | 'MISSING_ROLE_LEAD';       // Отсутствие старшего смены/L2

export interface ValidationIssue {
  id: string;
  type: ConstraintType;
  severity: ConstraintSeverity;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  title: string;
  message: string;
  ruleExplanation: string;
}

export type CalendarViewMode = 'month' | 'two-weeks' | 'week';

export type ScheduleStatus = 'draft' | 'published';

export interface ScheduleRevision {
  id: string;
  timestamp: string;
  version: number;
  author: string;
  changesSummary: string;
  assignmentsCount: number;
}

export interface DailyCoverageRequirement {
  dayShiftMin: number;
  nightShiftMin: number;
  requireLeadDay: boolean;
  requireLeadNight: boolean;
}
