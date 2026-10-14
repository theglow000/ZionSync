# Song "Last Sung" + Accurate Song History — Design

Agreed in conversation with the owner on 2026-10-13 (option A chosen).

## Problem

The worship leader hand-types "Last sung February 8, 2026, the 5th Sunday of
Epiphany" into song notes (15 times since Feb 2026), plus the verses used
("Verses 1, 3, 4", ~40 times) and per-song arrangement notes she re-types each
time. Investigation of production data found three defects underneath:

1. `song_usage` is append-only. Swapping a song out of a service never removes
   its use, so 151 of 595 history entries (~1 in 4) name songs no longer on
   that service. Suggestions, the "used in the last 4 weeks" warning and the
   rediscovery panel all read this history.
2. Saving a service POSTs every selected song to `/api/songs`, which `$set`s
   the whole song with schema defaults: the per-service note becomes the
   song's permanent note (6 songs carry stale "Last sung…"/"Not sung-SNOW"),
   and `seasonalTags`/`songOrder` are reset to empty (none are stored today,
   so nothing has been lost yet).
3. Several teams plan at different distances ahead, so any "last sung" value
   must be derived live, never stored.

## Requirements

- R1 **Last-use line on each filled song card** in the worship song picker:
  `Last sung February 8, 2026 · 5th Sunday of Epiphany` when the previous use
  is before today; `Scheduled November 15, 2026 · 24th Sunday after Pentecost`
  when it is between today and this service. No previous use → `No earlier
record`. Display only; never written into notes.
- R2 **Source of truth is the current selections** (`service_songs`), so the
  line updates as other teams add, swap or remove songs. "Previous use" = the
  latest service strictly before this one whose selections contain the song.
- R3 **Title matching ignores case, spacing and punctuation**
  ("Shine, Jesus Shine" = "Shine, Jesus, Shine"; trailing spaces).
- R4 **Day names in her wording:** "Nth Sunday of Advent/Christmas/Epiphany/
  Lent/Easter", "Nth Sunday after Pentecost"; a named special day uses its
  name (Ash Wednesday, Christmas Eve, Palm Sunday…); any other weekday shows
  the date only.
- R5 **"Last time:" line** with the previous service's note lines that mention
  verses, verbatim. Omitted when there are none.
- R6 **"Copy last time's notes" button** fills the notes box with the previous
  service's note for that song, minus lines starting "Last sung"/"Last used".
  Editable before saving; only offered when the box is empty and a previous
  note exists.
- R7 **History stays in sync:** every save of a service's songs makes that
  date's `song_usage` entries exactly match its selections (add missing, remove
  swapped-out), server-side. The client-side per-song usage POST is removed.
  Rotation status and `usageCount` are recomputed for touched songs.
- R8 **Service saves never overwrite song-database fields they don't own:**
  the picker's song upsert sends no notes; `/api/songs` POST on an existing
  song only `$set`s fields present in the request body.
- R9 **One-time production repair** (run by Claude right after the push the
  owner approves): back up `song_usage` and `songs` to JSON files, rebuild
  every `uses` list from `service_songs`, clear the 6 stale per-service notes
  from `songs`, report before/after counts. "Not sung" services still count
  (owner decision).

## Out of scope

Marking a song "not sung"; changing how other features rank songs.

## Acceptance

- Computed day names and dates match her 15 hand-typed "Last sung" notes
  (read-only comparison against production; differences reported).
- Unit tests for title matching, day naming, previous-use lookup, verse
  extraction, usage sync, and partial song update.
- Full suite + build green; independent review before push.
