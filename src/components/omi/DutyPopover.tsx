import React, { useEffect, useRef } from 'react';
import { useOmi } from '../../context/OmiContext';
import { ShiftCode } from '../../types/omi';
import { getShiftBadgeStyle } from '../../utils/omiAlgorithm';
import { UserCheck, Trash2, Check, X, Sparkles } from 'lucide-react';

interface DutyPopoverProps {
  ym: string;
  date: string;
  currentDutyId?: number;
  position: { x: number; y: number } | null;
  onSelect: (empId: number | null) => void;
  onSmartSuggest?: () => void;
  onClose: () => void;
}

export const DutyPopover: React.FC<DutyPopoverProps> = ({
  ym,
  date,
  currentDutyId,
  position,
  onSelect,
  onSmartSuggest,
  onClose,
}) => {
  const { state } = useOmi();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!position) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Window bounds calculation for desktop
  let left = position.x;
  let top = position.y;
  if (left + 260 > window.innerWidth) left = window.innerWidth - 270;
  if (top + 360 > window.innerHeight) top = window.innerHeight - 370;

  const sch = state.schedule[ym] || { res: {}, duty: {} };
  const res = sch.res || {};

  const content = (
    <div
      ref={popoverRef}
      style={isMobile ? undefined : { left: `${Math.max(10, left)}px`, top: `${Math.max(10, top)}px` }}
      className={`${
        isMobile
          ? 'w-full max-h-[85vh] overflow-y-auto bg-slate-950/95 border-t border-white/20 rounded-t-3xl p-4 shadow-2xl flex flex-col gap-2 pb-[max(20px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-5 duration-200'
          : 'fixed z-50 bg-black/95 border border-white/20 backdrop-blur-3xl rounded-2xl p-2.5 shadow-2xl flex flex-col gap-1.5 min-w-[250px] animate-in fade-in zoom-in-95 duration-100'
      }`}
    >
      {isMobile && (
        <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-1 shrink-0" />
      )}

      <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-1">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Дежурный ({date.slice(8)}.{date.slice(5, 7)})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {onSmartSuggest && (
        <button
          onClick={() => {
            onClose();
            onSmartSuggest();
          }}
          className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 text-white border border-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer text-left shadow-sm mb-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="leading-tight">Smart Suggest</span>
            <span className="text-[10px] text-emerald-300 font-normal">AI подбор дежурного</span>
          </div>
        </button>
      )}

      <div className="space-y-1.5 overflow-y-auto max-h-[50vh] sm:max-h-none">
        {state.employees.map((emp) => {
          const isCurrentDuty = currentDutyId === emp.id;
          const shiftVal = (res[emp.id] || {})[date] || '';
          const vRec = state.vacations.find(
            (v) => v.empId === emp.id && date >= v.from && date <= v.to
          );

          let codeToDisplay: ShiftCode = shiftVal;
          if (vRec) {
            codeToDisplay = vRec.desc.toLowerCase().includes('бол') ? 'sick' : 'vac';
          }
          const badge = getShiftBadgeStyle(codeToDisplay);

          return (
            <button
              key={emp.id}
              onClick={() => {
                onSelect(emp.id);
                onClose();
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                isCurrentDuty
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                  {emp.name.slice(0, 2)}
                </div>
                <div className="text-left min-w-0">
                  <div className="font-bold text-white truncate">{emp.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{emp.role}</div>
                </div>
                {codeToDisplay ? (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold shrink-0 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-normal shrink-0">Свободен</span>
                )}
              </div>

              {isCurrentDuty && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="h-[1px] bg-white/10 my-1" />

      <button
        onClick={() => {
          onSelect(null);
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 transition-colors cursor-pointer text-left"
      >
        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>Снять дежурного</span>
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm p-0 animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};
