import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  X, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useOmi } from '../../context/OmiContext';
import { SmartSuggestResult, ShiftCode } from '../../types/omi';
import { WD, MONTHS } from '../../data/omiConstants';
import { getShiftBadgeStyle } from '../../utils/omiAlgorithm';

interface SmartSuggestModalProps {
  initialDate?: string;
  initialShiftCode?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SmartSuggestModal: React.FC<SmartSuggestModalProps> = ({
  initialDate,
  initialShiftCode = 'ост',
  isOpen,
  onClose,
}) => {
  const { state, setShift, setDuty, showToast } = useOmi();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDate) return initialDate;
    const now = new Date();
    return `${state.currentMonth}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const [targetShift, setTargetShift] = useState<string>(initialShiftCode || 'ост');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SmartSuggestResult | null>(null);

  // Update selected date if initialDate changes when opened
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
    if (initialShiftCode) {
      setTargetShift(initialShiftCode);
    }
  }, [initialDate, initialShiftCode, isOpen]);

  const ym = selectedDate ? selectedDate.slice(0, 7) : state.currentMonth;

  // Fetch AI suggestion from backend
  const fetchSuggestion = useCallback(async (dateStr: string, shiftType: string) => {
    if (!dateStr) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/smart-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateStr,
          shiftCode: shiftType,
          ym: dateStr.slice(0, 7),
          employees: state.employees,
          schedule: state.schedule,
          vacations: state.vacations,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера (${response.status})`);
      }

      const data: SmartSuggestResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Smart Suggest fetch error:', err);
      setError(err.message || 'Не удалось получить рекомендацию');
    } finally {
      setLoading(false);
    }
  }, [state.employees, state.schedule, state.vacations]);

  // Automatically request recommendation when modal opens or date/shift changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchSuggestion(selectedDate, targetShift);
    }
  }, [isOpen, selectedDate, targetShift, fetchSuggestion]);

  if (!isOpen) return null;

  // Date parsing
  const [y, m, d] = selectedDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = WD[dateObj.getDay()];
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  const handleStepDay = (delta: number) => {
    const nextDate = new Date(y, m - 1, d + delta);
    const nextYm = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    const nextStr = `${nextYm}-${String(nextDate.getDate()).padStart(2, '0')}`;
    setSelectedDate(nextStr);
  };

  const handleApplyShift = () => {
    if (!result) return;
    const empId = result.recommendedEmployeeId;
    const empName = result.recommendedEmployeeName;
    const targetYm = selectedDate.slice(0, 7);

    if (targetShift === 'duty') {
      setDuty(targetYm, selectedDate, empId);
      showToast(`Назначен дежурный: ${empName} на ${selectedDate}`, 'success');
    } else {
      const code = (result.recommendedShiftCode as ShiftCode) || (targetShift as ShiftCode) || 'ост';
      setShift(targetYm, empId, selectedDate, code);
      showToast(`Смена "${code.toUpperCase()}" назначена: ${empName} (${selectedDate})`, 'success');
    }

    onClose();
  };

  const handleApplyAlternative = (empId: number, empName: string) => {
    const targetYm = selectedDate.slice(0, 7);
    if (targetShift === 'duty') {
      setDuty(targetYm, selectedDate, empId);
      showToast(`Назначен дежурный: ${empName} на ${selectedDate}`, 'success');
    } else {
      const code = (targetShift as ShiftCode) || 'ост';
      setShift(targetYm, empId, selectedDate, code);
      showToast(`Смена "${code.toUpperCase()}" назначена: ${empName} (${selectedDate})`, 'success');
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-950/95 border border-white/15 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-blue-500/30 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">Smart Suggest</h3>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-emerald-500/30">
                  AI Рекомендация
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Интеллектуальный подбор кандидата на основе истории, навыков и баланса квоты часов
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date & Shift Controls Bar */}
        <div className="p-4 border-b border-white/10 bg-black/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Date Picker Ribbon */}
          <div className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-2xl p-1 gap-1">
            <button
              onClick={() => handleStepDay(-1)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Предыдущий день"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2 text-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">
                {String(d).padStart(2, '0')}.{String(m).padStart(2, '0')}.{y}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${isWeekend ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-slate-300'}`}>
                {dayOfWeek}
              </span>
            </div>

            <button
              onClick={() => handleStepDay(1)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Следующий день"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Shift Type Selector */}
          <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-2xl p-1 overflow-x-auto">
            <button
              onClick={() => setTargetShift('ост')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                targetShift === 'ост'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Ост (8.2 ч)
            </button>
            <button
              onClick={() => setTargetShift('кор')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                targetShift === 'кор'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Кор (7.2 ч)
            </button>
            <button
              onClick={() => setTargetShift('искра')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                targetShift === 'искра'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Искра (8 ч)
            </button>
            <button
              onClick={() => setTargetShift('duty')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                targetShift === 'duty'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Дежурный
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-3xl bg-white/5 border border-white/20 flex items-center justify-center animate-spin">
                <BrainCircuit className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Анализируем графики и нормы...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini оценивает интервалы отдыха, матрицу навыков и остаток месячных часов
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <div className="font-bold">Ошибка подбора</div>
                <div>{error}</div>
              </div>
              <button
                onClick={() => fetchSuggestion(selectedDate, targetShift)}
                className="ml-auto px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-white font-semibold"
              >
                Повторить
              </button>
            </div>
          )}

          {!loading && result && (
            <>
              {/* Top Hero: Recommended Employee Card */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/15 via-white/[0.04] to-blue-500/10 border border-emerald-500/30 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white text-black font-black text-lg flex items-center justify-center shadow-md shrink-0">
                      {result.recommendedEmployeeName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {result.matchLevel}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {result.confidenceScore}% соответствие
                        </span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                        {result.recommendedEmployeeName}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {state.employees.find((e) => e.id === result.recommendedEmployeeId)?.role || 'Дежурный инженер'}
                      </p>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <button
                    onClick={handleApplyShift}
                    className="px-5 py-3 rounded-2xl bg-white text-black hover:bg-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer self-stretch sm:self-auto"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Назначить на смену</span>
                  </button>
                </div>

                {/* AI Summary Quote */}
                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-200 italic leading-relaxed bg-black/20 p-3 rounded-xl">
                  «{result.summary}»
                </div>
              </div>

              {/* 3 Pillar Decision Factors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Availability */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Доступность</span>
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-300 mb-1">
                      {result.availabilityBreakdown.status}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {result.availabilityBreakdown.details}
                    </p>
                  </div>
                </div>

                {/* 2. Skill Match */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>Навыки & Профиль</span>
                    </div>
                    <div className="text-[11px] font-semibold text-purple-300 mb-1">
                      {result.skillMatchBreakdown.status}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {result.skillMatchBreakdown.details}
                    </p>
                  </div>
                </div>

                {/* 3. Hours Quota */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Баланс квоты</span>
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-300 mb-1">
                      Остаток: {result.quotaBreakdown.remainingHours} ч
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {result.quotaBreakdown.details}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                      <span>{result.quotaBreakdown.workedHours} ч</span>
                      <span>норма {result.quotaBreakdown.targetHours} ч</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((result.quotaBreakdown.workedHours / (result.quotaBreakdown.targetHours || 44)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative Candidates Ranking */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Рейтинг всех кандидатов команды:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Ранжирование по скорингу
                  </span>
                </div>

                <div className="space-y-1.5">
                  {result.rankings.map((cand) => {
                    const isTop = cand.employeeId === result.recommendedEmployeeId;
                    return (
                      <div
                        key={cand.employeeId}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                          isTop
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                            : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                            isTop ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-300'
                          }`}>
                            {cand.score}%
                          </span>
                          <div>
                            <span className="font-bold text-white mr-2">{cand.employeeName}</span>
                            <span className="text-[11px] text-slate-400">{cand.shortReason}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            cand.verdict.includes('Рекомендован')
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : cand.verdict.includes('Недоступен')
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-white/10 text-slate-300'
                          }`}>
                            {cand.verdict}
                          </span>

                          {!isTop && !cand.verdict.includes('Недоступен') && (
                            <button
                              onClick={() => handleApplyAlternative(cand.employeeId, cand.employeeName)}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Назначить этого сотрудника"
                            >
                              Выбрать
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-[11px] text-slate-400">
          <span>Синхронизировано с базой смен OMI Workspace</span>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-semibold cursor-pointer"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
