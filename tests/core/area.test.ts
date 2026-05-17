import { describe, it, expect } from 'vitest';
import { Area } from '../../src/core/area';
import type { MarkdownPage } from '@blacksmithgu/datacore';

function makePage(name: string, colorRaw?: string): MarkdownPage {
	return {
		$name: name,
		$frontmatter: colorRaw !== undefined
			? { color: { key: 'color', raw: colorRaw, value: colorRaw, position: {} } }
			: {},
	} as unknown as MarkdownPage;
}

describe('Area.fromMarkdownPage', () => {
	it('returns ok:true with name and color for a valid page', () => {
		const result = Area.fromMarkdownPage(makePage('Work', '3b82f6'));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Work');
		expect(result.value.color).toBe('#3b82f6');
	});

	it('adds # prefix when color has none', () => {
		const result = Area.fromMarkdownPage(makePage('Personal', '8b5cf6'));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.color).toBe('#8b5cf6');
	});

	it('preserves existing # prefix', () => {
		const result = Area.fromMarkdownPage(makePage('Health', '#f97316'));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.color).toBe('#f97316');
	});

	it('uses default color when frontmatter color field is absent', () => {
		const result = Area.fromMarkdownPage(makePage('Learning'));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.color).toBe('#94a3b8');
	});

	it('trims whitespace from the extracted name', () => {
		const result = Area.fromMarkdownPage(makePage('  Work  ', '#123456'));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Work');
	});

	it('returns ok:false when name is empty', () => {
		const result = Area.fromMarkdownPage(makePage('', '3b82f6'));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('name is empty');
	});

	it('returns ok:false when name is only whitespace', () => {
		const result = Area.fromMarkdownPage(makePage('   ', '3b82f6'));
		expect(result.ok).toBe(false);
	});

	it('returns ok:false when frontmatter is null', () => {
		const item = { $name: 'Valid', $frontmatter: null } as unknown as MarkdownPage;
		const result = Area.fromMarkdownPage(item);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('frontmatter');
	});

	it('returns ok:false when frontmatter is undefined', () => {
		const item = { $name: 'Valid', $frontmatter: undefined } as unknown as MarkdownPage;
		const result = Area.fromMarkdownPage(item);
		expect(result.ok).toBe(false);
	});
});
