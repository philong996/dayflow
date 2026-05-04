import { describe, it, expect } from 'vitest';
import { DatacoreExtractor } from '../../src/services/datacore-extractor';
import type { DayFlowSettings } from '../../src/settings';

function makeSettings(overrides: Partial<DayFlowSettings> = {}): DayFlowSettings {
	return {
		dailyNoteFolder:   'Journal/Daily',
		dailyNoteFormat:   'YYYY-MM-DD',
		calendarStartHour: 6,
		calendarEndHour:   23,
		...overrides,
	};
}

// Access the private method via casting for unit testing query shape.
function buildQuery(settings: DayFlowSettings, startDate: string, endDate: string, type: 'tracked' | 'planned' | 'all' = 'tracked'): string {
	const extractor = new DatacoreExtractor({} as any, settings);
	return (extractor as any).buildEntriesQuery(startDate, endDate, type) as string;
}

// ─── buildEntriesQuery ────────────────────────────────────────────────────────

describe('DatacoreExtractor.buildEntriesQuery', () => {
	it('produces a date range query using dailyNoteFolder from settings', () => {
		const q = buildQuery(makeSettings({ dailyNoteFolder: 'Journal/Daily' }), '2026-04-28', '2026-05-04');
		expect(q).toContain('path("Journal/Daily")');
		expect(q).toContain('$name >= "2026-04-28" and $name <= "2026-05-04"');
		expect(q).toContain('exists(duration)');
	});

	it('collapses equal start/end to a single equality check', () => {
		const q = buildQuery(makeSettings(), '2026-04-28', '2026-04-28');
		expect(q).toContain('$name = "2026-04-28"');
		expect(q).not.toContain('>=');
	});

	it('omits path clause when dailyNoteFolder is empty', () => {
		const q = buildQuery(makeSettings({ dailyNoteFolder: '' }), '2026-04-28', '2026-05-04');
		expect(q).not.toContain('path(');
		expect(q).toContain('$name >= "2026-04-28"');
	});

	it('adds not exists(type) clause for tracked', () => {
		const q = buildQuery(makeSettings(), '2026-05-04', '2026-05-04', 'tracked');
		expect(q).toContain('not exists(type)');
	});

	it('adds type = "planned" clause for planned', () => {
		const q = buildQuery(makeSettings(), '2026-05-04', '2026-05-04', 'planned');
		expect(q).toContain('type = "planned"');
	});

	it('adds no type clause for all', () => {
		const q = buildQuery(makeSettings(), '2026-05-04', '2026-05-04', 'all');
		expect(q).not.toContain('not exists(type)');
		expect(q).not.toContain('type = "planned"');
	});
});
