import { DatacoreApi, MarkdownPage, MarkdownTaskItem } from '@blacksmithgu/datacore';
import { Project } from '../core/project';
import { Task } from '../core/task';
import { findParentPage } from '../utils/datacore';

export class ProjectService {
	constructor(private readonly api: DatacoreApi) {}

	getProjects(active: boolean): Project[] {
		const query = active
			? `@page and #type/journal/project and active = true`
			: `@page and #type/journal/project`;
		const items = this.api.query(query).filter(
			(b): b is MarkdownPage => b !== null && typeof b === 'object'
		);
		const values: Project[] = [];
		for (const item of items) {
			const r = Project.fromMarkdownPage(item);
			if (!r.ok) { console.warn('ProjectService:', r.error); continue; }
			values.push(r.value);
		}
		return values.sort((a, b) => a.name.localeCompare(b.name));
	}

	getTasks(): Task[] {
		const items = this.api.query(
			`@list-item and #task and childof(@page and #type/journal/project and active = true)`
		).filter(
			(b): b is MarkdownTaskItem => b !== null && typeof b === 'object'
		);
		const values: Task[] = [];
		for (const item of items) {
			const parent = findParentPage(item as unknown as Record<string, unknown>);
			if (!parent) { console.warn('ProjectService: task item has no parent page'); continue; }
			const pr = Project.fromMarkdownPage(parent);
			if (!pr.ok) { console.warn('ProjectService:', pr.error); continue; }
			const tr = Task.fromMarkdownTaskItem(item, pr.value);
			if (!tr.ok) { console.warn('ProjectService:', tr.error); continue; }
			values.push(tr.value);
		}
		return values;
	}
}
