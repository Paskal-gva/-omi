import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ArrowRight, 
  Trash2,
  Filter
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ValidationIssue } from '../types/schedule';

interface ConflictDrawerProps {
  onClose: () => void;
  onNavigateToCell?: (employeeId: string, date: string) => void;
}

export const ConflictDrawer: React.FC<ConflictDrawerProps> = ({
  onClose,
  onNavigateToCell,
}) => {
  const { validation, removeAssignmentsForCell } = useSchedule();
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all');

  const filteredIssues = validation.issues.filter((issue) => {
    if (filterSeverity === 'all') return true;
    return issue.severity === filterSeverity;
  });

  const handleResolve = (issue: ValidationIssue) => {
    if (issue.employeeId && issue.date) {
      removeAssignmentsForCell(issue.employeeId, issue.date);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Движок валидации ограничений</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {validation.issues.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Контроль ТК РФ, норм отдыха ≥11ч, отсутствий и покрытия
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

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterSeverity === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({validation.issues.length})
            </button>
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                filterSeverity === 'critical'
                  ? 'bg-rose-500/30 text-rose-200 shadow-sm border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Критические ({validation.criticalCount})</span>
            </button>
            <button
              onClick={() => setFilterSeverity('warning')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                filterSeverity === 'warning'
                  ? 'bg-amber-500/30 text-amber-200 shadow-sm border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Предупреждения ({validation.warningCount})</span>
            </button>
          </div>
        </div>

        {/* Issue Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {filteredIssues.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-400/80 mb-3" />
              <h4 className="text-base font-bold text-slate-300">
                Конфликтов не обнаружено
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Все смены строго соответствуют нормам трудового законодательства и производственным требованиям.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isCritical = issue.severity === 'critical';
              const isWarning = issue.severity === 'warning';

              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
                    isCritical
                      ? 'bg-rose-950/30 border-rose-500/30 shadow-md shadow-rose-950/20'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-500/30 shadow-md shadow-amber-950/20'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}
                      >
                        {isCritical ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-bold leading-tight ${
                            isCritical ? 'text-rose-200' : isWarning ? 'text-amber-200' : 'text-slate-200'
                          }`}
                        >
                          {issue.title}
                        </h4>

                        {issue.employeeName && (
                          <div className="text-[11px] font-semibold text-slate-300 mt-0.5">
                            Сотрудник: {issue.employeeName} {issue.date && `(${issue.date})`}
                          </div>
                        )}

                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {issue.message}
                        </p>

                        <div className="mt-2 text-[10px] text-slate-500 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="font-semibold text-slate-400">Обоснование: </span>
                          {issue.ruleExplanation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  {issue.employeeId && issue.date && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResolve(issue)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors"
                        title="Удалить конфликтующую смену на этот день"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Очистить ячейку</span>
                      </button>

                      {onNavigateToCell && (
                        <button
                          onClick={() => {
                            onNavigateToCell(issue.employeeId!, issue.date!);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/60 rounded-lg transition-colors"
                        >
                          <span>Перейти к ячейке</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Стандарты ТК РФ ст. 99, 103, 110</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
