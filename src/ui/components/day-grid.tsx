import { useState, useEffect, Fragment } from 'react';
import { DateTime, Duration } from 'luxon';
import { TimeBlock, formatDuration } from './time-block';
import type { TimeEntry } from '../../core/time-entry';

export const PX_PER_HOUR = 56;

function hourLabel(h: number): string {
	if (h === 0)  return '12 am';
	if (h === 12) return '12 pm';
	return h > 12 ? `${h - 12} pm` : `${h} am`;
}

interface DayGridProps {
	entries:      TimeEntry[];
	startHour:    number;
	endHour:      number;
	currentDate:  string;
	areaColors:   Record<string, string>;
	onSlotClick?: (time: string) => void;
}

export function DayGrid({ entries, startHour, endHour, currentDate, areaColors, onSlotClick }: DayGridProps) {
	const [now, setNow] = useState(() => DateTime.now());

	useEffect(() => {
		const id = setInterval(() => setNow(DateTime.now()), 60_000);
		return () => clearInterval(id);
	}, []);

	const totalMinutes = (endHour - startHour) * 60;
	const columnHeight = (endHour - startHour) * PX_PER_HOUR;
	const hours        = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

	const tracked = entries.filter(e => e.type === 'tracked');
	const planned = entries.filter(e => e.type === 'planned');

	// "now" indicator — only when viewing today and within visible range
	const isToday    = currentDate === DateTime.now().toISODate();
	const nowInRange = isToday && now.hour >= startHour && now.hour < endHour;
	const nowMins    = nowInRange ? (now.hour - startHour) * 60 + now.minute : null;
	const nowPct     = nowMins !== null ? (nowMins / totalMinutes) * 100 : null;

	// Header
	const dayTitle   = DateTime.fromISO(currentDate).toFormat('yyyy-MM-dd');
	const totalTime  = tracked.reduce((s, e) => s.plus(e.duration), Duration.fromMillis(0));
	const totalLabel = tracked.length > 0 ? `${formatDuration(totalTime)} tracked` : '';

	return (
		<div className="df-day-wrapper">
			<div className="df-day-header">
				<span className="df-day-title">{dayTitle}</span>
				{totalLabel && <span className="df-day-total">{totalLabel}</span>}
			</div>
			<div className="df-day-grid">
				<div className="df-hour-track" style={{ height: columnHeight }}>
					{hours.map(h => {
						const pct = ((h - startHour) / (endHour - startHour)) * 100;
						return (
							<span key={h} className="df-hour-label" style={{ top: `${pct}%` }}>
								{hourLabel(h)}
							</span>
						);
					})}
					{nowPct !== null && (
						<div className="df-now-dot" style={{ top: `${nowPct}%` }} />
					)}
				</div>

				<div
					className="df-columns-area"
					style={{ height: columnHeight }}
					onClick={onSlotClick ? (e) => {
						if ((e.target as HTMLElement).closest('.df-time-block')) return;
						const rect = e.currentTarget.getBoundingClientRect();
						const y = e.clientY - rect.top;
						const rawMins = (y / columnHeight) * totalMinutes;
						const snapped = Math.round(rawMins / 15) * 15;
						const abs = startHour * 60 + Math.max(0, Math.min(snapped, totalMinutes - 15));
						const hh = String(Math.floor(abs / 60)).padStart(2, '0');
						const mm = String(abs % 60).padStart(2, '0');
						onSlotClick(`${hh}:${mm}`);
					} : undefined}
				>
					{/* Shared dividers spanning all columns */}
					<div className="df-dividers-overlay">
						{hours.map(h => {
							const pct     = ((h - startHour) / (endHour - startHour)) * 100;
							const halfPct = ((h - startHour + 0.5) / (endHour - startHour)) * 100;
							return (
								<Fragment key={h}>
									<div className="df-hour-divider" style={{ top: `${pct}%` }} />
									<div className="df-half-divider" style={{ top: `${halfPct}%` }} />
								</Fragment>
							);
						})}
						{nowPct !== null && (
							<div className="df-now-line" style={{ top: `${nowPct}%` }} />
						)}
					</div>

					<div className="df-day-column">
						{tracked.map(entry => (
							<TimeBlock
								key={entry.id}
								entry={entry}
								startHour={startHour}
								totalMinutes={totalMinutes}
								pxPerHour={PX_PER_HOUR}
								areaColors={areaColors}
							/>
						))}
					</div>

					{planned.length > 0 && (
						<div className="df-day-column df-day-column--planned">
							{planned.map(entry => (
								<TimeBlock
									key={entry.id}
									entry={entry}
									startHour={startHour}
									totalMinutes={totalMinutes}
									pxPerHour={PX_PER_HOUR}
									areaColors={areaColors}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

