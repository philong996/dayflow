import { DatacoreApi, MarkdownPage } from '@blacksmithgu/datacore';
import { Project } from '../core/project';

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
}
