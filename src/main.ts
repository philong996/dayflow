import { Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { DatacoreApi } from '@blacksmithgu/datacore';
import { DayFlowSettings, DEFAULT_SETTINGS, DayFlowSettingTab } from './settings';
import { DailyNoteWriter } from './core/daily-note-writer';
import { EntryService } from './services/entry-service';
import { AreaService } from './services/area-service';
import { ProjectService } from './services/project-service';
import { TimerService, type TimerState } from './services/timer-service';
import { CalendarView, CALENDAR_VIEW_TYPE } from './ui/calendar-view';
import { TimerPanelView, TIMER_PANEL_VIEW_TYPE } from './ui/timer-panel-view';

const DEFAULT_TIMER_STATE: TimerState = { status: 'idle' };

export default class DayFlowPlugin extends Plugin {
	settings!:        DayFlowSettings;
	timerState!:      TimerState;
	entryService!:    EntryService;
	areaService!:     AreaService;
	projectService!:  ProjectService;
	timerService!:    TimerService;

	async onload() {
		const data = await this.loadData() as {
			settings?:   Partial<DayFlowSettings>;
			timerState?: TimerState;
		} | null;

		this.settings   = { ...DEFAULT_SETTINGS, ...data?.settings };
		this.timerState = data?.timerState ?? DEFAULT_TIMER_STATE;

		const datacoreApi = (this.app as any).plugins?.plugins?.['datacore']?.api as DatacoreApi;
		this.entryService   = new EntryService(datacoreApi, new DailyNoteWriter(this.app));
		this.areaService    = new AreaService(datacoreApi);
		this.projectService = new ProjectService(datacoreApi);
		this.timerService   = new TimerService(
			()  => this.timerState,
			async (s) => { this.timerState = s; await this.saveSettings(); },
			this.entryService,
		);

		this.registerView(CALENDAR_VIEW_TYPE, (leaf: WorkspaceLeaf) =>
			new CalendarView(
				leaf,
				this.entryService,
				this.settings,
				this.areaService,
				this.projectService,
			)
		);

		this.registerView(TIMER_PANEL_VIEW_TYPE, (leaf: WorkspaceLeaf) =>
			new TimerPanelView(
				leaf,
				this.timerService,
				() => this.settings.defaultArea ?? '',
				this.areaService,
				this.projectService,
			)
		);

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (!(file instanceof TFile) || file.extension !== 'md') return;
				this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE).forEach(leaf => {
					(leaf.view as CalendarView).refresh();
				});
				this.app.workspace.getLeavesOfType(TIMER_PANEL_VIEW_TYPE).forEach(leaf => {
					(leaf.view as TimerPanelView).refresh();
				});
			})
		);

		this.addCommand({
			id: 'open-calendar',
			name: 'Open calendar',
			callback: () => this.activateCalendarView(),
		});

		this.addCommand({
			id: 'open-timer',
			name: 'Open timer',
			callback: () => this.activateTimerPanelView(),
		});

		this.addSettingTab(new DayFlowSettingTab(this.app, this));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(CALENDAR_VIEW_TYPE);
	}

	async saveSettings() {
		await this.saveData({
			settings:   this.settings,
			timerState: this.timerState,
		});
	}

	private async activateTimerPanelView() {
		const existing = this.app.workspace.getLeavesOfType(TIMER_PANEL_VIEW_TYPE);
		if (existing.length > 0) {
			this.app.workspace.revealLeaf(existing[0]!);
			return;
		}
		const leaf = this.app.workspace.getLeaf('tab');
		await leaf.setViewState({ type: TIMER_PANEL_VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	private async activateCalendarView() {
		const existing = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
		if (existing.length > 0) {
			this.app.workspace.revealLeaf(existing[0]!);
			return;
		}
		const leaf = this.app.workspace.getLeaf('tab');
		await leaf.setViewState({ type: CALENDAR_VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);
	}
}
