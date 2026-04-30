import { App, PluginSettingTab, Setting } from 'obsidian';
import DayFlowPlugin from './main';

export interface DayFlowSettings {
	dailyNoteFolder:   string;
	dailyNoteFormat:   string;
	calendarStartHour: number;
	calendarEndHour:   number;
	defaultArea?:      string;
}

export const DEFAULT_SETTINGS: DayFlowSettings = {
	dailyNoteFolder:   '',
	dailyNoteFormat:   'YYYY-MM-DD',
	calendarStartHour: 6,
	calendarEndHour:   23,
};

export class DayFlowSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: DayFlowPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'DayFlow Settings' });

		new Setting(containerEl)
			.setName('Daily note folder')
			.setDesc('Folder where daily notes are stored. Leave empty for vault root.')
			.addText(text => text
				.setPlaceholder('e.g. Journal/Daily')
				.setValue(this.plugin.settings.dailyNoteFolder)
				.onChange(async value => {
					this.plugin.settings.dailyNoteFolder = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Daily note filename format')
			.setDesc('Moment.js date format used for daily note filenames.')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.plugin.settings.dailyNoteFormat)
				.onChange(async value => {
					this.plugin.settings.dailyNoteFormat = value.trim() || 'YYYY-MM-DD';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Calendar start hour')
			.setDesc('First hour shown on the day calendar (0–12).')
			.addSlider(slider => slider
				.setLimits(0, 12, 1)
				.setValue(this.plugin.settings.calendarStartHour)
				.setDynamicTooltip()
				.onChange(async value => {
					this.plugin.settings.calendarStartHour = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Calendar end hour')
			.setDesc('Last hour shown on the day calendar (13–24).')
			.addSlider(slider => slider
				.setLimits(13, 24, 1)
				.setValue(this.plugin.settings.calendarEndHour)
				.setDynamicTooltip()
				.onChange(async value => {
					this.plugin.settings.calendarEndHour = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default area')
			.setDesc('Pre-filled area link in the timer form.')
			.addText(text => text
				.setPlaceholder('e.g. [[2026#Work]]')
				.setValue(this.plugin.settings.defaultArea ?? '')
				.onChange(async value => {
					this.plugin.settings.defaultArea = value.trim() || undefined;
					await this.plugin.saveSettings();
				}));
	}
}
