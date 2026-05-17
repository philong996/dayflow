import { type MarkdownListItem } from '@blacksmithgu/datacore';
import type { ParseResult } from './parse-result';
import { findParentPage } from '../utils/datacore';

export interface Activity {
	name:     string;
	areaName: string;
	active:   boolean;
}

export namespace Activity {
	export function fromMarkdownListItem(item: MarkdownListItem): ParseResult<Activity> {
		const r = item as unknown as Record<string, unknown>;
		const rawText = (r['$text'] as string | undefined) ?? '';
		const name = rawText
			.replace(/#activity\S*/g, '')
			.replace(/\[[^\]]*::[^\]]*\]/g, '')
			.trim();
		if (!name)
			return { ok: false, error: 'Activity: name is empty after stripping tags' };

		const parent = findParentPage(r);
		if (!parent)
			return { ok: false, error: 'Activity: could not resolve parent area page' };

		const areaName = parent.$name.trim();
		if (!areaName)
			return { ok: false, error: 'Activity: parent area page has an empty name' };

		return { ok: true, value: { name, areaName, active: true } };
	}
}
