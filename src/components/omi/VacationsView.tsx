import React, { useState } from 'react';
import { useOmi } from '../../context/OmiContext';
import { Plus, Trash2, X, Palmtree } from 'lucide-react';

export const VacationsView: React.FC = () => {
  const {
    state,
    setSelectedVacEmpId,
    addVacation,
    deleteVacation,
    showToast,
  } = useOmi();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalFrom, setModalFrom] = useState<string>('2027-07-01');
  const [modalTo, setModalTo] = useState<string>('2027-07-14');
  const [modalDesc, setModalDesc] = useState<string>('Летний отпуск');
  const [modalIsMain, setModalIsMain] = useState<boolean>(false);

  const selectedEmp = state.employees.find((e) => e.id === state.selectedVacEmpId);
  const empVacations = state.vacations.filter((v) => v.empId === state.selectedVacEmpId);

  const handleSaveModal = () => {
    if (!modalFrom || !modalTo) {
      showToast('Укажите даты начала и окончания!', 'error');
      return;
    }
    addVacation(state.selectedVacEmpId, modalFrom, modalTo, modalDesc, modalIsMain);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Управление отпусками и отсутствиями
        </h2>
        <p className="text-xs text-slate-400">
          Выберите сотрудника для просмотра и добавления утверждённых периодов отдыха.
        </p>
      </div>

      {/* Employee Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {state.employees.map((emp) => {
          const isActive = emp.id === state.selectedVacEmpId;
          const count = state.vacations.filter((v) => v.empId === emp.id).length;
          return (
            <button
              key={emp.id}
              onClick={() => setSelectedVacEmpId(emp.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <span>{emp.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-black text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vacation List Container */}
      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Периоды отдыха: {selectedEmp ? selectedEmp.name : ''}
            </h3>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить период</span>
          </button>
        </div>

        {empVacations.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            У сотрудника пока нет запланированных периодов отсутствия.
          </div>
        ) : (
          <div className="space-y-3">
            {empVacations.map((v) => {
              const isSick = v.desc.toLowerCase().includes('бол');
              return (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-xs transition-all ${
                    v.isMain
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : isSick
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        {v.from} — {v.to}
                      </span>
                      {v.isMain && (
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-extrabold uppercase">
                          Основной
                        </span>
                      )}
                      {isSick && (
                        <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-extrabold uppercase">
                          Больничный
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs">{v.desc}</div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Удалить период ${v.from} — ${v.to}?`)) {
                        deleteVacation(v.id);
                      }
                    }}
                    className="p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Удалить период"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Vacation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                Новый период отпуска ({selectedEmp?.name})
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    value={modalFrom}
                    onChange={(e) => setModalFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    value={modalTo}
                    onChange={(e) => setModalTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Описание / Заметка
                </label>
                <input
                  type="text"
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  placeholder="Например: Июль (отдых 14 дн.)"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={modalIsMain}
                  onChange={(e) => setModalIsMain(e.target.checked)}
                  className="rounded border-white/20 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-slate-300 font-medium">
                  Сделать основным ежегодным отпуском
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
