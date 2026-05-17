import { describe, it, expect } from 'vitest';
import { Project } from '../../src/core/project';
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

describe('Project.fromMarkdownPage', () => {
	it('returns ok:true with name and path for a valid page', () => {
		const result = Project.fromMarkdownPage(makePage('Atlas', 'Projects/Atlas.md', { area: '[[Personal]]', years: ['[[2026]]'] }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Atlas');
		expect(result.value.path).toBe('Projects/Atlas.md');
	});

	it('strips wikilink brackets from the area field', () => {
		const result = Project.fromMarkdownPage(makePage('Zephyr', 'Projects/Zephyr.md', { area: '[[Work]]' }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.area).toBe('Work');
	});

	it('parses years from an array of wikilink strings', () => {
		const result = Project.fromMarkdownPage(makePage('Zephyr', 'Projects/Zephyr.md', { area: '[[Work]]', years: ['[[2026]]', '[[2025]]'] }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.year).toEqual([2026, 2025]);
	});

	it('returns an empty year array when years field is absent', () => {
		const result = Project.fromMarkdownPage(makePage('Solo', 'Projects/Solo.md', { area: '[[Work]]' }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.year).toEqual([]);
	});

	it('returns an empty year array when years is an empty array', () => {
		const result = Project.fromMarkdownPage(makePage('Mercury', 'Projects/Mercury.md', { area: '[[Work]]', years: [] }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.year).toEqual([]);
	});

	it('returns an empty string for area when area field is absent', () => {
		const result = Project.fromMarkdownPage(makePage('Solo', 'Projects/Solo.md', { years: ['[[2026]]'] }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.area).toBe('');
	});

	it('ignores non-numeric entries in the years array', () => {
		const result = Project.fromMarkdownPage(makePage('Mixed', 'Projects/Mixed.md', { years: ['[[abc]]', '[[2026]]', '[[]]'] }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.year).toEqual([2026]);
	});

	it('trims whitespace from name and path', () => {
		const result = Project.fromMarkdownPage(makePage('  Trimmed  ', '  Projects/Trimmed.md  ', { area: '[[Work]]' }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Trimmed');
		expect(result.value.path).toBe('Projects/Trimmed.md');
	});

	it('handles missing frontmatter gracefully (null)', () => {
		const item = { $name: 'NullFm', $path: 'Projects/NullFm.md', $frontmatter: null } as unknown as MarkdownPage;
		const result = Project.fromMarkdownPage(item);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toMatchObject({ name: 'NullFm', area: '', year: [] });
	});

	it('returns ok:false when name is empty', () => {
		const result = Project.fromMarkdownPage(makePage('', 'Projects/Valid.md', { area: '[[Work]]' }));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('name is empty');
	});

	it('returns ok:false when path is empty', () => {
		const result = Project.fromMarkdownPage(makePage('NoPath', '', { area: '[[Work]]' }));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('path is empty');
	});
});
