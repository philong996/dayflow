import { useState, useEffect } from 'react';
import type { Suggestion } from '../../core/suggestion';

interface AutocompleteInputProps {
	value:        string;
	onChange:     (value: string) => void;
	onSelect:     (suggestion: Suggestion) => void;
	suggestions:  Suggestion[];
	placeholder?: string;
	className?:   string;
}

function getLevel(s: Suggestion): 0 | 1 | 2 {
	if (s.description) return 2;
	if (s.subTask)     return 1;
	return 0;
}

function getDisplayName(s: Suggestion): string {
	if (s.description) return s.description;
	if (s.subTask)     return s.subTask;
	return s.name;
}

function getParent(s: Suggestion): string | undefined {
	if (s.description) return s.subTask ?? s.name;
	if (s.subTask)     return s.name;
	return undefined;
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
	const [activeIndex, setActiveIndex] = useState(-1);

	useEffect(() => { setActiveIndex(-1); }, [value]);

	const filtered = suggestions.filter(s => {
		const q = value.toLowerCase();
		return s.name.toLowerCase().includes(q)
			|| s.subTask?.toLowerCase().includes(q)
			|| s.description?.toLowerCase().includes(q);
	});

	const showDropdown = open && filtered.length > 0;

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (!showDropdown) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActiveIndex(i => Math.max(i - 1, 0));
		} else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filtered.length) {
			e.preventDefault();
			onSelect(filtered[activeIndex]!);
			setOpen(false);
		} else if (e.key === 'Escape') {
			setOpen(false);
		}
	}

	return (
		<div className="df-autocomplete-root">
			<input
				value={value}
				onChange={e => onChange(e.target.value)}
				onFocus={() => setOpen(true)}
				onBlur={() => setTimeout(() => setOpen(false), 150)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				className={className}
			/>
			{showDropdown && (
				<div className="df-autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 'auto', zIndex: 50, maxWidth: '80vw' }}>
					{filtered.map((s, i) => {
						const level     = getLevel(s);
						const display   = getDisplayName(s);
						const parent    = getParent(s);
						const isActive  = i === activeIndex;

						const icon = level === 0
							? <div className={`df-ac-icon-box df-ac-icon-${s.type === 'task' ? 'task' : 'act'}`}>
								{s.type === 'task' ? '☑' : '↻'}
							  </div>
							: level === 1
								? <span className="df-ac-icon-sub">−</span>
								: <span className="df-ac-icon-desc">·</span>;

						return (
							<div
								key={`${s.type}-${s.name}-${s.subTask ?? ''}-${s.description ?? ''}`}
								className={`df-ac-row df-ac-indent-${level}${isActive ? ' active' : ''}`}
								onMouseDown={e => e.preventDefault()}
								onMouseEnter={() => setActiveIndex(i)}
								onClick={() => { onSelect(s); setOpen(false); }}
							>
								{icon}
								<div className="df-ac-label">
									<div className="df-ac-name">{display}</div>
								</div>
								<div className="df-ac-meta">
									{s.areaName   && <span className="df-ac-chip df-ac-chip-area">{s.areaName}</span>}
									{s.sourceName && <span className="df-ac-chip df-ac-chip-source">{s.sourceName}</span>}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
