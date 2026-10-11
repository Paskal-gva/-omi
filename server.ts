import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to determine shift duration in hours
function getShiftHours(code: string): number {
  if (code === 'ост') return 8.2;
  if (code === 'кор') return 7.2;
  if (code === 'искра') return 8.0;
  return 0;
}

// Heuristic calculation fallback if Gemini API is unavailable
function calculateHeuristicRecommendation(
  date: string,
  targetShiftType: string,
  employees: any[],
  currentMonthSchedule: any,
  vacations: any[],
  ym: string
) {
  const [y, m, d] = date.split('-').map(Number);
  const targetDateObj = new Date(y, m - 1, d);
  const dayOfWeek = targetDateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 3 = Wed, 4 = Thu

  const stats = employees.map((emp) => {
    const res = currentMonthSchedule?.res?.[emp.id] || {};
    let workedHours = 0;
    let shiftCount = 0;
    let daysSinceLastShift = 99;
    let daysToNextShift = 99;

    // Check vacations or sick leave on targetDate
    const hasLeave = vacations.some(
      (v: any) => v.empId === emp.id && date >= v.from && date <= v.to
    );

    // Worked hours & shift count in this month
    Object.entries(res).forEach(([dt, code]) => {
      const c = String(code);
      const hrs = getShiftHours(c);
      if (hrs > 0) {
        workedHours += hrs;
        shiftCount++;
        const dtObj = new Date(dt);
        const diffDays = Math.round((targetDateObj.getTime() - dtObj.getTime()) / (86400000));
        if (diffDays > 0 && diffDays < daysSinceLastShift) {
          daysSinceLastShift = diffDays;
        } else if (diffDays < 0 && Math.abs(diffDays) < daysToNextShift) {
          daysToNextShift = Math.abs(diffDays);
        }
      }
    });

    // Target monthly quota estimation (assuming ~21 working days / 4 engineers ~ 42h)
    const targetQuota = 44.0;
    const remainingQuota = Math.round((targetQuota - workedHours) * 10) / 10;

    // Skill match score
    let skillScore = 70;
    const roleLower = (emp.role || '').toLowerCase();
    const nameLower = (emp.name || '').toLowerCase();

    if (dayOfWeek === 3 || targetShiftType === 'искра') {
      // Wednesday Iskra
      if (nameLower.includes('саша') || roleLower.includes('ср')) {
        skillScore = 98;
      } else {
        skillScore = 65;
      }
    } else if (dayOfWeek === 4 || targetShiftType === 'кор') {
      // Thursday Kor
      if (nameLower.includes('саша') || roleLower.includes('чт')) {
        skillScore = 95;
      } else if (nameLower.includes('вадим')) {
        skillScore = 90;
      } else {
        skillScore = 70;
      }
    } else {
      // Standard duty/ost rotation
      if (nameLower.includes('илья') || nameLower.includes('олег') || nameLower.includes('вадим')) {
        skillScore = 92;
      } else {
        skillScore = 75;
      }
    }

    // Availability score
    let availScore = 90;
    let availDetails = 'Доступен для назначения';
    if (hasLeave) {
      availScore = 0;
      availDetails = 'В отпуске или на больничном';
    } else if (daysSinceLastShift === 1) {
      availScore = 40;
      availDetails = 'Работал вчера, минимальный межсменный отдых';
    } else if (daysSinceLastShift >= 2) {
      availScore = 95;
      availDetails = `Отдыхал ${daysSinceLastShift === 99 ? 'достаточно' : daysSinceLastShift + ' дн.'}, оптимальная готовность`;
    }

    // Quota score (higher score if has more remaining quota)
    let quotaScore = 70;
    if (remainingQuota > 20) quotaScore = 95;
    else if (remainingQuota > 10) quotaScore = 85;
    else if (remainingQuota >= 0) quotaScore = 70;
    else quotaScore = 40; // Overtime

    // Total weighted score
    const totalScore = hasLeave ? 0 : Math.round(availScore * 0.4 + skillScore * 0.35 + quotaScore * 0.25);

    return {
      emp,
      hasLeave,
      workedHours: Math.round(workedHours * 10) / 10,
      remainingQuota,
      targetQuota,
      daysSinceLastShift,
      skillScore,
      availScore,
      quotaScore,
      totalScore,
      availDetails,
    };
  });

  // Sort descending by score
  const sorted = [...stats].sort((a, b) => b.totalScore - a.totalScore);
  const best = sorted[0];

  const suggestedCode = targetShiftType && targetShiftType !== 'duty' ? targetShiftType : (
    dayOfWeek === 3 ? 'искра' : dayOfWeek === 4 ? 'кор' : 'ост'
  );

  return {
    recommendedEmployeeId: best?.emp.id || employees[0]?.id || 1,
    recommendedEmployeeName: best?.emp.name || 'Сотрудник',
    recommendedShiftCode: suggestedCode,
    confidenceScore: Math.min(98, Math.max(65, best?.totalScore || 85)),
    matchLevel: best?.totalScore >= 88 ? 'Идеальный кандидат' : 'Рекомендуемый кандидат',
    summary: `${best?.emp.name} является оптимальным выбором: ${best?.availDetails.toLowerCase()}, остаток квоты ${best?.remainingQuota} ч.`,
    availabilityBreakdown: {
      status: best?.hasLeave ? 'Недоступен' : 'Отличная готовность',
      details: best?.availDetails || 'Соблюдены межсменные интервалы отдыха.',
    },
    skillMatchBreakdown: {
      status: 'Соответствует требованиям смены',
      details: `Роль: ${best?.emp.role || 'Дежурный инженер'}. Высокая компетенция для выполнения задач смены.`,
    },
    quotaBreakdown: {
      status: best?.remainingQuota >= 0 ? 'В пределах нормы' : 'Превышение нормы',
      workedHours: best?.workedHours || 0,
      targetHours: best?.targetQuota || 44,
      remainingHours: best?.remainingQuota || 0,
      details: `Отработано ${best?.workedHours} ч из плановых ${best?.targetQuota} ч. Остаток баланса: ${best?.remainingQuota} ч.`,
    },
    rankings: sorted.map((s) => ({
      employeeId: s.emp.id,
      employeeName: s.emp.name,
      score: s.totalScore,
      verdict: s.hasLeave ? 'Недоступен (Отпуск/Больничный)' : s.totalScore >= 80 ? 'Рекомендован' : 'Возможная замена',
      shortReason: s.hasLeave
        ? 'Находится в отпуске/больничном'
        : `Отдых: ${s.daysSinceLastShift === 99 ? '>3 дн.' : s.daysSinceLastShift + ' дн.'}, остаток квоты: ${s.remainingQuota} ч.`,
    })),
  };
}

// POST endpoint for AI Smart Suggest
app.post('/api/smart-suggest', async (req, res) => {
  try {
    const { date, shiftCode, ym, employees, schedule, vacations } = req.body;

    if (!date || !employees || !Array.isArray(employees)) {
      return res.status(400).json({ error: 'Параметры date и employees обязательны' });
    }

    const currentYm = ym || date.slice(0, 7);
    const monthSchedule = schedule?.[currentYm] || { res: {}, duty: {} };

    // Prepare context for Gemini
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeekNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const dayOfWeekName = dayOfWeekNames[dateObj.getDay()];

    const empProfiles = employees.map((emp: any) => {
      const empRes = monthSchedule.res?.[emp.id] || {};
      let workedHours = 0;
      let shiftCount = 0;
      const shiftDates: string[] = [];

      Object.entries(empRes).forEach(([dt, sc]) => {
        const hrs = getShiftHours(String(sc));
        if (hrs > 0) {
          workedHours += hrs;
          shiftCount++;
          shiftDates.push(dt);
        }
      });

      const onLeave = (vacations || []).filter(
        (v: any) => v.empId === emp.id && date >= v.from && date <= v.to
      );

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role || 'Дежурный инженер',
        currentMonthWorkedHours: Math.round(workedHours * 10) / 10,
        currentMonthShiftsCount: shiftCount,
        targetQuotaHours: 44.0,
        remainingHoursQuota: Math.round((44.0 - workedHours) * 10) / 10,
        activeLeaveOnDate: onLeave.map((l: any) => l.desc),
        hasLeaveOnDate: onLeave.length > 0,
        recentShiftDates: shiftDates.slice(-3),
      };
    });

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log('GEMINI_API_KEY is not set, using heuristic engine');
      const heuristic = calculateHeuristicRecommendation(
        date,
        shiftCode || '',
        employees,
        monthSchedule,
        vacations || [],
        currentYm
      );
      return res.json(heuristic);
    }

    // Call Gemini with GoogleGenAI SDK
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `
Ты — интеллектуальный диспетчер планирования графиков дежурств и сменности ИТ-инфраструктуры (система OMI Workspace).
Твоя задача — рекомендовать наилучшего сотрудника (Next Best Employee) для назначения на смену на дату: ${date} (${dayOfWeekName}).
Целевой тип смены: ${shiftCode || 'Автоопределение (Ост / Кор / Искра)'}.

КРИТЕРИИ ОЦЕНКИ:
1. Историческая доступность (Historical availability):
   - Сотрудник не должен быть в отпуске или на больничном в эту дату.
   - Межсменный отдых: необходимо не менее 24-48 часов отдыха между сменами, недопустимы две тяжелые смены подряд без перерыва.
2. Соответствие навыкам и роли (Skill Match):
   - По средам (смена "искра") приоритет имеет Саша (Спец. дежурный Ср/Чт) или профильный специалист.
   - По четвергам (смена "кор") приоритет имеет Саша или Вадим.
   - Основные дежурства ("ост") и дежурный инженер — Илья, Олег, Вадим, Саша.
3. Баланс и остаток месячной квоты часов (Remaining monthly hours quota):
   - Целевая плановая норма на месяц: ~44 часа на человека.
   - Приоритет отдается сотрудникам с наибольшим положительным остатком квоты (remainingHoursQuota), чтобы избежать переработок и выровнять нагрузку в коллективе.

ДАННЫЕ СОТРУДНИКОВ:
${JSON.stringify(empProfiles, null, 2)}

Верни детальный JSON-ответ на русском языке со структурированной аналитикой по каждому фактору и рейтингом всех кандидатов.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedEmployeeId: {
              type: Type.INTEGER,
              description: 'ID рекомендованного сотрудника',
            },
            recommendedEmployeeName: {
              type: Type.STRING,
              description: 'Имя рекомендованного сотрудника',
            },
            recommendedShiftCode: {
              type: Type.STRING,
              description: 'Рекомендуемый код смены (ост, кор или искра)',
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: 'Оценка соответствия в процентах от 50 до 99',
            },
            matchLevel: {
              type: Type.STRING,
              description: 'Уровень соответствия, например: Идеальный кандидат, Отличное соответствие',
            },
            summary: {
              type: Type.STRING,
              description: 'Краткое резюме почему выбран именно этот сотрудник',
            },
            availabilityBreakdown: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING },
                details: { type: Type.STRING },
              },
              required: ['status', 'details'],
            },
            skillMatchBreakdown: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING },
                details: { type: Type.STRING },
              },
              required: ['status', 'details'],
            },
            quotaBreakdown: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING },
                workedHours: { type: Type.NUMBER },
                targetHours: { type: Type.NUMBER },
                remainingHours: { type: Type.NUMBER },
                details: { type: Type.STRING },
              },
              required: ['status', 'workedHours', 'targetHours', 'remainingHours', 'details'],
            },
            rankings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  employeeId: { type: Type.INTEGER },
                  employeeName: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  verdict: { type: Type.STRING },
                  shortReason: { type: Type.STRING },
                },
                required: ['employeeId', 'employeeName', 'score', 'verdict', 'shortReason'],
              },
            },
          },
          required: [
            'recommendedEmployeeId',
            'recommendedEmployeeName',
            'recommendedShiftCode',
            'confidenceScore',
            'matchLevel',
            'summary',
            'availabilityBreakdown',
            'skillMatchBreakdown',
            'quotaBreakdown',
            'rankings',
          ],
        },
      },
    });

    const responseText = response.text?.trim() || '';
    if (responseText) {
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (e) {
        console.error('Failed to parse Gemini response as JSON:', e);
      }
    }

    // Fallback if parsing was empty
    const fallback = calculateHeuristicRecommendation(
      date,
      shiftCode || '',
      employees,
      monthSchedule,
      vacations || [],
      currentYm
    );
    return res.json(fallback);
  } catch (error) {
    console.error('Error in /api/smart-suggest:', error);
    // Graceful fallback to heuristic recommendation on error
    try {
      const { date, shiftCode, ym, employees, schedule, vacations } = req.body;
      const currentYm = ym || (date ? date.slice(0, 7) : '2026-10');
      const fallback = calculateHeuristicRecommendation(
        date || '2026-10-15',
        shiftCode || '',
        employees || [],
        schedule?.[currentYm] || {},
        vacations || [],
        currentYm
      );
      return res.json(fallback);
    } catch {
      return res.status(500).json({ error: 'Внутренняя ошибка генерации рекомендации' });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
