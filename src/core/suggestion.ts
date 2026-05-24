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

const active = (status: string) => status === 'todo' || status === 'in-progress';

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

		if (active(task.status)) result.push(base);

		for (const subtask of task.subtasks) {
			if (active(subtask.status)) result.push({ ...base, subTask: subtask.name });

			for (const desc of subtask.descriptions) {
				if (active(desc.status)) result.push({ ...base, subTask: subtask.name, description: desc.name });
			}
		}
	}

	return result;
}
