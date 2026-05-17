import { type MarkdownPage } from '@blacksmithgu/datacore';
import type { ParseResult } from './parse-result';

export interface Area {
	name:  string;
	color: string;
}

export namespace Area {
	const DEFAULT_COLOR = '#94a3b8';

	export function fromMarkdownPage(item: MarkdownPage): ParseResult<Area> {
		const name = item.$name.trim();
		if (!name)
			return { ok: false, error: 'Area: name is empty' };

		const frontmatter = item.$frontmatter;
		if (!frontmatter)
			return { ok: false, error: 'Area: missing frontmatter' };

		const rawColor = (frontmatter['color']?.raw ?? '').trim();
		const color = rawColor
			? (rawColor.startsWith('#') ? rawColor : `#${rawColor}`)
			: DEFAULT_COLOR;

		return { ok: true, value: { name, color } };
	}
}
