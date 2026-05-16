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
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('#type/journal/area'));
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

// ── getActivities / parseActivities ───────────────────────────────────────────

function makeAreaPage(name: string): MarkdownPage {
	return {
		$name:        name,
		$path:        `Areas/${name}.md`,
		$frontmatter: {},
	} as unknown as MarkdownPage;
}

function makeActivityItem(
	text: string,
	activeVal: unknown,
	parent: MarkdownPage,
) {
	return {
		$text:     text,
		$infields: {
			active: { key: 'active', raw: String(activeVal), value: activeVal, position: {} },
		},
		$parent: parent,
	} as unknown as import('@blacksmithgu/datacore').MarkdownListItem;
}

const AREA_PAGE = makeAreaPage('Health');

describe('AreaService.parseActivities', () => {
	it('returns [] for empty input', () => {
		expect(new AreaService({ query: vi.fn() } as any).parseActivities([])).toEqual([]);
	});

	it('retains only items where $infields["active"].value === true', () => {
		const svc = new AreaService({ query: vi.fn() } as any);
		const items = [
			makeActivityItem('Running #activity [active:: true]', true,  AREA_PAGE),
			makeActivityItem('Yoga #activity [active:: false]',   false, AREA_PAGE),
			makeActivityItem('Swim #activity',                    false, AREA_PAGE),
		];
		const result = svc.parseActivities(items);
		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe('Running');
	});

	it('extracts name by stripping the #activity tag', () => {
		const svc = new AreaService({ query: vi.fn() } as any);
		const result = svc.parseActivities([makeActivityItem('Morning run #activity', true, AREA_PAGE)]);
		expect(result[0]?.name).toBe('Morning run');
	});

	it('extracts areaName from the parent page', () => {
		const svc = new AreaService({ query: vi.fn() } as any);
		const result = svc.parseActivities([makeActivityItem('Cycling #activity', true, AREA_PAGE)]);
		expect(result[0]?.areaName).toBe('Health');
	});

	it('skips items with empty name after stripping', () => {
		const svc = new AreaService({ query: vi.fn() } as any);
		const result = svc.parseActivities([makeActivityItem('#activity', true, AREA_PAGE)]);
		expect(result).toHaveLength(0);
	});
});

describe('AreaService.getActivities', () => {
	it('queries DataCore with #activity in the query string', () => {
		const api = { query: vi.fn().mockReturnValue([]) };
		new AreaService(api as any).getActivities();
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('#activity'));
	});

	it('returns [] when DataCore returns empty', () => {
		const api = { query: vi.fn().mockReturnValue([]) };
		expect(new AreaService(api as any).getActivities()).toEqual([]);
	});
});
