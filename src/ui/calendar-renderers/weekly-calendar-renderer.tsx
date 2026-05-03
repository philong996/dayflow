import { CalendarRenderer, type CalendarRendererProps } from './calendar-renderer';

export class WeeklyCalendarRenderer extends CalendarRenderer {
	getDateRange(currentDate: string) {
		// TODO: return Sunday–Saturday of the ISO week containing currentDate
		return { startDate: currentDate, endDate: currentDate };
	}

	renderGrid(_props: CalendarRendererProps) {
		return <div className="df-placeholder">Weekly view — not yet implemented</div>;
	}
}
