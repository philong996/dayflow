import type { Task } from './task';
import type { Activity } from './activity';

export type { Task } from './task';
export type { Activity } from './activity';

export interface Suggestion {
	name:         string;
	type:         'task' | 'activity';
	subTask?:     string;
	projectName?: string;
	projectPath?: string;
	dueDate?:     string;
	areaName?:    string;
}

export function buildSuggestions(tasks: Task[], activities: Activity[]): Suggestion[] {
	const result: Suggestion[] = [];

	for (const task of tasks) {
		result.push({
			type:        'task',
			name:        task.name,
			projectName: task.projectName,
			projectPath: task.projectPath,
			areaName:    task.areaName,
			dueDate:     task.dueDate,
		});
		for (const subtaskText of task.subtasks) {
			result.push({
				type:        'task',
				name:        task.name,
				subTask:     subtaskText,
				projectName: task.projectName,
				projectPath: task.projectPath,
				areaName:    task.areaName,
				dueDate:     task.dueDate,
			});
		}
	}

	for (const activity of activities) {
		result.push({
			type:     'activity',
			name:     activity.name,
			areaName: activity.areaName,
		});
	}

	return result.sort((a, b) => {
		const nameCmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
		if (nameCmp !== 0) return nameCmp;
		return (a.subTask ?? '').localeCompare(b.subTask ?? '');
	});
}
