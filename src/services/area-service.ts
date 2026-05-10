import { DatacoreApi, MarkdownListItem } from '@blacksmithgu/datacore';
import type { Area } from '../core/area';

const DEFAULT_COLOR = '#94a3b8';

export class AreaService {
	constructor(private readonly api: DatacoreApi) {}

	getAreas(year: string): Area[] {
		const items = this.api.query(
			`@list-item\n  and #area\n  and childof(@page and $name = "${year}")`
		).filter((b): b is MarkdownListItem => b !== null && typeof b === 'object');
		return this.parseAreas(items);
	}

	getAreaColors(year: string): Record<string, string> {
		const map: Record<string, string> = {};
		for (const { name, color } of this.getAreas(year)) {
			map[name] = color;
		}
		return map;
	}

	parseAreas(items: MarkdownListItem[]): Area[] {
		return items
			.flatMap(item => {
				const rawColor = (item.$infields['color']?.raw ?? '').trim();
				const color = rawColor
					? (rawColor.startsWith('#') ? rawColor : `#${rawColor}`)
					: DEFAULT_COLOR;
				const name  = (item.$cleantext ?? '')
					.replace('#area', '')
					.replace(/\s+/g, ' ')
					.trim();
				return name ? [{ name, color }] : [];
			});
	}
}
