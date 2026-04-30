import { Plugin, Notice, TFile } from 'obsidian';
import { Duration } from 'luxon';
import { Link } from '@blacksmithgu/datacore';
import { DayFlowSettings, DEFAULT_SETTINGS, DayFlowSettingTab } from './settings';
import { DailyNoteWriter } from './domain/daily-note-writer';
import type { TimeEntry } from './domain/time-entry';

export default class DayFlowPlugin extends Plugin {
	settings!: DayFlowSettings;
	writer!: DailyNoteWriter;

	async onload() {
		const data = await this.loadData() as { settings?: Partial<DayFlowSettings> } | null;
		this.settings = { ...DEFAULT_SETTINGS, ...data?.settings };

		this.writer = new DailyNoteWriter(this.app);

		this.addSettingTab(new DayFlowSettingTab(this.app, this));

		console.log('DayFlow loaded');
	}

	onunload() {
		console.log('DayFlow unloaded');
	}

	async saveSettings() {
		const data = await this.loadData() as object | null;
		await this.saveData({ ...data, settings: this.settings });
	}
}
