import type { CalendarMode } from '../calendar-types';
import { CalendarRenderer } from './calendar-renderer';
import { DailyCalendarRenderer } from './daily-calendar-renderer';
import { WeeklyCalendarRenderer } from './weekly-calendar-renderer';
import { MonthlyCalendarRenderer } from './monthly-calendar-renderer';

export { CalendarRenderer };

export const CALENDAR_RENDERERS: Record<CalendarMode, new () => CalendarRenderer> = {
	daily:   DailyCalendarRenderer,
	weekly:  WeeklyCalendarRenderer,
	monthly: MonthlyCalendarRenderer,
};
