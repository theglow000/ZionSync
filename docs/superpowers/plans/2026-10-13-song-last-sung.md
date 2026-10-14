# Song "Last Sung" + Accurate Song History — Plan

Spec: `docs/superpowers/specs/2026-10-13-song-last-sung-design.md`. Executed inline, TDD per task.

## Global constraints

- Dates are app strings `M/D/YY`, parsed as local dates (reuse `parseServiceDate`/`formatServiceDate` from `src/lib/avRotation.js`).
- Production is read-only until the owner approves the push; the repair script defaults to dry-run.
- Never write per-service notes onto a song record.

## Task 1 — `src/lib/songHistory.js` (pure)

`normalizeTitle(t)`; `findPreviousUse(serviceSongsDocs, title, beforeDate) → {date, notes} | null`
(latest doc strictly before `beforeDate` whose selections contain the title); `verseLines(notes)`;
`notesToCopy(notes)` (drops "Last sung"/"Last used" lines); `describePreviousUse(prev, todayStr) →
{verb: "Last sung"|"Scheduled", date: "February 8, 2026", dayName}`.
Tests: punctuation/case/space matching, strictly-before, future → Scheduled, today boundary, no match.

## Task 2 — `serviceDayName(dateStr)` in `src/lib/serviceDayName.js`

Special day name if any; else Sundays counted within season ("Nth Sunday of Advent/Christmas/
Epiphany/Lent/Easter", "Nth Sunday after Pentecost"); non-Sunday → null.
Tests: 12/21/25 → 4th Sunday of Advent; 2/8/26 → 5th Sunday of Epiphany; 2/22/26 → 1st Sunday of Lent;
2/18/26 → Ash Wednesday; a midweek non-special → null; a Pentecost-season Sunday.

## Task 3 — server-side usage sync

`src/lib/songUsageSync.js`: `syncSongUsageForDate(db, date, selections, {service, addedBy})` makes that
date's uses match the selections (match by normalized title; new song_usage doc on first use), then
for each touched title sets `usageCount = uses.length` and recomputes rotation status (helper moved
from `api/song-usage/route.js` into the lib). Called from `api/service-songs` POST after the save.
Remove `recordSongUsage` from `ServiceSongSelector.jsx`.
Tests (fake db): add, swap removes old, unchanged is idempotent, title variants, other dates untouched.

## Task 4 — stop service saves overwriting songs

`/api/songs` POST on an existing song `$set`s only keys present in the raw body (+ lastUpdated).
Picker's upsert omits `notes`. Tests: existing notes/tags survive a picker-shaped POST; SongDatabase-shaped
full edit still updates notes.

## Task 5 — UI

`ServiceSongSelector` loads all `service_songs` (GET `/api/service-songs`) when opened and after save;
passes `previousUse` per slot to `SongSection`, which renders the R1/R5 lines and the R6 button.

## Task 6 — production scripts (`scripts/`)

`check-last-sung-notes.mjs` (read-only): compare computed line vs her 15 notes. `repair-song-history.mjs`:
dry-run prints before/after counts; `--apply` first writes JSON backups to `~/zionsync-backups/`,
then rebuilds uses from `service_songs` and clears the stale per-service song notes.

## Task 7 — verify

Full suite, build, independent review; owner approves push; run repair `--apply` after deploy; report.
