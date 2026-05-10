import { Link } from '@blacksmithgu/datacore';

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
