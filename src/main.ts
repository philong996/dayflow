import { Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { DatacoreApi } from '@blacksmithgu/datacore';
import { DayFlowSettings, DEFAULT_SETTINGS, DayFlowSettingTab } from './settings';
import { CalendarViewState, DEFAULT_CALENDAR_VIEW } from './ui/calendar-types';
import { DailyNoteWriter } from './core/daily-note-writer';
import { EntryService } from './services/entry-service';
import { CalendarView, CALENDAR_VIEW_TYPE } from './ui/calendar-view';

export default class DayFlowPlugin extends Plugin {
	settings!:     DayFlowSettings;
	calendarView!: CalendarViewState;
	entryService!: EntryService;

	async onload() {
		const data = await this.loadData() as { settings?: Partial<DayFlowSettings>; calendarView?: Partial<CalendarViewState> } | null;
		this.settings     = { ...DEFAULT_SETTINGS,      ...data?.settings };
		this.calendarView = { ...DEFAULT_CALENDAR_VIEW, ...data?.calendarView };

		const datacoreApi = (this.app as any).plugins?.plugins?.['datacore']?.api as DatacoreApi;
		this.entryService = new EntryService(datacoreApi, new DailyNoteWriter(this.app));

		this.registerView(CALENDAR_VIEW_TYPE, (leaf: WorkspaceLeaf) =>
			new CalendarView(
				leaf,
				this.entryService,
				this.calendarView,
				async (s) => { this.calendarView = s; await this.saveSettings(); },
				this.settings,
			)
		);

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (!(file instanceof TFile) || file.extension !== 'md') return;
				this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE).forEach(leaf => {
					(leaf.view as CalendarView).refresh();
				});
			})
		);

		this.addCommand({
			id: 'open-calendar',
			name: 'Open calendar',
			callback: () => this.activateCalendarView(),
		});

		this.addSettingTab(new DayFlowSettingTab(this.app, this));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(CALENDAR_VIEW_TYPE);
	}

	async saveSettings() {
		await this.saveData({ settings: this.settings, calendarView: this.calendarView });
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
