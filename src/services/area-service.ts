import { DatacoreApi, MarkdownListItem, MarkdownPage } from '@blacksmithgu/datacore';
import type { Area } from '../core/area';
import type { Activity } from '../core/suggestion';
import { findParentPage } from '../utils/datacore';

const DEFAULT_COLOR = '#94a3b8';

export class AreaService {
	constructor(private readonly api: DatacoreApi) {}

	getAreas(): Area[] {
		const items = this.api.query(`
			@page
			and #type/journal/area
			and active = true
		`).filter((b): b is MarkdownPage => b !== null && typeof b === 'object');
		return this.parseAreas(items);
	}

	getAreaColors(): Record<string, string> {
		const map: Record<string, string> = {};
		for (const { name, color } of this.getAreas()) {
			map[name] = color;
		}
		return map;
	}

	parseAreas(items: MarkdownPage[]): Area[] {
		return items
			.flatMap(item => {
				const frontmatter = item.$frontmatter;
				if (!frontmatter) return [];
				const rawColor = (frontmatter['color']?.raw ?? '').trim();
				const color = rawColor
					? (rawColor.startsWith('#') ? rawColor : `#${rawColor}`)
					: DEFAULT_COLOR;
				const name  = item.$name.trim();
				return name ? [{ name, color }] : [];
			});
	}

	getActivities(): Activity[] {
		const items = this.api.query(
			`@list-item and #activity and active=true and childof(@page and #type/journal/area and active = true)`
		).filter(
			(b): b is MarkdownListItem => b !== null && typeof b === 'object'
		);
		return this.parseActivities(items);
	}

	parseActivities(items: MarkdownListItem[]): Activity[] {
		const result: Activity[] = [];

		for (const item of items) {
			const r = item as unknown as Record<string, unknown>;

			const rawText = (r['$text'] as string | undefined) ?? '';
			const name = rawText
				.replace(/#activity\S*/g, '')
				.replace(/\[[^\]]*::[^\]]*\]/g, '')
				.trim();
			if (!name) continue;

			const parent = findParentPage(r);
			const areas = parent ? this.parseAreas([parent]) : [];
			const areaName = areas[0]?.name ?? '';

			result.push({ name, areaName, active: true });
		}

		return result;
	}
}
