import { describe, it, expect } from 'vitest';
import { buildSuggestions } from '../../src/core/suggestion';
import type { Task, SubTask, Description } from '../../src/core/task';

const makeDesc = (overrides: Partial<Description> = {}): Description => ({
	name:   'Default Description',
	status: 'todo',
	...overrides,
});

const makeSubTask = (overrides: Partial<SubTask> = {}): SubTask => ({
	name:         'Default Sub-task',
	status:       'todo',
	descriptions: [],
	...overrides,
});

const makeTask = (overrides: Partial<Task> = {}): Task => ({
	name:       'Default Task',
	status:     'todo',
	type:       'task',
	sourceName: 'My Project',
	sourcePath: 'Projects/MyProject.md',
	areaName:   'Work',
	subtasks:   [],
	...overrides,
});

describe('buildSuggestions', () => {
	it('returns [] when tasks is empty', () => {
		expect(buildSuggestions([])).toEqual([]);
	});

	// ── base suggestions ────────────────────────────────────────────────────────

	it('task with no subtasks produces exactly one suggestion', () => {
		const result = buildSuggestions([makeTask({ name: 'Fix bug', subtasks: [] })]);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'task', name: 'Fix bug' });
		expect(result[0]?.subTask).toBeUndefined();
		expect(result[0]?.description).toBeUndefined();
	});

	it('base suggestion carries sourceName, sourcePath, areaName, dueDate', () => {
		const task = makeTask({
			name:       'Deploy',
			sourceName: 'Infra',
			sourcePath: 'Projects/Infra.md',
			areaName:   'Work',
			dueDate:    '2026-06-01',
		});
		const result = buildSuggestions([task]);
		expect(result[0]).toMatchObject({
			sourceName: 'Infra',
			sourcePath: 'Projects/Infra.md',
			areaName:   'Work',
			dueDate:    '2026-06-01',
		});
	});

	it('type field reflects task.type', () => {
		const result = buildSuggestions([makeTask({ type: 'activity' })]);
		expect(result[0]?.type).toBe('activity');
	});

	// ── subtask expansion ───────────────────────────────────────────────────────

	it('task with 2 subtasks produces 3 suggestions (base + 2 subtask entries)', () => {
		const task = makeTask({
			name:     'Write report',
			subtasks: [
				makeSubTask({ name: 'Outline' }),
				makeSubTask({ name: 'Draft' }),
			],
		});
		const result = buildSuggestions([task]);
		expect(result).toHaveLength(3);
		expect(result.map(s => s.subTask ?? null)).toContain(null);
		expect(result.map(s => s.subTask ?? null)).toContain('Outline');
		expect(result.map(s => s.subTask ?? null)).toContain('Draft');
	});

	it('subtask suggestion inherits sourceName, sourcePath, dueDate from parent task', () => {
		const task = makeTask({
			name:       'Deploy',
			sourceName: 'Infra',
			sourcePath: 'Projects/Infra.md',
			dueDate:    '2026-06-01',
			subtasks:   [makeSubTask({ name: 'Staging' })],
		});
		const result = buildSuggestions([task]);
		const sub = result.find(s => s.subTask === 'Staging');
		expect(sub).toMatchObject({
			sourceName: 'Infra',
			sourcePath: 'Projects/Infra.md',
			dueDate:    '2026-06-01',
		});
	});

	// ── description expansion ───────────────────────────────────────────────────

	it('task with subtask containing one description produces 3 suggestions', () => {
		const task = makeTask({
			name:     'Research',
			subtasks: [makeSubTask({
				name:         'Data pipelines',
				descriptions: [makeDesc({ name: 'Kafka partitions' })],
			})],
		});
		const result = buildSuggestions([task]);
		expect(result).toHaveLength(3);
	});

	it('description-level suggestion has description and subTask fields set', () => {
		const task = makeTask({
			name:     'Research',
			subtasks: [makeSubTask({
				name:         'Data pipelines',
				descriptions: [makeDesc({ name: 'Kafka partitions' })],
			})],
		});
		const result = buildSuggestions([task]);
		const descEntry = result.find(s => s.description !== undefined);
		expect(descEntry).toMatchObject({
			name:        'Research',
			subTask:     'Data pipelines',
			description: 'Kafka partitions',
		});
	});

	it('description suggestion has no description field when none exist', () => {
		const result = buildSuggestions([makeTask({ subtasks: [makeSubTask({ name: 'Sub' })] })]);
		const subEntry = result.find(s => s.subTask === 'Sub');
		expect(subEntry?.description).toBeUndefined();
	});

	it('task with 2 subtasks each having 1 description produces 5 suggestions', () => {
		const task = makeTask({
			subtasks: [
				makeSubTask({ name: 'Sub A', descriptions: [makeDesc({ name: 'Desc A' })] }),
				makeSubTask({ name: 'Sub B', descriptions: [makeDesc({ name: 'Desc B' })] }),
			],
		});
		const result = buildSuggestions([task]);
		expect(result).toHaveLength(5);
	});

	// ── sorting ─────────────────────────────────────────────────────────────────

	it('result is sorted alphabetically by name (case-insensitive)', () => {
		const tasks = [
			makeTask({ name: 'Zebra task', subtasks: [] }),
			makeTask({ name: 'alpha task', subtasks: [] }),
			makeTask({ name: 'Middle task', subtasks: [] }),
		];
		const result = buildSuggestions(tasks);
		expect(result.map(s => s.name)).toEqual(['alpha task', 'Middle task', 'Zebra task']);
	});

	it('entries for the same task sort: base, then subtask, then description', () => {
		const task = makeTask({
			name:     'Alpha',
			subtasks: [makeSubTask({
				name:         'Sub',
				descriptions: [makeDesc({ name: 'Desc' })],
			})],
		});
		const result = buildSuggestions([task]);
		expect(result[0]?.name).toBe('Alpha');
		expect(result[0]?.subTask).toBeUndefined();
		expect(result[0]?.description).toBeUndefined();
		expect(result[1]?.name).toBe('Alpha');
		expect(result[1]?.subTask).toBe('Sub');
		expect(result[1]?.description).toBeUndefined();
		expect(result[2]?.name).toBe('Alpha');
		expect(result[2]?.subTask).toBe('Sub');
		expect(result[2]?.description).toBe('Desc');
	});

	it('multiple tasks are merged in the same sorted list', () => {
		const tasks = [
			makeTask({ name: 'Zeta', subtasks: [] }),
			makeTask({ name: 'Alpha', type: 'activity', subtasks: [] }),
		];
		const result = buildSuggestions(tasks);
		expect(result[0]?.name).toBe('Alpha');
		expect(result[1]?.name).toBe('Zeta');
	});
});
