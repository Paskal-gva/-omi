import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Clock, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle 
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ShiftType } from '../types/schedule';
import { formatDayHeader, parseDateIso } from '../utils/dateUtils';

interface ShiftModalProps {
  employeeId: string;
  date: string;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  employeeId,
  date,
  onClose,
}) => {
  const {
    employees,
    shiftTypes,
    assignments,
    assignShift,
    removeAssignmentsForCell,
    validation,
    strictMode,
  } = useSchedule();

  const employee = employees.find((e) => e.id === employeeId);
  const cellAssignments = assignments.filter(
    (a) => a.employeeId === employeeId && a.date === date
  );
  const currentAssignment = cellAssignments[0];

  const cellKey = `${employeeId}_${date}`;
  const cellIssues = validation.issuesByCellKey.get(cellKey) || [];

  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    currentAssignment?.shiftTypeId || 'shift-day-12'
  );
  const [customStartTime, setCustomStartTime] = useState<string>(
    currentAssignment?.customStartTime || ''
  );
  const [customEndTime, setCustomEndTime] = useState<string>(
    currentAssignment?.customEndTime || ''
  );
  const [customHours, setCustomHours] = useState<string>(
    currentAssignment?.customHours ? currentAssignment.customHours.toString() : ''
  );
  const [note, setNote] = useState<string>(currentAssignment?.note || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedShiftType = shiftTypes.find((st) => st.id === selectedShiftId);

  // Sync defaults when selecting shift type
  const handleShiftTypeChange = (st: ShiftType) => {
    setSelectedShiftId(st.id);
    setCustomStartTime(st.startTime);
    setCustomEndTime(st.endTime);
    setCustomHours(st.durationHours.toString());
  };

  useEffect(() => {
    if (!currentAssignment && selectedShiftType) {
      setCustomStartTime(selectedShiftType.startTime);
      setCustomEndTime(selectedShiftType.endTime);
      setCustomHours(selectedShiftType.durationHours.toString());
    }
  }, [currentAssignment, selectedShiftType]);

  const handleSave = () => {
    setErrorMessage(null);
    const parsedHours = customHours ? parseFloat(customHours) : undefined;

    const result = assignShift(employeeId, date, selectedShiftId, {
      customStartTime: customStartTime || undefined,
      customEndTime: customEndTime || undefined,
      customHours: parsedHours,
      note: note.trim() || undefined,
    });

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.message || 'Ошибка валидации правил графика');
    }
  };

  const handleDelete = () => {
    removeAssignmentsForCell(employeeId, date);
    onClose();
  };

  if (!employee) return null;

  const dateObj = parseDateIso(date);
  const { dayNumber, dayOfWeek } = formatDayHeader(dateObj);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Назначение смены</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                {date} ({dayOfWeek})
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {employee.name} · {employee.role}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Active cell conflicts / warnings */}
          {cellIssues.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Обнаружены нарушения правил на эту дату:</span>
              </div>
              {cellIssues.map((issue) => (
                <div key={issue.id} className="pl-6 text-slate-300">
                  <p className="font-semibold text-rose-200">{issue.title}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{issue.message}</p>
                  <p className="text-slate-500 text-[10px] italic mt-0.5">Правило: {issue.ruleExplanation}</p>
                </div>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Shift Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Выберите тип смены или статус отсутствия:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {shiftTypes.map((st) => {
                const isSelected = selectedShiftId === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleShiftTypeChange(st)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${st.badgeBg} border-white/40 ring-2 ring-white/30 shadow-md`
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-black/30 shrink-0">
                      {st.code}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{st.name}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {st.durationHours > 0 ? `${st.durationHours}ч (${st.startTime}–${st.endTime})` : 'Без часов'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Time adjustments */}
          {selectedShiftType && selectedShiftType.category === 'work' && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Время и продолжительность смены</span>
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Начало</label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Окончание</label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Часов</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Служебная заметка (необязательно)</span>
            </label>
            <input
              type="text"
              placeholder="Например: Замена по заявке #102, дежурный инженер..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div>
            {currentAssignment && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить смену</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all shadow-md shadow-indigo-600/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Сохранить смену</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
