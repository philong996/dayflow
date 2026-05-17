import { type MarkdownPage } from '@blacksmithgu/datacore';
import type { ParseResult } from './parse-result';

export interface Project {
	name: string;
	year: number[];
	area: string;
	path: string;
}

export namespace Project {
	export function fromMarkdownPage(item: MarkdownPage): ParseResult<Project> {
		const name = item.$name.trim();
		if (!name)
			return { ok: false, error: 'Project: name is empty' };

		const path = item.$path.trim();
		if (!path)
			return { ok: false, error: 'Project: path is empty' };

		const fm = item.$frontmatter;

		const rawArea = (fm?.['area']?.raw ?? '');
		const area = String(rawArea).replace(/^\[\[|\]\]$/g, '').trim();

		const rawYears = fm?.['years']?.raw;
		const year: number[] = Array.isArray(rawYears)
			? rawYears
				.map((y: unknown) => parseInt(String(y).replace(/^\[\[|\]\]$/g, '').trim(), 10))
				.filter((n: number) => !isNaN(n))
			: [];

		return { ok: true, value: { name, path, area, year } };
	}
}
