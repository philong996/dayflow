import { DatacoreApi, MarkdownPage } from '@blacksmithgu/datacore';
import type { Project } from '../core/project';

export class ProjectService {
	constructor(private readonly api: DatacoreApi) {}

	getProjects(active: boolean): Project[] {
		const query = active
			? `@page and #type/artifact/project and active = true`
			: `@page and #type/artifact/project`;
		const items = this.api.query(query).filter(
			(b): b is MarkdownPage => b !== null && typeof b === 'object'
		);
		return this.parseProjects(items);
	}

	parseProjects(items: MarkdownPage[]): Project[] {
		return items
			.flatMap(item => {
				const name = item.$name.trim();
				const path = item.$path.trim();
				if (!name || !path) return [];

				const fm = item.$frontmatter;

				const rawArea = (fm?.['area']?.raw ?? '');
				const area    = String(rawArea).replace(/^\[\[|\]\]$/g, '').trim();

				const rawYears = fm?.['years']?.raw;
				const year: number[] = Array.isArray(rawYears)
					? rawYears
						.map((y: unknown) => parseInt(String(y).replace(/^\[\[|\]\]$/g, '').trim(), 10))
						.filter((n: number) => !isNaN(n))
					: [];

				return [{ name, year, area, path }];
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	}
}
