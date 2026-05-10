# DayFlow — Source Architecture

## Entry Data Foundation (`src/core/`)

Business logic and core data structures for reuse across UI and services.

- `time-entry.ts` — `TimeEntry` interface (unified for tracked and planned entries)
- `entry-parser.ts` — maps `MarkdownListItem[]` → `TimeEntry[]`
- `daily-note-writer.ts` — serializes and upserts entries into daily notes

See [[core]] for interfaces, method signatures, and serialization format.

**Read path** (calendar view):
```
CalendarViewState { mode, currentDate, options }
  └─ CALENDAR_RENDERERS[mode].getDateRange(currentDate)  ──► { startDate, endDate }
       └─ DatacoreExtractor.fetchTrackedEntries(startDate, endDate)
            └─ datacoreApi.tryQuery(query)  ──► MarkdownListItem[]
                 └─ EntryParser.parseAllEntries(blocks)  ──► TimeEntry[]
                      └─ renderer.renderGrid(entries, ...)  ──► DayGrid / month grid
```

**Write path** (timer panel):
```
TimeEntry
  └─ DailyNoteLocator.getTodayNote()  ──► TFile
       └─ DailyNoteWriter.writeEntry(file, entry)
            └─ vault.read() → upsertEntry() → vault.modify()
```

The two paths never intersect: the locator is only used for writing; DataCore handles reading.

---

## Services (`src/services/`)

- `datacore-extractor.ts` — owns `DatacoreApi`, builds queries, exposes named fetch methods; the UI never calls `datacoreApi` directly
- `timer-state.ts` — `TimerState` union (`idle | active`) and `EntryDraft` interface
- `timer-service.ts` — state machine for start/stop; constructs `TimeEntry` and writes to vault

See [[services]] for full type definitions and method details.

---

## UI (`src/ui/`)

All views extend `ItemView` and are shells only — no feature logic. Each mounts a React root in
`onOpen` and unmounts in `onClose`.

**Calendar component tree:**
```
CalendarView (ItemView)
  └─ Calendar (React)
       ├─ CalendarToolbar          mode toggle + prev/next navigation
       └─ CALENDAR_RENDERERS[mode] maps CalendarMode → CalendarRenderer subclass
            └─ CalendarRenderer (abstract)
                 ├─ getDateRange(currentDate) → { startDate, endDate }
                 └─ renderGrid(CalendarRendererProps) → JSX
                      └─ DayGrid
                           └─ TimeBlock (one per TimeEntry, absolutely positioned by %)
```

**Timer component tree:**
```
TimerPanelView (ItemView)      right sidebar, registered as 'dayflow-timer'
  └─ TimerForm (React)         form with start/stop controls
       ├─ onStart → TimerService.start()
       └─ onStop(draft) → TimerService.stop(draft)
```

See [[ui]] for state types, renderer details, and component props.

---

## Settings & Persistence (`src/settings.ts`, `src/main.ts`)

`DayFlowSettings` — user preferences stored in `data.json`.
`PersistedData` — single JSON envelope holding settings, timer state, and calendar view state.
`main.ts` — wiring only: instantiates core/service/view objects and registers commands.

See [[settings]] for interfaces, the settings tab controls, and the full `onload` wiring.

---

## End-to-End Data Flow

```
User clicks Start
  TimerService.start()
    TimerState: idle → active (startTime = now HH:mm)
    plugin.saveData()
  TimerPanelView interval fires every second
    TimerForm.updateElapsed(service.getElapsed())

User fills in action/project fields
  TimerForm fields update draft in-memory only

User clicks Stop
  TimerPanelView calls TimerService.stop(draft)
    Duration.formatDuration(start, end)        → "1h 30m"
    EntryId.generateId()                       → 20260428153000000
    construct TimeEntry
    DailyNoteLocator.getTodayNote()            → TFile
    DailyNoteWriter.writeEntry(file, entry)
      vault.read() → upsertEntry() → vault.modify()
    TimerState: active → idle
    plugin.saveData()

vault.modify() completes
  CalendarView re-renders on next interaction
    CALENDAR_RENDERERS[mode].getDateRange(currentDate)  → { startDate, endDate }
    DatacoreExtractor.fetchTrackedEntries(startDate, endDate)
      datacoreApi.tryQuery(query)              → MarkdownListItem[]
      EntryParser.parseAllEntries(blocks)      → TimeEntry[]
    renderer.renderGrid(entries, ...)
      DayGrid: derives columns; TimeBlock per entry, positioned by %

User changes mode or navigates
  CalendarView updates viewState → setViewState(next)
    saveView(next)  → plugin.saveData()
    useMemo re-instantiates CalendarRenderer if mode changed
    re-runs refresh flow above
```
