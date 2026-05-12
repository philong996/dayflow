import { describe, it, expect, vi } from 'vitest';
import { AreaService } from '../../src/services/area-service';
import type { MarkdownPage } from '@blacksmithgu/datacore';

function makePage(name: string, tags: string[], colorRaw?: string): MarkdownPage {
	return {
		$tags:     tags,
		$name:     name,
		$frontmatter: colorRaw
			? { color: { key: 'color', raw: colorRaw, value: colorRaw, position: {} } }
			: {},
	} as unknown as MarkdownPage;
}

function makeApi(items: MarkdownPage[] = []) {
	return { query: vi.fn().mockReturnValue(items) };
}

function service(items: MarkdownPage[] = []) {
	return new AreaService(makeApi(items) as any);
}

const FIXTURE_ITEMS: MarkdownPage[] = [
	makePage('Work',     ['#area'], '3b82f6'),
	makePage('Personal', ['#area'], '8b5cf6'),
	makePage('Learning', ['#area']),
	makePage('Health',   ['#area'], 'f97316'),
	makePage('Finance',  ['#area'], 'eab308')
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
		const items = [makePage('  Work  ', ['#area'], '#123456')];
		const areas = service().parseAreas(items);
		expect(areas[0]?.name).toBe('Work');
	});
});

describe('AreaService.getAreas', () => {
	it('queries DataCore for active area pages', () => {
		const api = makeApi(FIXTURE_ITEMS);
		new AreaService(api as any).getAreas();
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('@page'));
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('#area'));
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('active = true'));
	});

	it('returns parsed areas from the query result', () => {
		const areas = service(FIXTURE_ITEMS).getAreas();
		expect(areas.map(a => a.name)).toEqual(['Work', 'Personal', 'Learning', 'Health', 'Finance']);
	});

	it('returns an empty array when the query returns nothing', () => {
		expect(service([]).getAreas()).toEqual([]);
	});
});

describe('AreaService.getAreaColors', () => {
	it('returns a name→hex map from the query result', () => {
		const colors = service(FIXTURE_ITEMS).getAreaColors();
		expect(colors['Work']).toBe('#3b82f6');
		expect(colors['Personal']).toBe('#8b5cf6');
	});

	it('returns an empty map when the query returns nothing', () => {
		expect(service([]).getAreaColors()).toEqual({});
	});
});
