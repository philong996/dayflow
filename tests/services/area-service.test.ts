import { describe, it, expect, vi } from 'vitest';
import { AreaService } from '../../src/services/area-service';
import type { MarkdownListItem } from '@blacksmithgu/datacore';

function makeItem(cleantext: string, tags: string[], colorRaw?: string): MarkdownListItem {
	return {
		$tags:     tags,
		$cleantext: cleantext,
		$text:     cleantext,
		$infields: colorRaw
			? { color: { key: 'color', raw: colorRaw, value: colorRaw, position: {} } }
			: {},
	} as unknown as MarkdownListItem;
}

function makeApi(items: MarkdownListItem[] = []) {
	return { query: vi.fn().mockReturnValue(items) };
}

function service(items: MarkdownListItem[] = []) {
	return new AreaService(makeApi(items) as any);
}

const FIXTURE_ITEMS: MarkdownListItem[] = [
	makeItem('Work #area',     ['#area'], '3b82f6'),
	makeItem('Personal #area', ['#area'], '8b5cf6'),
	makeItem('Learning #area', ['#area']),
	makeItem('Health #area',   ['#area'], 'f97316'),
	makeItem('Finance #area',  ['#area'], 'eab308')
];

describe('AreaService.parseAreas', () => {
	it('parses all #area items', () => {
		const areas = service().parseAreas(FIXTURE_ITEMS);
		expect(areas.map(a => a.name)).toEqual(['Work', 'Personal', 'Learning', 'Health', 'Finance']);
	});

	it('reads the color inline field when present', () => {
		const areas = service().parseAreas(FIXTURE_ITEMS);
		expect(areas.find(a => a.name === 'Work')?.color).toBe('#3b82f6');
		expect(areas.find(a => a.name === 'Personal')?.color).toBe('#8b5cf6');
	});

	it('uses the default color when no color field is present', () => {
		const areas = service().parseAreas(FIXTURE_ITEMS);
		expect(areas.find(a => a.name === 'Learning')?.color).toBe('#94a3b8');
	});

	it('ignores items without the #area tag', () => {
		const areas = service().parseAreas(FIXTURE_ITEMS);
		expect(areas.find(a => a.name === 'Dayflow')).toBeUndefined();
	});

	it('returns an empty array for empty input', () => {
		expect(service().parseAreas([])).toEqual([]);
	});

	it('trims whitespace from the extracted name', () => {
		const items = [makeItem('  Work  #area ', ['#area'], '#123456')];
		const areas = service().parseAreas(items);
		expect(areas[0]?.name).toBe('Work');
	});
});

describe('AreaService.getAreas', () => {
	it('queries DataCore with the correct year', () => {
		const api = makeApi(FIXTURE_ITEMS);
		new AreaService(api as any).getAreas('2026');
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('$name = "2026"'));
	});

	it('returns parsed areas from the query result', () => {
		const areas = service(FIXTURE_ITEMS).getAreas('2026');
		expect(areas.map(a => a.name)).toEqual(['Work', 'Personal', 'Learning', 'Health', 'Finance']);
	});

	it('returns an empty array when the query returns nothing', () => {
		expect(service([]).getAreas('2026')).toEqual([]);
	});
});

describe('AreaService.getAreaColors', () => {
	it('returns a name→hex map from the query result', () => {
		const colors = service(FIXTURE_ITEMS).getAreaColors('2026');
		expect(colors['Work']).toBe('#3b82f6');
		expect(colors['Personal']).toBe('#8b5cf6');
	});

	it('returns an empty map when the query returns nothing', () => {
		expect(service([]).getAreaColors('2026')).toEqual({});
	});
});
