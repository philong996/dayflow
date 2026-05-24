import { useState } from 'react';
import { createPortal } from 'react-dom';
import { DateTime, Duration } from 'luxon';
import type { Area } from '../../core/area';
import type { Project } from '../../core/project';
import type { TimeEntry } from '../../core/time-entry';
import type { Suggestion } from '../../core/suggestion';
import { parseLinkText } from '../../utils/datacore';
import { AutocompleteInput } from './autocomplete-input';

interface PlanFormProps {
	initialStart:         string;
	defaultArea:          string;
	areas:                Area[];
	projects:             Project[];
	suggestions:          Suggestion[];
	onRefreshSuggestions: () => void;
	onSave:               (entry: TimeEntry) => void;
	onCancel:             () => void;
}


function computeDefaultEnd(start: string): string {
	const [h = 0, m = 0] = start.split(':').map(Number);
	const total = Math.min(h * 60 + m + 30, 23 * 60 + 59);
	return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function PlanForm({ initialStart, defaultArea, areas, projects, suggestions, onRefreshSuggestions, onSave, onCancel }: PlanFormProps) {
	const defaultEnd = computeDefaultEnd(initialStart);

	const [start,   setStart]   = useState(initialStart);
	const [end,     setEnd]     = useState(defaultEnd);
	const [task,    setTask]    = useState('');
	const [subTask, setSubTask] = useState('');
	const [area,    setArea]    = useState(defaultArea);
	const [project, setProject] = useState('');

	const handleSelect = (s: Suggestion) => {
		setTask(s.name);
		setSubTask(s.subTask ?? '');
		setArea(s.areaName ?? area);
		setProject(s.sourceName ?? '');
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!start || !end || !task.trim() || !area.trim()) return;
		const [sh = 0, sm = 0] = start.split(':').map(Number);
		const [eh = 0, em = 0] = end.split(':').map(Number);
		const durationMins = Math.max(0, eh * 60 + em - (sh * 60 + sm));
		const entry: TimeEntry = {
			id:       DateTime.now().toFormat('yyyyMMddHHmmssSSS'),
			start,
			end,
			duration: Duration.fromObject({ minutes: durationMins }),
			task:     task.trim(),
			subTask:  subTask.trim() || undefined,
			area:     area.trim(),
			project:  project ? parseLinkText('[[' + project + ']]') ?? undefined : undefined,
			type:     'planned',
		};
		onSave(entry);
	};

	return createPortal(
		<div className="df-plan-overlay" onClick={onCancel}>
			<div className="df-plan-form" onClick={e => e.stopPropagation()}>
				<div className="df-plan-form-header">
					<span className="df-plan-form-title">New Planned Block</span>
					<button className="df-plan-close" onClick={onCancel} type="button">✕</button>
				</div>
				<form onSubmit={handleSubmit}>
					<div className="df-plan-row">
						<label className="df-plan-label">Start</label>
						<input
							className="df-plan-input"
							type="time"
							value={start}
							onChange={e => setStart(e.target.value)}
							required
						/>
					</div>
					<div className="df-plan-row">
						<label className="df-plan-label">End</label>
						<input
							className="df-plan-input"
							type="time"
							value={end}
							onChange={e => setEnd(e.target.value)}
							required
						/>
					</div>
					<div className="df-plan-row">
						<label className="df-plan-label">Task</label>
						<AutocompleteInput
							value={task}
							onChange={setTask}
							onSelect={handleSelect}
							suggestions={suggestions}
							placeholder="Task name"
							className="df-plan-input"
						/>
						<button
							className="df-suggestions-refresh-btn"
							type="button"
							onClick={onRefreshSuggestions}
							title="Refresh task suggestions"
						>↻</button>
					</div>
					<div className="df-plan-row">
						<label className="df-plan-label">Sub-task</label>
						<input
							className="df-plan-input"
							type="text"
							value={subTask}
							onChange={e => setSubTask(e.target.value)}
							placeholder="Optional"
						/>
					</div>
					<div className="df-plan-row">
						<label className="df-plan-label">Area</label>
						<select
							className="df-plan-input"
							value={area}
							onChange={e => setArea(e.target.value)}
							required
						>
							<option value="" disabled>Select area…</option>
							{areas.map(a => (
								<option key={a.name} value={a.name}>{a.name}</option>
							))}
						</select>
					</div>
					<div className="df-plan-row">
						<label className="df-plan-label">Project</label>
						<select
							className="df-plan-input"
							value={project}
							onChange={e => setProject(e.target.value)}
						>
							<option value="">No project</option>
							{projects.map(p => (
								<option key={p.path} value={p.name}>{p.name}</option>
							))}
						</select>
					</div>
					<div className="df-plan-actions">
						<button className="df-plan-btn" type="button" onClick={onCancel}>Cancel</button>
						<button className="df-plan-btn df-plan-btn--primary" type="submit">Save</button>
					</div>
				</form>
			</div>
		</div>,
		document.body,
	);
}
