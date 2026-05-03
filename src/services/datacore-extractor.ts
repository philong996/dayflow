import { DatacoreApi, MarkdownListItem } from '@blacksmithgu/datacore';
import type { TimeEntry } from '../domain/time-entry';
import { EntryParser } from '../domain/entry-parser';

export class DatacoreExtractor {
	private readonly parser = new EntryParser();

	constructor(
		private readonly api: DatacoreApi,
		private readonly settings: { dailyNoteFolder: string },
	) {}

	fetchTrackedEntries(startDate: string, endDate: string): TimeEntry[] {
		const query = this.trackedEntriesQuery(startDate, endDate);
		const blocks = this.api.query(query).filter(
			(b): b is MarkdownListItem => b !== null && typeof b === 'object',
		);
		return this.parser.parseAllEntries(blocks);
	}

	private trackedEntriesQuery(startDate: string, endDate: string): string {
		const folder = this.settings.dailyNoteFolder;
		const dateClause = startDate === endDate
			? `$name = "${startDate}"`
			: `($name >= "${startDate}" and $name <= "${endDate}")`;
		const inner = folder
			? `path("${folder}")\n      and ${dateClause}`
			: dateClause;
		return `@list-item\n  and exists(duration)\n  and childof(\n      ${inner}\n  )`;
	}
}
