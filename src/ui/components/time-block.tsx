import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Duration } from 'luxon';
import type { TimeEntry } from '../../core/time-entry';


// ─── Area colors ─────────────────────────────────────────────────────────
export interface AreaColorScheme {
	border:    string;
	blockBg:   string;
	blockText: string;
	badgeBg:   string;
	badgeText: string;
}

const DEFAULT_COLOR = '#94a3b8';

export function getAreaColors(areaName: string | undefined, areaColors: Record<string, string>): AreaColorScheme {
	const hex = (areaName && areaColors[areaName]) ?? DEFAULT_COLOR;
	return {
		border:    hex,
		blockBg:   hex + '1a',
		blockText: "#fffff",
		badgeBg:   hex + '26',
		badgeText: hex,
	};
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatTime(hhmm: string): string {
	const [h, m] = hhmm.split(':').map(Number);
	const hour = h ?? 0;
	const period = hour >= 12 ? 'pm' : 'am';
	const h12 = hour % 12 || 12;
	const min = (m ?? 0) > 0 ? `:${String(m).padStart(2, '0')}` : '';
	return `${h12}${min} ${period}`;
}

export function formatDuration(duration: Duration): string {
	const total = Math.round(duration.as('minutes'));
	const h = Math.floor(total / 60);
	const m = total % 60;
	if (h === 0) return `${m}m`;
	if (m === 0) return `${h}h`;
	return `${h}h ${m}m`;
}


function toMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(':').map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}

// ─── TimeBlock ────────────────────────────────────────────────────────────────

interface TimeBlockProps {
	entry:        TimeEntry;
	startHour:    number;
	totalMinutes: number;
	pxPerHour:    number;
	areaColors:   Record<string, string>;
}

export function TimeBlock({ entry, startHour, totalMinutes, pxPerHour, areaColors }: TimeBlockProps) {
	const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

	const offsetMinutes = toMinutes(entry.start) - startHour * 60;
	const durationMins  = entry.duration.as('minutes');
	const heightPx      = (durationMins / 60) * pxPerHour;

	const top    = (offsetMinutes / totalMinutes) * 100;
	const height = (durationMins  / totalMinutes) * 100;

	const areaKey = entry.area.subpath ?? entry.area.path.split('/').pop();
	const colors  = getAreaColors(areaKey, areaColors);

	const showSubTask = heightPx > 32 && !!entry.subTask;

	return (
		<>
			<div
				className={`df-time-block${entry.type === 'planned' ? ' df-time-block--planned' : ''}`}
				style={{
					top:             `${top}%`,
					height:          `calc(${height}% - 2px)`,
					backgroundColor: colors.blockBg,
					borderColor:     colors.border,
					color:           colors.blockText,
					opacity:         entry.type === 'planned' ? 0.75 : 1,
				}}
				onMouseMove={(e) => setTooltipPos({ x: e.clientX + 12, y: e.clientY + 12 })}
				onMouseLeave={() => setTooltipPos(null)}
			>
				<span className="df-block-task">{entry.task}</span>
				{showSubTask && <span className="df-block-subtask">{entry.subTask}</span>}
			</div>
			{tooltipPos && createPortal(
				<BlockTooltip entry={entry} colors={colors} x={tooltipPos.x} y={tooltipPos.y} />,
				document.body,
			)}
		</>
	);
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
	entry:  TimeEntry;
	colors: AreaColorScheme;
	x:      number;
	y:      number;
}

function BlockTooltip({ entry, colors, x, y }: TooltipProps) {
	const areaLabel    = entry.area.subpath ?? entry.area.path.split('/').pop() ?? entry.area.path;
	const projectLabel = entry.project
		? (entry.project.subpath ?? entry.project.path.split('/').pop() ?? entry.project.path)
		: null;

	return (
		<div className="df-tooltip" style={{ left: x, top: y }}>
			<div className="df-tooltip-task">{entry.task}</div>
			{entry.subTask && <div className="df-tooltip-subtask">{entry.subTask}</div>}
			{entry.description && (
				<div className="df-tooltip-desc">{entry.description}</div>
			)}
			<div className="df-tooltip-divider" />
			<div className="df-tooltip-time">
				{formatTime(entry.start)} – {formatTime(entry.end)} · {formatDuration(entry.duration)}
			</div>
			
			
			<div className="df-tooltip-badges">
				<span className="df-tooltip-badge" style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}>
					{areaLabel}
				</span>
				{projectLabel && (
					<span className="df-tooltip-badge df-tooltip-badge-project">{projectLabel}</span>
				)}
			</div>
			
		</div>
	);
}



