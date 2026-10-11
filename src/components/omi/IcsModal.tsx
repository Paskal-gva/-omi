import React, { useState } from 'react';
import { useOmi } from '../../context/OmiContext';
import { generateIcsForEmployee } from '../../utils/icsExport';
import { X, Calendar, Download } from 'lucide-react';

interface IcsModalProps {
  onClose: () => void;
}

export const IcsModal: React.FC<IcsModalProps> = ({ onClose }) => {
  const { state, showToast } = useOmi();
  const [selectedEmpId, setSelectedEmpId] = useState<number>(2); // Вадим

  const selectedEmp = state.employees.find((e) => e.id === selectedEmpId);
  const currentMonthData = state.schedule[state.currentMonth] || { res: {}, duty: {} };

  const handleExport = () => {
    if (!selectedEmp) return;

    const res = generateIcsForEmployee(
      selectedEmp,
      state.currentMonth,
      currentMonthData,
      state.vacations
    );

    if (!res.success || !res.blobUrl) {
      showToast(`Для сотрудника ${selectedEmp.name} нет смен в ${state.currentMonth}`, 'error');
      return;
    }

    const a = document.createElement('a');
    a.href = res.blobUrl;
    a.download = res.fileName || `График_${selectedEmp.name}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(res.blobUrl);

    showToast(`Файл календаря iCal (.ics) для ${selectedEmp.name} скачан!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Экспорт в системный календарь (.ics)
              </h3>
              <p className="text-xs text-slate-400">
                Синхронизация с iPhone / Android / Google Calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Выберите сотрудника для выгрузки:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {state.employees.map((emp) => {
                const isSelected = selectedEmpId === emp.id;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{emp.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{emp.role}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-[11px] space-y-1">
            <p>
              📅 <strong>Период:</strong> {state.currentMonth}
            </p>
            <p>
              🔔 <strong>Напоминания:</strong> Каждая смена включает напоминание накануне в 18:00 (за 15 часов до смены).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать .ICS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
