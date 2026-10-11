import React from 'react';
import { 
  X, 
  History, 
  CheckCircle2, 
  FileEdit, 
  Clock, 
  User, 
  Calendar 
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

interface RevisionsModalProps {
  onClose: () => void;
}

export const RevisionsModal: React.FC<RevisionsModalProps> = ({ onClose }) => {
  const { revisions, status, publishSchedule, assignments } = useSchedule();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                История версий и ревизий графика
              </h3>
              <p className="text-xs text-slate-400">
                Фиксация изменений производственного графика
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
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Current Status banner */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Текущее состояние графика:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {status === 'published' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Опубликовано (Актуальная версия)
                    </>
                  ) : (
                    <>
                      <FileEdit className="w-3.5 h-3.5" />
                      Черновик (Редактируется)
                    </>
                  )}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {assignments.length} назначенных смен
                </span>
              </div>
            </div>

            {status === 'draft' && (
              <button
                onClick={() => {
                  publishSchedule();
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md shadow-emerald-600/30"
              >
                Опубликовать
              </button>
            )}
          </div>

          {/* Timeline of Revisions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Журнал публикаций:
            </h4>

            {revisions.map((rev, idx) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      v{rev.version}.0
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] uppercase font-bold text-emerald-400">
                        Последняя ревизия
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {rev.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {rev.changesSummary}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    {rev.author}
                  </span>
                  <span className="font-mono text-slate-400">
                    Смен в слепке: {rev.assignmentsCount}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
