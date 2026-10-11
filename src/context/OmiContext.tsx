import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  OmiWorkspaceState, 
  ActiveTab, 
  ShiftCode, 
  VacationPeriod, 
  MonthScheduleData,
  Employee
} from '../types/omi';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_VACATIONS, 
  INITIAL_OCTOBER_2026, 
  MONTHS,
  WD
} from '../data/omiConstants';
import { generateMonthSchedule } from '../utils/omiAlgorithm';

interface LiveClockData {
  time: string;
  date: string;
  mini: string;
}

interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface OmiContextType {
  state: OmiWorkspaceState;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  changeMonth: (delta: number) => void;
  setCurrentMonth: (ym: string) => void;
  toggleViewMonths: () => void;
  toggleLock: (targetYm?: string) => void;
  generateMonth: (ym?: string) => void;
  generateCurrentMonthAndUpcoming: () => void;
  generateYearAll: () => void;
  setShift: (ym: string, empId: number, date: string, code: ShiftCode) => void;
  setDuty: (ym: string, date: string, empId: number | null) => void;
  saveSickLeave: (empId: number, from: string, to: string) => void;
  addVacation: (empId: number, from: string, to: string, desc: string, isMain: boolean) => void;
  deleteVacation: (id: number) => void;
  setSelectedVacEmpId: (id: number) => void;

  // New Features:
  // 1. Personal Filter ("Мой график")
  filterEmpId: number | null;
  setFilterEmpId: (id: number | null) => void;

  // 2. Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // 3. UX & Navigation
  jumpToToday: () => void;
  copyTelegramSummary: (targetDate?: string) => Promise<boolean>;

  // 4. Team Management (CRUD)
  addEmployee: (name: string, role?: string) => void;
  updateEmployee: (id: number, name: string, role?: string) => void;
  deleteEmployee: (id: number) => void;

  liveClock: LiveClockData;
  isCloudActive: boolean;
  cloudStatusText: string;
  connectFirebase: (url: string, apiKey: string) => Promise<boolean>;
  disconnectFirebase: () => void;
  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

const LOCAL_STORAGE_KEY = 'omi_workspace_v43_modern';

const OmiContext = createContext<OmiContextType | undefined>(undefined);

export const OmiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [filterEmpId, setFilterEmpId] = useState<number | null>(null);
  const [isCloudActive, setIsCloudActive] = useState<boolean>(false);
  const [cloudStatusText, setCloudStatusText] = useState<string>('Локальный режим');
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Undo/Redo history stacks
  const [history, setHistory] = useState<Record<string, MonthScheduleData>[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef<boolean>(false);

  // Live Clock
  const [liveClock, setLiveClock] = useState<LiveClockData>({
    time: '00:00:00',
    date: 'Загрузка даты...',
    mini: '00:00',
  });

  // Main Application State
  const [state, setState] = useState<OmiWorkspaceState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          locked: { ...parsed.locked, '2026-10': true },
        };
      }
    } catch (e) {
      console.error(e);
    }

    const initialNov = generateMonthSchedule('2026-11', INITIAL_VACATIONS);
    return {
      theme: 'dark',
      currentMonth: '2026-10',
      viewMonths: 1,
      selectedVacEmpId: 2, // Вадим
      employees: INITIAL_EMPLOYEES,
      vacations: INITIAL_VACATIONS,
      schedule: {
        '2026-10': INITIAL_OCTOBER_2026,
        '2026-11': initialNov,
      },
      locked: {
        '2026-10': true,
      },
    };
  });

  // Push to history when schedule changes
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, JSON.parse(JSON.stringify(state.schedule))];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [state.schedule]);

  // Keyboard shortcut for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetSchedule = history[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      setState((prev) => ({
        ...prev,
        schedule: JSON.parse(JSON.stringify(targetSchedule)),
      }));
      showToast('Действие отменено (Undo)', 'info');
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetSchedule = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      setState((prev) => ({
        ...prev,
        schedule: JSON.parse(JSON.stringify(targetSchedule)),
      }));
      showToast('Действие возвращено (Redo)', 'info');
    }
  }, [historyIndex, history]);

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const daysArr = [
        'Воскресенье',
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
      ];

      setLiveClock({
        time: `${hours}:${minutes}:${seconds}`,
        mini: `${hours}:${minutes}`,
        date: `${daysArr[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }, [state]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    setState((prev) => ({ ...prev, theme }));
    document.body.className = `theme-${theme}`;
  }, []);

  const changeMonth = useCallback((delta: number) => {
    setState((prev) => {
      const [y, m] = prev.currentMonth.split('-').map(Number);
      const d = new Date(y, m - 1 + delta, 1);
      const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { ...prev, currentMonth: newMonth };
    });
  }, []);

  const setCurrentMonth = useCallback((ym: string) => {
    setState((prev) => ({ ...prev, currentMonth: ym }));
  }, []);

  const toggleViewMonths = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewMonths: prev.viewMonths === 1 ? 2 : prev.viewMonths === 2 ? 3 : 1,
    }));
  }, []);

  const toggleLock = useCallback((targetYm?: string) => {
    setState((prev) => {
      const ym = targetYm || prev.currentMonth;
      if (ym === '2026-10') {
        showToast('Октябрь 2026 зафиксирован как эталонный месяц!', 'info');
        return prev;
      }
      const newLocked = { ...prev.locked, [ym]: !prev.locked[ym] };
      const statusText = newLocked[ym] ? `Месяц ${ym} зафиксирован 🔒` : `Месяц ${ym} открыт для правок 🔓`;
      showToast(statusText, 'success');
      return { ...prev, locked: newLocked };
    });
  }, [showToast]);

  const generateMonth = useCallback((targetYm?: string) => {
    setState((prev) => {
      const ym = targetYm || prev.currentMonth;
      if (ym === '2026-10' || prev.locked[ym]) {
        showToast('Этот месяц зафиксирован от изменений!', 'error');
        return prev;
      }
      const generated = generateMonthSchedule(ym, prev.vacations);
      showToast(`График на ${ym} успешно сформирован!`, 'success');
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          [ym]: generated,
        },
      };
    });
  }, [showToast]);

  const generateCurrentMonthAndUpcoming = useCallback(() => {
    setState((prev) => {
      const ym = prev.currentMonth;
      if (ym === '2026-10' || prev.locked[ym]) {
        showToast('Текущий месяц зафиксирован!', 'error');
        return prev;
      }

      const newSchedule = { ...prev.schedule };
      newSchedule[ym] = generateMonthSchedule(ym, prev.vacations);

      const [y, m] = ym.split('-').map(Number);
      if (prev.viewMonths >= 2) {
        let nextM = m + 1;
        let nextY = y;
        if (nextM > 12) {
          nextM = 1;
          nextY++;
        }
        const nextYm = `${nextY}-${String(nextM).padStart(2, '0')}`;
        if (!prev.locked[nextYm]) {
          newSchedule[nextYm] = generateMonthSchedule(nextYm, prev.vacations);
        }
      }

      if (prev.viewMonths === 3) {
        let nextM = m + 2;
        let nextY = y;
        if (nextM > 12) {
          nextM -= 12;
          nextY++;
        }
        const nextYm = `${nextY}-${String(nextM).padStart(2, '0')}`;
        if (!prev.locked[nextYm]) {
          newSchedule[nextYm] = generateMonthSchedule(nextYm, prev.vacations);
        }
      }

      showToast(`Сформирован график на ${prev.viewMonths} мес.`, 'success');
      return { ...prev, schedule: newSchedule };
    });
  }, [showToast]);

  const generateYearAll = useCallback(() => {
    setState((prev) => {
      const newSchedule = { ...prev.schedule };
      let count = 0;

      for (let yr = 2026; yr <= 2028; yr++) {
        const startMonth = yr === 2026 ? 10 : 1;
        for (let m = startMonth; m <= 12; m++) {
          const ym = `${yr}-${String(m).padStart(2, '0')}`;
          if (ym !== '2026-10' && !prev.locked[ym]) {
            newSchedule[ym] = generateMonthSchedule(ym, prev.vacations);
            count++;
          }
        }
      }

      showToast(`Сформировано ${count} открытых месяцев на 2026–2028 гг.`, 'success');
      return { ...prev, schedule: newSchedule };
    });
  }, [showToast]);

  const setShift = useCallback(
    (ym: string, empId: number, date: string, code: ShiftCode) => {
      setState((prev) => {
        if (ym === '2026-10' || prev.locked[ym]) {
          showToast('Месяц зафиксирован! Снимите блокировку для изменения смен.', 'error');
          return prev;
        }

        const monthData = prev.schedule[ym]
          ? {
              res: { ...prev.schedule[ym].res },
              duty: { ...prev.schedule[ym].duty },
            }
          : { res: {}, duty: {} };

        if (!monthData.res[empId]) {
          monthData.res[empId] = {};
        } else {
          monthData.res[empId] = { ...monthData.res[empId] };
        }

        if (code === '') {
          delete monthData.res[empId][date];
        } else {
          monthData.res[empId][date] = code;
        }

        return {
          ...prev,
          schedule: {
            ...prev.schedule,
            [ym]: monthData,
          },
        };
      });
    },
    [showToast]
  );

  const setDuty = useCallback(
    (ym: string, date: string, empId: number | null) => {
      setState((prev) => {
        if (ym === '2026-10' || prev.locked[ym]) {
          showToast('Месяц зафиксирован! Снимите блокировку для назначения дежурного.', 'error');
          return prev;
        }

        const monthData = prev.schedule[ym]
          ? {
              res: { ...prev.schedule[ym].res },
              duty: { ...prev.schedule[ym].duty },
            }
          : { res: {}, duty: {} };

        if (empId === null) {
          delete monthData.duty[date];
          showToast(`Дежурство на ${date} снято`, 'info');
        } else {
          monthData.duty[date] = empId;
          const emp = prev.employees.find((e) => e.id === empId);
          showToast(`Дежурным на ${date} назначен ${emp?.name || empId}`, 'success');
        }

        return {
          ...prev,
          schedule: {
            ...prev.schedule,
            [ym]: monthData,
          },
        };
      });
    },
    [showToast]
  );

  const recalculateAllUnlockedSchedules = (vacationsList: VacationPeriod[], currentSchedule: Record<string, MonthScheduleData>, lockedMap: Record<string, boolean>) => {
    const updated = { ...currentSchedule };
    for (const ym in updated) {
      if (ym !== '2026-10' && !lockedMap[ym]) {
        updated[ym] = generateMonthSchedule(ym, vacationsList);
      }
    }
    return updated;
  };

  const saveSickLeave = useCallback(
    (empId: number, from: string, to: string) => {
      setState((prev) => {
        const newSick: VacationPeriod = {
          id: Date.now(),
          empId,
          from,
          to,
          desc: 'Больничный лист',
          isMain: false,
        };
        const updatedVacations = [...prev.vacations, newSick];
        const updatedSchedule = recalculateAllUnlockedSchedules(updatedVacations, prev.schedule, prev.locked);

        showToast('Больничный оформлен. График автоматически пересчитан!', 'success');
        return {
          ...prev,
          vacations: updatedVacations,
          schedule: updatedSchedule,
        };
      });
    },
    [showToast]
  );

  const addVacation = useCallback(
    (empId: number, from: string, to: string, desc: string, isMain: boolean) => {
      setState((prev) => {
        const newVac: VacationPeriod = {
          id: Date.now(),
          empId,
          from,
          to,
          desc: desc || 'Отпуск',
          isMain,
        };
        const updatedVacations = [...prev.vacations, newVac];
        const updatedSchedule = recalculateAllUnlockedSchedules(updatedVacations, prev.schedule, prev.locked);

        showToast('Период отпуска добавлен!', 'success');
        return {
          ...prev,
          vacations: updatedVacations,
          schedule: updatedSchedule,
        };
      });
    },
    [showToast]
  );

  const deleteVacation = useCallback(
    (id: number) => {
      setState((prev) => {
        const updatedVacations = prev.vacations.filter((v) => v.id !== id);
        const updatedSchedule = recalculateAllUnlockedSchedules(updatedVacations, prev.schedule, prev.locked);

        showToast('Период удален из реестра', 'info');
        return {
          ...prev,
          vacations: updatedVacations,
          schedule: updatedSchedule,
        };
      });
    },
    [showToast]
  );

  const setSelectedVacEmpId = useCallback((id: number) => {
    setState((prev) => ({ ...prev, selectedVacEmpId: id }));
  }, []);

  // Jump to Today
  const jumpToToday = useCallback(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setState((prev) => ({ ...prev, currentMonth: ym }));
    setActiveTab('schedule');
    showToast(`Переход к сегодняшней дате (${now.toLocaleDateString('ru-RU')})`, 'info');
  }, [showToast]);

  // Copy Telegram / Chat Summary
  const copyTelegramSummary = useCallback(async (targetDate?: string) => {
    const now = new Date();
    const fd = targetDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const [y, m, d] = fd.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const ym = `${y}-${String(m).padStart(2, '0')}`;

    const sch = state.schedule[ym] || { res: {}, duty: {} };
    const res = sch.res || {};
    const dutyId = sch.duty?.[fd];
    const dutyEmp = state.employees.find((e) => e.id === dutyId);

    const dayName = WD[dt.getDay()];
    const dateFormatted = `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y} (${dayName})`;

    let text = `📋 *ОМИ Workspace — Дежурства на ${dateFormatted}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🌟 *Дежурный:* ${dutyEmp ? `${dutyEmp.name} (Ост)` : 'не назначен'}\n\n`;
    text += `👥 *Распределение смен:*\n`;

    state.employees.forEach((emp) => {
      const val = (res[emp.id] || {})[fd] || '';
      const vRec = state.vacations.find((v) => v.empId === emp.id && fd >= v.from && fd <= v.to);

      let status = 'Свободен';
      if (vRec) {
        status = vRec.desc.toLowerCase().includes('бол') ? 'Больничный 🏥' : 'Отпуск 🏖';
      } else if (val === 'ост') {
        status = 'Ост (Основная смена) 🟢';
      } else if (val === 'кор') {
        status = 'Кор (Четверг) 🔵';
      } else if (val === 'искра') {
        status = 'Искра (Среда) 🟣';
      }
      text += `• *${emp.name}:* ${status}\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🕒 Сформировано в ОМИ Workspace v43.0 Pro`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('Сводка для Telegram скопирована в буфер обмена!', 'success');
      return true;
    } catch (e) {
      showToast('Не удалось скопировать текст в буфер', 'error');
      return false;
    }
  }, [state, showToast]);

  // Team Management (CRUD)
  const addEmployee = useCallback((name: string, role?: string) => {
    setState((prev) => {
      const maxId = prev.employees.reduce((acc, curr) => Math.max(acc, curr.id), 0);
      const newEmp: Employee = {
        id: maxId + 1,
        name: name.trim(),
        role: role?.trim() || 'Дежурный инженер',
      };
      showToast(`Сотрудник ${newEmp.name} добавлен в команду!`, 'success');
      return {
        ...prev,
        employees: [...prev.employees, newEmp],
      };
    });
  }, [showToast]);

  const updateEmployee = useCallback((id: number, name: string, role?: string) => {
    setState((prev) => {
      const updated = prev.employees.map((emp) =>
        emp.id === id ? { ...emp, name: name.trim(), role: role?.trim() || emp.role } : emp
      );
      showToast('Данные сотрудника обновлены', 'success');
      return {
        ...prev,
        employees: updated,
      };
    });
  }, [showToast]);

  const deleteEmployee = useCallback((id: number) => {
    setState((prev) => {
      const emp = prev.employees.find((e) => e.id === id);
      const updated = prev.employees.filter((e) => e.id !== id);
      showToast(`Сотрудник ${emp?.name || id} удален из команды`, 'info');
      return {
        ...prev,
        employees: updated,
      };
    });
  }, [showToast]);

  const connectFirebase = useCallback(async (url: string, apiKey: string): Promise<boolean> => {
    if (!url) {
      showToast('Укажите URL базы данных Firebase!', 'error');
      return false;
    }
    try {
      localStorage.setItem('omi_fb_url', url);
      localStorage.setItem('omi_fb_key', apiKey);
      setIsCloudActive(true);
      setCloudStatusText('Firebase подключен');
      showToast('Подключено к облачной базе Firebase!', 'success');
      return true;
    } catch (e: any) {
      showToast(`Ошибка подключения: ${e.message}`, 'error');
      return false;
    }
  }, [showToast]);

  const disconnectFirebase = useCallback(() => {
    localStorage.removeItem('omi_fb_url');
    localStorage.removeItem('omi_fb_key');
    setIsCloudActive(false);
    setCloudStatusText('Локальный режим');
    showToast('Облачное подключение отключено', 'info');
  }, [showToast]);

  return (
    <OmiContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        setTheme,
        changeMonth,
        setCurrentMonth,
        toggleViewMonths,
        toggleLock,
        generateMonth,
        generateCurrentMonthAndUpcoming,
        generateYearAll,
        setShift,
        setDuty,
        saveSickLeave,
        addVacation,
        deleteVacation,
        setSelectedVacEmpId,
        filterEmpId,
        setFilterEmpId,
        canUndo,
        canRedo,
        undo,
        redo,
        jumpToToday,
        copyTelegramSummary,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        liveClock,
        isCloudActive,
        cloudStatusText,
        connectFirebase,
        disconnectFirebase,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </OmiContext.Provider>
  );
};

export const useOmi = () => {
  const context = useContext(OmiContext);
  if (!context) {
    throw new Error('useOmi must be used within an OmiProvider');
  }
  return context;
};
