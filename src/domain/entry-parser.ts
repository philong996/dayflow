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
		const start = timeMatch?.[1] ?? null;
		const end   = timeMatch?.[2] ?? null;
		if (!start || !end) return null;

		if (!timeMatch || timeMatch[3] === undefined) return null;
		const parts = timeMatch[3].split('|').map(s => s.trim());
		const task  = parts[0] ?? null;
		if (!task) return null;
		const subTask     = parts[1] ?? '';
		const description = parts[2] ?? '';

		const duration = item.$infields['duration']?.value;
		if (duration === undefined || !Duration.isDuration(duration)) return null;

		const rawArea = item.$infields['area']?.value;
		if (!isLink(rawArea)) return null;

		const rawProject = item.$infields['project']?.value;
		const project = isLink(rawProject) ? rawProject : undefined;

		return { id, start, end, duration, task, subTask, description, area: rawArea, project };
	}
}
