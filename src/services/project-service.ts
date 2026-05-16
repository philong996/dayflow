import { DatacoreApi, MarkdownPage, MarkdownTaskItem } from '@blacksmithgu/datacore';
import type { Project } from '../core/project';
import type { Task } from '../core/suggestion';
import { findParentPage } from 'utils/datacore';

export class ProjectService {
	constructor(private readonly api: DatacoreApi) {}

	getProjects(active: boolean): Project[] {
		const query = active
			? `@page and #type/journal/project and active = true`
			: `@page and #type/journal/project`;
		const items = this.api.query(query).filter(
			(b): b is MarkdownPage => b !== null && typeof b === 'object'
		);
		return this.parseProjects(items);
	}

	parseProjects(items: MarkdownPage[]): Project[] {
		return items
			.flatMap(item => {
				const name = item.$name.trim();
				const path = item.$path.trim();
				if (!name || !path) return [];

				const fm = item.$frontmatter;

				const rawArea = (fm?.['area']?.raw ?? '');
				const area = String(rawArea).replace(/^\[\[|\]\]$/g, '').trim();

				const rawYears = fm?.['years']?.raw;
				const year: number[] = Array.isArray(rawYears)
					? rawYears
						.map((y: unknown) => parseInt(String(y).replace(/^\[\[|\]\]$/g, '').trim(), 10))
						.filter((n: number) => !isNaN(n))
					: [];

				return [{ name, year, area, path }];
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	getTasks(): Task[] {
		const items = this.api.query(
			`@list-item and #task and childof(@page and #type/journal/project and active = true)`
		).filter(
			(b): b is MarkdownTaskItem => b !== null && typeof b === 'object'
		);
		return this.parseTasks(items);
	}

	parseTasks(items: MarkdownTaskItem[]): Task[] {
		const result: Task[] = [];

		for (const item of items) {
			const status = item['$status'] as string | undefined;
			if ((status !== '-') && (status !== ' ')) continue;

			const rawText = (item['$text'] as string | undefined) ?? '';
			const name = rawText
				.replace(/#task\S*/g, '')
				.replace(/\(due:[^)]*\)/g, '')
				.replace(/\[[^\]]*::[^\]]*\]/g, '')
				.trim();
			if (!name) continue;

			const parent = findParentPage(item as unknown as Record<string, unknown>);
			if (!parent) continue;
			const projects = this.parseProjects([parent]);
			const project = projects[0];
			if (!project || !project.name) continue;

			const rawDue = item.$infields['due']?.value;
			const dueDate = typeof rawDue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDue)
				? rawDue
				: undefined;

			const elements = (item['$elements'] as MarkdownTaskItem[] | undefined) ?? [];
			const subtasks = elements
				.filter(e => (e?.['$status'] as string | undefined) === ' ')
				.map(el => ((el as MarkdownTaskItem)['$cleantext'] as string | undefined)?.trim() ?? '');
			if (subtasks.length === 0) continue;

			result.push({
				name,
				status:      status === '-' ? 'in-progress' : 'todo',
				projectName: project.name,
				projectPath: project.path,
				areaName:    project.area,
				subtasks,
				dueDate,
			});
		}

		return result;
	}
}
