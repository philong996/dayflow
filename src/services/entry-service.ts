import { DatacoreApi, MarkdownListItem } from '@blacksmithgu/datacore';
import { getDailyNoteSettings } from 'obsidian-daily-notes-interface';
import { DailyNoteWriter } from '../core/daily-note-writer';
import { TimeEntry } from '../core/time-entry';

export class EntryService {
	constructor(
		private readonly api: DatacoreApi,
		private readonly writer: DailyNoteWriter,
	) {}

	fetchEntries(startDate: string, endDate: string, type: 'tracked' | 'planned' | 'all' = 'tracked'): TimeEntry[] {
		const query = this.buildQuery(startDate, endDate, type);
		const blocks = this.api.query(query).filter(
			(b): b is MarkdownListItem => b !== null && typeof b === 'object',
		);
		const entries: TimeEntry[] = [];
		for (const b of blocks) {
			const r = TimeEntry.fromMarkdownListItem(b);
			if (!r.ok) {
				console.warn(`EntryService: failed to parse entry for block ${b.$blockId ?? '<no-id>'}`, r.error);
				continue;
			}
			entries.push(r.value);
		}
		return entries;
	}

	async saveEntry(entry: TimeEntry, date: string): Promise<void> {
		await this.writer.writeEntryForDate(entry, date);
	}

	private buildQuery(startDate: string, endDate: string, type: 'tracked' | 'planned' | 'all'): string {
		const folder = getDailyNoteSettings().folder ?? '';
		const dateClause = startDate === endDate
			? `$name = "${startDate}"`
			: `($name >= "${startDate}" and $name <= "${endDate}")`;
		const inner = folder
			? `path("${folder}")\n      and ${dateClause}`
			: dateClause;
		const typeClause = type === 'tracked'
			? '\n  and !exists(type)'
			: type === 'planned'
				? '\n  and type = "planned"'
				: '';
		return `@list-item\n  and exists(duration)${typeClause}\n  and childof(\n      ${inner}\n  )`;
	}
}
