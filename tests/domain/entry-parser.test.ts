import { describe, it, expect } from 'vitest';
import { Duration } from 'luxon';
import { Link } from '@blacksmithgu/datacore';
import type { MarkdownListItem } from '@blacksmithgu/datacore';
import { EntryParser } from '../../src/domain/entry-parser';

const parser = new EntryParser();

const pos = { line: 0, start: 0, startValue: 0, end: 0 };

function makeItem(overrides: Partial<MarkdownListItem> & { $text?: string } = {}): MarkdownListItem {
	const area = Link.header('2026', 'Career');
	return {
		$blockId: 'abc123',
		$text: '09:00 - 10:30 (duration:: 1h 30m): DayFlow | | Implement parser (area:: [[2026#Career]]) ^abc123',
		$infields: {
			duration: { key: 'duration', raw: '1h 30m', value: Duration.fromObject({ hours: 1, minutes: 30 }), position: pos },
			area:     { key: 'area',     raw: '[[2026#Career]]', value: area, position: pos },
		},
		...overrides,
	} as MarkdownListItem & { $text: string };
}

// ─── parseEntry ───────────────────────────────────────────────────────────────

describe('EntryParser.parseEntry', () => {
	it('parses a minimal valid item (two body segments)', () => {
		const entry = parser.parseEntry(makeItem());
		expect(entry).not.toBeNull();
		expect(entry!.id).toBe('abc123');
		expect(entry!.start).toBe('09:00');
		expect(entry!.end).toBe('10:30');
		expect(entry!.duration.toObject()).toEqual({ hours: 1, minutes: 30 });
		expect(entry!.task).toBe('DayFlow');
		expect(entry!.subTask).toBe('');
		expect(entry!.description).toBe('Implement parser');
		expect(entry!.area.markdown()).toBe('[[2026#Career]]');
		expect(entry!.project).toBeUndefined();
	});

	it('parses three body segments into task, subTask, description', () => {
		const entry = parser.parseEntry(makeItem({
			$text: '09:00 - 10:30 (duration:: 1h 30m): Deep work | Backend | Implement parser (area:: [[2026#Career]]) ^abc123',
		}));
		expect(entry!.task).toBe('Deep work');
		expect(entry!.subTask).toBe('Backend');
		expect(entry!.description).toBe('Implement parser');
	});

	it('includes project when present and valid', () => {
		const project = Link.file('MyProject');
		const item = makeItem({
			$infields: {
				...makeItem().$infields,
				project: { key: 'project', raw: '[[MyProject]]', value: project, position: pos },
			},
		});
		const entry = parser.parseEntry(item);
		expect(entry!.project?.markdown()).toBe('[[MyProject]]');
	});

	it('returns null when $blockId is absent', () => {
		expect(parser.parseEntry(makeItem({ $blockId: undefined }))).toBeNull();
	});

	it('returns null when $text does not start with a time range', () => {
		expect(parser.parseEntry(makeItem({ $text: 'no time here' }))).toBeNull();
	});

	it('returns null when duration infield is missing', () => {
		const { duration: _, ...rest } = makeItem().$infields;
		expect(parser.parseEntry(makeItem({ $infields: rest }))).toBeNull();
	});

	it('returns null when duration value is not a Duration', () => {
		const item = makeItem({
			$infields: {
				...makeItem().$infields,
				duration: { key: 'duration', raw: '', value: 90, position: pos },
			},
		});
		expect(parser.parseEntry(item)).toBeNull();
	});

	it('returns null when area infield is missing', () => {
		const { area: _, ...rest } = makeItem().$infields;
		expect(parser.parseEntry(makeItem({ $infields: rest }))).toBeNull();
	});

	it('returns null when area value is not a Link', () => {
		const item = makeItem({
			$infields: {
				...makeItem().$infields,
				area: { key: 'area', raw: 'not-a-link', value: 'not-a-link', position: pos },
			},
		});
		expect(parser.parseEntry(item)).toBeNull();
	});

	it('returns null when body has fewer than two segments', () => {
		expect(parser.parseEntry(makeItem({ $text: '09:00 - 10:30: only one segment' }))).toBeNull();
	});
});

// ─── parseAllEntries ──────────────────────────────────────────────────────────

describe('EntryParser.parseAllEntries', () => {
	it('maps valid items and drops nulls', () => {
		const items = [makeItem(), makeItem({ $blockId: undefined }), makeItem({ $blockId: 'xyz' })];
		const entries = parser.parseAllEntries(items);
		expect(entries).toHaveLength(2);
		expect(entries.map(e => e.id)).toEqual(['abc123', 'xyz']);
	});

	it('returns empty array for empty input', () => {
		expect(parser.parseAllEntries([])).toEqual([]);
	});
});
