import { App, PluginSettingTab, Setting } from 'obsidian';
import DayFlowPlugin from './main';

export interface DayFlowSettings {
	dailyNoteFolder:   string;
	dailyNoteFormat:   string;
	calendarStartHour: number;
	calendarEndHour:   number;
	defaultArea?:      string;
	areaColors:        Record<string, string>;
}

export const DEFAULT_SETTINGS: DayFlowSettings = {
	dailyNoteFolder:   '',
	dailyNoteFormat:   'YYYY-MM-DD',
	calendarStartHour: 0,
	calendarEndHour:   23,
	areaColors: {
		Work:     '#3b82f6',
		Personal: '#8b5cf6',
		Learning: '#22c55e',
		Health:   '#f97316',
		Finance:  '#eab308',
	},
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

		containerEl.createEl('h3', { text: 'Area colors' });
		containerEl.createEl('p', { text: 'One color per area name. The name must match the heading/subpath used in your daily notes.', cls: 'setting-item-description' });

		const renderAreaColors = () => {
			areaColorContainer.empty();
			for (const [name, color] of Object.entries(this.plugin.settings.areaColors)) {
				new Setting(areaColorContainer)
					.setName(name)
					.addColorPicker(cp => cp
						.setValue(color)
						.onChange(async val => {
							this.plugin.settings.areaColors[name] = val;
							await this.plugin.saveSettings();
						}))
					.addExtraButton(btn => btn
						.setIcon('trash')
						.setTooltip('Remove')
						.onClick(async () => {
							delete this.plugin.settings.areaColors[name];
							await this.plugin.saveSettings();
							renderAreaColors();
						}));
			}

			let newName = '';
			new Setting(areaColorContainer)
				.setName('Add area')
				.addText(text => text
					.setPlaceholder('Area name')
					.onChange(val => { newName = val.trim(); }))
				.addColorPicker(cp => cp
					.setValue('#94a3b8')
					.onChange(async val => {
						if (!newName) return;
						this.plugin.settings.areaColors[newName] = val;
						await this.plugin.saveSettings();
						renderAreaColors();
					}));
		};

		const areaColorContainer = containerEl.createDiv();
		renderAreaColors();
	}
}
