import { describe, it, expect } from 'vitest';
import { buildSuggestions } from '../../src/core/suggestion';
import type { Task, Activity } from '../../src/core/suggestion';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
	name:        'Default Task',
	status:      'todo',
	projectName: 'My Project',
	projectPath: 'Projects/MyProject.md',
	areaName:    'Work',
	subtasks:    [],
	...overrides,
});

const makeActivity = (overrides: Partial<Activity> = {}): Activity => ({
	name:     'Default Activity',
	areaName: 'Health',
	active:   true,
	...overrides,
});

describe('buildSuggestions', () => {
	it('returns [] when both inputs are empty', () => {
		expect(buildSuggestions([], [])).toEqual([]);
	});

	it('task with no subtasks produces exactly one suggestion', () => {
		const result = buildSuggestions([makeTask({ name: 'Fix bug', subtasks: [] })], []);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'task', name: 'Fix bug' });
		expect(result[0]?.subTask).toBeUndefined();
	});

	it('task with 2 subtasks produces 3 suggestions (base + 2 subtask entries)', () => {
		const task = makeTask({ name: 'Write report', subtasks: ['Outline', 'Draft'] });
		const result = buildSuggestions([task], []);
		expect(result).toHaveLength(3);
		const names = result.map(s => s.name);
		expect(names.every(n => n === 'Write report')).toBe(true);
		const subTasks = result.map(s => s.subTask ?? null);
		expect(subTasks).toContain(null);
		expect(subTasks).toContain('Outline');
		expect(subTasks).toContain('Draft');
	});

	it('subtask suggestions inherit projectName, projectPath, dueDate from parent task', () => {
		const task = makeTask({
			name:        'Deploy',
			projectName: 'Infra',
			projectPath: 'Projects/Infra.md',
			dueDate:     '2026-06-01',
			subtasks:    ['Staging'],
		});
		const result = buildSuggestions([task], []);
		const subtaskSuggestion = result.find(s => s.subTask === 'Staging');
		expect(subtaskSuggestion).toMatchObject({
			projectName: 'Infra',
			projectPath: 'Projects/Infra.md',
			dueDate:     '2026-06-01',
		});
	});

	it('activity produces one suggestion with areaName and no projectName', () => {
		const result = buildSuggestions([], [makeActivity({ name: 'Running', areaName: 'Health' })]);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'activity', name: 'Running', areaName: 'Health' });
		expect(result[0].projectName).toBeUndefined();
	});

	it('result is sorted alphabetically by name (case-insensitive)', () => {
		const tasks = [
			makeTask({ name: 'Zebra task', subtasks: [] }),
			makeTask({ name: 'alpha task', subtasks: [] }),
			makeTask({ name: 'Middle task', subtasks: [] }),
		];
		const result = buildSuggestions(tasks, []);
		const names = result.map(s => s.name);
		expect(names).toEqual(['alpha task', 'Middle task', 'Zebra task']);
	});

	it('tasks and activities are merged in the same sorted list (not grouped by type)', () => {
		const tasks      = [makeTask({ name: 'Zeta', subtasks: [] })];
		const activities = [makeActivity({ name: 'Alpha' })];
		const result = buildSuggestions(tasks, activities);
		expect(result[0].name).toBe('Alpha');
		expect(result[1].name).toBe('Zeta');
		expect(result[0].type).toBe('activity');
		expect(result[1].type).toBe('task');
	});

	it('returns activity suggestions when tasks is empty', () => {
		const result = buildSuggestions([], [makeActivity({ name: 'Yoga' })]);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Yoga');
	});

	it('returns task suggestions when activities is empty', () => {
		const result = buildSuggestions([makeTask({ name: 'Code review', subtasks: [] })], []);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Code review');
	});
});
