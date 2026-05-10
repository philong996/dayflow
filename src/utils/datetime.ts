export const pad = (n: number) => String(n).padStart(2, '0');

export function fmtTime(hhmm: string): string {
	const [h, m] = hhmm.split(':').map(Number);
	const hour = h ?? 0;
	const period = hour >= 12 ? 'pm' : 'am';
	const h12 = hour % 12 || 12;
	const min = (m ?? 0) > 0 ? `:${pad(m ?? 0)}` : '';
	return `${h12}${min} ${period}`;
}

export function nowHHmm(): string {
	const d = new Date();
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtElapsed(ms: number): string {
	const secs = Math.floor(ms / 1000);
	const h    = Math.floor(secs / 3600);
	const m    = Math.floor((secs % 3600) / 60);
	const s    = secs % 60;
	return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function fmtDuration(mins: number): string {
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	if (!h) return `${m}m`;
	return m ? `${h}h ${m}m` : `${h}h`;
}

export function toMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(':').map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}

export function hourLabel(h: number): string {
	if (h === 0) return '12 am';
	if (h === 12) return '12 pm';
	return h > 12 ? `${h - 12} pm` : `${h} am`;
}

