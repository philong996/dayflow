import { CalendarRenderer, type CalendarRendererProps } from './calendar-renderer';

export class MonthlyCalendarRenderer extends CalendarRenderer {
	getDateRange(currentDate: string) {
		// TODO: return first–last day of the calendar month containing currentDate
		return { startDate: currentDate, endDate: currentDate };
	}

	renderGrid(_props: CalendarRendererProps) {
		return <div className="df-placeholder">Monthly view — not yet implemented</div>;
	}
}
