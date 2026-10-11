import React, { useState } from 'react';
import { useOmi } from '../../context/OmiContext';
import { Cloud, Palette, Download, ShieldCheck, Unlink } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    state,
    setTheme,
    connectFirebase,
    disconnectFirebase,
    isCloudActive,
    showToast,
  } = useOmi();

  const [fbUrl, setFbUrl] = useState<string>(
    localStorage.getItem('omi_fb_url') || ''
  );
  const [fbApiKey, setFbApiKey] = useState<string>(
    localStorage.getItem('omi_fb_key') || ''
  );

  const handleConnect = async () => {
    await connectFirebase(fbUrl.trim(), fbApiKey.trim());
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omi_workspace_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Резервная копия скачана в формате JSON', 'success');
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          Настройки и Облако
        </h2>
        <p className="text-xs text-slate-400">
          Управление внешними сервисами, оформлением и резервными копиями ОМИ Workspace.
        </p>
      </div>

      {/* Firebase Cloud Sync Card */}
      <div className="bg-white/[0.03] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Синхронизация Firebase Realtime Database
            </h3>
            <p className="text-xs text-slate-400">
              Совместное ведение графика командой в реальном времени.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Database URL:
            </label>
            <input
              type="text"
              value={fbUrl}
              onChange={(e) => setFbUrl(e.target.value)}
              placeholder="https://your-project-default-rtdb.firebaseio.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              API Key (необязательно для публичных правил):
            </label>
            <input
              type="password"
              value={fbApiKey}
              onChange={(e) => setFbApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleConnect}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 cursor-pointer"
          >
            Подключить и запустить облако
          </button>

          {isCloudActive && (
            <button
              onClick={disconnectFirebase}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Отключить</span>
            </button>
          )}
        </div>
      </div>

      {/* Theme Card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/20">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Оформление темы</h3>
            <p className="text-xs text-slate-400">
              Строгая монохромная палитра интерфейса.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              state.theme === 'dark'
                ? 'bg-white text-black border-white shadow-md font-bold'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            Dark Frosted (Тёмная)
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              state.theme === 'light'
                ? 'bg-black text-white border-black shadow-md font-bold'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            Light Glass (Светлая)
          </button>
        </div>
      </div>

      {/* Backup Card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Резервное копирование данных
            </h3>
            <p className="text-xs text-slate-400">
              Локальное сохранение структуры смен, отпусков и статусов.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Скачать бэкап (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
