import { vi } from 'vitest';

export const appHasDailyNotesPluginLoaded = vi.fn().mockReturnValue(true);
export const getAllDailyNotes             = vi.fn().mockReturnValue({});
export const getDailyNote                = vi.fn().mockReturnValue(null);
export const createDailyNote             = vi.fn().mockResolvedValue({ path: '2026-05-06.md' });
export const getDailyNoteSettings        = vi.fn().mockReturnValue({ folder: '' });
