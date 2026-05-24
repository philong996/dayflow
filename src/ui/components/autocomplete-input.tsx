import { useState } from 'react';
import type { Suggestion } from '../../core/suggestion';

interface AutocompleteInputProps {
	value:       string;
	onChange:    (value: string) => void;
	onSelect:    (suggestion: Suggestion) => void;
	suggestions: Suggestion[];
	placeholder?: string;
	className?:   string;
}

export function AutocompleteInput({
	value,
	onChange,
	onSelect,
	suggestions,
	placeholder,
	className,
}: AutocompleteInputProps) {
	const [open, setOpen] = useState(false);

	const filtered = suggestions.filter(s =>
		s.name.toLowerCase().startsWith(value.toLowerCase())
	);

	const showDropdown = open && filtered.length > 0;

	return (
		<div className="df-autocomplete-root">
			<input
				value={value}
				onChange={e => onChange(e.target.value)}
				onFocus={() => setOpen(true)}
				onBlur={() => setTimeout(() => setOpen(false), 150)}
				placeholder={placeholder}
				className={className}
			/>
			{showDropdown && (
				<div className="df-autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, width: '100%' }}>
					{filtered.map(s => (
						<div
							key={`${s.type}-${s.name}-${s.subTask ?? ''}`}
							className="df-ac-row"
							onMouseDown={e => e.preventDefault()}
							onClick={() => { onSelect(s); setOpen(false); }}
						>
							<span className="df-ac-icon">
								{s.type === 'task' ? '🏷' : '↻'}
							</span>
							<div className="df-ac-body">
								<div className="df-ac-line1">
									<span className="df-ac-name">{s.name}</span>
									<span className="df-ac-context">{s.sourceName ?? s.areaName ?? ''}</span>
								</div>
								{s.subTask && <div className="df-ac-subtask">{s.subTask}</div>}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
