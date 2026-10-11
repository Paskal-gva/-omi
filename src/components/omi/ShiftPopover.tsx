import React, { useEffect, useRef } from 'react';
import { ShiftCode } from '../../types/omi';
import { Trash2, Sparkles } from 'lucide-react';

interface ShiftPopoverProps {
  position: { x: number; y: number } | null;
  onSelect: (code: ShiftCode) => void;
  onSmartSuggest?: () => void;
  onClose: () => void;
}

export const ShiftPopover: React.FC<ShiftPopoverProps> = ({
  position,
  onSelect,
  onSmartSuggest,
  onClose,
}) => {
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

  // Bound within window for desktop
  let left = position.x;
  let top = position.y;
  if (left + 220 > window.innerWidth) left = window.innerWidth - 230;
  if (top + 330 > window.innerHeight) top = window.innerHeight - 340;

  const content = (
    <div
      ref={popoverRef}
      style={isMobile ? undefined : { left: `${Math.max(10, left)}px`, top: `${Math.max(10, top)}px` }}
      className={`${
        isMobile
          ? 'w-full max-h-[85vh] overflow-y-auto bg-slate-950/95 border-t border-white/20 rounded-t-3xl p-4 shadow-2xl flex flex-col gap-1.5 pb-[max(20px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-5 duration-200'
          : 'fixed z-50 bg-slate-900/95 border border-white/15 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl flex flex-col gap-1 min-w-[210px] animate-in fade-in zoom-in-95 duration-100'
      }`}
    >
      {isMobile && (
        <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-2 shrink-0" />
      )}

      {isMobile && (
        <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10 mb-1">
          <span className="text-xs font-bold text-white">Редактор смены:</span>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/5"
          >
            Закрыть
          </button>
        </div>
      )}

      {onSmartSuggest && (
        <>
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
              <span className="text-[10px] text-emerald-300 font-normal">AI подбор кандидата</span>
            </div>
          </button>
          <div className="h-[1px] bg-white/10 my-0.5" />
        </>
      )}

      <button
        onClick={() => {
          onSelect('ост');
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
        <span>Ост (Основная смена)</span>
      </button>

      <button
        onClick={() => {
          onSelect('кор');
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 shadow-sm" />
        <span>Кор (Четверг)</span>
      </button>

      <button
        onClick={() => {
          onSelect('искра');
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0 shadow-sm" />
        <span>Искра (Среда)</span>
      </button>

      <div className="h-[1px] bg-white/10 my-1" />

      <button
        onClick={() => {
          onSelect('vac');
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-sm" />
        <span>Отпуск</span>
      </button>

      <button
        onClick={() => {
          onSelect('sick');
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0 shadow-sm" />
        <span>Больничный</span>
      </button>

      <button
        onClick={() => {
          onSelect('');
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
      >
        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>Очистить смену</span>
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
