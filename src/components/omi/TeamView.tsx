import React, { useState } from 'react';
import { useOmi } from '../../context/OmiContext';
import { Users, Plus, Edit2, Trash2, X, Check, Shield } from 'lucide-react';

export const TeamView: React.FC = () => {
  const { state, addEmployee, updateEmployee, deleteEmployee, showToast } = useOmi();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);

  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('Дежурный инженер');

  const [editName, setEditName] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('');

  const handleAdd = () => {
    if (!newName.trim()) {
      showToast('Укажите имя сотрудника!', 'error');
      return;
    }
    addEmployee(newName.trim(), newRole.trim());
    setNewName('');
    setNewRole('Дежурный инженер');
    setShowAddModal(false);
  };

  const startEdit = (emp: { id: number; name: string; role?: string }) => {
    setEditingEmpId(emp.id);
    setEditName(emp.name);
    setEditRole(emp.role || 'Дежурный инженер');
  };

  const handleSaveEdit = (id: number) => {
    if (!editName.trim()) {
      showToast('Имя не может быть пустым', 'error');
      return;
    }
    updateEmployee(id, editName.trim(), editRole.trim());
    setEditingEmpId(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-white" />
            <span>Управление составом команды</span>
          </h2>
          <p className="text-xs text-slate-400">
            Добавление сотрудников, редактирование ролей и настройка ротации дежурств.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-lg shadow-white/10"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить сотрудника</span>
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {state.employees.map((emp) => {
          const isEditing = editingEmpId === emp.id;
          const vacationsCount = state.vacations.filter((v) => v.empId === emp.id).length;
          const currentMonthData = state.schedule[state.currentMonth]?.res?.[emp.id] || {};
          const shiftsThisMonth = Object.values(currentMonthData).filter(
            (v) => v === 'ост' || v === 'кор' || v === 'искра'
          ).length;

          return (
            <div
              key={emp.id}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xl hover:border-white/20 transition-all"
            >
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Имя"
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-bold focus:outline-none focus:border-white"
                    />
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      placeholder="Роль"
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-slate-300 text-xs focus:outline-none focus:border-white"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(emp.id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-black flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Сохранить</span>
                      </button>
                      <button
                        onClick={() => setEditingEmpId(null)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">{emp.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500">ID #{emp.id}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{emp.role}</div>
                  </div>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                    Смен в {state.currentMonth.slice(5)}: <strong>{shiftsThisMonth}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                    Отпусков: <strong>{vacationsCount}</strong>
                  </span>
                </div>
              </div>

              {!isEditing && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => startEdit(emp)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Редактировать сотрудника"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Удалить сотрудника ${emp.name}?`)) {
                        deleteEmployee(emp.id);
                      }
                    }}
                    disabled={state.employees.length <= 2}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors disabled:opacity-30 cursor-pointer"
                    title="Удалить сотрудника"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Новый сотрудник</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Имя / Фамилия
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Например: Денис"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Должность / Роль
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Например: Дежурный инженер"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5"
              >
                Отмена
              </button>
              <button
                onClick={handleAdd}
                className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
