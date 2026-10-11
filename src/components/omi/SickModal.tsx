import React, { useState } from 'react';
import { useOmi } from '../../context/OmiContext';
import { X, HeartPulse } from 'lucide-react';

interface SickModalProps {
  onClose: () => void;
}

export const SickModal: React.FC<SickModalProps> = ({ onClose }) => {
  const { state, saveSickLeave, showToast } = useOmi();
  const [empId, setEmpId] = useState<number>(1); // default Олег
  const [fromDate, setFromDate] = useState<string>('2026-11-02');
  const [toDate, setToDate] = useState<string>('2026-11-06');

  const handleSave = () => {
    if (!fromDate || !toDate) {
      showToast('Укажите обе даты больничного!', 'error');
      return;
    }
    saveSickLeave(empId, fromDate, toDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Оформление больничного
              </h3>
              <p className="text-xs text-slate-400">
                Автоматический пересчёт дежурств
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

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Сотрудник
            </label>
            <select
              value={empId}
              onChange={(e) => setEmpId(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-medium focus:outline-none focus:border-rose-500"
            >
              {state.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Дата начала
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Дата выхода
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-[11px] leading-relaxed">
            При сохранении больничного листа все рабочие смены сотрудника в этом интервале будут заменены согласно алгоритму ротации ОМИ.
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
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};
