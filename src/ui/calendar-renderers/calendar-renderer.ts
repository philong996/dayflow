import type { ReactElement, MouseEvent } from 'react';
import type { TimeEntry } from '../../core/time-entry';
import type { CalendarViewOptions } from '../calendar';

export interface CalendarRendererProps {
	entries:              TimeEntry[];
	startDate:            string;
	endDate:              string;
	startHour:            number;
	endHour:              number;
	options:              CalendarViewOptions;
	areaColors:           Record<string, string>;
	onSlotClick?:         (date: string, time: string) => void;
	onBlockContextMenu?:  (entry: TimeEntry, e: MouseEvent) => void;
}

export abstract class CalendarRenderer {
	abstract getDateRange(currentDate: string): { startDate: string; endDate: string };
	abstract renderGrid(props: CalendarRendererProps): ReactElement;
}
