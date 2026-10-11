import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  addDays, 
  isWeekend, 
  isToday, 
  isSameDay 
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarViewMode } from '../types/schedule';

export function formatDateIso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateIso(isoString: string): Date {
  return parseISO(isoString);
}

export function formatDayHeader(date: Date): { dayNumber: string; dayOfWeek: string; isWeekendDay: boolean; isCurrentDay: boolean } {
  return {
    dayNumber: format(date, 'd'),
    dayOfWeek: format(date, 'EEEEEE', { locale: ru }).toUpperCase(),
    isWeekendDay: isWeekend(date),
    isCurrentDay: isToday(date),
  };
}

export function formatMonthYear(date: Date): string {
  const monthName = format(date, 'LLLL yyyy', { locale: ru });
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

export function getDaysForView(currentDate: Date, mode: CalendarViewMode): Date[] {
  if (mode === 'month') {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }

  if (mode === 'two-weeks') {
    // 14 consecutive days starting from Monday of current week
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 14 }, (_, i) => addDays(monday, i));
  }

  // mode === 'week': 7 days Monday to Sunday
  const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatTimeRange(startTime: string, endTime: string, crossesMidnight: boolean): string {
  return `${startTime}–${endTime}${crossesMidnight ? ' (+1)' : ''}`;
}

export { isToday, isSameDay, isWeekend };
