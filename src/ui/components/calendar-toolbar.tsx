import { DateTime } from 'luxon';
import type { CalendarMode, CalendarViewState } from '../calendar';

interface CalendarToolbarProps {
	viewState: CalendarViewState;
	onChange:  (next: CalendarViewState) => void;
	onRefresh: () => void;
}

export function CalendarToolbar({ viewState, onChange, onRefresh }: CalendarToolbarProps) {
	const modes: CalendarMode[] = ['daily', 'weekly', 'monthly'];

	const navigate = (delta: number) => {
		const next = DateTime.fromISO(viewState.currentDate).plus({ days: delta }).toISODate()!;
		onChange({ ...viewState, currentDate: next });
	};

	return (
		<div className="df-toolbar">
			<div className="df-mode-toggle">
				{modes.map(m => (
					<button
						key={m}
						className={`df-mode-btn${viewState.mode === m ? ' active' : ''}`}
						onClick={() => onChange({ ...viewState, mode: m })}
					>
						{m[0]!.toUpperCase() + m.slice(1)}
					</button>
				))}
			</div>
			<div className="df-nav">
				<button onClick={() => navigate(-1)}>←</button>
				<span className="df-current-date">{viewState.currentDate}</span>
				<button onClick={() => navigate(1)}>→</button>
				<button className="df-refresh-btn" onClick={onRefresh} title="Refresh">↺</button>
			</div>
		</div>
	);
}
