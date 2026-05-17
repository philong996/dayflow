import { Duration } from 'luxon';
import { type MarkdownListItem, type Link } from '@blacksmithgu/datacore';
import { isLink } from '../utils/datacore';
import type { ParseResult } from './parse-result';

export interface TimeEntry {
	id:           string;
	start:        string;
	end:          string;
	duration:     Duration;
	task:         string;
	subTask?:     string;
	description?: string;
	area:         string;
	project?:     Link;
	type:         'planned' | 'tracked';
}

export namespace TimeEntry {
	export function fromMarkdownListItem(item: MarkdownListItem): ParseResult<TimeEntry> {
		const id = item.$blockId;
		if (!id)
			return { ok: false, error: 'TimeEntry: missing $blockId' };

		const timeMatch = item.$text?.match(
			/(\d{2}:\d{2}) - (\d{2}:\d{2}) \(duration:: .*?\): (.*?)(?= \()/
		);
		if (!timeMatch)
			return { ok: false, error: 'TimeEntry: $text does not match time-range format' };

		const start = timeMatch[1];
		const end   = timeMatch[2];
		const body  = timeMatch[3];
		if (!start || !end || !body)
			return { ok: false, error: 'TimeEntry: incomplete time range fields' };

		const parts = body.split('|').map(s => s.trim());
		const task  = parts[0];
		if (!task)
			return { ok: false, error: 'TimeEntry: task name is empty' };

		const duration = item.$infields['duration']?.value;
		if (duration === undefined || !Duration.isDuration(duration))
			return { ok: false, error: 'TimeEntry: invalid or missing duration infield' };

		const rawArea = item.$infields['area']?.value;
		if (typeof rawArea !== 'string')
			return { ok: false, error: 'TimeEntry: area infield must be a string' };

		const rawProject = item.$infields['project']?.value;
		const project = isLink(rawProject) ? rawProject : undefined;

		const type = item.$infields['type']?.value === 'planned' ? 'planned' : 'tracked';

		let subTask: string | undefined;
		let description: string | undefined;
		if (type === 'planned') {
			subTask = parts[1] || undefined;
		} else {
			if (parts.length >= 3) {
				subTask     = parts[1] || undefined;
				description = parts[2];
			} else {
				description = parts[1] ?? '';
			}
		}

		return {
			ok:    true,
			value: { id, start, end, duration, task, subTask, description, area: rawArea, project, type },
		};
	}
}
