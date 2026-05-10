# Settings & Persistence — Implementation Details

## `DayFlowSettings` (`src/settings.ts`)

```ts
export interface DayFlowSettings {
  dailyNoteFolder:   string;   // default: ""  (vault root)
  dailyNoteFormat:   string;   // default: "YYYY-MM-DD"
  calendarStartHour: number;   // default: 0
  calendarEndHour:   number;   // default: 23
  defaultArea?:      string;   // pre-filled in TimerForm
  yearNotePath:      string;   // path to the year note that defines areas (e.g. "Journal/2026.md")
}

export const DEFAULT_SETTINGS: DayFlowSettings = { ... }
```

Area colors are no longer stored in settings. They are read at runtime from the year note via `AreaService` and keyed by area name.

---

## Persisted Data Envelope (`src/main.ts`)

```ts
interface PersistedData {
  settings:     DayFlowSettings;
  timerState:   TimerState | null;   // null when idle; preserves in-progress timer across reloads
  calendarView: CalendarViewState;   // last active mode + anchor date
}
```

- `TimerService.setState()` calls `plugin.saveData()` on every timer state transition
- `CalendarView` calls its `saveView` callback on every mode or navigation change
- `onload()` deserializes both states and passes them to their views before registering

---

## `DayFlowSettingTab`

Extends `PluginSettingTab`. Provides:

| Setting | Control |
|---|---|
| Daily note folder | Text input |
| Daily note filename format | Text input (with format hint) |
| Calendar start hour | Slider (0–12) |
| Calendar end hour | Slider (13–24) |
| Default area | Text input |
| Year note path | Text input — triggers `AreaService.refresh()` on change |

---

## `main.ts` Wiring

```ts
async onload() {
  const data = await this.loadData() as PersistedData | null;
  this.settings     = { ...DEFAULT_SETTINGS,       ...data?.settings };
  this.calendarView = { ...DEFAULT_CALENDAR_VIEW,  ...data?.calendarView };

  // Domain
  const locator     = new DailyNoteLocator(this.app.vault, this.settings);
  const writer      = new DailyNoteWriter(this.app);
  const datacoreApi = (this.app as any).plugins.plugins['datacore']?.api as DatacoreApi;

  // Services
  const extractor    = new DatacoreExtractor(datacoreApi, this.settings);
  const timerService = new TimerService(
    () => this.timerState,
    async s => { this.timerState = s; await this.saveData(this.buildData()); },
    writer, locator,
  );
  if (data?.timerState) this.timerState = data.timerState;

  // Views
  this.registerView('dayflow-timer',    l => new TimerPanelView(l, timerService));
  this.registerView('dayflow-calendar', l => new CalendarView(
    l, extractor, this.calendarView,
    async s => { this.calendarView = s; await this.saveData(this.buildData()); },
    this.settings,
  ));

  // Commands
  this.addCommand({ id: 'open-timer',    name: 'Open timer panel',   ... });
  this.addCommand({ id: 'open-calendar', name: 'Open day calendar',  ... });
  this.addCommand({ id: 'start-stop',    name: 'Start / stop timer', ... });

  this.addSettingTab(new DayFlowSettingTab(this.app, this));
}
```
