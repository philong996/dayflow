import { DatacoreApi, MarkdownListItem } from '@blacksmithgu/datacore';
import type { TimeEntry } from '../domain/time-entry';
import { EntryParser } from '../domain/entry-parser';

export class DatacoreExtractor {
	private readonly parser = new EntryParser();

	constructor(
		private readonly api: DatacoreApi,
		private readonly settings: { dailyNoteFolder: string },
	) {}

	fetchEntries(startDate: string, endDate: string, type: 'tracked' | 'planned' | 'all' = 'tracked'): TimeEntry[] {
		const query = this.buildEntriesQuery(startDate, endDate, type);
		const blocks = this.api.query(query).filter(
			(b): b is MarkdownListItem => b !== null && typeof b === 'object',
		);
		return this.parser.parseAllEntries(blocks);
	}

	private buildEntriesQuery(startDate: string, endDate: string, type: 'tracked' | 'planned' | 'all'): string {
		const folder = this.settings.dailyNoteFolder;
		const dateClause = startDate === endDate
			? `$name = "${startDate}"`
			: `($name >= "${startDate}" and $name <= "${endDate}")`;
		const inner = folder
			? `path("${folder}")\n      and ${dateClause}`
			: dateClause;
		const typeClause = type === 'tracked'
			? '\n  and not exists(type)'
			: type === 'planned'
				? '\n  and type = "planned"'
				: '';
		return `@list-item\n  and exists(duration)${typeClause}\n  and childof(\n      ${inner}\n  )`;
	}
}
