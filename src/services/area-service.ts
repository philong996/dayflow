import { DatacoreApi,  MarkdownPage } from '@blacksmithgu/datacore';
import type { Area } from '../core/area';

const DEFAULT_COLOR = '#94a3b8';

export class AreaService {
	constructor(private readonly api: DatacoreApi) {}

	getAreas(): Area[] {
		const items = this.api.query(`
			@page
			and #area
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
}
