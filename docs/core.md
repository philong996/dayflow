# Entry Data Foundation — Implementation Details

## `time-entry.ts`

`TimeEntry` is the unified interface for both planned and tracked entries. Fields:

| field | type | notes |
|---|---|---|
| `id` | `string` | Obsidian block ID, e.g. `20260428153000000` |
| `start` | `string` | HH:mm wall clock |
| `end` | `string` | HH:mm wall clock |
| `duration` | `Duration` | Luxon Duration — derived from start/end; stored explicitly |
| `task` | `string` | first pipe segment |
| `subTask?` | `string` | second pipe segment, optional |
| `description?` | `string` | present on tracked entries only |
| `area` | `Link` | required DataCore Link |
| `project?` | `Link` | optional DataCore Link |
| `type` | `'planned' \| 'tracked'` | required — discriminates the two entry kinds |

`date` is not stored on the entry — always derived from the containing daily note.

---

## `entry-parser.ts`

`EntryParser` maps `MarkdownListItem[]` → `TimeEntry[]`. The public surface is
`parseAllEntries(blocks)` which calls `parseEntry(item)` on each block and drops nulls
with a console warning.

`parseEntry` reads `(type:: planned)` to set `type: 'planned'`; absence of the field yields
`type: 'tracked'`. Area and project are read as DataCore `Link` objects via a duck-type

---

## `daily-note-writer.ts`

Pure serializer and vault writer. Owns no note-location logic — receives a resolved `TFile`
from the caller (`EntryService`).

Public API: `writeEntry(file, entry)` reads the file content, calls `upsertEntry`, writes back.

`serializeEntry` produces a list item in this format:

```
- {start} - {end} (duration:: Xh Ym): {task} | {subTask} | {description} (area:: [[...]]) (project:: [[...]]) (type:: planned) ^{id}
```

Serialization rules:
- `(type:: planned)` appended for planned entries; omitted for tracked entries
- `subTask` and `project` omitted when absent
- `description` omitted for planned entries; body becomes `{task}` or `{task} | {subTask}`
- `duration` serialized as `Xh Ym` — DataCore stores it as a plain string, parser recovers via regex
- `area` / `project` serialized via `Link.markdown()` — e.g. `[[2026#Work]]`

`upsertEntry` locates an existing item by `^{id}` and replaces it in-place, or inserts at the
top of `# Logs` (creating the section if absent).

    
