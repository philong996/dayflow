import { DatacoreApi, MarkdownTaskItem } from '@blacksmithgu/datacore';
import { Task } from '../core/task';
import { findParentPage } from '../utils/datacore';

export class TaskService {
	constructor(private readonly api: DatacoreApi) {}

	getTasks(statuses?: string[]): Task[] {
		let query = '@list-item and #task';
		if (statuses && statuses.length > 0) {
			const clause = statuses.map(s => `$status = "${s}"`).join(' or ');
			query += ` and (${clause})`;
		}
		console.info('TaskService: query', query);
		const items = this.api.query(query).filter(
			(b): b is MarkdownTaskItem =>
				b !== null && typeof b === 'object' && typeof (b as any)['$status'] === 'string',
		);

		const values: Task[] = [];
		for (const item of items) {
			const page = findParentPage(item as unknown as Record<string, unknown>);
			if (!page) { console.warn('TaskService: task item has no parent page'); continue; }
			const result = Task.fromMarkdownTaskItem(item, page);
			if (!result.ok) { console.warn('TaskService:', result.error); continue; }
			values.push(result.value);
		}
		return values;
	}
}
