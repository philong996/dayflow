import React, { useState, useMemo, useCallback } from 'react';
import { DateTime, Duration } from 'luxon';
import { Menu } from 'obsidian';
import type { TimeEntry } from '../core/time-entry';
import { buildSuggestions, type Suggestion } from '../core/suggestion';
import { EntryService } from '../services/entry-service';
import { AreaService } from '../services/area-service';
import { ProjectService } from '../services/project-service';
import { TaskService } from '../services/task-service';
import { TimerService } from '../services/timer-service';
import { CALENDAR_RENDERERS } from './calendar-renderers';
import { PlanForm } from './components/plan-form';
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
	projectService:    ProjectService;
	taskService:       TaskService;
	timerService:      TimerService;
	initialView:       CalendarViewState;
	calendarStartHour: number;
	calendarEndHour:   number;
	defaultArea:       string;
	revision:          number;
	onRefresh:         () => void;
}

export function Calendar({ entryService, areaService, projectService, taskService, timerService, initialView, calendarStartHour, calendarEndHour, defaultArea, revision, onRefresh }: CalendarProps) {
	const [viewState, setViewState] = useState<CalendarViewState>(initialView);
	const [planForm,  setPlanForm]  = useState<{ date: string; initialStart: string } | null>(null);

	const renderer = useMemo(
		() => new CALENDAR_RENDERERS[viewState.mode](),
		[viewState.mode],
	);

	const areaColors = areaService.getAreaColors();
	const areas      = areaService.getAreas();
	const projects   = projectService.getProjects(true);

	const [suggestionRevision, setSuggestionRevision] = useState(0);
	const suggestions = useMemo(() => buildSuggestions(taskService.getTasks()), [suggestionRevision]);
	const refreshSuggestions = useCallback(() => setSuggestionRevision(r => r + 1), []);

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

	const handleSavePlan = async (entry: TimeEntry) => {
		await entryService.saveEntry(entry, planForm!.date);
		setPlanForm(null);
	};

	const handleBlockContextMenu = (entry: TimeEntry, e: React.MouseEvent) => {
		if (timerService.isRunning()) return;

		const now = DateTime.now();
		const newEntry: TimeEntry = {
			id:          now.toFormat('yyyyMMddHHmmssSSS'),
			type:        'tracked',
			start:       now.toFormat('HH:mm'),
			end:         now.toFormat('HH:mm'),
			duration:    Duration.fromMillis(0),
			task:        entry.task,
			subTask:     entry.subTask,
			description: entry.description,
			area:        entry.area,
			project:     entry.project,
		};

		const menu = new Menu();
		menu.addItem(item =>
			item
				.setTitle(entry.type === 'tracked' ? 'Continue tracking' : 'Start timer from plan')
				.setIcon('play')
				.onClick(async () => {
					await timerService.start(newEntry);
					onRefresh();
				})
		);
		menu.showAtMouseEvent(e.nativeEvent as MouseEvent);
	};

	return (
		<div className="df-calendar">
			<CalendarToolbar viewState={viewState} onChange={handleChange} onRefresh={onRefresh} />
			{renderer.renderGrid({
				entries,
				startDate,
				endDate,
				startHour:          calendarStartHour,
				endHour:            calendarEndHour,
				areaColors,
				options:            viewState.options,
				onSlotClick:        handleSlotClick,
				onBlockContextMenu: handleBlockContextMenu,
			})}
			{planForm && (
				<PlanForm
					initialStart={planForm.initialStart}
					defaultArea={defaultArea}
					areas={areas}
					projects={projects}
					suggestions={suggestions}
					onRefreshSuggestions={refreshSuggestions}
					onSave={handleSavePlan}
					onCancel={() => setPlanForm(null)}
				/>
			)}
		</div>
	);
}
