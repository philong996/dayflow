import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntryService } from '../../src/services/entry-service';
import { getDailyNoteSettings } from 'obsidian-daily-notes-interface';

function buildQuery(folder: string, startDate: string, endDate: string, type: 'tracked' | 'planned' | 'all' = 'tracked'): string {
	vi.mocked(getDailyNoteSettings).mockReturnValue({ folder });
	const service = new EntryService({} as any, {} as any);
	return (service as any).buildQuery(startDate, endDate, type) as string;
}

beforeEach(() => vi.clearAllMocks());

// ─── buildQuery ───────────────────────────────────────────────────────────────

describe('EntryService.buildQuery', () => {
	it('scopes to the folder from getDailyNoteSettings', () => {
		const q = buildQuery('Journal/Daily', '2026-04-28', '2026-05-04');
		expect(q).toContain('path("Journal/Daily")');
		expect(q).toContain('exists(duration)');
	});

	it('produces a date range clause for different start and end dates', () => {
		const q = buildQuery('', '2026-04-28', '2026-05-04');
		expect(q).toContain('$name >= "2026-04-28" and $name <= "2026-05-04"');
	});

	it('collapses equal start/end to a single equality check', () => {
		const q = buildQuery('', '2026-04-28', '2026-04-28');
		expect(q).toContain('$name = "2026-04-28"');
		expect(q).not.toContain('>=');
	});

	it('omits path clause when folder is empty', () => {
		const q = buildQuery('', '2026-04-28', '2026-05-04');
		expect(q).not.toContain('path(');
	});

	it('adds not exists(type) clause for tracked', () => {
		const q = buildQuery('', '2026-05-06', '2026-05-06', 'tracked');
		expect(q).toContain('not exists(type)');
	});

	it('adds type = "planned" clause for planned', () => {
		const q = buildQuery('', '2026-05-06', '2026-05-06', 'planned');
		expect(q).toContain('type = "planned"');
	});

	it('adds no type clause for all', () => {
		const q = buildQuery('', '2026-05-06', '2026-05-06', 'all');
		expect(q).not.toContain('not exists(type)');
		expect(q).not.toContain('type = "planned"');
	});
});
