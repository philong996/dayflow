# DayFlow

DayFlow is an Obsidian community plugin for time-tracking inside the vault. Start a timer, fill in
what you worked on, stop it — the result is saved as a structured entry in the `# Logs` section of
your daily note. A day-calendar view displays your tracked sessions and planned time blocks on a
vertical timeline.

---

## Code Structure

**`src/domain/`** — Pure logic with no Obsidian UI dependency. Defines the `TimeEntry` data model,
serializes entries to and from the inline-field format used in daily notes, and resolves daily note
file paths.

**`src/services/`** — Stateful runtime layer. The timer service manages the start/stop state
machine and writes completed entries to the vault. The DataCore extractor owns the query interface
and feeds parsed entries to the UI.

**`src/ui/`** — React views mounted inside Obsidian `ItemView` panels. The calendar renders tracked
and planned entries on a time grid with daily, weekly, and monthly modes. The timer panel provides
the start/stop form.

**`src/settings.ts` + `src/main.ts`** — User preferences and plugin wiring. `main.ts` composes the
domain, service, and view objects and registers commands; no feature logic lives here.

---

## Prerequisites
- [Datacore](https://github.com/blacksmithgu/datacore) plugin must be installed and enabled in the vault
