export type CalendarMode = 'daily' | 'weekly' | 'monthly';

export interface CalendarViewOptions {
	showTracked: boolean;
}

export interface CalendarViewState {
	mode:        CalendarMode;
	currentDate: string;
	options:     CalendarViewOptions;
}

export const DEFAULT_CALENDAR_VIEW: CalendarViewState = {
	mode:        'daily',
	currentDate: '',
	options:     { showTracked: true },
};
