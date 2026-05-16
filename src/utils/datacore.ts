import { Link, MarkdownPage } from '@blacksmithgu/datacore';

export function linkLabel(link: Link): string {
	if ((link as any).display) return (link as any).display as string;
	const hash = link.path.indexOf('#');
	return hash >= 0 ? link.path.slice(hash + 1) : link.path;
}

export function parseLinkText(text: string): Link | null {
	const inner = text.trim().replace(/^\[\[|\]\]$/g, '');
	if (!inner) return null;
	try { return Link.parseInner(inner); } catch { return null; }
}

export function isLink(val: unknown): val is Link {
	return typeof val === 'object' && val !== null
		&& typeof (val as Record<string, unknown>)['path'] === 'string';
}
export function findParentPage(node: Record<string, unknown>): MarkdownPage | undefined {
	let current = node['$parent'];
	while (current !== null && current !== undefined) {
		const n = current as Record<string, unknown>;
		if (typeof n['$path'] === 'string') return n as unknown as MarkdownPage;
		current = n['$parent'];
	}
	return undefined;
}
