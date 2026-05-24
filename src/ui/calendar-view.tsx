import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';
import { DEFAULT_CALENDAR_VIEW , type CalendarViewState, Calendar } from './calendar';
import { EntryService } from '../services/entry-service';
import { AreaService } from '../services/area-service';
import { ProjectService } from '../services/project-service';
import { TaskService } from '../services/task-service';
import { TimerService } from '../services/timer-service';

export const CALENDAR_VIEW_TYPE = 'dayflow-calendar';

export class CalendarView extends ItemView {
	private root: Root | null = null;
	private revision = 0;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly entryService:    EntryService,
		private readonly settings:        { calendarStartHour: number; calendarEndHour: number; defaultArea?: string },
		private readonly areaService:     AreaService,
		private readonly projectService:  ProjectService,
		private readonly taskService:     TaskService,
		private readonly timerService:    TimerService,
	) {
		super(leaf);
	}

	getViewType(): string { return CALENDAR_VIEW_TYPE; }
	getDisplayText(): string { return 'Calendar'; }

	async onOpen(): Promise<void> {
		this.root = createRoot(this.containerEl);
		this.renderRoot();
	}

	refresh(): void {
		this.revision++;
		this.renderRoot();
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
		this.root = null;
	}

	private renderRoot(): void {
		const initialView: CalendarViewState = {
			...DEFAULT_CALENDAR_VIEW
		};
		this.root?.render(
			<Calendar
				entryService={this.entryService}
				areaService={this.areaService}
				projectService={this.projectService}
				taskService={this.taskService}
				timerService={this.timerService}
				initialView={initialView}
				calendarStartHour={this.settings.calendarStartHour}
				calendarEndHour={this.settings.calendarEndHour}
				defaultArea={this.settings.defaultArea ?? ''}
				revision={this.revision}
				onRefresh={() => this.refresh()}
			/>
		);
	}
}
