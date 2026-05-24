import { useState } from 'react';
import type { TimeEntry } from '../../core/time-entry';
import { pad, fmtDuration } from '../../utils/datetime';
import { linkLabel } from '../../utils/datacore';
import { getAreaColors } from './time-block';

// ── EntryRow ──────────────────────────────────────────────────────────────────

function EntryRow({ entry, areaColors }: { entry: TimeEntry; areaColors: Record<string, string> }) {
	const [hovered, setHovered] = useState(false);
	const mins   = Math.round(entry.duration.as('minutes'));
	const colors = getAreaColors(entry.area, areaColors);

	return (
		<div
			className={`df-timer-entry${hovered ? ' hovered' : ''}`}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div className="df-timer-entry-main">
				<div className="df-timer-entry-title">
					<span className="df-timer-entry-task">{entry.task}</span>
					{entry.subTask && (
						<>
							<span className="df-timer-entry-dot">·</span>
							<span className="df-timer-entry-subtask">{entry.subTask}</span>
						</>
					)}
				</div>
				{entry.description && (
					<span className="df-timer-entry-desc">{entry.description}</span>
				)}
			</div>

			<div className="df-timer-entry-chips">
				<span
					className="df-timer-chip-area"
					style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
				>
					{entry.area}
				</span>
				{entry.project && <span className="df-timer-chip-project">{linkLabel(entry.project)}</span>}
			</div>

			<div className="df-timer-entry-right">
				<span className="df-timer-entry-dur">{fmtDuration(mins)}</span>
				<span className="df-timer-entry-span">{entry.start}-{entry.end}</span>
			</div>
		</div>
	);
}

// ── EntryList ─────────────────────────────────────────────────────────────────

export interface EntryListProps {
	entries:    TimeEntry[];
	areaColors: Record<string, string>;
}

export function EntryList({ entries, areaColors }: EntryListProps) {
	const totalMins = entries.reduce((s, e) => s + Math.round(e.duration.as('minutes')), 0);

	return (
		<>
			<div className="df-timer-list-header">
				<span className="df-timer-list-label">Today's entries</span>
				<span className="df-timer-total-badge">
					{Math.floor(totalMins / 60)}h {pad(totalMins % 60)}m
				</span>
			</div>
			{entries.length === 0 ? (
				<div className="df-timer-empty">No entries yet.</div>
			) : (
				entries.map(e => <EntryRow key={e.id} entry={e} areaColors={areaColors} />)
			)}
		</>
	);
}
