import { describe, it, expect } from 'vitest';
import { Activity } from '../../src/core/activity';
import type { MarkdownListItem, MarkdownPage } from '@blacksmithgu/datacore';

function makeAreaPage(name: string): MarkdownPage {
	return {
		$name: name,
		$path: `Areas/${name}.md`,
		$frontmatter: {},
	} as unknown as MarkdownPage;
}

function makeActivityItem(text: string, parent?: MarkdownPage): MarkdownListItem {
	return (parent
		? { $text: text, $parent: parent }
		: { $text: text }
	) as unknown as MarkdownListItem;
}

const AREA_PAGE = makeAreaPage('Health');

describe('Activity.fromMarkdownListItem', () => {
	it('returns ok:true with name and areaName for a valid item', () => {
		const result = Activity.fromMarkdownListItem(makeActivityItem('Running #activity', AREA_PAGE));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Running');
		expect(result.value.areaName).toBe('Health');
		expect(result.value.active).toBe(true);
	});

	it('strips the #activity tag from the name', () => {
		const result = Activity.fromMarkdownListItem(makeActivityItem('Morning run #activity', AREA_PAGE));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Morning run');
	});

	it('strips inline fields from the name', () => {
		const result = Activity.fromMarkdownListItem(
			makeActivityItem('Cycling #activity [active:: true]', AREA_PAGE)
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe('Cycling');
	});

	it('extracts areaName from the parent page $name', () => {
		const result = Activity.fromMarkdownListItem(
			makeActivityItem('Yoga #activity', makeAreaPage('Personal'))
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.areaName).toBe('Personal');
	});

	it('returns ok:false when name is empty after stripping', () => {
		const result = Activity.fromMarkdownListItem(makeActivityItem('#activity', AREA_PAGE));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('name is empty');
	});

	it('returns ok:false when there is no parent page', () => {
		const result = Activity.fromMarkdownListItem(makeActivityItem('Running #activity'));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('parent area page');
	});

	it('returns ok:false when parent page has an empty name', () => {
		const result = Activity.fromMarkdownListItem(
			makeActivityItem('Running #activity', makeAreaPage(''))
		);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('empty name');
	});
});
