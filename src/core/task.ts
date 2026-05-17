import { type MarkdownTaskItem } from '@blacksmithgu/datacore';
import type { ParseResult } from './parse-result';
import type { Project } from './project';

export interface Task {
	name:        string;
	status:      'todo' | 'in-progress';
	projectName: string;
	projectPath: string;
	areaName:    string;
	subtasks:    string[];
	dueDate?:    string;
}

export namespace Task {
	export function fromMarkdownTaskItem(
		item: MarkdownTaskItem,
		project: Project,
	): ParseResult<Task> {
		const status = item['$status'] as string | undefined;
		if (status !== '-' && status !== ' ')
			return { ok: false, error: `Task: unsupported status '${status ?? 'undefined'}'` };

		const rawText = (item['$text'] as string | undefined) ?? '';
		const name = rawText
			.replace(/#task\S*/g, '')
			.replace(/\(due:[^)]*\)/g, '')
			.replace(/\[[^\]]*::[^\]]*\]/g, '')
			.trim();
		if (!name)
			return { ok: false, error: 'Task: name is empty after stripping tags' };

		const rawDue = item.$infields['due']?.value;
		const dueDate =
			typeof rawDue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDue) ? rawDue : undefined;

		const elements = (item['$elements'] as MarkdownTaskItem[] | undefined) ?? [];
		const subtasks = elements
			.filter(e => (e?.['$status'] as string | undefined) === ' ')
			.map(el => ((el as MarkdownTaskItem)['$cleantext'] as string | undefined)?.trim() ?? '');

		const mappedStatus: 'todo' | 'in-progress' = status === '-' ? 'in-progress' : 'todo';

		return {
			ok:    true,
			value: {
				name,
				status:      mappedStatus,
				projectName: project.name,
				projectPath: project.path,
				areaName:    project.area,
				subtasks,
				dueDate,
			},
		};
	}
}
