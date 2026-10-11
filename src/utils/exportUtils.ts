import { Employee, ShiftAssignment, ShiftType } from '../types/schedule';
import { formatDateIso } from './dateUtils';

export function exportScheduleToCsv(
  employees: Employee[],
  days: Date[],
  assignments: ShiftAssignment[],
  shiftTypes: ShiftType[],
  monthTitle: string
) {
  const shiftMap = new Map<string, ShiftType>(shiftTypes.map((s) => [s.id, s]));
  const assignmentMap = new Map<string, ShiftAssignment[]>();

  for (const a of assignments) {
    const key = `${a.employeeId}_${a.date}`;
    if (!assignmentMap.has(key)) assignmentMap.set(key, []);
    assignmentMap.get(key)!.push(a);
  }

  // Header row
  const dateHeaders = days.map((d) => formatDateIso(d).slice(8)); // day numbers 01, 02..
  const headers = ['Сотрудник', 'Отдел', 'Роль', 'Норма (ч)', 'Факт (ч)', ...dateHeaders];

  const rows: string[][] = [];

  for (const emp of employees) {
    let totalFactHours = 0;
    const dayCells: string[] = [];

    for (const d of days) {
      const dateIso = formatDateIso(d);
      const key = `${emp.id}_${dateIso}`;
      const cellAssignments = assignmentMap.get(key) || [];

      if (cellAssignments.length === 0) {
        dayCells.push('—');
      } else {
        const codes: string[] = [];
        for (const a of cellAssignments) {
          const st = shiftMap.get(a.shiftTypeId);
          if (st) {
            codes.push(st.code);
            totalFactHours += a.customHours ?? st.durationHours;
          }
        }
        dayCells.push(codes.join('+'));
      }
    }

    rows.push([
      `"${emp.name.replace(/"/g, '""')}"`,
      `"${emp.department.replace(/"/g, '""')}"`,
      `"${emp.role.replace(/"/g, '""')}"`,
      emp.targetHoursMonth.toString(),
      totalFactHours.toString(),
      ...dayCells.map((c) => `"${c.replace(/"/g, '""')}"`),
    ]);
  }

  // Combine into CSV with UTF-8 BOM
  const csvContent =
    '\uFEFF' +
    [`График сменности: ${monthTitle}`, headers.join(';'), ...rows.map((r) => r.join(';'))].join(
      '\r\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `grafik_smen_${monthTitle.toLowerCase().replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrintSchedule() {
  window.print();
}
