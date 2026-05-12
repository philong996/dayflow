import { useState, useEffect, useMemo } from 'react';
import { DateTime, Duration } from 'luxon';
import type { TimerService } from '../services/timer-service';
import { AreaService } from '../services/area-service';
import type { TimeEntry } from '../core/time-entry';
import { pad, nowHHmm, fmtElapsed, fmtDuration } from '../utils/datetime';
import { linkLabel, parseLinkText } from '../utils/link';
import { getAreaColors } from './components/time-block';

// ── EntryRow ─────────────────────────────────────────────────────────────────

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

// ── TimerPanel ────────────────────────────────────────────────────────────────

export interface TimerPanelProps {
	timerService: TimerService;
	defaultArea:  string;
	revision:     number;
	areaService:  AreaService;
}

export function TimerPanel({ timerService, defaultArea, revision, areaService }: TimerPanelProps) {
	const activeEntry = timerService.getActiveEntry();
	const running     = timerService.isRunning();

	const areas      = areaService.getAreas();
	const areaColors = areaService.getAreaColors();

	const [task,        setTask]        = useState(activeEntry?.task ?? '');
	const [subTask,     setSubTask]     = useState(activeEntry?.subTask ?? '');
	const [description, setDescription] = useState(activeEntry?.description ?? '');
	const [area,        setArea]        = useState(activeEntry?.area ?? defaultArea);
	const [project,     setProject]     = useState(activeEntry?.project?.markdown() ?? '');
	const [elapsed,     setElapsed]     = useState(timerService.getElapsed());

	const entries = useMemo(
		() => timerService.fetchTodayEntries(),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[revision],
	);

	useEffect(() => {
		const id = setInterval(() => setElapsed(timerService.getElapsed()), 1000);
		return () => clearInterval(id);
	}, [timerService]);

	const totalMins = entries.reduce((s, e) => s + Math.round(e.duration.as('minutes')), 0);

	const handleStart = async () => {
		if (!area.trim()) return;
		const startTime = nowHHmm();
		const entry: TimeEntry = {
			id:          DateTime.now().toFormat('yyyyMMddHHmmssSSS'),
			start:       startTime,
			end:         startTime,
			duration:    Duration.fromMillis(0),
			task:        task.trim() || 'Untitled',
			subTask:     subTask.trim() || undefined,
			description: description.trim() || undefined,
			area:        area.trim(),
			project:     project ? (parseLinkText(project) ?? undefined) : undefined,
			type:        'tracked',
		};
		await timerService.start(entry);
		setElapsed(0);
	};

	const handleStop = async () => {
		await timerService.stop();
		setElapsed(0);
		setTask('');
		setSubTask('');
		setDescription('');
		setArea(defaultArea);
		setProject('');
	};

	return (
		<div className="df-timer-root">
			<div className="df-timer-card">
				{/* Row 1: task · subtask | clock + button */}
				<div className="df-timer-main-row">
					<div className="df-timer-task-group">
						<input
							value={task}
							onChange={e => setTask(e.target.value)}
							placeholder="Task"
							disabled={running}
							className="df-timer-field df-timer-field--task"
						/>
						<input
							value={subTask}
							onChange={e => setSubTask(e.target.value)}
							placeholder="Sub-task"
							disabled={running}
							className="df-timer-field df-timer-field--subtask"
						/>
					</div>
					<div className="df-timer-controls">
						<span className={`df-timer-clock${running ? ' running' : ''}`}>
							{fmtElapsed(elapsed)}
						</span>
						<button
							className={`df-timer-run-btn${running ? ' stop' : ' start'}`}
							onClick={running ? handleStop : handleStart}
							type="button"
						>
							{running ? (
								<><span className="df-timer-dot" />Stop</>
							) : (
								<>
									<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<polygon points="5 3 19 12 5 21 5 3" />
									</svg>
									Start
								</>
							)}
						</button>
					</div>
				</div>

				{/* Row 2: area · project */}
				<div className="df-timer-meta-row">
					<select
						value={area}
						onChange={e => setArea(e.target.value)}
						disabled={running}
						className="df-timer-chip-input"
					>
						<option value="" disabled>Area…</option>
						{areas.map(a => (
							<option key={a.name} value={a.name}>{a.name}</option>
						))}
					</select>
					<input
						value={project}
						onChange={e => setProject(e.target.value)}
						placeholder="Project…"
						disabled={running}
						className="df-timer-chip-input"
					/>
				</div>

				{/* Row 3: description */}
				<div className="df-timer-desc-row">
					<textarea
						value={description}
						onChange={e => setDescription(e.target.value)}
						placeholder="Description (optional)…"
						disabled={running}
						className="df-timer-desc"
					/>
				</div>
			</div>

			{/* Entry list */}
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
		</div>
	);
}
