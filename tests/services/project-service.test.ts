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

