import { Employee, MonthScheduleData, VacationPeriod } from '../types/omi';
import { isWorkingDay } from './omiAlgorithm';

export function exportScheduleToExcel(
  ym: string,
  employees: Employee[],
  scheduleData: MonthScheduleData,
  vacations: VacationPeriod[]
) {
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const res = scheduleData?.res || {};
  const duty = scheduleData?.duty || {};

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"></head>
<body>
<table border="1" style="font-family: Arial, sans-serif; text-align: center; border-collapse: collapse;">
  <tr style="background:#f2f2f2; font-weight:bold;">
    <th>Сотрудник</th>`;

  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m - 1, d);
    if (isWorkingDay(dt)) {
      html += `<th>${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}</th>`;
    }
  }

  html += `<th style="background:#e6e6e6;">Всего смен</th>
    <th style="background:#d9ead3;">Ост</th>
    <th style="background:#c9daf8;">Кор</th>
    <th style="background:#e1bee7;">Иск</th>
  </tr>`;

  employees.forEach((emp) => {
    html += `<tr><td style="font-weight:bold; text-align:left; padding: 4px 8px;">${emp.name}</td>`;
    let total = 0;
    let ost = 0;
    let kor = 0;
    let isk = 0;

    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m - 1, d);
      if (!isWorkingDay(dt)) continue;

      const fd = `${ym}-${String(d).padStart(2, '0')}`;
      const val = (res[emp.id] || {})[fd] || '';
      const isVac = vacations.some((v) => v.empId === emp.id && fd >= v.from && fd <= v.to);

      let cTxt = '';
      if (isVac || val === 'vac') {
        cTxt = 'Отп';
      } else if (val === 'ост') {
        cTxt = 'Ост';
        ost++;
        total++;
      } else if (val === 'кор') {
        cTxt = 'Кор';
        kor++;
        total++;
      } else if (val === 'искра') {
        cTxt = 'Иск';
        isk++;
        total++;
      } else if (val === 'sick') {
        cTxt = 'Бол';
      }

      html += `<td>${cTxt}</td>`;
    }

    html += `<td style="font-weight:bold; background:#e6e6e6;">${total}</td>
      <td style="background:#d9ead3;">${ost}</td>
      <td style="background:#c9daf8;">${kor}</td>
      <td style="background:#e1bee7;">${isk}</td>
    </tr>`;
  });

  html += `<tr style="background:#f9f9f9; font-weight:bold;"><td style="text-align:left; padding: 4px 8px;">Дежурный</td>`;
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m - 1, d);
    if (!isWorkingDay(dt)) continue;

    const fd = `${ym}-${String(d).padStart(2, '0')}`;
    const dutyId = duty[fd];
    const dutyEmp = employees.find((e) => e.id === dutyId);
    html += `<td>${dutyEmp ? dutyEmp.name : ''}</td>`;
  }
  html += `<td></td><td></td><td></td><td></td></tr></table></body></html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `График_${ym}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
