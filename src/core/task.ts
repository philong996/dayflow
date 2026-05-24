import { type MarkdownTaskItem, type MarkdownPage } from '@blacksmithgu/datacore';
import type { ParseResult } from './parse-result';
import { isLink, linkLabel } from '../utils/datacore';

export interface Description {
	name:   string;
	status: string;
}

export interface SubTask {
	name:         string;
	status:       string;
	descriptions: Description[];
}

export interface Task {
	name:       string;
	status:     string;
	type:       string;
	sourceName: string;
	sourcePath: string;
	areaName?:  string;
	dueDate?:   string;
	subtasks:   SubTask[];
}

const STATUS_MAP: Record<string, string> = {
	' ': 'todo',
	'-': 'in-progress',
	'x': 'done',
	'X': 'done',
	'C': 'cancelled',
};

function mapStatus(raw: string | undefined): string {
	return STATUS_MAP[raw ?? ''] ?? 'todo';
}

function elementText(el: unknown): string {
	const r = el as Record<string, unknown>;
	const text = (r['$cleantext'] as string | undefined)
		?? (r['$text'] as string | undefined)
		?? '';
	return text.replace(/\[[^\]]*::[^\]]*\]/g, '').trim();
}

export namespace Task {
	export function fromMarkdownTaskItem(
		item: MarkdownTaskItem,
		page: MarkdownPage,
	): ParseResult<Task> {
		const status  = item['$status'] as string | undefined;
		const rawText = (item['$text'] as string | undefined) ?? '';

		const typeMatch = rawText.match(/#task\/(\S+)/);
		const type      = typeMatch ? typeMatch[1]! : 'task';

		const name = rawText
			.replace(/#task\S*/g, '')
			.replace(/\(due:[^)]*\)/g, '')
			.replace(/\[[^\]]*::[^\]]*\]/g, '')
			.trim();
		if (!name)
			return { ok: false, error: 'Task: name is empty after stripping tags' };

		const rawDue = item.$infields['due']?.value;
		const dueDate =
			typeof rawDue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDue) ? rawDue : undefined;

		const areaName = resolveArea(item, page);

		const elements = (item['$elements'] as MarkdownTaskItem[] | undefined) ?? [];
		const subtasks: SubTask[] = [];
		for (const el of elements) {
			const elName = elementText(el);
			if (!elName) continue;
			const subEls = ((el as any)['$elements'] as MarkdownTaskItem[] | undefined) ?? [];
			const descriptions: Description[] = [];
			for (const desc of subEls) {
				const descName = elementText(desc);
				if (!descName) continue;
				descriptions.push({
					name:   descName,
					status: mapStatus((desc as any)['$status'] as string | undefined),
				});
			}
			subtasks.push({
				name:         elName,
				status:       mapStatus((el as any)['$status'] as string | undefined),
				descriptions,
			});
		}

		return {
			ok:    true,
			value: {
				name,
				status:     mapStatus(status),
				type,
				sourceName: page.$name,
				sourcePath: page.$path,
				areaName,
				dueDate,
				subtasks,
			},
		};
	}

	function resolveArea(item: MarkdownTaskItem, page: MarkdownPage): string | undefined {
		const inlineVal = item.$infields['area']?.value;
		if (inlineVal !== undefined && inlineVal !== null) {
			if (isLink(inlineVal)) {
				const label = linkLabel(inlineVal);
				if (label) return label;
			} else if (typeof inlineVal === 'string' && inlineVal.trim()) {
				return inlineVal.trim();
			}
		}
		const rawFm = (page as any).$frontmatter?.['area']?.raw;
		if (rawFm) {
			const stripped = String(rawFm).replace(/^\[\[|\]\]$/g, '').trim();
			if (stripped) return stripped;
		}
		return undefined;
	}
}
