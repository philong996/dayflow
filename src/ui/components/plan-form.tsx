import { useState } from 'react';
import { createPortal } from 'react-dom';

export interface PlanDraft {
	start:    string;
	end:      string;
	task:     string;
	subTask?: string;
	area:     string;
	project?: string;
}

interface PlanFormProps {
	initialStart: string;
	defaultArea:  string;
	onSave:       (draft: PlanDraft) => void;
	onCancel:     () => void;
}

export function PlanForm({ initialStart, defaultArea, onSave, onCancel }: PlanFormProps) {
	const defaultEnd = computeDefaultEnd(initialStart);

	const [start,   setStart]   = useState(initialStart);
	const [end,     setEnd]     = useState(defaultEnd);
	const [task,    setTask]    = useState('');
	const [subTask, setSubTask] = useState('');
	const [area,    setArea]    = useState(defaultArea);
	const [project, setProject] = useState('');

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!start || !end || !task.trim() || !area.trim()) return;
		onSave({
			start,
			end,
			task:    task.trim(),
			subTask: subTask.trim() || undefined,
			area:    area.trim(),
			project: project.trim() || undefined,
		});
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
						<input
							className="df-plan-input"
							type="text"
							value={task}
							onChange={e => setTask(e.target.value)}
							placeholder="Task name"
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
							required
						/>
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
						<input
							className="df-plan-input"
							type="text"
							value={area}
							onChange={e => setArea(e.target.value)}
							placeholder="[[2026#Work]]"
							required
						/>
					</div>
					<div className="df-plan-row">
						<label className="df-plan-label">Project</label>
						<input
							className="df-plan-input"
							type="text"
							value={project}
							onChange={e => setProject(e.target.value)}
							placeholder="[[ProjectName]] (optional)"
						/>
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

function computeDefaultEnd(start: string): string {
	const [h = 0, m = 0] = start.split(':').map(Number);
	const total = Math.min(h * 60 + m + 30, 23 * 60 + 59);
	return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
