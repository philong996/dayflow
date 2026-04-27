# DayFlow — Build Roadmap

- [ ] Entry Data foundation: Define the core data model and the rules for storing and reading DayFlow records.  A DayFlow record can be written and parsed back without losing information.
  - [ ] Design entry data model
  - [ ] Time entry writer for daily notes
  - [ ] Time entry parser for existing notes
  - [ ] Entry validation and edge case handling for crossing the days

- [ ] Timer panel: Build the primary user flow for creating and stopping a tracked entry.  A user can start a session, fill in the required information, stop it, and persist the result.
  - [ ] Main sidebar timer panel, embed to daily note. 
  - [ ] Show live elapsed time while running
  - [ ] Command and entry point for opening the panel
  - [ ] Entry model for tracking fields and controls

- [ ] Day visualization: Build a calendar-style view for inspecting the day. Existing records are displayed in the correct position on the day view.
  - [ ] Calendar-style day view
  - [ ] Timeline grid for day visualization
  - [ ] Tracked entry placement on the timeline
  - [ ] Planned and scheduled item support
  - [ ] Hover details and interaction hooks
  - [ ] Auto-scroll to the current time

- [ ] Settings and persistence: Define the configurable parts of the plugin and how user preferences are stored.
  - [ ] Settings tab for plugin configuration
  - [ ] Persistent user preferences across vault restarts
  - [ ] Validation and error handling for write operations
  - [ ] Keyboard shortcut support for key actions
  - [ ] Destructive action confirmation

