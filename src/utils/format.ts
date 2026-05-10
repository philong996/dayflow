export const pad = (n: number) => String(n).padStart(2, '0');

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
