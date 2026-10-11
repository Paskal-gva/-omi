import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Employee, 
  ShiftType, 
  ShiftAssignment, 
  CalendarViewMode, 
  ScheduleStatus, 
  ScheduleRevision, 
  Department 
} from '../types/schedule';
import { 
  SHIFT_TYPES, 
  INITIAL_EMPLOYEES, 
  INITIAL_REVISIONS, 
  generateInitialAssignments 
} from '../data/mockData';
import { validateSchedule, ValidationSummary } from '../utils/validationEngine';
import { AutoFillParams, generateCyclicSchedule } from '../utils/autoFillEngine';

interface ScheduleContextType {
  employees: Employee[];
  shiftTypes: ShiftType[];
  assignments: ShiftAssignment[];
  status: ScheduleStatus;
  strictMode: boolean;
  activeTool: string | null; // shiftTypeId or 'eraser' or null
  viewMode: CalendarViewMode;
  currentDate: Date;
  departmentFilter: string;
  searchQuery: string;
  selectedCell: { employeeId: string; date: string } | null;
  revisions: ScheduleRevision[];
  validation: ValidationSummary;
  toastMessage: { text: string; type: 'success' | 'warning' | 'error' } | null;
  
  // Actions
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setDepartmentFilter: (dep: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveTool: (tool: string | null) => void;
  setStrictMode: (enabled: boolean) => void;
  setSelectedCell: (cell: { employeeId: string; date: string } | null) => void;
  assignShift: (
    employeeId: string,
    date: string,
    shiftTypeId: string,
    options?: {
      customHours?: number;
      customStartTime?: string;
      customEndTime?: string;
      note?: string;
    }
  ) => { success: boolean; message?: string };
  removeAssignmentsForCell: (employeeId: string, date: string) => void;
  removeAssignmentById: (id: string) => void;
  applyAutoFill: (params: Omit<AutoFillParams, 'existingAssignments' | 'shiftTypes'>) => void;
  publishSchedule: () => void;
  resetToDefaultData: () => void;
  clearToast: () => void;
}

const STORAGE_KEY = 'smart_shift_schedule_state_v2';

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 9, 11)); // October 2026
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Core Data
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_employees`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EMPLOYEES;
  });

  const [shiftTypes] = useState<ShiftType[]>(SHIFT_TYPES);

  const [assignments, setAssignments] = useState<ShiftAssignment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_assignments`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return generateInitialAssignments(new Date(2026, 9, 11));
  });

  const [status, setStatus] = useState<ScheduleStatus>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_status`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return 'draft';
  });

  const [revisions, setRevisions] = useState<ScheduleRevision[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_revisions`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REVISIONS;
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_employees`, JSON.stringify(employees));
      localStorage.setItem(`${STORAGE_KEY}_assignments`, JSON.stringify(assignments));
      localStorage.setItem(`${STORAGE_KEY}_status`, JSON.stringify(status));
      localStorage.setItem(`${STORAGE_KEY}_revisions`, JSON.stringify(revisions));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [employees, assignments, status, revisions]);

  const showToast = useCallback((text: string, type: 'success' | 'warning' | 'error') => {
    setToastMessage({ text, type });
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Run validation engine
  const validation = useMemo(() => {
    return validateSchedule(employees, assignments, shiftTypes, currentDate);
  }, [employees, assignments, shiftTypes, currentDate]);

  // Assign shift with strict mode validation check
  const assignShift = useCallback(
    (
      employeeId: string,
      date: string,
      shiftTypeId: string,
      options?: {
        customHours?: number;
        customStartTime?: string;
        customEndTime?: string;
        note?: string;
      }
    ) => {
      const newAssignment: ShiftAssignment = {
        id: `asg-${employeeId}-${date}-${Date.now().toString(36)}`,
        employeeId,
        date,
        shiftTypeId,
        ...options,
      };

      // Test new state against validation engine if strict mode is active
      if (strictMode) {
        // Filter out existing assignments in the cell
        const testAssignments = [
          ...assignments.filter((a) => !(a.employeeId === employeeId && a.date === date)),
          newAssignment,
        ];

        const testValidation = validateSchedule(employees, testAssignments, shiftTypes, currentDate);
        const cellIssues = testValidation.issuesByCellKey.get(`${employeeId}_${date}`) || [];
        const criticalCellIssues = cellIssues.filter((i) => i.severity === 'critical');

        if (criticalCellIssues.length > 0) {
          const firstErr = criticalCellIssues[0];
          showToast(`Строгий режим заблокировал сохранение: ${firstErr.title}`, 'error');
          return { success: false, message: firstErr.message };
        }
      }

      // If allowed, replace any existing assignment for this cell
      setAssignments((prev) => [
        ...prev.filter((a) => !(a.employeeId === employeeId && a.date === date)),
        newAssignment,
      ]);

      showToast('Смена успешно назначена', 'success');
      return { success: true };
    },
    [assignments, employees, shiftTypes, currentDate, strictMode, showToast]
  );

  const removeAssignmentsForCell = useCallback(
    (employeeId: string, date: string) => {
      setAssignments((prev) => prev.filter((a) => !(a.employeeId === employeeId && a.date === date)));
      showToast('Смена удалена из расписания', 'success');
    },
    [showToast]
  );

  const removeAssignmentById = useCallback(
    (id: string) => {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      showToast('Смена удалена', 'success');
    },
    [showToast]
  );

  const applyAutoFill = useCallback(
    (params: Omit<AutoFillParams, 'existingAssignments' | 'shiftTypes'>) => {
      const updated = generateCyclicSchedule({
        ...params,
        existingAssignments: assignments,
        shiftTypes,
      });
      setAssignments(updated);
      showToast(`Автозаполнение выполнено для ${params.employeeIds.length} сотрудников`, 'success');
    },
    [assignments, shiftTypes, showToast]
  );

  const publishSchedule = useCallback(() => {
    const newVersion = revisions.length + 1;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}`;

    const newRev: ScheduleRevision = {
      id: `rev-${Date.now()}`,
      timestamp,
      version: newVersion,
      author: 'Диспетчер сменности',
      changesSummary: `Публикация версии v${newVersion}. Назначено смен: ${assignments.length}. Выявлено конфликтов: ${validation.criticalCount}.`,
      assignmentsCount: assignments.length,
    };

    setRevisions((prev) => [newRev, ...prev]);
    setStatus('published');
    showToast(`График опубликован (Версия ${newVersion})`, 'success');
  }, [assignments.length, revisions.length, validation.criticalCount, showToast]);

  const resetToDefaultData = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY}_employees`);
    localStorage.removeItem(`${STORAGE_KEY}_assignments`);
    localStorage.removeItem(`${STORAGE_KEY}_status`);
    localStorage.removeItem(`${STORAGE_KEY}_revisions`);

    setEmployees(INITIAL_EMPLOYEES);
    setAssignments(generateInitialAssignments(new Date(2026, 9, 11)));
    setStatus('draft');
    setRevisions(INITIAL_REVISIONS);
    setCurrentDate(new Date(2026, 9, 11));
    showToast('Данные сброшены к начальному демонстрационному набору', 'success');
  }, [showToast]);

  return (
    <ScheduleContext.Provider
      value={{
        employees,
        shiftTypes,
        assignments,
        status,
        strictMode,
        activeTool,
        viewMode,
        currentDate,
        departmentFilter,
        searchQuery,
        selectedCell,
        revisions,
        validation,
        toastMessage,
        setCurrentDate,
        setViewMode,
        setDepartmentFilter,
        setSearchQuery,
        setActiveTool,
        setStrictMode,
        setSelectedCell,
        assignShift,
        removeAssignmentsForCell,
        removeAssignmentById,
        applyAutoFill,
        publishSchedule,
        resetToDefaultData,
        clearToast,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
