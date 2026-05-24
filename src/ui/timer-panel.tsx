import React, { useState, useEffect, useMemo } from 'react';
import { DateTime, Duration } from 'luxon';
import { Menu } from 'obsidian';
import type { TimerService } from '../services/timer-service';
import { EntryService } from '../services/entry-service';
import { AreaService } from '../services/area-service';
import { ProjectService } from '../services/project-service';
import { TaskService } from '../services/task-service';
import type { TimeEntry } from '../core/time-entry';
import { buildSuggestions } from '../core/suggestion';
import type { Suggestion } from '../core/suggestion';
import { nowHHmm, fmtElapsed } from '../utils/datetime';
import { linkLabel, parseLinkText } from '../utils/datacore';
import { AutocompleteInput } from './components/autocomplete-input';
import { EntryList } from './components/entry-list';
import { DayGrid } from './components/day-grid';
import { PlanForm } from './components/plan-form';

// ── TimerPanel ────────────────────────────────────────────────────────────────

export interface TimerPanelProps {
	timerService:      TimerService;
	defaultArea:       string;
	revision:          number;
	areaService:       AreaService;
	projectService:    ProjectService;
	taskService:       TaskService;
	entryService:      EntryService;
	calendarStartHour: number;
	calendarEndHour:   number;
	onRefresh:         () => void;
}

export function TimerPanel({ timerService, defaultArea, revision, areaService, projectService, taskService, entryService, calendarStartHour, calendarEndHour, onRefresh }: TimerPanelProps) {
	const activeEntry = timerService.getActiveEntry();
	const running     = timerService.isRunning();

	const areas      = areaService.getAreas();
	const areaColors = areaService.getAreaColors();
	const projects   = projectService.getProjects(true);

	const [suggestionRevision, setSuggestionRevision] = useState(0);
	const suggestions = useMemo(() => buildSuggestions(taskService.getTasks([' ', '-'])), [suggestionRevision]);

	const [task,        setTask]        = useState(activeEntry?.task ?? '');
	const [subTask,     setSubTask]     = useState(activeEntry?.subTask ?? '');
	const [description, setDescription] = useState(activeEntry?.description ?? '');
	const [area,        setArea]        = useState(activeEntry?.area ?? defaultArea);
	const [project,     setProject]     = useState(
		activeEntry?.project ? linkLabel(activeEntry.project) : ''
	);
	const [elapsed,  setElapsed]  = useState(timerService.getElapsed());
	const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
	const [planForm, setPlanForm] = useState<{ date: string; initialStart: string } | null>(null);

	useEffect(() => {
		if (!activeEntry) return;
		setTask(activeEntry.task);
		setSubTask(activeEntry.subTask ?? '');
		setDescription(activeEntry.description ?? '');
		setArea(activeEntry.area);
		setProject(activeEntry.project ? linkLabel(activeEntry.project) : '');
		setElapsed(timerService.getElapsed());
	}, [activeEntry?.id]);

	const today = DateTime.now().toISODate()!;

	const trackedEntries = useMemo(
		() => entryService.fetchEntries(today, today, 'tracked'),
		[revision],
	);

	const allEntries = useMemo(
		() => entryService.fetchEntries(today, today, 'all'),
		[revision],
	);

	useEffect(() => {
		const id = setInterval(() => setElapsed(timerService.getElapsed()), 1000);
		return () => clearInterval(id);
	}, [timerService]);

	const calendarEntries: TimeEntry[] = activeEntry
		? allEntries.map(e =>
			e.id === activeEntry.id
				? { ...e, duration: Duration.fromMillis(elapsed) }
				: e
		)
		: allEntries;

	const handleSelect = (s: Suggestion) => {
		setTask(s.name);
		setSubTask(s.subTask ?? '');
		setDescription(s.description ?? '');
		setArea(s.areaName ?? area);
		setProject(s.sourceName ?? '');
	};

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
			project:     project ? (parseLinkText('[[' + project + ']]') ?? undefined) : undefined,
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

	const handleBlockContextMenu = (entry: TimeEntry, e: React.MouseEvent) => {
		if (timerService.isRunning()) return;
		const menu = new Menu();
		menu.addItem(item =>
			item
				.setTitle(entry.type === 'tracked' ? 'Continue tracking' : 'Start timer from plan')
				.setIcon('play')
				.onClick(async () => {
					await timerService.startFromEntry(entry);
					onRefresh();
				})
		);
		menu.showAtMouseEvent(e.nativeEvent as MouseEvent);
	};

	const handleSlotClick = (time: string) => setPlanForm({ date: today, initialStart: time });

	const handleSavePlan = async (entry: TimeEntry) => {
		await entryService.saveEntry(entry, planForm!.date);
		setPlanForm(null);
		onRefresh();
	};

	return (
		<div className="df-timer-root">
			<div className="df-timer-body">
				<div className="df-timer-card">
					{/* Row 1: task | clock + button */}
					<div className="df-timer-main-row">
						<div className="df-timer-task-group">
							<AutocompleteInput
								value={task}
								onChange={setTask}
								onSelect={handleSelect}
								suggestions={suggestions}
								placeholder="Task"
								className="df-timer-field df-timer-field--task"
							/>
						<input
							value={subTask}
							onChange={e => setSubTask(e.target.value)}
							placeholder="Sub-task"
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

					{/* Row 2: description */}
					<div className="df-timer-desc-row">
						<textarea
							value={description}
							onChange={e => setDescription(e.target.value)}
							placeholder="Description…"
							disabled={running}
							className="df-timer-desc"
						/>
					</div>

					{/* Row 3: area · project */}
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
						<select
							value={project}
							onChange={e => setProject(e.target.value)}
							disabled={running}
							className="df-timer-chip-input"
						>
							<option value="">Project…</option>
							{projects.map(p => (
								<option key={p.path} value={p.name}>{p.name}</option>
							))}
						</select>
						<button
							className="df-suggestions-refresh-btn"
							type="button"
							onClick={() => { setSuggestionRevision(r => r + 1); onRefresh(); }}
							title="Refresh task suggestions"
						>↻</button>
					</div>
				</div>

				{/* View toggle */}
				<div className="df-mode-toggle">
					<button
						className={`df-mode-btn${viewMode === 'list' ? ' active' : ''}`}
						onClick={() => setViewMode('list')}
						type="button"
					>List</button>
					<button
						className={`df-mode-btn${viewMode === 'calendar' ? ' active' : ''}`}
						onClick={() => setViewMode('calendar')}
						type="button"
					>Calendar</button>
				</div>
			</div>

			{/* Entry area */}
			<div className="df-timer-entry-area">
				{viewMode === 'list' ? (
					<EntryList entries={trackedEntries} areaColors={areaColors} />
				) : (
					<DayGrid
						entries={calendarEntries}
						startHour={calendarStartHour}
						endHour={calendarEndHour}
						currentDate={today}
						areaColors={areaColors}
						onSlotClick={handleSlotClick}
						onBlockContextMenu={handleBlockContextMenu}
					/>
				)}
			</div>

			{planForm && (
				<PlanForm
					initialStart={planForm.initialStart}
					defaultArea={defaultArea}
					areas={areas}
					projects={projects}
					suggestions={suggestions}
					onRefreshSuggestions={() => setSuggestionRevision(r => r + 1)}
					onSave={handleSavePlan}
					onCancel={() => setPlanForm(null)}
				/>
			)}
		</div>
	);
}
