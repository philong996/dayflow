import type { Duration } from 'luxon';
import type { Link } from '@blacksmithgu/datacore';

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
