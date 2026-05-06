import { CalendarRenderer, type CalendarRendererProps } from './calendar-renderer';
import { DayGrid } from '../components/day-grid';

export class DailyCalendarRenderer extends CalendarRenderer {
	getDateRange(currentDate: string) {
		return { startDate: currentDate, endDate: currentDate };
	}

	renderGrid({ entries, startHour, endHour, startDate, areaColors, onSlotClick }: CalendarRendererProps) {
		const handleSlotClick = onSlotClick
			? (time: string) => onSlotClick(startDate, time)
			: undefined;
		return (
			<DayGrid
				entries={entries}
				startHour={startHour}
				endHour={endHour}
				currentDate={startDate}
				areaColors={areaColors}
				onSlotClick={handleSlotClick}
			/>
		);
	}
}
