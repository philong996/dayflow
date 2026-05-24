import { DateTime, Duration } from 'luxon';
import type { EntryService } from './entry-service';
import type { TimeEntry } from '../core/time-entry';

export type TimerState =
	| { status: 'idle' }
	| { status: 'active'; startedAt: number; entry: TimeEntry };

export class TimerService {
	constructor(
		private readonly getState:     () => TimerState,
		private readonly setState:     (s: TimerState) => Promise<void>,
		private readonly entryService: EntryService,
	) {}

	async start(entry: TimeEntry): Promise<void> {
		if (this.isRunning()) return;
		await this.setState({ status: 'active', startedAt: Date.now(), entry });
		await this.entryService.saveEntry(entry, DateTime.now().toISODate()!);
	}

	async update(changes: Partial<Omit<TimeEntry, 'id' | 'end' | 'duration' | 'type'>>): Promise<void> {
		const state = this.getState();
		if (state.status !== 'active') return;

		const updated: TimeEntry = { ...state.entry, ...changes };
		let { startedAt } = state;
		if (changes.start) {
			const [h = 0, m = 0] = changes.start.split(':').map(Number);
			startedAt = DateTime.now().set({ hour: h, minute: m, second: 0, millisecond: 0 }).toMillis();
		}
		await this.setState({ ...state, startedAt, entry: updated });
		await this.entryService.saveEntry(updated, DateTime.now().toISODate()!);
	}

	async stop(): Promise<void> {
		const state = this.getState();
		if (state.status !== 'active') return;

		const now = DateTime.now();
		const end = now.toFormat('HH:mm');
		const [sh = 0, sm = 0] = state.entry.start.split(':').map(Number);
		const [eh = 0, em = 0] = end.split(':').map(Number);

		const updated: TimeEntry = {
			...state.entry,
			end,
			duration: Duration.fromObject({ minutes: Math.max(0, eh * 60 + em - (sh * 60 + sm)) }),
		};

		await this.entryService.saveEntry(updated, now.toISODate()!);
		await this.setState({ status: 'idle' });
	}

	getElapsed(): number {
		const state = this.getState();
		return state.status === 'active' ? Date.now() - state.startedAt : 0;
	}

	getActiveEntry(): TimeEntry | null {
		const state = this.getState();
		return state.status === 'active' ? state.entry : null;
	}

	async startFromEntry(source: TimeEntry): Promise<void> {
		if (this.isRunning()) return;
		const now = DateTime.now();
		await this.start({
			id:          now.toFormat('yyyyMMddHHmmssSSS'),
			type:        'tracked',
			start:       now.toFormat('HH:mm'),
			end:         now.toFormat('HH:mm'),
			duration:    Duration.fromMillis(0),
			task:        source.task,
			subTask:     source.subTask,
			description: source.description,
			area:        source.area,
			project:     source.project,
		});
	}

	isRunning(): boolean {
		return this.getState().status === 'active';
	}
}
