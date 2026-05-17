import { describe, it, expect } from 'vitest';
import { Duration } from 'luxon';
import { Link } from '@blacksmithgu/datacore';
import type { MarkdownListItem } from '@blacksmithgu/datacore';
import { TimeEntry } from '../../src/core/time-entry';

const pos = { line: 0, start: 0, startValue: 0, end: 0 };

function makeItem(overrides: Partial<MarkdownListItem> & { $text?: string } = {}): MarkdownListItem {
	return {
		$blockId: 'abc123',
		$text: '09:00 - 10:30 (duration:: 1h 30m): DayFlow | | Implement parser (area:: Career) ^abc123',
		$infields: {
			duration: { key: 'duration', raw: '1h 30m', value: Duration.fromObject({ hours: 1, minutes: 30 }), position: pos },
			area:     { key: 'area',     raw: 'Career', value: 'Career', position: pos },
		},
		...overrides,
	} as MarkdownListItem & { $text: string };
}

// ─── success cases ────────────────────────────────────────────────────────────

describe('TimeEntry.fromMarkdownListItem', () => {
	it('parses a minimal valid item (two body segments)', () => {
		const result = TimeEntry.fromMarkdownListItem(makeItem());
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.id).toBe('abc123');
		expect(result.value.start).toBe('09:00');
		expect(result.value.end).toBe('10:30');
		expect(result.value.duration.toObject()).toEqual({ hours: 1, minutes: 30 });
		expect(result.value.task).toBe('DayFlow');
		expect(result.value.subTask).toBeUndefined();
		expect(result.value.description).toBe('Implement parser');
		expect(result.value.area).toBe('Career');
		expect(result.value.project).toBeUndefined();
		expect(result.value.type).toBe('tracked');
	});

	it('parses three body segments into task, subTask, description', () => {
		const result = TimeEntry.fromMarkdownListItem(makeItem({
			$text: '09:00 - 10:30 (duration:: 1h 30m): Deep work | Backend | Implement parser (area:: Career) ^abc123',
		}));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.task).toBe('Deep work');
		expect(result.value.subTask).toBe('Backend');
		expect(result.value.description).toBe('Implement parser');
		expect(result.value.type).toBe('tracked');
	});

	it('parses a planned entry with type:: planned and subTask', () => {
		const item = makeItem({
			$text: '10:00 - 11:00 (duration:: 1h 0m): Plan feature | Backend (area:: Career) (type:: planned) ^abc123',
			$infields: {
				duration: { key: 'duration', raw: '1h 0m', value: Duration.fromObject({ hours: 1 }), position: pos },
				area:     { key: 'area', raw: 'Career', value: 'Career', position: pos },
				type:     { key: 'type', raw: 'planned', value: 'planned', position: pos },
			},
		});
		const result = TimeEntry.fromMarkdownListItem(item);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.type).toBe('planned');
		expect(result.value.task).toBe('Plan feature');
		expect(result.value.subTask).toBe('Backend');
		expect(result.value.description).toBeUndefined();
	});

	it('parses a planned entry with no subTask', () => {
		const item = makeItem({
			$text: '10:00 - 11:00 (duration:: 1h 0m): Plan feature (area:: Career) (type:: planned) ^abc123',
			$infields: {
				duration: { key: 'duration', raw: '1h 0m', value: Duration.fromObject({ hours: 1 }), position: pos },
				area:     { key: 'area', raw: 'Career', value: 'Career', position: pos },
				type:     { key: 'type', raw: 'planned', value: 'planned', position: pos },
			},
		});
		const result = TimeEntry.fromMarkdownListItem(item);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.type).toBe('planned');
		expect(result.value.task).toBe('Plan feature');
		expect(result.value.subTask).toBeUndefined();
		expect(result.value.description).toBeUndefined();
	});

	it('includes project when present and valid', () => {
		const project = Link.file('MyProject');
		const item = makeItem({
			$infields: {
				...makeItem().$infields,
				project: { key: 'project', raw: '[[MyProject]]', value: project, position: pos },
			},
		});
		const result = TimeEntry.fromMarkdownListItem(item);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.project?.markdown()).toBe('[[MyProject]]');
	});

	// ─── failure cases ────────────────────────────────────────────────────────

	it('returns error when $blockId is absent', () => {
		const result = TimeEntry.fromMarkdownListItem(makeItem({ $blockId: undefined }));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('$blockId');
	});

	it('returns error when $text does not match time-range format', () => {
		const result = TimeEntry.fromMarkdownListItem(makeItem({ $text: 'no time here' }));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('time-range format');
	});

	it('returns error when duration infield is missing', () => {
		const { duration: _, ...rest } = makeItem().$infields;
		const result = TimeEntry.fromMarkdownListItem(makeItem({ $infields: rest }));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('duration');
	});

	it('returns error when duration value is not a Duration', () => {
		const item = makeItem({
			$infields: {
				...makeItem().$infields,
				duration: { key: 'duration', raw: '', value: 90, position: pos },
			},
		});
		const result = TimeEntry.fromMarkdownListItem(item);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('duration');
	});

	it('returns error when area infield is missing', () => {
		const { area: _, ...rest } = makeItem().$infields;
		const result = TimeEntry.fromMarkdownListItem(makeItem({ $infields: rest }));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('area');
	});

	it('returns error when area value is not a string', () => {
		const item = makeItem({
			$infields: {
				...makeItem().$infields,
				area: { key: 'area', raw: '', value: 42, position: pos },
			},
		});
		const result = TimeEntry.fromMarkdownListItem(item);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('area');
	});

	it('returns error when $text has no parseable time range (same as missing match)', () => {
		const result = TimeEntry.fromMarkdownListItem(makeItem({ $text: '09:00 - 10:30: only one segment' }));
		expect(result.ok).toBe(false);
	});
});
