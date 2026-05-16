import { describe, it, expect, vi } from 'vitest';
import { ProjectService } from '../../src/services/project-service';
import type { MarkdownPage } from '@blacksmithgu/datacore';

function makePage(
	name: string,
	path: string,
	opts: { area?: string; years?: string[] } = {},
): MarkdownPage {
	const fm: Record<string, unknown> = {};
	if (opts.area !== undefined) {
		fm['area']  = { key: 'area',  raw: opts.area,  value: opts.area,  position: {} };
	}
	if (opts.years !== undefined) {
		fm['years'] = { key: 'years', raw: opts.years, value: opts.years, position: {} };
	}
	return { $name: name, $path: path, $frontmatter: fm } as unknown as MarkdownPage;
}

function makeApi(items: MarkdownPage[] = []) {
	return { query: vi.fn().mockReturnValue(items) };
}

function service(items: MarkdownPage[] = []) {
	return new ProjectService(makeApi(items) as any);
}

const FIXTURE_ITEMS: MarkdownPage[] = [
	makePage('Zephyr',  'Projects/Zephyr.md',  { area: '[[Work]]',     years: ['[[2026]]', '[[2025]]'] }),
	makePage('Atlas',   'Projects/Atlas.md',    { area: '[[Personal]]', years: ['[[2026]]'] }),
	makePage('Mercury', 'Projects/Mercury.md',  { area: '[[Work]]',     years: [] }),
	makePage('Beta',    'Projects/Beta.md',     { area: '[[Learning]]', years: ['[[2025]]'] }),
];

// ── parseProjects ─────────────────────────────────────────────────────────────

describe('ProjectService.parseProjects', () => {
	it('parses name and path from each page', () => {
		const projects = service().parseProjects(FIXTURE_ITEMS);
		expect(projects.map(p => p.name)).toContain('Atlas');
		expect(projects.find(p => p.name === 'Atlas')?.path).toBe('Projects/Atlas.md');
	});

	it('sorts results alphabetically by name', () => {
		const projects = service().parseProjects(FIXTURE_ITEMS);
		expect(projects.map(p => p.name)).toEqual(['Atlas', 'Beta', 'Mercury', 'Zephyr']);
	});

	it('strips wikilink brackets from the area field', () => {
		const projects = service().parseProjects(FIXTURE_ITEMS);
		expect(projects.find(p => p.name === 'Zephyr')?.area).toBe('Work');
		expect(projects.find(p => p.name === 'Atlas')?.area).toBe('Personal');
		expect(projects.find(p => p.name === 'Beta')?.area).toBe('Learning');
	});

	it('parses years from an array of wikilink strings', () => {
		const projects = service().parseProjects(FIXTURE_ITEMS);
		expect(projects.find(p => p.name === 'Zephyr')?.year).toEqual([2026, 2025]);
		expect(projects.find(p => p.name === 'Atlas')?.year).toEqual([2026]);
		expect(projects.find(p => p.name === 'Beta')?.year).toEqual([2025]);
	});

	it('returns an empty year array when years field is absent', () => {
		const items = [makePage('Solo', 'Projects/Solo.md', { area: '[[Work]]' })];
		expect(service().parseProjects(items)[0]?.year).toEqual([]);
	});

	it('returns an empty year array when years is an empty array', () => {
		expect(service().parseProjects(FIXTURE_ITEMS).find(p => p.name === 'Mercury')?.year).toEqual([]);
	});

	it('returns an empty string for area when area field is absent', () => {
		const items = [makePage('Solo', 'Projects/Solo.md', { years: ['[[2026]]'] })];
		expect(service().parseProjects(items)[0]?.area).toBe('');
	});

	it('ignores non-numeric entries in the years array', () => {
		const items = [makePage('Mixed', 'Projects/Mixed.md', { years: ['[[abc]]', '[[2026]]', '[[]]'] })];
		expect(service().parseProjects(items)[0]?.year).toEqual([2026]);
	});

	it('filters out items with an empty name', () => {
		const items = [
			makePage('',      'Projects/Valid.md', { area: '[[Work]]' }),
			makePage('Valid', 'Projects/Valid.md', { area: '[[Work]]' }),
		];
		const names = service().parseProjects(items).map(p => p.name);
		expect(names).not.toContain('');
		expect(names).toContain('Valid');
	});

	it('filters out items with an empty path', () => {
		const items = [
			makePage('NoPath', '', { area: '[[Work]]' }),
			makePage('HasPath', 'Projects/HasPath.md', { area: '[[Work]]' }),
		];
		const names = service().parseProjects(items).map(p => p.name);
		expect(names).not.toContain('NoPath');
		expect(names).toContain('HasPath');
	});

	it('trims whitespace from name and path', () => {
		const items = [makePage('  Trimmed  ', '  Projects/Trimmed.md  ', { area: '[[Work]]' })];
		const p = service().parseProjects(items)[0];
		expect(p?.name).toBe('Trimmed');
		expect(p?.path).toBe('Projects/Trimmed.md');
	});

	it('handles missing frontmatter gracefully', () => {
		const item = { $name: 'NullFm', $path: 'Projects/NullFm.md', $frontmatter: null } as unknown as MarkdownPage;
		const projects = service().parseProjects([item]);
		expect(projects[0]).toMatchObject({ name: 'NullFm', area: '', year: [] });
	});

	it('returns an empty array for empty input', () => {
		expect(service().parseProjects([])).toEqual([]);
	});
});

// ── getProjects ───────────────────────────────────────────────────────────────

describe('ProjectService.getProjects', () => {
	it('queries DataCore with the hierarchical project tag', () => {
		const api = makeApi([]);
		new ProjectService(api as any).getProjects(true);
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('#type/journal/project'));
	});

	it('includes active = true in the query when active is true', () => {
		const api = makeApi([]);
		new ProjectService(api as any).getProjects(true);
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('active = true'));
	});

	it('omits active = true in the query when active is false', () => {
		const api = makeApi([]);
		new ProjectService(api as any).getProjects(false);
		expect(api.query).not.toHaveBeenCalledWith(expect.stringContaining('active = true'));
	});

	it('returns parsed and sorted projects from the query result', () => {
		const projects = service(FIXTURE_ITEMS).getProjects(true);
		expect(projects.map(p => p.name)).toEqual(['Atlas', 'Beta', 'Mercury', 'Zephyr']);
	});

	it('returns an empty array when the query returns nothing', () => {
		expect(service([]).getProjects(true)).toEqual([]);
	});

	it('returns projects with correct area and year from the query result', () => {
		const projects = service(FIXTURE_ITEMS).getProjects(true);
		const zephyr = projects.find(p => p.name === 'Zephyr');
		expect(zephyr?.area).toBe('Work');
		expect(zephyr?.year).toEqual([2026, 2025]);
	});
});

// ── getTasks / parseTasks ──────────────────────────────────────────────────────

function makeParentPage(name: string, path: string, area = '[[Work]]'): MarkdownPage {
	return {
		$name: name,
		$path: path,
		$frontmatter: {
			area: { key: 'area', raw: area, value: area, position: {} },
		},
	} as unknown as MarkdownPage;
}

function makeListItem(
	text: string,
	symbol: string,
	parent: MarkdownPage,
	opts: {
		infields?: Record<string, { key: string; raw: string; value: unknown; position: unknown }>;
		elements?: Array<{ $text: string }>;
	} = {},
) {
	return {
		$text:     text,
		$symbol:   symbol,
		$infields: opts.infields ?? {},
		$elements: opts.elements ?? [],
		$parent:   parent,
	} as unknown as import('@blacksmithgu/datacore').MarkdownListItem;
}

const PROJECT_PAGE = makeParentPage('MyProject', 'Projects/MyProject.md', '[[Work]]');

describe('ProjectService.parseTasks', () => {
	it('returns [] for empty input', () => {
		expect(new ProjectService({ query: vi.fn() } as any).parseTasks([])).toEqual([]);
	});

	it('filters out items with $symbol not in [" ", "-"]', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const items = [
			makeListItem('Done task #task', 'x', PROJECT_PAGE),
			makeListItem('Cancelled #task', 'C', PROJECT_PAGE),
			makeListItem('Todo task #task', ' ', PROJECT_PAGE),
		];
		const result = svc.parseTasks(items);
		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe('Todo task');
	});

	it('strips the #task tag text from the extracted name', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const result = svc.parseTasks([makeListItem('Fix login #task', ' ', PROJECT_PAGE)]);
		expect(result[0]?.name).toBe('Fix login');
	});

	it('sets status "todo" for $symbol === " "', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const result = svc.parseTasks([makeListItem('Write tests #task', ' ', PROJECT_PAGE)]);
		expect(result[0]?.status).toBe('todo');
	});

	it('sets status "in-progress" for $symbol === "-"', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const result = svc.parseTasks([makeListItem('Review PR #task', '-', PROJECT_PAGE)]);
		expect(result[0]?.status).toBe('in-progress');
	});

	it('extracts dueDate from $infields["due"] when valid', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const infields = { due: { key: 'due', raw: '2026-07-01', value: '2026-07-01', position: {} } };
		const result = svc.parseTasks([makeListItem('Deploy #task', ' ', PROJECT_PAGE, { infields })]);
		expect(result[0]?.dueDate).toBe('2026-07-01');
	});

	it('sets dueDate to undefined when due field is absent', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const result = svc.parseTasks([makeListItem('Deploy #task', ' ', PROJECT_PAGE)]);
		expect(result[0]?.dueDate).toBeUndefined();
	});

	it('populates subtasks from $elements text', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const elements = [{ $text: 'Step one' }, { $text: 'Step two' }];
		const result = svc.parseTasks([makeListItem('Big task #task', ' ', PROJECT_PAGE, { elements })]);
		expect(result[0]?.subtasks).toEqual(['Step one', 'Step two']);
	});

	it('returns [] for subtasks when $elements is absent', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const item = { $text: 'No elements #task', $symbol: ' ', $infields: {}, $parent: PROJECT_PAGE } as unknown as import('@blacksmithgu/datacore').MarkdownListItem;
		const result = svc.parseTasks([item]);
		expect(result[0]?.subtasks).toEqual([]);
	});

	it('filters out items with empty name after stripping', () => {
		const svc = new ProjectService({ query: vi.fn() } as any);
		const result = svc.parseTasks([makeListItem('#task', ' ', PROJECT_PAGE)]);
		expect(result).toHaveLength(0);
	});
});

describe('ProjectService.getTasks', () => {
	it('queries DataCore with #task in the query string', () => {
		const api = { query: vi.fn().mockReturnValue([]) };
		new ProjectService(api as any).getTasks();
		expect(api.query).toHaveBeenCalledWith(expect.stringContaining('#task'));
	});

	it('returns [] when DataCore returns empty', () => {
		const api = { query: vi.fn().mockReturnValue([]) };
		expect(new ProjectService(api as any).getTasks()).toEqual([]);
	});
});
