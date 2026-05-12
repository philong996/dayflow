import { useState, useMemo } from 'react';
import { DateTime, Duration } from 'luxon';
import type { TimeEntry } from '../core/time-entry';
import { EntryService } from '../services/entry-service';
import { AreaService } from '../services/area-service';
import { CALENDAR_RENDERERS } from './calendar-renderers';
import { PlanForm, type PlanDraft } from './components/plan-form';
import { parseLinkText } from '../utils/link';
import { CalendarToolbar } from './components/calendar-toolbar';

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
	currentDate: DateTime.now().toISODate(),
	options:     { showTracked: true },
};


export interface CalendarProps {
	entryService:      EntryService;
	areaService:       AreaService;
	initialView:       CalendarViewState;
	calendarStartHour: number;
	calendarEndHour:   number;
	defaultArea:       string;
	revision:          number;
	onRefresh:         () => void;
}

export function Calendar({ entryService, areaService, initialView, calendarStartHour, calendarEndHour, defaultArea, revision, onRefresh }: CalendarProps) {
	const [viewState, setViewState] = useState<CalendarViewState>(initialView);
	const [planForm,  setPlanForm]  = useState<{ date: string; initialStart: string } | null>(null);

	const renderer = useMemo(
		() => new CALENDAR_RENDERERS[viewState.mode](),
		[viewState.mode],
	);

	const areaColors = areaService.getAreaColors();
	const areas      = areaService.getAreas();

	const { startDate, endDate } = renderer.getDateRange(viewState.currentDate);
	const entries = useMemo(
		() => entryService.fetchEntries(startDate, endDate, viewState.mode === 'daily' ? 'all' : 'tracked'),
		[revision, startDate, endDate, viewState.mode],
	);

	const handleChange = (next: CalendarViewState) => {
		setViewState(next);
	};

	const handleSlotClick = viewState.mode === 'daily'
		? (date: string, time: string) => setPlanForm({ date, initialStart: time })
		: undefined;

	const handleSavePlan = async (draft: PlanDraft) => {
		if (!draft.area.trim()) return;
		const projectLink = draft.project ? parseLinkText(draft.project) ?? undefined : undefined;

		const [sh = 0, sm = 0] = draft.start.split(':').map(Number);
		const [eh = 0, em = 0] = draft.end.split(':').map(Number);
		const durationMins = Math.max(0, eh * 60 + em - (sh * 60 + sm));

		const entry: TimeEntry = {
			id:       DateTime.now().toFormat('yyyyMMddHHmmssSSS'),
			start:    draft.start,
			end:      draft.end,
			duration: Duration.fromObject({ minutes: durationMins }),
			task:     draft.task,
			subTask:  draft.subTask,
			area:     draft.area.trim(),
			project:  projectLink,
			type:     'planned',
		};

		await entryService.saveEntry(entry, planForm!.date);
		setPlanForm(null);
	};

	return (
		<div className="df-calendar">
			<CalendarToolbar viewState={viewState} onChange={handleChange} onRefresh={onRefresh} />
			{renderer.renderGrid({
				entries,
				startDate,
				endDate,
				startHour:   calendarStartHour,
				endHour:     calendarEndHour,
				areaColors,
				options:     viewState.options,
				onSlotClick: handleSlotClick,
			})}
			{planForm && (
				<PlanForm
					initialStart={planForm.initialStart}
					defaultArea={defaultArea}
					areas={areas}
					onSave={handleSavePlan}
					onCancel={() => setPlanForm(null)}
				/>
			)}
		</div>
	);
}
