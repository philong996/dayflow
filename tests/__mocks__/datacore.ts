export class Link {
	readonly path: string;
	readonly subpath?: string;
	readonly type: string;
	readonly display?: string;
	readonly embed: boolean;

	constructor(fields: { path: string; subpath?: string; type?: string; display?: string; embed?: boolean }) {
		this.path    = fields.path;
		this.subpath = fields.subpath;
		this.type    = fields.type ?? 'file';
		this.display = fields.display;
		this.embed   = fields.embed ?? false;
	}

	static file(path: string, embed = false, display?: string): Link {
		return new Link({ path, embed, display, type: 'file' });
	}

	static header(path: string, header: string, embed?: boolean, display?: string): Link {
		return new Link({ path, subpath: header, embed, display, type: 'header' });
	}

	static block(path: string, blockId: string, embed?: boolean, display?: string): Link {
		return new Link({ path, subpath: blockId, embed, display, type: 'block' });
	}

	static infer(linkpath: string, embed = false, display?: string): Link {
		if (linkpath.includes('#^')) {
			const parts = linkpath.split('#^');
			return Link.block(parts[0]!, parts[1]!, embed, display);
		} else if (linkpath.includes('#')) {
			const parts = linkpath.split('#');
			return Link.header(parts[0]!, parts[1]!, embed, display);
		}
		return Link.file(linkpath, embed, display);
	}

	markdown(): string {
		const inner = this.subpath
			? (this.type === 'block' ? `${this.path}#^${this.subpath}` : `${this.path}#${this.subpath}`)
			: this.path;
		return `[[${inner}]]`;
	}
}

export const Literals = {
	isLink(val: unknown): val is Link {
		return val instanceof Link;
	},
};

export type MarkdownListItem = {
	$blockId?: string;
	$text?: string;
	$infields: Record<string, { key: string; raw: string; value: unknown; position: unknown; wrapping?: string }>;
	[key: string]: unknown;
};
