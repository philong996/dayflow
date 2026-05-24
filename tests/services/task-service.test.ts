import { describe, it, expect, vi } from 'vitest';
import { TaskService } from '../../src/services/task-service';
import type { MarkdownPage } from '@blacksmithgu/datacore';

function makePage(name: string, path: string): MarkdownPage {
	return { $name: name, $path: path, $frontmatter: {} } as unknown as MarkdownPage;
}

function makeTaskItem(text: string, status: string, page?: MarkdownPage) {
	return {
		$text:     text,
		$status:   status,
		$infields: {},
		$elements: [],
		...(page ? { $parent: page } : {}),
	};
}

function makeApi(items: unknown[] = []) {
	return { query: vi.fn().mockReturnValue(items) };
}

describe('TaskService.getTasks', () => {
	// ── query string ────────────────────────────────────────────────────────────

	it('queries DataCore with a string containing #task', () => {
		const api = makeApi([]);
		new TaskService(api as any).getTasks();
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('#task'));
	});

	it('does NOT include childof in the query', () => {
		const api = makeApi([]);
		new TaskService(api as any).getTasks();
		expect(api.query).not.toHaveBeenCalledWith(expect.stringContaining('childof'));
	});

	// ── status filter ───────────────────────────────────────────────────────────

	it('getTasks() with no arguments does NOT include a $status clause', () => {
		const api = makeApi([]);
		new TaskService(api as any).getTasks();
		expect(api.query).not.toHaveBeenCalledWith(expect.stringContaining('$status'));
	});

	it('getTasks([]) (empty array) does NOT include a $status clause', () => {
		const api = makeApi([]);
		new TaskService(api as any).getTasks([]);
		expect(api.query).not.toHaveBeenCalledWith(expect.stringContaining('$status'));
	});

	it('getTasks([" "]) appends a $status clause for todo', () => {
		const api = makeApi([]);
		new TaskService(api as any).getTasks([' ']);
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('$status = " "'));
	});

	it('getTasks([" ", "-"]) appends an OR-joined $status clause', () => {
		const api = makeApi([]);
		new TaskService(api as any).getTasks([' ', '-']);
		const q: string = api.query.mock.calls[0][0];
		expect(q).toContain('$status = " "');
		expect(q).toContain('$status = "-"');
		expect(q).toContain(' or ');
		expect(q).toContain('(');
	});

	// ── result handling ─────────────────────────────────────────────────────────

	it('returns [] when DataCore returns empty', () => {
		const api = makeApi([]);
		expect(new TaskService(api as any).getTasks()).toEqual([]);
	});

	it('skips items with no parent page and emits console.warn', () => {
		const api = makeApi([makeTaskItem('Task without parent #task', ' ')]);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = new TaskService(api as any).getTasks();
		expect(result).toHaveLength(0);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('no parent page'));
		warn.mockRestore();
	});

	it('returns a parsed Task[] from items with a valid parent page', () => {
		const page = makePage('MyProject', 'Projects/MyProject.md');
		const api  = makeApi([makeTaskItem('Do the thing #task', ' ', page)]);
		const result = new TaskService(api as any).getTasks();
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			name:       'Do the thing',
			type:       'task',
			sourceName: 'MyProject',
			sourcePath: 'Projects/MyProject.md',
		});
	});

	it('parsed task reflects type from sub-tag', () => {
		const page = makePage('2026', 'Yearly/2026.md');
		const api  = makeApi([makeTaskItem('Practice meditation #task/activity', ' ', page)]);
		const result = new TaskService(api as any).getTasks();
		expect(result[0]?.type).toBe('activity');
	});
});
