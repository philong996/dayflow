import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimerService, type TimerState } from '../../src/services/timer-service';
import { Duration } from 'luxon';
import type { TimeEntry } from '../../src/core/time-entry';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id:       '20260509090000000',
		start:    '09:00',
		end:      '09:00',
		duration: Duration.fromMillis(0),
		task:     'Write tests',
		area:     'Work',
		type:     'tracked',
		...overrides,
	};
}

function makeService(initial: TimerState = { status: 'idle' }) {
	let state: TimerState = initial;
	const setState  = vi.fn(async (s: TimerState) => { state = s; });
	const saveEntry = vi.fn().mockResolvedValue(undefined);
	const service   = new TimerService(
		() => state,
		setState,
		{ saveEntry } as any,
	);
	return { service, setState, saveEntry, getState: () => state };
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-05-09T09:00:00.000'));
});

// ─── isRunning / getElapsed ───────────────────────────────────────────────────

describe('isRunning', () => {
	it('returns false when idle', () => {
		const { service } = makeService();
		expect(service.isRunning()).toBe(false);
	});

	it('returns true when active', () => {
		const { service } = makeService({ status: 'active', startedAt: Date.now(), entry: makeEntry() });
		expect(service.isRunning()).toBe(true);
	});
});

describe('getElapsed', () => {
	it('returns 0 when idle', () => {
		const { service } = makeService();
		expect(service.getElapsed()).toBe(0);
	});

	it('returns ms since startedAt when active', () => {
		const startedAt = Date.now();
		const { service } = makeService({ status: 'active', startedAt, entry: makeEntry() });
		vi.advanceTimersByTime(5000);
		expect(service.getElapsed()).toBe(5000);
	});
});

// ─── start ────────────────────────────────────────────────────────────────────

describe('start', () => {
	it('transitions to active and writes the entry to vault', async () => {
		const { service, setState, saveEntry } = makeService();
		const entry = makeEntry();
		await service.start(entry);
		expect(setState).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', entry }));
		expect(saveEntry).toHaveBeenCalledWith(entry, '2026-05-09');
	});

	it('records startedAt as current epoch ms', async () => {
		const { service, getState } = makeService();
		await service.start(makeEntry());
		const state = getState();
		expect(state.status).toBe('active');
		if (state.status === 'active') expect(state.startedAt).toBe(Date.now());
	});

	it('is a no-op when already running', async () => {
		const entry   = makeEntry();
		const { service, setState } = makeService({ status: 'active', startedAt: Date.now(), entry });
		await service.start(makeEntry({ id: 'other' }));
		expect(setState).not.toHaveBeenCalled();
	});
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('update', () => {
	it('merges changes into the active entry and upserts to vault', async () => {
		const entry = makeEntry();
		const { service, setState, saveEntry } = makeService({ status: 'active', startedAt: Date.now(), entry });
		await service.update({ task: 'Refactor parser', start: '08:30' });
		const updated = expect.objectContaining({ task: 'Refactor parser', start: '08:30' });
		expect(setState).toHaveBeenCalledWith(expect.objectContaining({ entry: updated }));
		expect(saveEntry).toHaveBeenCalledWith(expect.objectContaining({ task: 'Refactor parser', start: '08:30' }), '2026-05-09');
	});

	it('preserves unchanged fields', async () => {
		const entry = makeEntry({ task: 'Original', subTask: 'Sub' });
		const { service, saveEntry } = makeService({ status: 'active', startedAt: Date.now(), entry });
		await service.update({ task: 'Updated' });
		expect(saveEntry).toHaveBeenCalledWith(expect.objectContaining({ subTask: 'Sub' }), expect.any(String));
	});

	it('recalculates startedAt when start time changes', async () => {
		const entry = makeEntry({ start: '09:00' });
		const { service, setState } = makeService({ status: 'active', startedAt: Date.now(), entry });
		await service.update({ start: '08:30' });
		const expected = new Date('2026-05-09T08:30:00.000').getTime();
		expect(setState).toHaveBeenCalledWith(expect.objectContaining({ startedAt: expected }));
	});

	it('is a no-op when idle', async () => {
		const { service, setState } = makeService();
		await service.update({ task: 'Ignored' });
		expect(setState).not.toHaveBeenCalled();
	});
});

// ─── stop ─────────────────────────────────────────────────────────────────────

describe('stop', () => {
	it('upserts entry with computed end time and duration, then goes idle', async () => {
		const entry = makeEntry({ start: '09:00' });
		const { service, setState, saveEntry } = makeService({ status: 'active', startedAt: Date.now(), entry });

		vi.setSystemTime(new Date('2026-05-09T10:30:00.000'));
		await service.stop();

		expect(saveEntry).toHaveBeenCalledWith(
			expect.objectContaining({ end: '10:30', duration: expect.objectContaining({ minutes: 90 }) }),
			'2026-05-09',
		);
		expect(setState).toHaveBeenCalledWith({ status: 'idle' });
	});

	it('duration is 0 when stopped at the same minute as start', async () => {
		const entry = makeEntry({ start: '09:00' });
		const { service, saveEntry } = makeService({ status: 'active', startedAt: Date.now(), entry });
		await service.stop();
		expect(saveEntry).toHaveBeenCalledWith(
			expect.objectContaining({ duration: expect.objectContaining({ minutes: 0 }) }),
			expect.any(String),
		);
	});

	it('is a no-op when idle', async () => {
		const { service, setState, saveEntry } = makeService();
		await service.stop();
		expect(setState).not.toHaveBeenCalled();
		expect(saveEntry).not.toHaveBeenCalled();
	});
});
