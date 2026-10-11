import React from 'react';
import { useOmi } from '../../context/OmiContext';

export const LiveClockWidget: React.FC = () => {
  const { liveClock } = useOmi();

  return (
    <div className="relative overflow-hidden bg-white/[0.04] border border-white/10 rounded-2xl md:rounded-3xl p-3.5 md:p-5 flex flex-row md:flex-col items-center justify-between md:justify-center text-left md:text-center backdrop-blur-xl shadow-lg">
      <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
        {liveClock.time}
      </div>
      <div className="text-[11px] sm:text-xs md:text-sm text-slate-400 font-medium md:mt-1">
        {liveClock.date}
      </div>
    </div>
  );
};
