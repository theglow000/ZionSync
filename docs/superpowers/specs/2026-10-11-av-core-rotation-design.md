# A/V Core Rotation — Design

**Date:** 2026-10-11
**Status:** Approved in conversation, awaiting written-spec review

## Goal

Replace the hardcoded A/V schedule (Ben in slot 1 every week, Doug/Jaimes/Brett
cycling slot 2) with a fair two-person rotation drawn from a **core member** list
that the user maintains in the app. Adding or removing a core member must
re-balance the rotation automatically, with no code change.

## Decisions (from the user)

| #   | Decision                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Add **Abbey** to the core rotation.                                                                                                           |
| 2   | **10/18/26 and earlier stay exactly as they are today.** The new rotation starts **Sunday 10/25/26**.                                         |
| 3   | Ben is no longer scheduled every week; he is an ordinary core member.                                                                         |
| 4   | Two rotation people per service (slots 1 and 2). Slot 3 stays an open sign-up.                                                                |
| 5   | **Laila is a sub, not core.** Subs can be hand-picked into any slot but are never auto-scheduled.                                             |
| 6   | Core membership is a toggle in **Manage Users**.                                                                                              |
| 7   | A core-list change takes effect on the **first Sunday at least 7 days out** (option b), so the coming week's crew never changes under anyone. |
| 8   | **Special services are sign-up only.** Only Sundays are in the rotation.                                                                      |

## Current behavior (for reference)

- `AVTeam.jsx` and `MobileAVTeamCard.jsx` each render slot 1 as
  `team_member_1 || "Ben"` and slot 2 as
  `team_member_2 || AV_ROTATION_MEMBERS[index % 3]`.
- `index` is the row's position in the year's service list, so the default crew
  depends on how many services precede it. Adding a midweek service shifts
  everyone after it.
- Only hand-edits are stored (`av_assignments`). Defaults are recomputed on every
  render, so changing the list today would rewrite every unedited past service.
- On load, `AVTeam.jsx` re-adds `["Ben","Doug","Jaimes","Laila","Brett"]` if
  missing — and the POST reactivates soft-deleted users, so **removing one of
  them is silently undone on the next page load.** That blocks decision 6 and is
  removed by this design.

## Design

### 1. Core flag on users

- `av_users` documents gain `core: boolean` (absent = false).
- New `PATCH /api/av-users` with `{ name, core }` sets the flag **and** records a
  rotation change (section 3) in the same request.
- Soft-deleting a core user (`DELETE /api/av-users`) also records a rotation
  change that drops them.
- Manage Users modal: each row gets a **Core** toggle next to the delete button.
  Core members sort first. If fewer than 2 people are core, a warning shows in
  the modal and above the schedule.
- The `initialMembers` auto-seed in `AVTeam.jsx` is deleted.

### 2. Which services are in the rotation

- **Rotation services:** any service whose `type` is `"regular"` (Sundays),
  including festival Sundays such as Easter, Pentecost and Advent Sundays.
- **Sign-up services:** any service whose `type` is `"special"` (special
  weekday services — Christmas Eve, Thanksgiving Eve, Ash Wednesday, Holy Week,
  midweek Advent/Lent). From 10/25/26 on, slots 1 and 2 render as **Sign Up**
  buttons like slot 3. Before 10/25/26 they keep their legacy display.
- A Sunday with several service times uses **one** rotation turn; the same crew
  is the default on every time-row for that date. Each row is still editable on
  its own.

### 3. Rotation history ("epochs")

New collection `av_rotation_epochs`:

```js
{ effectiveDate: "10/25/26",          // a Sunday, MM/DD/YY like the rest of the app
  members: ["Ben","Doug","Jaimes","Brett","Abbey"],  // rotation order
  createdAt: Date }
```

- The crew for a Sunday comes from the **latest epoch whose effectiveDate is on
  or before it**. Dates before the first epoch use the **legacy rule** unchanged
  (Ben + `["Doug","Jaimes","Brett"][index % 3]`), which is what keeps 10/18 and
  all past services exactly as they display today.
- **On a core change:** effective date = first Sunday ≥ today + 7 days.
  - If an epoch already exists with that effective date (several toggles before
    it takes effect), it is **updated in place**, not duplicated.
  - Member order: start from the order of the epoch in force on that date,
    **rotated so the list begins with whoever was due next**, then drop removed
    members and append new ones at the end. This continues the cycle instead of
    restarting it at the top.
- Epochs are returned in the existing `GET /api/av-team` response as
  `rotationEpochs`.

### 4. Crew calculation (pure function)

New module `src/lib/avRotation.js`, used by both desktop and mobile:

`getRotationCrew(date, epochs, legacyIndex) → { slot1, slot2, source }`
where `source` is `"legacy" | "rotation" | "signup" | "insufficient"`.

Within an epoch, `t` = number of whole weeks from `effectiveDate` to the
service's Sunday (calendar math, independent of the service list). With
`N = members.length`:

- **N odd** (e.g. 5): crew = `members[2t mod N]`, `members[(2t+1) mod N]`.
  Everyone serves 2 of every N Sundays, never two Sundays in a row, partners
  rotate. With the starting five:
  Ben+Doug · Jaimes+Brett · Abbey+Ben · Doug+Jaimes · Brett+Abbey · repeat.
- **N even** (e.g. 4, 6): pairs hold for one cycle of `N/2` Sundays, then the
  whole list shifts by one so partners change.
  `cycle = floor(t / (N/2))`, `k = t mod (N/2)`, `o = cycle mod N`,
  crew = `members[(o+2k) mod N]`, `members[(o+2k+1) mod N]`.
  Trade-off: a back-to-back Sunday can occur once per cycle boundary — the only
  way to rotate partners when N is even.
- **N = 2:** both every Sunday.
- **N < 2:** slots blank, `source: "insufficient"`, warning shown.

**Hand-picked names always win:** a stored `team_member_1/2` overrides the
calculated crew, before and after any epoch change.

### 5. One-time setup (automatic)

There is no local database credential, so instead of a script the setup runs
inside the app: `GET /api/av-team` calls `ensureRotationSeeded(db)`, which
upserts the first epoch keyed on `effectiveDate "10/25/26"` with members
`["Ben","Doug","Jaimes","Brett","Abbey"]`. **Only when that upsert actually
inserts** does it create Abbey (if missing) and set `core: true` on those five,
so a later manual un-core is never reverted and concurrent loads are safe.
Laila stays `core: false`.

### 6. Cleanup

- `AV_ROTATION_MEMBERS` in `constants.js` is renamed to
  `AV_LEGACY_ROTATION_MEMBERS` and used only by the legacy rule.
- The hardcoded `"Ben"` fallbacks in both components are replaced by
  `getRotationCrew`.

## Testing

Unit tests for `avRotation.js`:

- 10/18/26 and an earlier date return the legacy crew, identical to today.
- 10/25/26 onward: the 5-week cycle above, and no member on consecutive Sundays
  over 20 weeks.
- Each member serves exactly 2 of every 5 Sundays.
- A special weekday service returns `signup`.
- Adding a 6th member via a second epoch: Sundays before its effective date are
  unchanged; after it, the even-N rule applies and partners change per cycle.
- Removing a member: same before/after guarantee.
- N = 2 and N < 2.
- Multi-time Sunday: both rows get the same crew.
- Year boundary (late Dec → early Jan) keeps counting weeks.

API tests: PATCH core on/off creates an epoch 7+ days out; two toggles before it
takes effect update one epoch; deleting a core user creates an epoch.

## Out of scope

- Changing the legacy schedule for past services.
- Notifications to crew members.
- Rotating slot 3.
