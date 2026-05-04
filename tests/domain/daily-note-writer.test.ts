import { describe, it, expect } from 'vitest';
import { Duration } from 'luxon';
import { serializeEntry, upsertEntry } from '../../src/domain/daily-note-writer';
import type { TimeEntry } from '../../src/domain/time-entry';
import type { Link } from '@blacksmithgu/datacore';

function link(markdown: string): Link {
	return { markdown: () => markdown } as unknown as Link;
}

const area    = link('[[2026#Engineering]]');
const project = link('[[Project - DayFlow]]');

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id:          'abc123',
		start:       '09:00',
		end:         '10:30',
		duration:    Duration.fromISO('PT1H30M'),
		task:        'Write parser',
		description: 'Implemented the entry parser',
		area,
		type:        'tracked',
		...overrides,
	};
}

describe('serializeEntry', () => {
	it('produces the correct list item format', () => {
		const result = serializeEntry(makeEntry());
		expect(result).toBe(
			'- 09:00 - 10:30 (duration:: 1h 30m): Write parser | Implemented the entry parser (area:: [[2026#Engineering]]) ^abc123'
		);
	});

	it('includes subTask when present', () => {
		const result = serializeEntry(makeEntry({ subTask: 'Focus on upsert logic' }));
		expect(result).toContain('Write parser | Focus on upsert logic | Implemented the entry parser');
	});

	it('omits subTask segment when absent', () => {
		const result = serializeEntry(makeEntry());
		expect(result).not.toContain('undefined');
		expect(result).toContain('Write parser | Implemented the entry parser');
	});

	it('includes project when present', () => {
		const result = serializeEntry(makeEntry({ project }));
		expect(result).toContain('(project:: [[Project - DayFlow]])');
	});

	it('omits project when absent', () => {
		const result = serializeEntry(makeEntry());
		expect(result).not.toContain('project::');
	});

	it('ends with the block id', () => {
		const result = serializeEntry(makeEntry({ id: 'xyz999' }));
		expect(result.endsWith('^xyz999')).toBe(true);
	});

	it('serializes a planned entry with (type:: planned) and no description', () => {
		const result = serializeEntry(makeEntry({ type: 'planned', description: undefined }));
		expect(result).toContain('(type:: planned)');
		expect(result).not.toContain('undefined');
		expect(result).toContain('Write parser');
	});

	it('serializes a planned entry with subTask and no description', () => {
		const result = serializeEntry(makeEntry({ type: 'planned', subTask: 'Backend', description: undefined }));
		expect(result).toContain('Write parser | Backend');
		expect(result).toContain('(type:: planned)');
		expect(result).not.toContain('undefined');
	});

	it('does not include (type:: planned) for tracked entries', () => {
		const result = serializeEntry(makeEntry());
		expect(result).not.toContain('type::');
	});
});

describe('upsertEntry', () => {
	it('creates # Logs section when absent', () => {
		const result = upsertEntry('# Journal\n\nSome notes.', makeEntry());
		expect(result).toContain('# Logs');
		expect(result).toContain('^abc123');
	});

	it('inserts at the top of an existing # Logs section', () => {
		const existing = '# Logs\n\n- 08:00 - 09:00 (duration:: PT1H0M): Old task | Done (area:: [[2026]]) ^old1\n';
		const result = upsertEntry(existing, makeEntry());
		const lines = result.split('\n').filter(l => l.startsWith('- '));
		expect(lines[0]).toContain('^abc123');
		expect(lines[1]).toContain('^old1');
	});

	it('replaces an existing entry with the same id', () => {
		const original = '# Logs\n\n- 08:00 - 09:00 (duration:: PT1H0M): Old task | Old desc (area:: [[2026]]) ^abc123\n';
		const result = upsertEntry(original, makeEntry({ description: 'Updated desc' }));
		expect(result).toContain('Updated desc');
		expect(result.match(/\^abc123/g)?.length).toBe(1);
	});

	it('does not duplicate an entry on repeated writes', () => {
		const entry = makeEntry();
		const once  = upsertEntry('', entry);
		const twice = upsertEntry(once, entry);
		expect(twice.match(/\^abc123/g)?.length).toBe(1);
	});

	it('preserves content above # Logs', () => {
		const content = '# Daily Note\n\nSome prose.\n\n# Logs\n\n';
		const result = upsertEntry(content, makeEntry());
		expect(result.startsWith('# Daily Note\n\nSome prose.')).toBe(true);
	});
});
