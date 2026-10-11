import React, { useState } from 'react';
import { OmiProvider, useOmi } from './context/OmiContext';
import { Sidebar } from './components/omi/Sidebar';
import { TopBar } from './components/omi/TopBar';
import { LiveClockWidget } from './components/omi/LiveClockWidget';
import { ScheduleView } from './components/omi/ScheduleView';
import { AnalyticsView } from './components/omi/AnalyticsView';
import { VacationsView } from './components/omi/VacationsView';
import { YearPlanningView } from './components/omi/YearPlanningView';
import { TeamView } from './components/omi/TeamView';
import { SettingsView } from './components/omi/SettingsView';
import { IcsModal } from './components/omi/IcsModal';
import { MobileNav } from './components/omi/MobileNav';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

function OmiWorkspaceContent() {
  const { activeTab, state, toast, clearToast } = useOmi();
  const [showIcsModal, setShowIcsModal] = useState<boolean>(false);

  const isLight = state.theme === 'light';

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-0 md:p-6 transition-colors duration-200 ${
        isLight ? 'bg-[#f2f2f7] text-[#1c1c1e]' : 'bg-black text-white'
      }`}
    >
      {/* 1440px x 92vh Shell on Desktop; Full Native Scroll on Mobile */}
      <div className="w-full max-w-[1440px] h-auto md:h-[92vh] flex flex-col md:flex-row gap-6 overflow-visible md:overflow-hidden">
        
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <main
          className={`flex-1 rounded-none md:rounded-3xl border-0 md:border p-3.5 sm:p-5 md:p-8 overflow-y-visible md:overflow-y-auto flex flex-col gap-4 sm:gap-6 shadow-2xl pb-28 md:pb-8 backdrop-blur-2xl transition-colors ${
            isLight
              ? 'bg-white/80 border-black/10'
              : 'bg-[#121214]/85 border-white/10'
          }`}
        >
          {/* Top Bar with actions */}
          <TopBar />

          {/* Active Tab View */}
          {activeTab === 'schedule' && (
            <div className="flex flex-col gap-4 sm:gap-5">
              <LiveClockWidget />
              <ScheduleView onOpenIcsModal={() => setShowIcsModal(true)} />
            </div>
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'vacations2027' && <VacationsView />}

          {activeTab === 'year' && <YearPlanningView />}

          {activeTab === 'team' && <TeamView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* iCal Export Modal */}
      {showIcsModal && (
        <IcsModal onClose={() => setShowIcsModal(false)} />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-200 max-w-[90vw]">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/40'
                : 'bg-black/90 text-white border-white/20 shadow-black/50'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="truncate">{toast.message}</span>
            <button
              onClick={clearToast}
              className="ml-2 text-white/50 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <OmiProvider>
      <OmiWorkspaceContent />
    </OmiProvider>
  );
}
