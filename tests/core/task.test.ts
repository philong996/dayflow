import { describe, it, expect } from 'vitest';
import { Task } from '../../src/core/task';
import type { MarkdownTaskItem } from '@blacksmithgu/datacore';
import type { Project } from '../../src/core/project';

const PROJECT: Project = {
	name: 'MyProject',
	path: 'Projects/MyProject.md',
	area: 'Work',
	year: [2026],
};

function makeTaskItem(
	text: string,
	status: string,
	opts: {
		infields?: Record<string, { key: string; raw: string; value: unknown; position: unknown }>;
		elements?: Array<{ $status?: string; $cleantext: string }>;
	} = {},
): MarkdownTaskItem {
	return {
		$text:     text,
		$status:   status,
		$infields: opts.infields ?? {},
		$elements: opts.elements ?? [],
	} as unknown as MarkdownTaskItem;
}

describe('Task.fromMarkdownTaskItem', () => {
	it('returns ok:true with status "todo" for $status === " "', () => {
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Fix login #task', ' '), PROJECT);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.status).toBe('todo');
		expect(result.value.name).toBe('Fix login');
	});

	it('returns ok:true with status "in-progress" for $status === "-"', () => {
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Review PR #task', '-'), PROJECT);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.status).toBe('in-progress');
	});

	it('strips the #task tag from the name', () => {
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Write tests #task', ' '), PROJECT);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Write tests');
	});

	it('strips (due:…) and inline fields from the name', () => {
		const result = Task.fromMarkdownTaskItem(
			makeTaskItem('Deploy #task (due:: 2026-07-01) [area:: Work]', ' '),
			PROJECT,
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Deploy');
	});

	it('fills projectName, projectPath, areaName from the passed project', () => {
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Work item #task', ' '), PROJECT);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.projectName).toBe('MyProject');
		expect(result.value.projectPath).toBe('Projects/MyProject.md');
		expect(result.value.areaName).toBe('Work');
	});

	it('extracts dueDate from $infields["due"] when it is a valid YYYY-MM-DD string', () => {
		const infields = { due: { key: 'due', raw: '2026-07-01', value: '2026-07-01', position: {} } };
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Deploy #task', ' ', { infields }), PROJECT);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.dueDate).toBe('2026-07-01');
	});

	it('sets dueDate to undefined when due field is absent', () => {
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Deploy #task', ' '), PROJECT);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.dueDate).toBeUndefined();
	});

	it('collects open subtasks from $elements with $status === " "', () => {
		const elements = [
			{ $status: ' ', $cleantext: 'Step one' },
			{ $status: ' ', $cleantext: 'Step two' },
		];
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Big task #task', ' ', { elements }), PROJECT);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.subtasks).toEqual(['Step one', 'Step two']);
	});

	it('returns ok:true with empty subtasks when $elements is absent', () => {
		const item = { $text: 'No elements #task', $status: ' ', $infields: {}, $elements: undefined } as unknown as MarkdownTaskItem;
		const result = Task.fromMarkdownTaskItem(item, PROJECT);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.subtasks).toEqual([]);
	});

	it('returns ok:false for unsupported status "x"', () => {
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Done task #task', 'x'), PROJECT);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('unsupported status');
	});

	it('returns ok:false for unsupported status "C"', () => {
		const result = Task.fromMarkdownTaskItem(makeTaskItem('Cancelled #task', 'C'), PROJECT);
		expect(result.ok).toBe(false);
	});

	it('returns ok:false when $status is undefined', () => {
		const item = { $text: 'Task #task', $infields: {}, $elements: [] } as unknown as MarkdownTaskItem;
		const result = Task.fromMarkdownTaskItem(item, PROJECT);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('unsupported status');
	});

	it('returns ok:false when name is empty after stripping', () => {
		const result = Task.fromMarkdownTaskItem(makeTaskItem('#task', ' '), PROJECT);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('name is empty');
	});
});
