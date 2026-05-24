import type { Task } from './task';

export type { Task } from './task';

export interface Suggestion {
	name:         string;
	type:         string;
	subTask?:     string;
	description?: string;
	sourceName?:  string;
	sourcePath?:  string;
	areaName?:    string;
	dueDate?:     string;
}

export function buildSuggestions(tasks: Task[]): Suggestion[] {
	const result: Suggestion[] = [];

	for (const task of tasks) {
		const base = {
			type:       task.type,
			name:       task.name,
			sourceName: task.sourceName,
			sourcePath: task.sourcePath,
			areaName:   task.areaName,
			dueDate:    task.dueDate,
		};

		result.push(base);

		for (const subtask of task.subtasks) {
			result.push({ ...base, subTask: subtask.name });

			for (const desc of subtask.descriptions) {
				result.push({ ...base, subTask: subtask.name, description: desc.name });
			}
		}
	}

	return result.sort((a, b) => {
		const nameCmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
		if (nameCmp !== 0) return nameCmp;
		const subCmp = (a.subTask ?? '').localeCompare(b.subTask ?? '');
		if (subCmp !== 0) return subCmp;
		return (a.description ?? '').localeCompare(b.description ?? '');
	});
}
