import { DatacoreApi, MarkdownPage } from '@blacksmithgu/datacore';
import { Area } from '../core/area';

export class AreaService {
	constructor(private readonly api: DatacoreApi) {}

	getAreas(): Area[] {
		const items = this.api.query(`
			@page
			and #type/journal/area
			and active = true
		`).filter((b): b is MarkdownPage => b !== null && typeof b === 'object');
		const values: Area[] = [];
		for (const item of items) {
			const r = Area.fromMarkdownPage(item);
			if (!r.ok) { console.warn('AreaService:', r.error); continue; }
			values.push(r.value);
		}
		return values;
	}

	getAreaColors(): Record<string, string> {
		const map: Record<string, string> = {};
		for (const { name, color } of this.getAreas()) {
			map[name] = color;
		}
		return map;
	}
}
