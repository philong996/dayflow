import { ItemView, WorkspaceLeaf } from 'obsidian';
import { useState, useMemo } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DateTime, Duration } from 'luxon';
import type { CalendarViewState, CalendarMode } from './calendar-types';
import { DEFAULT_CALENDAR_VIEW } from './calendar-types';
import { EntryService } from '../services/entry-service';
import { CALENDAR_RENDERERS } from './calendar-renderers';
import type { TimeEntry } from '../core/time-entry';
import { PlanForm, type PlanDraft } from './components/plan-form';
import { parseLinkText } from '../utils/link';

export const CALENDAR_VIEW_TYPE = 'dayflow-calendar';

export class CalendarView extends ItemView {
	private root: Root | null = null;
	private revision = 0;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly entryService: EntryService,
		private readonly initialView: CalendarViewState,
		private readonly saveView: (s: CalendarViewState) => Promise<void>,
		private readonly settings: { calendarStartHour: number; calendarEndHour: number; areaColors: Record<string, string>; defaultArea?: string },
	) {
		super(leaf);
	}

	getViewType(): string { return CALENDAR_VIEW_TYPE; }
	getDisplayText(): string { return 'Calendar'; }

	async onOpen(): Promise<void> {
		const initialView: CalendarViewState = {
			...DEFAULT_CALENDAR_VIEW,
			...this.initialView,
			currentDate: this.initialView.currentDate || DateTime.now().toISODate()!,
		};
		this.root = createRoot(this.containerEl);
		this.renderRoot(initialView);
	}

	refresh(): void {
		this.revision++;
		this.renderRoot();
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
		this.root = null;
	}

	private renderRoot(initialView = this.initialView): void {
		this.root?.render(
			<CalendarRoot
				entryService={this.entryService}
				initialView={initialView}
				saveView={this.saveView}
				calendarStartHour={this.settings.calendarStartHour}
				calendarEndHour={this.settings.calendarEndHour}
				areaColors={this.settings.areaColors}
				defaultArea={this.settings.defaultArea ?? ''}
				revision={this.revision}
				onRefresh={() => this.refresh()}
			/>
		);
	}
}

interface CalendarRootProps {
	entryService:      EntryService;
	initialView:       CalendarViewState;
	saveView:          (s: CalendarViewState) => Promise<void>;
	calendarStartHour: number;
	calendarEndHour:   number;
	areaColors:        Record<string, string>;
	defaultArea:       string;
	revision:          number;
	onRefresh:         () => void;
}

function CalendarRoot({ entryService, initialView, saveView, calendarStartHour, calendarEndHour, areaColors, defaultArea, revision, onRefresh }: CalendarRootProps) {
	const [viewState, setViewState] = useState<CalendarViewState>(initialView);
	const [planForm,  setPlanForm]  = useState<{ date: string; initialStart: string } | null>(null);

	const renderer = useMemo(
		() => new CALENDAR_RENDERERS[viewState.mode](),
		[viewState.mode],
	);

	const { startDate, endDate } = renderer.getDateRange(viewState.currentDate);
	const entries = useMemo(
		() => entryService.fetchEntries(startDate, endDate, viewState.mode === 'daily' ? 'all' : 'tracked'),
		[revision, startDate, endDate, viewState.mode],
	);

	const handleChange = (next: CalendarViewState) => {
		setViewState(next);
		saveView(next);
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
					onSave={handleSavePlan}
					onCancel={() => setPlanForm(null)}
				/>
			)}
		</div>
	);
}


interface CalendarToolbarProps {
	viewState: CalendarViewState;
	onChange:  (next: CalendarViewState) => void;
	onRefresh: () => void;
}

function CalendarToolbar({ viewState, onChange, onRefresh }: CalendarToolbarProps) {
	const modes: CalendarMode[] = ['daily', 'weekly', 'monthly'];

	const navigate = (delta: number) => {
		const next = DateTime.fromISO(viewState.currentDate).plus({ days: delta }).toISODate()!;
		onChange({ ...viewState, currentDate: next });
	};

	return (
		<div className="df-toolbar">
			<div className="df-mode-toggle">
				{modes.map(m => (
					<button
						key={m}
						className={`df-mode-btn${viewState.mode === m ? ' active' : ''}`}
						onClick={() => onChange({ ...viewState, mode: m })}
					>
						{m[0]!.toUpperCase() + m.slice(1)}
					</button>
				))}
			</div>
			<div className="df-nav">
				<button onClick={() => navigate(-1)}>←</button>
				<span className="df-current-date">{viewState.currentDate}</span>
				<button onClick={() => navigate(1)}>→</button>
				<button className="df-refresh-btn" onClick={onRefresh} title="Refresh">↺</button>
			</div>
		</div>
	);
}
