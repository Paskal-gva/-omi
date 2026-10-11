import React, { useState } from 'react';
import { 
  CalendarCheck2, 
  FileSpreadsheet, 
  Printer, 
  RotateCcw, 
  ShieldAlert, 
  History, 
  CheckCircle2, 
  FileEdit,
  Sparkles
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { exportScheduleToCsv, triggerPrintSchedule } from '../utils/exportUtils';
import { formatMonthYear, getDaysForView } from '../utils/dateUtils';

interface HeaderProps {
  onOpenRevisions: () => void;
  onOpenConflicts: () => void;
  onOpenAutoFill: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRevisions,
  onOpenConflicts,
  onOpenAutoFill,
}) => {
  const {
    currentDate,
    status,
    validation,
    revisions,
    employees,
    assignments,
    shiftTypes,
    publishSchedule,
    resetToDefaultData,
    strictMode,
    setStrictMode,
  } = useSchedule();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);

  const monthTitle = formatMonthYear(currentDate);
  const daysInMonth = getDaysForView(currentDate, 'month');

  const handleExportCsv = () => {
    exportScheduleToCsv(employees, daysInMonth, assignments, shiftTypes, monthTitle);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <CalendarCheck2 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                  ShiftMatrix
                </h1>
                <span className="text-slate-500 text-xs font-mono">v{revisions.length}.0</span>
                
                {/* Schedule Status Badge */}
                <button
                  onClick={onOpenRevisions}
                  title="Нажмите для просмотра истории версий"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                    status === 'published'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                >
                  {status === 'published' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Опубликовано</span>
                    </>
                  ) : (
                    <>
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Черновик</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Умный график сменности с движком валидации и производственным календарем
              </p>
            </div>
          </div>

          {/* Quick Actions & Strict Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Strict Mode Toggle */}
            <button
              onClick={() => setStrictMode(!strictMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                strictMode
                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 shadow-sm shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Строгий режим блокирует сохранение смен при нарушении норм отдыха и пересечении с отпуском"
            >
              <div className={`w-2 h-2 rounded-full ${strictMode ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-slate-500'}`} />
              <span>Строгий контроль: {strictMode ? 'ВКЛ' : 'ВЫКЛ'}</span>
            </button>

            {/* Validation issues counter trigger */}
            {validation.criticalCount > 0 && (
              <button
                onClick={onOpenConflicts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all shadow-sm shadow-rose-500/20 animate-pulse"
                title="Обнаружены критические конфликты смен"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Конфликты ({validation.criticalCount})</span>
              </button>
            )}

            {/* Auto-fill trigger button */}
            <button
              onClick={onOpenAutoFill}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600/80 to-indigo-600/80 hover:from-violet-500 hover:to-indigo-500 text-white transition-all shadow-sm border border-violet-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span>Автозаполнение</span>
            </button>

            {/* Revisions history */}
            <button
              onClick={onOpenRevisions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
              title="История версий и публикаций"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">История</span>
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
              title="Экспорт в формате CSV (Excel)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Excel/CSV</span>
            </button>

            {/* Print Schedule */}
            <button
              onClick={triggerPrintSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
              title="Печать графика или сохранение в PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Печать</span>
            </button>

            {/* Reset mock data */}
            <button
              onClick={() => setShowConfirmReset(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Сбросить к начальным демонстрационным данным"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Publish button */}
            {status === 'draft' ? (
              <button
                onClick={() => setShowConfirmPublish(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all border border-emerald-400/30"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Опубликовать</span>
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmPublish(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Новая редакция</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal for reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Сбросить данные расписания?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Все текущие изменения графика и смен будут заменены на начальный демонстрационный набор (10 сотрудников, базовые смены, несколько примеров предупреждений).
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  resetToDefaultData();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-lg shadow-rose-600/30"
              >
                Да, сбросить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal for publish */}
      {showConfirmPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {status === 'draft' ? 'Опубликовать график сменности?' : 'Создать новую редакцию графика?'}
            </h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              График будет сохранен в реестр ревизий со слепком назначений.
              {validation.criticalCount > 0 && (
                <span className="block mt-2 text-rose-400 font-medium">
                  Внимание: в текущем расписании есть {validation.criticalCount} неразрешенных конфликтов!
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmPublish(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  publishSchedule();
                  setShowConfirmPublish(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-600/30"
              >
                Подтвердить публикацию
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
