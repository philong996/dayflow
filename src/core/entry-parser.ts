import { Duration } from 'luxon';
import { type MarkdownListItem, type Link } from '@blacksmithgu/datacore';
import type { TimeEntry } from './time-entry';

function isLink(val: unknown): val is Link {
	return typeof val === 'object' && val !== null
		&& typeof (val as Record<string, unknown>)['path'] === 'string';
}

export class EntryParser {
	parseAllEntries(blocks: MarkdownListItem[]): TimeEntry[] {
		const entries: TimeEntry[] = [];
		for (const b of blocks) {
			const e = this.parseEntry(b);
			if (e === null) {
				console.warn(`EntryParser: failed to parse entry for block ${b.$blockId ?? '<no-id>'}`, b);
				continue;
			}
			entries.push(e);
		}
		return entries;
	}

	parseEntry(item: MarkdownListItem): TimeEntry | null {
		const id = item.$blockId;
		if (!id) return null;

		const timeMatch = item.$text?.match(/(\d{2}:\d{2}) - (\d{2}:\d{2}) \(duration:: .*?\): (.*?)(?= \()/);
		if (!timeMatch) return null;
		const start = timeMatch[1];
		const end   = timeMatch[2];
		const body  = timeMatch[3];
		if (!start || !end || !body) return null;

		const parts = body.split('|').map(s => s.trim());
		const task  = parts[0];
		if (!task) return null;

		const duration = item.$infields['duration']?.value;
		if (duration === undefined || !Duration.isDuration(duration)) return null;

		const rawArea = item.$infields['area']?.value;
		if (typeof rawArea !== 'string') return null;

		const rawProject = item.$infields['project']?.value;
		const project = isLink(rawProject) ? rawProject : undefined;

		const type = item.$infields['type']?.value === 'planned' ? 'planned' : 'tracked';

		let subTask: string | undefined;
		let description: string | undefined;
		if (type === 'planned') {
			subTask = parts[1] || undefined;
		} else {
			if (parts.length >= 3) {
				subTask     = parts[1] || undefined;
				description = parts[2];
			} else {
				description = parts[1] ?? '';
			}
		}

		return { id, start, end, duration, task, subTask, description, area: rawArea, project, type };
	}
}
