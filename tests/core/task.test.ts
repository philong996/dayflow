import { describe, it, expect } from 'vitest';
import { Task } from '../../src/core/task';
import type { MarkdownTaskItem, MarkdownPage } from '@blacksmithgu/datacore';

function makePage(
	name: string,
	path: string,
	opts: { areaRaw?: string } = {},
): MarkdownPage {
	const fm: Record<string, unknown> = {};
	if (opts.areaRaw !== undefined) {
		fm['area'] = { key: 'area', raw: opts.areaRaw, value: opts.areaRaw, position: {} };
	}
	return { $name: name, $path: path, $frontmatter: fm } as unknown as MarkdownPage;
}

function makeTaskItem(
	text: string,
	status: string,
	opts: {
		infields?: Record<string, { key: string; raw: string; value: unknown; position: unknown }>;
		elements?: Array<{
			$status?: string;
			$cleantext: string;
			$elements?: Array<{ $status?: string; $cleantext: string }>;
		}>;
	} = {},
): MarkdownTaskItem {
	return {
		$text:     text,
		$status:   status,
		$infields: opts.infields ?? {},
		$elements: opts.elements ?? [],
	} as unknown as MarkdownTaskItem;
}

const PAGE = makePage('MyProject', 'Projects/MyProject.md', { areaRaw: '[[Work]]' });

describe('Task.fromMarkdownTaskItem', () => {
	// ── status mapping ──────────────────────────────────────────────────────────

	it('maps $status " " to "todo"', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Fix login #task', ' '), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.status).toBe('todo');
	});

	it('maps $status "-" to "in-progress"', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Review PR #task', '-'), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.status).toBe('in-progress');
	});

	it('maps $status "x" to "done"', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Deploy #task', 'x'), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.status).toBe('done');
	});

	it('maps $status "C" to "cancelled"', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Cancelled #task', 'C'), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.status).toBe('cancelled');
	});

	// ── type from sub-tag ───────────────────────────────────────────────────────

	it('type is "activity" for #task/activity', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Practice meditation #task/activity', ' '), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.type).toBe('activity');
	});

	it('type is "task" for plain #task with no sub-tag', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Fix login #task', ' '), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.type).toBe('task');
	});

	it('type uses the sub-tag string for arbitrary sub-tags', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Write docs #task/research', ' '), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.type).toBe('research');
	});

	// ── name stripping ──────────────────────────────────────────────────────────

	it('strips #task tag from name', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Write tests #task', ' '), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.name).toBe('Write tests');
	});

	it('strips #task/activity sub-tag from name', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Practice meditation #task/activity', ' '), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.name).toBe('Practice meditation');
	});

	it('strips (due:…) and inline fields from name', () => {
		const r = Task.fromMarkdownTaskItem(
			makeTaskItem('Deploy #task (due:: 2026-07-01) [area:: Work]', ' '),
			PAGE,
		);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.name).toBe('Deploy');
	});

	it('returns ok:false when name is empty after stripping', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('#task', ' '), PAGE);
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.error).toContain('name is empty');
	});

	// ── source fields ───────────────────────────────────────────────────────────

	it('sourceName and sourcePath come from the passed page', () => {
		const page = makePage('SpecialNote', 'Notes/SpecialNote.md');
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Do thing #task', ' '), page);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.sourceName).toBe('SpecialNote');
		expect(r.value.sourcePath).toBe('Notes/SpecialNote.md');
	});

	// ── areaName resolution ─────────────────────────────────────────────────────

	it('areaName comes from task inline field (plain string) when present', () => {
		const item = makeTaskItem('Do thing #task', ' ', {
			infields: { area: { key: 'area', raw: 'Career', value: 'Career', position: {} } },
		});
		const page = makePage('2026', 'Yearly/2026.md');
		const r = Task.fromMarkdownTaskItem(item, page);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.areaName).toBe('Career');
	});

	it('areaName comes from task inline field (Link object) when present', () => {
		const item = makeTaskItem('Do thing #task', ' ', {
			infields: { area: { key: 'area', raw: '[[Work]]', value: { path: 'Work' }, position: {} } },
		});
		const page = makePage('2026', 'Yearly/2026.md');
		const r = Task.fromMarkdownTaskItem(item, page);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.areaName).toBe('Work');
	});

	it('areaName falls back to page frontmatter when inline field is absent', () => {
		const item = makeTaskItem('Do thing #task', ' ');
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.areaName).toBe('Work');
	});

	it('areaName is undefined when neither inline field nor page frontmatter provides it', () => {
		const item = makeTaskItem('Do thing #task', ' ');
		const page = makePage('2026', 'Yearly/2026.md');
		const r = Task.fromMarkdownTaskItem(item, page);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.areaName).toBeUndefined();
	});

	it('inline field areaName takes priority over page frontmatter', () => {
		const item = makeTaskItem('Do thing #task', ' ', {
			infields: { area: { key: 'area', raw: 'Personal', value: 'Personal', position: {} } },
		});
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.areaName).toBe('Personal');
	});

	// ── dueDate ─────────────────────────────────────────────────────────────────

	it('extracts dueDate from $infields["due"] when valid YYYY-MM-DD', () => {
		const item = makeTaskItem('Deploy #task', ' ', {
			infields: { due: { key: 'due', raw: '2026-07-01', value: '2026-07-01', position: {} } },
		});
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.dueDate).toBe('2026-07-01');
	});

	it('dueDate is undefined when due field is absent', () => {
		const r = Task.fromMarkdownTaskItem(makeTaskItem('Deploy #task', ' '), PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.dueDate).toBeUndefined();
	});

	// ── subtasks (layer 2) ──────────────────────────────────────────────────────

	it('subtasks is [] when $elements is absent', () => {
		const item = { $text: 'Big task #task', $status: ' ', $infields: {}, $elements: undefined } as unknown as MarkdownTaskItem;
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.subtasks).toEqual([]);
	});

	it('builds SubTask[] from $elements with name and status', () => {
		const item = makeTaskItem('Big task #task', ' ', {
			elements: [
				{ $status: ' ',  $cleantext: 'Step one' },
				{ $status: 'x',  $cleantext: 'Step two' },
				{ $status: '-',  $cleantext: 'Step three' },
			],
		});
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.subtasks).toHaveLength(3);
		expect(r.value.subtasks[0]).toMatchObject({ name: 'Step one',   status: 'todo' });
		expect(r.value.subtasks[1]).toMatchObject({ name: 'Step two',   status: 'done' });
		expect(r.value.subtasks[2]).toMatchObject({ name: 'Step three', status: 'in-progress' });
	});

	it('includes subtasks of all statuses, not only open ones', () => {
		const item = makeTaskItem('Task #task', ' ', {
			elements: [
				{ $status: 'x', $cleantext: 'Done sub' },
				{ $status: 'C', $cleantext: 'Cancelled sub' },
			],
		});
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.subtasks).toHaveLength(2);
	});

	it('skips subtasks with empty names', () => {
		const item = makeTaskItem('Task #task', ' ', {
			elements: [
				{ $status: ' ', $cleantext: '' },
				{ $status: ' ', $cleantext: 'Valid sub' },
			],
		});
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.subtasks).toHaveLength(1);
		expect(r.value.subtasks[0]!.name).toBe('Valid sub');
	});

	// ── descriptions (layer 3) ──────────────────────────────────────────────────

	it('builds Description[] from nested $elements of a subtask', () => {
		const item = makeTaskItem('Task #task', ' ', {
			elements: [
				{
					$status: ' ', $cleantext: 'Sub one',
					$elements: [
						{ $status: 'x', $cleantext: 'Done entry' },
						{ $status: ' ', $cleantext: 'Todo entry' },
					],
				},
			],
		});
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		const sub = r.value.subtasks[0]!;
		expect(sub.descriptions).toHaveLength(2);
		expect(sub.descriptions[0]).toMatchObject({ name: 'Done entry', status: 'done' });
		expect(sub.descriptions[1]).toMatchObject({ name: 'Todo entry', status: 'todo' });
	});

	it('descriptions is [] when subtask has no nested $elements', () => {
		const item = makeTaskItem('Task #task', ' ', {
			elements: [{ $status: ' ', $cleantext: 'Sub one' }],
		});
		const r = Task.fromMarkdownTaskItem(item, PAGE);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.subtasks[0]!.descriptions).toEqual([]);
	});
});
