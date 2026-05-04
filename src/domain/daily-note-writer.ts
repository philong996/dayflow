import { App, TFile } from 'obsidian';
import { TimeEntry } from './time-entry';

const LOGS_HEADING = '# Logs';

export class DailyNoteWriter {
	constructor(private readonly app: App) {}

	async writeEntry(file: TFile, entry: TimeEntry): Promise<void> {
		const content = await this.app.vault.read(file);
		const updated = upsertEntry(content, entry);
		await this.app.vault.modify(file, updated);
	}
}

export function serializeEntry(entry: TimeEntry): string {
	let body: string;
	if (entry.type === 'planned') {
		body = entry.subTask ? `${entry.task} | ${entry.subTask}` : entry.task;
	} else {
		body = entry.subTask
			? `${entry.task} | ${entry.subTask} | ${entry.description ?? ''}`
			: `${entry.task} | ${entry.description ?? ''}`;
	}

	const area      = `(area:: ${entry.area.markdown()})`;
	const project   = entry.project ? ` (project:: ${entry.project.markdown()})` : '';
	const typeField = entry.type === 'planned' ? ' (type:: planned)' : '';

	const { hours = 0, minutes = 0 } = entry.duration.shiftTo('hours', 'minutes').toObject();
	const duration = `${hours}h ${minutes}m`;

	return `- ${entry.start} - ${entry.end} (duration:: ${duration}): ${body} ${area}${project}${typeField} ^${entry.id}`;
}

export function upsertEntry(content: string, entry: TimeEntry): string {
	const line = serializeEntry(entry);

	const existingPattern = new RegExp(`^- .+\\^${entry.id}$`, 'm');
	if (existingPattern.test(content)) {
		return content.replace(existingPattern, line);
	}

	const logsMatch = /^# Logs$/m.exec(content);
	if (logsMatch === null) {
		return `${content.trimEnd()}\n\n${LOGS_HEADING}\n\n${line}\n`;
	}

	const insertAt = logsMatch.index + logsMatch[0].length;
	const before = content.slice(0, insertAt);
	const after = content.slice(insertAt).replace(/^\n+/, '');
	return after.length > 0
		? `${before}\n\n${line}\n\n${after}`
		: `${before}\n\n${line}\n`;
}
