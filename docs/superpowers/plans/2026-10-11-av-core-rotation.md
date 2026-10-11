# A/V Core Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded Ben + 3-person A/V schedule with a two-person rotation drawn from a user-maintained core list, effective Sunday 10/25/26.

**Architecture:** A pure module (`src/lib/avRotation.js`) computes each service's crew from a list of dated "epochs" (core-list snapshots). The API stores epochs in `av_rotation_epochs`, records a new/updated epoch whenever core membership changes, and seeds the first epoch automatically. The A/V page renders the computed crew; hand-picked names always win.

**Tech Stack:** Next.js 15 app router, MongoDB driver, React, Jest (jsdom, babel).

**Spec:** `docs/superpowers/specs/2026-10-11-av-core-rotation-design.md`

## Global Constraints

- Dates are app-format strings `M/D/YY` (no zero padding), parsed as local dates.
- Services before the first epoch (10/25/26) render exactly as today: slot 1 `Ben`, slot 2 `["Doug","Jaimes","Brett"][index % 3]`.
- Rotation applies only to `type === "regular"` services; `type === "special"` → slots 1 and 2 are sign-up.
- Core changes take effect on `max(first Sunday ≥ today+7, latest epoch's effectiveDate)`; an epoch with that date is updated in place.
- Stored `team_member_1/2` always override the computed crew.
- Initial core: Ben, Doug, Jaimes, Brett, Abbey. Laila is not core.
- Never auto-commit (user rule) — tasks end at green tests; the user decides on commits.

## Review Focus

1. **Core toggled before 10/25 takes effect** — must update the seeded 10/25 epoch, never create a 10/18 epoch (10/18 must stay legacy).
2. **DST weeks** (11/1/26 fall back, March spring forward) — week count must not drift by one; pinned in Task 1 tests across both transitions.
3. **Deleted user still listed in an epoch** — deleting a core user must produce an epoch without them; covered in Task 2.
4. **Concurrent first page loads** — seed must be idempotent (upsert keyed on effectiveDate, core flags only on first insert); covered in Task 2.
5. **Fewer than 2 core members** — no crash, sign-up slots, visible warning; covered in Tasks 1 and 3.

---

### Task 1: Pure rotation module

**Files:**

- Create: `src/lib/avRotation.js`
- Test: `src/lib/avRotation.test.js`
- Modify: `src/lib/constants.js` (rename `AV_ROTATION_MEMBERS` → `AV_LEGACY_ROTATION_MEMBERS`, add `AV_ROTATION_SEED`)

**Interfaces — Produces:**

- `parseServiceDate(str) → Date`, `formatServiceDate(Date) → "M/D/YY"`
- `getEpochFor(dateStr, epochs) → epoch | null`
- `crewForTurn(members, t) → [a, b]`
- `getRotationCrew({ date, type, legacyIndex, epochs }) → { slot1, slot2, source }`, `source ∈ "legacy"|"rotation"|"signup"|"insufficient"`
- `buildNextEpoch({ epochs, coreNames, today }) → { effectiveDate, members }`

- [ ] Step 1: Write tests (legacy before 10/25; 5-person cycle Ben+Doug · Jaimes+Brett · Abbey+Ben · Doug+Jaimes · Brett+Abbey; no back-to-back over 20 weeks; 2-of-5 fairness; special → signup; N=2; N<2; even N partner shift; epoch change leaves earlier Sundays unchanged; DST + year boundary; buildNextEpoch: before-seed toggle updates 10/25, later toggle starts with who was due next, removal, addition, update-in-place).
- [ ] Step 2: Run `npx jest src/lib/avRotation.test.js` — FAIL (module missing).
- [ ] Step 3: Implement `avRotation.js`.
- [ ] Step 4: Run tests — PASS.

### Task 2: API — epochs, core flag, seed

**Files:**

- Create: `src/lib/avRotationStore.js` (`recordRotationChange(db, today)`, `ensureRotationSeeded(db)`)
- Modify: `src/app/api/av-users/route.js` (PATCH `{name, core}`; DELETE records a change if the user was core; both return `rotationEpochs`)
- Modify: `src/app/api/av-team/route.js` (GET seeds, returns `rotationEpochs`)
- Test: `src/lib/avRotationStore.test.js` (in-memory fake db)

- [ ] Step 1: Tests — seed inserts the 10/25 epoch + core flags + Abbey once; second call is a no-op; recordRotationChange upserts by effectiveDate from current core users (non-deleted, `core: true`).
- [ ] Step 2: Run — FAIL. Step 3: implement. Step 4: Run — PASS.

### Task 3: UI

**Files:**

- Modify: `src/components/ui/AVTeam.jsx` — remove `initialMembers` seed; store `rotationEpochs`; compute crew with `getRotationCrew`; sign-up buttons for slots 1/2 when `source` is `signup`/`insufficient`; allow clearing slots 1/2 from the modal; Core toggle + warning in Manage Users; warning banner when core < 2.
- Modify: `src/components/ui/MobileAVTeamCard.jsx` — take a `crew` prop instead of `rotationMembers`/hardcoded Ben; same sign-up behavior.

- [ ] Step 1: `npx jest` full suite — only the 2 pre-existing `quickAddWorkflow.e2e` failures.
- [ ] Step 2: `npx next lint` on touched files; `npx next build` compiles.
