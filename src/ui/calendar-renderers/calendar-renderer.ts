import type { ReactElement } from 'react';
import type { TimeEntry } from '../../domain/time-entry';
import type { CalendarViewOptions } from '../calendar-types';

export interface CalendarRendererProps {
	entries:    TimeEntry[];
	startDate:  string;
	endDate:    string;
	startHour:  number;
	endHour:    number;
	options:    CalendarViewOptions;
	areaColors: Record<string, string>;
}

export abstract class CalendarRenderer {
	abstract getDateRange(currentDate: string): { startDate: string; endDate: string };
	abstract renderGrid(props: CalendarRendererProps): ReactElement;
}
