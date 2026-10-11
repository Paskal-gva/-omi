import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Users, 
  ShieldCheck, 
  CheckCircle2,
  Layers
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ROTATION_PATTERNS } from '../utils/autoFillEngine';
import { formatDateIso, parseDateIso } from '../utils/dateUtils';
import { startOfMonth, endOfMonth } from 'date-fns';

interface AutoFillModalProps {
  onClose: () => void;
}

export const AutoFillModal: React.FC<AutoFillModalProps> = ({ onClose }) => {
  const { employees, currentDate, applyAutoFill } = useSchedule();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const [patternId, setPatternId] = useState<string>('pattern-2-2-day');
  const [startDateStr, setStartDateStr] = useState<string>(formatDateIso(monthStart));
  const [endDateStr, setEndDateStr] = useState<string>(formatDateIso(monthEnd));
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>(employees.map((e) => e.id));
  const [respectAbsences, setRespectAbsences] = useState<boolean>(true);
  const [cycleOffset, setCycleOffset] = useState<number>(0);

  const selectedPattern = ROTATION_PATTERNS.find((p) => p.id === patternId);

  const toggleEmployee = (id: string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmpIds.length === employees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(employees.map((e) => e.id));
    }
  };

  const handleSelectByDept = (dept: string) => {
    const deptEmpIds = employees.filter((e) => e.department === dept).map((e) => e.id);
    setSelectedEmpIds(deptEmpIds);
  };

  const handleApply = () => {
    if (selectedEmpIds.length === 0) return;

    applyAutoFill({
      employeeIds: selectedEmpIds,
      patternId,
      startDate: parseDateIso(startDateStr),
      endDate: parseDateIso(endDateStr),
      respectAbsences,
      cycleOffset,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Мастер циклического автозаполнения
              </h3>
              <p className="text-xs text-slate-400">
                Генерация ротационных смен с защитой отпускных периодов и ТК РФ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1: Choose Pattern */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              1. Выберите шаблон ротации сменности:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROTATION_PATTERNS.map((p) => {
                const isSelected = patternId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPatternId(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-lg shadow-indigo-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{p.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Date Range */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              2. Период применения шаблона:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Дата начала</label>
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Дата окончания</label>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Employees selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Сотрудники ({selectedEmpIds.length} из {employees.length} выбрано):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllEmployees}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  {selectedEmpIds.length === employees.length ? 'Снять выделение' : 'Выбрать всех'}
                </button>
              </div>
            </div>

            {/* Quick Department Presets */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <span className="text-[10px] text-slate-500 self-center mr-1">По отделам:</span>
              {['Инфраструктура и DevOps', 'Поддержка 24/7', 'Склад и логистика', 'Контроль качества'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => handleSelectByDept(dept)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Employee Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              {employees.map((emp) => {
                const isChecked = selectedEmpIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    onClick={() => toggleEmployee(emp.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isChecked ? 'bg-indigo-950/40 text-slate-100' : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent label click
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight">{emp.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{emp.role}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Safety Settings */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={respectAbsences}
                onChange={(e) => setRespectAbsences(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Не затирать утверждённые отпуска и больничные (ТК РФ)</span>
              </span>
            </label>
            <p className="text-[11px] text-slate-400 pl-5">
              Дни ежегодных отпусков и больничных листов останутся без изменений, рабочие смены на них назначены не будут.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={selectedEmpIds.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl transition-all shadow-md shadow-violet-600/30 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Заполнить расписание ({selectedEmpIds.length} сотр.)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
