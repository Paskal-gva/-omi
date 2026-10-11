export type ShiftCode = 'ост' | 'кор' | 'искра' | 'vac' | 'sick' | '';

export interface Employee {
  id: number;
  name: string;
  role?: string;
}

export interface VacationPeriod {
  id: number;
  empId: number;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  desc: string;
  isMain: boolean;
}

export interface MonthScheduleData {
  res: Record<number, Record<string, ShiftCode>>; // empId -> date -> shiftCode
  duty: Record<string, number>;                   // date -> empId (duty officer)
}

export interface OmiWorkspaceState {
  theme: 'dark' | 'light';
  currentMonth: string; // YYYY-MM
  viewMonths: 1 | 2 | 3;
  selectedVacEmpId: number;
  employees: Employee[];
  vacations: VacationPeriod[];
  schedule: Record<string, MonthScheduleData>; // ym -> MonthScheduleData
  locked: Record<string, boolean>;             // ym -> isLocked
  firebaseUrl?: string;
  firebaseApiKey?: string;
}

export type ActiveTab = 'schedule' | 'analytics' | 'vacations2027' | 'year' | 'team' | 'settings';

export interface SmartSuggestRanking {
  employeeId: number;
  employeeName: string;
  score: number;
  verdict: string;
  shortReason: string;
}

export interface SmartSuggestResult {
  recommendedEmployeeId: number;
  recommendedEmployeeName: string;
  recommendedShiftCode: ShiftCode | string;
  confidenceScore: number;
  matchLevel: string;
  summary: string;
  availabilityBreakdown: {
    status: string;
    details: string;
  };
  skillMatchBreakdown: {
    status: string;
    details: string;
  };
  quotaBreakdown: {
    status: string;
    workedHours: number;
    targetHours: number;
    remainingHours: number;
    details: string;
  };
  rankings: SmartSuggestRanking[];
}
