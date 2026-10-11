import React from 'react';
import { useOmi } from '../../context/OmiContext';
import { MONTHS } from '../../data/omiConstants';
import { exportScheduleToExcel } from '../../utils/excelExport';
import { Sparkles, FileSpreadsheet, Lock, Unlock } from 'lucide-react';

export const YearPlanningView: React.FC = () => {
  const { state, toggleLock, generateYearAll } = useOmi();

  const years = [2026, 2027, 2028];

  return (
    <div className="space-y-8">
      {/* Header & Batch Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] p-5 rounded-3xl border border-white/10">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Планирование на год (2026–2028)
          </h2>
          <p className="text-xs text-slate-400">
            Фиксируйте сформированные месяцы для защиты данных и выгружайте их в Excel.
          </p>
        </div>

        <button
          onClick={generateYearAll}
          className="px-5 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10 self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Сформировать все открытые</span>
        </button>
      </div>

      {/* Years Sections */}
      <div className="space-y-8">
        {years.map((yr) => {
          const startMonth = yr === 2026 ? 9 : 0; // October for 2026

          return (
            <div key={yr} className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{yr} год</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {Array.from({ length: 12 - startMonth }).map((_, idx) => {
                  const monthIdx = startMonth + idx;
                  const ym = `${yr}-${String(monthIdx + 1).padStart(2, '0')}`;
                  const isLocked = Boolean(state.locked[ym]);

                  return (
                    <div
                      key={ym}
                      className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          {MONTHS[monthIdx]} {yr}
                        </span>
                        {isLocked ? (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ГОТОВО
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded bg-white/5">
                            ОТКРЫТ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleLock(ym)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isLocked
                              ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                              : 'bg-white text-black border-transparent font-bold hover:bg-slate-200'
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Unlock className="w-3 h-3 text-slate-400" />
                              <span>Открыть</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Зафиксировать</span>
                            </>
                          )}
                        </button>

                        {isLocked && (
                          <button
                            onClick={() =>
                              exportScheduleToExcel(
                                ym,
                                state.employees,
                                state.schedule[ym] || { res: {}, duty: {} },
                                state.vacations
                              )
                            }
                            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-1 cursor-pointer"
                            title="Скачать Excel за этот месяц"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Excel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
