# ZionSync Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every confirmed data-loss, injection, and correctness defect in ZionSync that can be fixed without changing stored data shapes.

**Architecture:** Three structural moves. (1) Extract the song-slot→element mapping into one shared module used by both the client and the API route, so the two writers can no longer disagree. (2) Extract line classification into one shared module with a vocabulary that separates hymn slots from liturgical songs, bound by a test to the authored templates. (3) Validate every request body with zod at the route boundary, which closes the NoSQL operator-injection class. Everything else is a localized bug fix.

**Tech Stack:** Next.js 16.0.7 (App Router), React 19, JavaScript (no TypeScript), MongoDB 6.20 driver, zod 4.1.12, Jest 29 + Testing Library, Tailwind 3.4.

**Spec:** This plan is self-contained; each task states the defect it fixes and how it was confirmed. Background analysis: https://claude.ai/code/artifact/edb5c792-3b07-494d-a6c0-daa2f922c675 (note: that artifact was written against a stale checkout and over-rates the Lord's Prayer finding — this plan supersedes it).

## Global Constraints

- Repository root is `/home/theglow000/zionsync`. This is now the main copy. The Syncthing copy at `/srv/media/syncthing/data/Tech Projects/zionsync` is a stale year-old checkout — **never read from or write to it**.
- Node 20.19.2. Package manager: npm. Install with `npm ci`, never `npm install` (the lockfile is authoritative).
- **A pre-commit hook runs `npx eslint . --max-warnings 50` and `npm test`.** Commits fail if tests fail. Task 1 must land first.
- All source is `.js`/`.jsx`. Do not introduce TypeScript. `npm run type-check` exists but there are no TS files.
- Path alias `@/` maps to `src/`.
- Line endings are LF. Do not reintroduce CRLF.
- Do not run `npm audit fix` — it will move pinned majors.
- **No task in this plan changes the shape of stored MongoDB documents.** Element IDs, the `song_N` slot convention, and `serviceDetails.content` all stay exactly as they are. The schema migration is deliberately deferred to a follow-on plan.
- Liturgical songs (`type: "liturgical_song"`) are recurring and are **never** selected by the worship team. Only `type: "song_hymn"` creates a selection slot. Never conflate these two.
- Prettier formats on commit via lint-staged. Don't hand-format.

---

## File Structure

**New files:**

- `src/lib/serviceElements.js` — the single implementation of song-slot↔element mapping. Consumed by `ServiceSongSelector.jsx` and `src/app/api/service-songs/route.js`.
- `src/lib/serviceElements.test.js` — tests for the above.
- `src/lib/elementClassifier.js` — the single line→type classifier plus its vocabulary.
- `src/lib/elementClassifier.test.js` — tests, including the template round-trip test.
- `src/lib/apiSchemas.js` — zod schemas for request bodies on mutating API routes.
- `.gitattributes` — pins LF.

**Modified files:**

- `src/lib/LiturgicalCalendarService.test.js` — two out-of-range year fixtures.
- `src/components/ui/ServiceSongSelector.jsx` — use `serviceElements.js`.
- `src/app/api/service-songs/route.js` — use `serviceElements.js`.
- `src/components/ui/WorshipTeam.jsx` — poller array/object bug.
- `src/components/ui/SignupSheet.jsx` — per-date debounce timers.
- `src/components/ui/PastorServiceInput.jsx` — label-keyed element match; use shared classifier; use authored template types.
- `src/components/ui/AddCustomService.jsx` — use shared classifier.
- `src/app/api/service-details/route.js` — use shared classifier.
- `src/app/api/users/route.js`, `signups/route.js`, `users/worship/route.js`, `custom-services/route.js`, `songs/route.js` — zod validation.
- `src/app/api/song-usage/route.js` — missing `ObjectId` import, NaN guard.
- `src/app/api/reference-songs/[id]/route.js` — `await params` for Next 16.
- `src/app/api/worship-assignments/route.js` — broken PUT.
- `next.config.mjs` — drop the `env` block.

**Deleted files:** 10 unreachable modules and 2 dead API routes (Task 13).

---

### Task 1: Unblock commits and pin line endings

The pre-commit hook runs `npm test`. Two tests fail, so **no commit can land until this is fixed.** Both failures use year `2285` (a genuine earliest-Easter year) but `validateAndNormalizeDate` rejects years above 2100. Within the supported 1970–2100 range the earliest Easter is **23 March 2008**; the latest is 25 April 2038 (already used by a passing test).

**Files:**

- Modify: `src/lib/LiturgicalCalendarService.test.js:373-377` and `:400-405`
- Create: `.gitattributes`

**Interfaces:**

- Consumes: nothing.
- Produces: a green `npm test`, which every later task depends on.

- [ ] **Step 1: Confirm the current failures**

Run: `cd ~/zionsync && npx jest src/lib/LiturgicalCalendarService.test.js 2>&1 | tail -6`

Expected: `Tests: 2 failed, ... passed`, with `Year must be between 1970 and 2100`.

- [ ] **Step 2: Fix the season-detection fixture**

In `src/lib/LiturgicalCalendarService.test.js`, replace this test:

```javascript
test("handles extreme early Easter correctly", () => {
  // March 22 is the earliest possible Easter
  const earlyEaster = new Date(2285, 2, 22);
  expect(getCurrentSeason(earlyEaster)).toBe("EASTER");
});
```

with:

```javascript
test("handles earliest Easter in the supported range correctly", () => {
  // Easter can fall as early as March 22, but the earliest occurrence
  // inside this service's supported range (1970-2100) is March 23, 2008.
  const earlyEaster = new Date(2008, 2, 23);
  expect(getCurrentSeason(earlyEaster)).toBe("EASTER");
});
```

- [ ] **Step 3: Fix the Easter-validation fixture**

Replace this test:

```javascript
test("validates earliest possible Easter (March 22)", () => {
  const result = validateEasterDate(2285);
  expect(result.isValid).toBe(true);
  expect(result.calculatedDate.getMonth()).toBe(2);
  expect(result.calculatedDate.getDate()).toBe(22);
});
```

with:

```javascript
test("validates earliest Easter in the supported range (March 23, 2008)", () => {
  const result = validateEasterDate(2008);
  expect(result.isValid).toBe(true);
  expect(result.calculatedDate.getMonth()).toBe(2);
  expect(result.calculatedDate.getDate()).toBe(23);
});
```

- [ ] **Step 4: Add a rejection test for the out-of-range year**

The old fixture was the only thing exercising the upper bound. Add this immediately after the test from Step 3, inside the same `describe("validateEasterDate")` block:

```javascript
test("rejects a year beyond the supported range", () => {
  expect(() => validateEasterDate(2285)).toThrow(/Invalid year/);
});
```

- [ ] **Step 5: Run the suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -6`
Expected: `Tests: 0 failed`, all suites pass.

- [ ] **Step 6: Create `.gitattributes`**

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.webp binary
```

- [ ] **Step 7: Commit**

```bash
cd ~/zionsync
git add .gitattributes src/lib/LiturgicalCalendarService.test.js
git commit -m "fix(test): use in-range Easter fixtures; pin LF line endings

The two failing tests used year 2285, which validateAndNormalizeDate
rejects (supported range is 1970-2100). Earliest Easter inside that
range is 2008-03-23. Adds an explicit out-of-range rejection test so
the upper bound stays covered.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 2: One shared song-slot mapper (fixes X1 and X2)

**Two defects, one cause.** The mapping from song selections to order-of-worship elements is implemented twice — once in `ServiceSongSelector.handleSubmit` and once in `POST /api/service-songs` — and both consume selections **positionally** (`songSelections[currentSongIndex++]`) rather than by slot key.

_X1 (confirmed by simulation against current code):_ `cleanSongSelections` drops any slot without a title, so a service with song 1 and song 3 chosen and song 2 still blank loads as a two-entry map. Positional consumption then writes song 3's pick onto song 2's line:

```
loaded slots: song_0, song_2
  Opening Hymn     <- Amazing Grace
  Hymn of the Day  <- How Great Thou Art     ← wrong; this is the sending song
  Sending Song     <- <Awaiting Song Selection>
```

This is the pastor/worship workflow the user described as normal ("they might know the third song while still deciding the second"), so it is corrupting orders of worship now.

_X2:_ the two implementations store the label differently — the route writes `selection.originalPrefix`, the client writes `selection.content` — and disagree about unfilled slots. The client normally wins because it writes second; when its request fails, labels degrade to "Song".

**Files:**

- Create: `src/lib/serviceElements.js`
- Create: `src/lib/serviceElements.test.js`
- Modify: `src/components/ui/ServiceSongSelector.jsx` (the `updatedElements` block around line 626)
- Modify: `src/app/api/service-songs/route.js` (the `updatedElements` block)

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `slotKeyForIndex(index: number) => string` — `0` → `"song_0"`
  - `labelForElement(element: object) => string` — `{content:"Opening Hymn: Amazing Grace #1"}` → `"Opening Hymn"`
  - `formatHymnalName(hymnal: string) => string`
  - `formatSongDetails(song: object) => string`
  - `applySelectionsToElements(elements: array, selectionsBySlot: object) => array`

- [ ] **Step 1: Write the failing test**

Create `src/lib/serviceElements.test.js`:

```javascript
import { slotKeyForIndex, labelForElement, formatSongDetails, applySelectionsToElements } from "./serviceElements.js";

const elements = [
  { id: "a", type: "song_hymn", content: "Opening Hymn:" },
  { id: "b", type: "liturgy", content: "Greeting" },
  { id: "c", type: "song_hymn", content: "Hymn of the Day:" },
  { id: "d", type: "liturgical_song", content: "Kyrie & Hymn of Praise" },
  { id: "e", type: "song_hymn", content: "Sending Song:" },
];

describe("slotKeyForIndex", () => {
  test("builds the song_N slot key", () => {
    expect(slotKeyForIndex(0)).toBe("song_0");
    expect(slotKeyForIndex(2)).toBe("song_2");
  });
});

describe("labelForElement", () => {
  test("returns the bare label from an unfilled line", () => {
    expect(labelForElement({ content: "Opening Hymn:" })).toBe("Opening Hymn");
  });

  test("returns the same label after a song has been written into the line", () => {
    expect(labelForElement({ content: "Opening Hymn: Amazing Grace #123 (Cranberry)" })).toBe("Opening Hymn");
  });

  test("handles a missing content field", () => {
    expect(labelForElement({})).toBe("");
  });
});

describe("formatSongDetails", () => {
  test("formats a hymn with number and hymnal", () => {
    expect(
      formatSongDetails({
        type: "hymn",
        title: "Amazing Grace",
        number: "123",
        hymnal: "cranberry",
      }),
    ).toBe("Amazing Grace #123 (Cranberry)");
  });

  test("formats a contemporary song with an author", () => {
    expect(
      formatSongDetails({
        type: "contemporary",
        title: "Build My Life",
        author: "Pat Barrett",
      }),
    ).toBe("Build My Life - Pat Barrett");
  });

  test("formats a contemporary song without an author", () => {
    expect(formatSongDetails({ type: "contemporary", title: "Build My Life" })).toBe("Build My Life");
  });
});

describe("applySelectionsToElements", () => {
  test("REGRESSION X1: a blank middle slot does not shift later songs up", () => {
    const result = applySelectionsToElements(elements, {
      song_0: { type: "hymn", title: "Amazing Grace", number: "123", hymnal: "cranberry" },
      song_2: { type: "hymn", title: "How Great Thou Art", number: "789", hymnal: "cranberry" },
    });

    expect(result[0].content).toBe("Opening Hymn: Amazing Grace #123 (Cranberry)");
    expect(result[2].content).toBe("Hymn of the Day: <Awaiting Song Selection>");
    expect(result[4].content).toBe("Sending Song: How Great Thou Art #789 (Cranberry)");
  });

  test("leaves non-song elements untouched", () => {
    const result = applySelectionsToElements(elements, {});
    expect(result[1]).toEqual(elements[1]);
    expect(result[3]).toEqual(elements[3]);
  });

  test("never treats a liturgical_song as a selectable slot", () => {
    const result = applySelectionsToElements(elements, {
      song_0: { type: "hymn", title: "A", number: "1", hymnal: "cranberry" },
      song_1: { type: "hymn", title: "B", number: "2", hymnal: "cranberry" },
      song_2: { type: "hymn", title: "C", number: "3", hymnal: "cranberry" },
    });
    expect(result[3].content).toBe("Kyrie & Hymn of Praise");
    expect(result[3].selection).toBeUndefined();
  });

  test("stores the label on the selection as `content`", () => {
    const result = applySelectionsToElements(elements, {
      song_0: { type: "hymn", title: "Amazing Grace", number: "123", hymnal: "cranberry" },
    });
    expect(result[0].selection.content).toBe("Opening Hymn");
    expect(result[0].selection.title).toBe("Amazing Grace");
  });

  test("clears a slot whose selection was removed", () => {
    const filled = applySelectionsToElements(elements, {
      song_0: { type: "hymn", title: "Amazing Grace", number: "123", hymnal: "cranberry" },
    });
    const cleared = applySelectionsToElements(filled, {});
    expect(cleared[0].content).toBe("Opening Hymn: <Awaiting Song Selection>");
    expect(cleared[0].selection).toBeNull();
  });

  test("returns an empty array when elements is missing", () => {
    expect(applySelectionsToElements(null, {})).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd ~/zionsync && npx jest src/lib/serviceElements.test.js`
Expected: FAIL — `Cannot find module './serviceElements.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/serviceElements.js`:

```javascript
/**
 * Single source of truth for mapping worship-team song selections onto
 * order-of-worship elements.
 *
 * Both the Worship tab (ServiceSongSelector) and POST /api/service-songs
 * import this module. They previously each had their own copy, which
 * disagreed about the shape of `selection` and about unfilled slots.
 *
 * Slot identity is the element's ordinal position among `song_hymn`
 * elements: the Nth song_hymn element owns slot `song_N`. Selections are
 * looked up BY THAT KEY, never by position in an array of values -- a
 * blank slot is dropped from the stored map, so positional consumption
 * silently shifts every later song up by one.
 *
 * `liturgical_song` elements (Kyrie, Alleluia, Create In Me, ...) recur
 * most Sundays and are never selected by the worship team. They are not
 * slots and must never be counted here.
 */

export const SONG_SLOT_PREFIX = "song_";
export const AWAITING_SELECTION = "<Awaiting Song Selection>";

/** The element type that creates a worship-team selection slot. */
export const SELECTABLE_SONG_TYPE = "song_hymn";

export function slotKeyForIndex(index) {
  return `${SONG_SLOT_PREFIX}${index}`;
}

/**
 * The pastor-authored label for a line, with any song details stripped.
 * "Opening Hymn: Amazing Grace #123 (Cranberry)" -> "Opening Hymn"
 */
export function labelForElement(element) {
  return (element?.content || "").split(":")[0].split(" - ")[0].trim();
}

export function formatHymnalName(hymnal) {
  if (!hymnal) return "";
  return hymnal.charAt(0).toUpperCase() + hymnal.slice(1);
}

export function formatSongDetails(song) {
  if (song?.type === "hymn") {
    return `${song.title} #${song.number} (${formatHymnalName(song.hymnal)})`;
  }
  return song?.author ? `${song.title} - ${song.author}` : `${song?.title}`;
}

/**
 * Returns a new elements array with each song_hymn line rewritten from
 * `selectionsBySlot`. Non-song elements are returned untouched.
 *
 * @param {Array<object>} elements order-of-worship elements
 * @param {object} selectionsBySlot map keyed "song_0", "song_1", ...
 * @returns {Array<object>}
 */
export function applySelectionsToElements(elements, selectionsBySlot) {
  if (!Array.isArray(elements)) return [];
  const selections = selectionsBySlot || {};
  let songIndex = 0;

  return elements.map((element) => {
    if (element?.type !== SELECTABLE_SONG_TYPE) return element;

    const slot = slotKeyForIndex(songIndex);
    songIndex += 1;

    const song = selections[slot];
    const label = labelForElement(element);

    if (!song?.title) {
      return { ...element, selection: null, content: `${label}: ${AWAITING_SELECTION}` };
    }

    return {
      ...element,
      selection: { ...song, content: label },
      content: `${label}: ${formatSongDetails(song)}`,
    };
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd ~/zionsync && npx jest src/lib/serviceElements.test.js`
Expected: PASS, 11 tests.

- [ ] **Step 5: Use it in the client**

In `src/components/ui/ServiceSongSelector.jsx`, add to the imports at the top:

```javascript
import { applySelectionsToElements } from "@/lib/serviceElements.js";
```

Then replace the whole `const updatedElements = serviceDetailsForDate.elements.map((element) => { ... });` block (starts around line 626, ends just before the `// Debug the final elements array` comment) with:

```javascript
const updatedElements = applySelectionsToElements(serviceDetailsForDate.elements, serviceSongStates);
```

Leave `songSelections` in place — the duplicate-song and missing-link checks above still use it. Delete the now-unused `let currentSongIndex = 0;` declaration that preceded the block.

- [ ] **Step 6: Use it in the API route**

In `src/app/api/service-songs/route.js`, add to the imports:

```javascript
import { applySelectionsToElements } from "@/lib/serviceElements.js";
```

Replace the `let currentSongIndex = 0;` line and the entire `const updatedElements = serviceDetails.elements.map((element) => { ... });` block with:

```javascript
const updatedElements = applySelectionsToElements(serviceDetails.elements, body.selections);
```

Then delete the now-unused local `formatHymnalName` helper at the bottom of that file.

- [ ] **Step 7: Run the full suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -6`
Expected: `Tests: 0 failed`.

- [ ] **Step 8: Commit**

```bash
cd ~/zionsync
git add src/lib/serviceElements.js src/lib/serviceElements.test.js \
        src/components/ui/ServiceSongSelector.jsx src/app/api/service-songs/route.js
git commit -m "fix(worship): key song slots by name, not array position

A blank song slot is dropped from the stored selections map, so consuming
Object.values() positionally shifted every later song up one line -- the
sending song was being written onto the hymn of the day. Selections are
now looked up by their song_N key.

Also collapses the two divergent copies of this mapping (client and API
route) into src/lib/serviceElements.js, so they can no longer disagree
about the selection shape or about unfilled slots.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 3: Fix the Worship tab poller iterating an array as an object

`GET /api/service-details` (no `date` param) returns an **array**. `WorshipTeam.jsx:330` does `Object.keys(data).forEach((date) => ...)`, so `date` is `"0"`, `"1"`, `"2"` — array indices. The poller writes junk numeric keys into shared state and has never refreshed the real date-keyed entries; all the merge logic beneath it is unreachable. `SignupSheet` had the same bug and was already fixed; `MainLayout.jsx` does it correctly.

**Files:**

- Modify: `src/components/ui/WorshipTeam.jsx:328-340`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing new.

- [ ] **Step 1: Confirm the defect**

Run: `cd ~/zionsync && grep -n "Object.keys(data)" src/components/ui/WorshipTeam.jsx`
Expected: one hit at line 330.

Run: `cd ~/zionsync && grep -n "data.forEach\|Array.isArray" src/components/MainLayout.jsx | head -3`
Expected: `MainLayout` converts the array with `data.forEach((detail) => ...)` keyed on `detail.date` — the correct pattern.

- [ ] **Step 2: Normalize the response before merging**

In `src/components/ui/WorshipTeam.jsx`, immediately after `const data = await response.json();` inside `fetchServiceDetails`, insert:

```javascript
// GET /api/service-details returns an ARRAY of service documents.
// Key it by date before merging -- Object.keys() on an array yields
// "0", "1", "2", which silently wrote junk keys into shared state
// and meant this poller never refreshed anything.
const byDate = Array.isArray(data)
  ? data.reduce((acc, detail) => {
      if (detail?.date) acc[detail.date] = detail;
      return acc;
    }, {})
  : data || {};
```

Then change the iteration line from:

```javascript
            Object.keys(data).forEach((date) => {
```

to:

```javascript
            Object.keys(byDate).forEach((date) => {
```

- [ ] **Step 3: Fix the two reads inside the loop**

Inside that same `forEach`, replace both occurrences of `data[date]` with `byDate[date]`:

```javascript
const newElements = byDate[date]?.elements || [];
```

and, further down in the merged object:

```javascript
              merged[date] = {
                ...prev[date],
                ...byDate[date],
```

- [ ] **Step 4: Verify no `data[` references remain in that effect**

Run: `cd ~/zionsync && sed -n '320,395p' src/components/ui/WorshipTeam.jsx | grep -n "data\[" || echo "clean"`
Expected: `clean`.

- [ ] **Step 5: Run the suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -5`
Expected: `Tests: 0 failed`.

- [ ] **Step 6: Commit**

```bash
cd ~/zionsync
git add src/components/ui/WorshipTeam.jsx
git commit -m "fix(worship): key the service-details poller by date, not array index

/api/service-details returns an array; Object.keys() on it yields \"0\",
\"1\", \"2\". The poller wrote those as state keys and never refreshed the
real date-keyed entries. Matches the pattern already used in MainLayout.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 4: Per-date debounce timers

`SignupSheet.jsx:661` stores its save debounce on `window.serviceDetailTimeout` — **one timer for the whole app**. Editing a field on one service and then touching another within 500 ms clears the first timer, so the first save never fires. The optimistic UI still shows it as saved, so the loss is silent.

**Files:**

- Modify: `src/components/ui/SignupSheet.jsx` (imports, plus `handleServiceDetailChange` around lines 648-700)

**Interfaces:**

- Consumes: nothing.
- Produces: nothing new.

- [ ] **Step 1: Confirm the defect**

Run: `cd ~/zionsync && grep -n "window.serviceDetailTimeout" src/components/ui/SignupSheet.jsx`
Expected: three hits (lines ~661, 662, 666).

- [ ] **Step 2: Add a ref to hold one timer per date+field**

`useRef` is already imported in this file (verify with `grep -n "useRef" src/components/ui/SignupSheet.jsx`; if absent, add it to the existing `react` import). Add this declaration alongside the component's other refs, before `handleServiceDetailChange`:

```javascript
// One debounce timer per date+field. This used to be a single global
// (window.serviceDetailTimeout), so editing a second field within 500ms
// cancelled the first field's save while the UI still showed it saved.
const serviceDetailTimers = useRef({});
```

- [ ] **Step 3: Replace the global timer**

Inside `handleServiceDetailChange`, replace:

```javascript
        // Clear any existing timeout
        if (window.serviceDetailTimeout) {
          clearTimeout(window.serviceDetailTimeout);
        }

        // Set new timeout for debouncing
        window.serviceDetailTimeout = setTimeout(async () => {
```

with:

```javascript
        // Clear only this field's pending save
        const timerKey = `${date}::${field}`;
        if (serviceDetailTimers.current[timerKey]) {
          clearTimeout(serviceDetailTimers.current[timerKey]);
        }

        serviceDetailTimers.current[timerKey] = setTimeout(async () => {
          delete serviceDetailTimers.current[timerKey];
```

- [ ] **Step 4: Clear pending timers on unmount**

Add this effect immediately after the ref declaration:

```javascript
useEffect(() => {
  const timers = serviceDetailTimers.current;
  return () => {
    Object.values(timers).forEach(clearTimeout);
  };
}, []);
```

- [ ] **Step 5: Verify the global is gone**

Run: `cd ~/zionsync && grep -n "window.serviceDetailTimeout" src/components/ui/SignupSheet.jsx || echo "clean"`
Expected: `clean`.

- [ ] **Step 6: Run the suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -5`
Expected: `Tests: 0 failed`.

- [ ] **Step 7: Commit**

```bash
cd ~/zionsync
git add src/components/ui/SignupSheet.jsx
git commit -m "fix(presentation): debounce saves per date+field, not globally

window.serviceDetailTimeout was a single app-wide timer, so editing a
second field within the 500ms window cancelled the first field's save
while the optimistic UI still showed it as saved.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 5: Make the pastor's type corrections durable

The pastor's confirmation screen lets him override a line's type (e.g. mark "Special Music:" as `song_hymn`). That override is preserved only by matching the line's **full text** against the previously stored elements. When the worship team fills a song, `element.content` is rewritten to `"Special Music: Amazing Grace #123"` while the service-level `content` string stays `"Special Music:"`. The keys stop matching, the classifier re-runs, and the override is lost.

Confirmed by simulation against current code:

```
After pastor confirms:      Special Music:  -> song_hymn
After worship team fills:   "Special Music: Amazing Grace #123 (Cranberry)"
Pastor reopens the modal:   Special Music:  -> liturgy      ← correction gone
   song slots remaining: 1  (should be 2)
```

Lines the classifier already guessed correctly survive by luck. **Only the lines the pastor had to correct revert** — and they revert exactly after the worship team fills them.

**Files:**

- Modify: `src/components/ui/PastorServiceInput.jsx:71-83` (map construction) and the lookup inside the `.map()` that follows

**Interfaces:**

- Consumes: nothing.
- Produces: nothing new.

- [ ] **Step 1: Reproduce the defect**

Create `src/components/ui/PastorServiceInput.override.test.js`:

```javascript
import { parseServiceContent } from "./PastorServiceInput.jsx";

describe("parseServiceContent - pastor type overrides", () => {
  const date = "1/5/25";
  const serviceContent = "Opening Hymn:\nSpecial Music:";

  test("REGRESSION: an override survives the worship team rewriting the line", () => {
    let elements = parseServiceContent(serviceContent, date, []);

    // Pastor corrects "Special Music:" from liturgy to song_hymn
    const i = elements.findIndex((e) => e.content === "Special Music:");
    elements[i] = { ...elements[i], type: "song_hymn" };

    // Worship team fills both songs: element.content is rewritten,
    // but the service-level content string is not.
    elements = elements.map((e) => (e.type !== "song_hymn" ? e : { ...e, content: `${e.content.split(":")[0].trim()}: Amazing Grace #123 (Cranberry)` }));

    // Pastor reopens the modal
    const reloaded = parseServiceContent(serviceContent, date, elements);

    expect(reloaded.filter((e) => e.type === "song_hymn")).toHaveLength(2);
    expect(reloaded.find((e) => e.content === "Special Music:").type).toBe("song_hymn");
  });

  test("an unmodified line still matches on its full text", () => {
    const elements = parseServiceContent(serviceContent, date, []);
    const reloaded = parseServiceContent(serviceContent, date, elements);
    expect(reloaded.map((e) => e.id)).toEqual(elements.map((e) => e.id));
  });
});
```

- [ ] **Step 2: Export the function so the test can reach it**

`parseServiceContent` is currently a module-private const in `PastorServiceInput.jsx`. Change its declaration from:

```javascript
const parseServiceContent = (content, dateStr, existingElements = []) => {
```

to:

```javascript
export const parseServiceContent = (content, dateStr, existingElements = []) => {
```

The default export of the component is unchanged.

- [ ] **Step 3: Run to verify it fails**

Run: `cd ~/zionsync && npx jest src/components/ui/PastorServiceInput.override.test.js`
Expected: FAIL — `Expected length: 2, Received length: 1`.

- [ ] **Step 4: Key the lookup map on the label as well as the full line**

Replace the map-construction block:

```javascript
if (existingElements && existingElements.length) {
  existingElements.forEach((el) => {
    if (el.content) {
      const key = el.content.toLowerCase().trim();
      existingElementMap[key] = el.type;
      existingContentMap[key] = el;
    }
  });
}
```

with:

```javascript
// Elements are matched to lines by text. The worship team rewrites a song
// line's content ("Opening Hymn:" -> "Opening Hymn: Amazing Grace #123"),
// so a full-text key stops matching and the line gets reclassified --
// silently discarding any type the pastor had corrected by hand. Index the
// label too, so a filled line still resolves back to its stored element.
const existingLabelMap = {};

if (existingElements && existingElements.length) {
  existingElements.forEach((el) => {
    if (!el.content) return;
    const key = el.content.toLowerCase().trim();
    existingElementMap[key] = el.type;
    existingContentMap[key] = el;

    const label = el.content.split(":")[0].trim().toLowerCase();
    // First writer wins, so duplicate labels can't steal each other's element.
    if (label && !(label in existingLabelMap)) {
      existingLabelMap[label] = el;
    }
  });
}
```

- [ ] **Step 5: Fall back to the label on lookup**

Inside the `.map()` over content lines, replace:

```javascript
const existingElement = existingContentMap[lineKey];
```

with:

```javascript
const labelKey = line.split(":")[0].trim().toLowerCase();
const existingElement = existingContentMap[lineKey] || existingLabelMap[labelKey];
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd ~/zionsync && npx jest src/components/ui/PastorServiceInput.override.test.js`
Expected: PASS, 2 tests.

- [ ] **Step 7: Run the full suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -5`
Expected: `Tests: 0 failed`.

- [ ] **Step 8: Commit**

```bash
cd ~/zionsync
git add src/components/ui/PastorServiceInput.jsx src/components/ui/PastorServiceInput.override.test.js
git commit -m "fix(pastor): keep manual element-type corrections after songs are filled

Elements were matched to order-of-worship lines by full text. The worship
team rewrites a song line's content, so the key stopped matching and the
line was reclassified from scratch -- discarding whatever type the pastor
had corrected by hand, and removing the song slot with it. Matching now
falls back to the line's label.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 6: Validate mutating request bodies (closes NoSQL operator injection)

Request bodies go straight into queries. `body.name` is JSON, so it need not be a string:

```javascript
await db.collection("signups").deleteMany({ name: body.name }); // users/route.js:48
```

`{"name":{"$ne":null}}` matches every document — **one request wipes the signups collection**. The same pattern sits on four more delete handlers as `deleteOne`, destroying one arbitrary record per call. The app is link-shared to volunteers, so this is not internet-scale exposure, but a forwarded link is enough.

`src/lib/validation.js` already provides `createValidationResponse(errors, status)`; reuse it rather than inventing a new error shape.

**Files:**

- Create: `src/lib/apiSchemas.js`
- Create: `src/lib/apiSchemas.test.js`
- Modify: `src/app/api/users/route.js`, `src/app/api/signups/route.js`, `src/app/api/users/worship/route.js`, `src/app/api/custom-services/route.js`, `src/app/api/songs/route.js`

**Interfaces:**

- Consumes: `createValidationResponse` from `@/lib/validation`.
- Produces:
  - `nameOnlySchema` — `{ name: string }`
  - `signupSchema` — `{ date: string, name: string }`
  - `idOnlySchema` — `{ id: string }`
  - `parseBody(schema, body) => { success: true, data } | { success: false, response }`

- [ ] **Step 1: Write the failing test**

Create `src/lib/apiSchemas.test.js`:

```javascript
import { nameOnlySchema, signupSchema, idOnlySchema, parseBody } from "./apiSchemas.js";

describe("parseBody", () => {
  test("accepts a well-formed body", () => {
    const result = parseBody(nameOnlySchema, { name: "Ben" });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe("Ben");
  });

  test("SECURITY: rejects a Mongo operator object in place of a string", () => {
    const result = parseBody(nameOnlySchema, { name: { $ne: null } });
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });

  test("SECURITY: rejects an operator object on a signup date", () => {
    const result = parseBody(signupSchema, { date: { $gt: "" }, name: "Ben" });
    expect(result.success).toBe(false);
  });

  test("rejects an empty name", () => {
    expect(parseBody(nameOnlySchema, { name: "" }).success).toBe(false);
  });

  test("rejects a missing body", () => {
    expect(parseBody(nameOnlySchema, null).success).toBe(false);
  });

  test("rejects an over-long name", () => {
    expect(parseBody(nameOnlySchema, { name: "x".repeat(201) }).success).toBe(false);
  });

  test("strips unknown keys rather than passing them to Mongo", () => {
    const result = parseBody(nameOnlySchema, { name: "Ben", $where: "1==1" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "Ben" });
  });

  test("idOnlySchema accepts a string id", () => {
    expect(parseBody(idOnlySchema, { id: "svc-123" }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd ~/zionsync && npx jest src/lib/apiSchemas.test.js`
Expected: FAIL — `Cannot find module './apiSchemas.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/apiSchemas.js`:

```javascript
/**
 * Request-body schemas for mutating API routes.
 *
 * These exist primarily to stop NoSQL operator injection: request bodies are
 * JSON, so a field the code assumes is a string can arrive as
 * {"$ne": null}, which matches every document. Parsing with zod forces the
 * value to a real string (or rejects it) before it can reach a query.
 *
 * zod strips unknown keys by default, so stray operator fields are dropped.
 */
import { z } from "zod";
import { createValidationResponse } from "./validation.js";

const safeString = z.string().trim().min(1).max(200);

export const nameOnlySchema = z.object({ name: safeString });

export const signupSchema = z.object({
  date: safeString,
  name: safeString,
});

export const idOnlySchema = z.object({ id: safeString });

/**
 * @returns {{success: true, data: object} | {success: false, response: Response}}
 */
export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    response: createValidationResponse(result.error.issues, 400),
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd ~/zionsync && npx jest src/lib/apiSchemas.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Apply to `DELETE /api/users`**

In `src/app/api/users/route.js`, add to the imports:

```javascript
import { nameOnlySchema, parseBody } from "@/lib/apiSchemas.js";
```

In the `DELETE` handler, replace `const body = await request.json();` and the two query calls with:

```javascript
const body = await request.json();
const parsed = parseBody(nameOnlySchema, body);
if (!parsed.success) return parsed.response;
const { name } = parsed.data;

const client = await clientPromise;
const db = client.db("church");

const deleteUserResult = await db.collection("users").deleteOne({ name });
const deleteSignupsResult = await db.collection("signups").deleteMany({ name });
```

Apply the same `nameOnlySchema` guard to the `POST` handler in this file, replacing `body.name` with the parsed `name`.

- [ ] **Step 6: Apply to the four remaining routes**

Same pattern in each:

- `src/app/api/signups/route.js` — `POST` and `DELETE` use `signupSchema`; replace `body.date` / `body.name` with parsed values.
- `src/app/api/users/worship/route.js` — `POST` and `DELETE` use `nameOnlySchema`.
- `src/app/api/custom-services/route.js` — `DELETE` uses `idOnlySchema`; replace `body.id`.
- `src/app/api/songs/route.js` — the `DELETE` handler at line ~171 uses `idOnlySchema`.

- [ ] **Step 7: Verify no raw body field reaches a delete query**

Run:

```bash
cd ~/zionsync && grep -rn "deleteOne({ name: body\.\|deleteMany({ name: body\.\|deleteOne({ id: body\." src/app/api --include=route.js || echo "clean"
```

Expected: `clean`.

- [ ] **Step 8: Run the suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -5`
Expected: `Tests: 0 failed`.

- [ ] **Step 9: Commit**

```bash
cd ~/zionsync
git add src/lib/apiSchemas.js src/lib/apiSchemas.test.js src/app/api/users/route.js \
        src/app/api/signups/route.js src/app/api/users/worship/route.js \
        src/app/api/custom-services/route.js src/app/api/songs/route.js
git commit -m "fix(api): validate request bodies to close NoSQL operator injection

Request bodies flowed straight into queries, so a JSON field the code
assumed was a string could arrive as {\"\$ne\": null} and match every
document -- one DELETE /api/users request could empty the signups
collection. Bodies on all mutating routes are now parsed with zod.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 7: Stop exposing MONGODB_URI to the bundler, and fix the broken PUT

Two independent one-file fixes.

**(a)** `next.config.mjs` lists `MONGODB_URI` in its `env` block. Next inlines `env` values into any bundle that references them. I verified the credential is **not** in the current client bundle (only the server-only `src/lib/mongodb.js` reads it), so this is a latent hazard rather than a live leak — but one `process.env.MONGODB_URI` in a client component would publish the Atlas password to every visitor. Server code reads `process.env` without the block.

**(b)** `PUT /api/worship-assignments` (line ~158) writes to `client.db(process.env.MONGODB_DB)` — **`MONGODB_DB` is defined nowhere in the repo** — and to `db.collection('assignments')` while every other operation in the file uses `worship_assignments`. It also skips the `formatDate()` normalization the GET path depends on. It sets `songsApproved` / `partialApproval`, which appear in zero components: a half-built approval feature. **It has no UI caller, so removing it changes no behavior.**

**Files:**

- Modify: `next.config.mjs`
- Modify: `src/app/api/worship-assignments/route.js` (remove the `PUT` handler)

**Interfaces:**

- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Confirm the credential is not currently in the client bundle**

Run:

```bash
cd ~/zionsync && grep -rl "mongodb+srv" .next/static/ 2>/dev/null || echo "not in client bundle (or not yet built)"
```

Expected: `not in client bundle`. If this ever prints a file, stop and escalate — the credential is live-exposed and must be rotated.

- [ ] **Step 2: Drop the `env` block**

Replace the contents of `next.config.mjs` with:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: MONGODB_URI must NOT be listed here. Next inlines `env` values into
  // any bundle that references them, so one client-side reference would ship
  // the Atlas credential to every visitor. Server code reads process.env
  // directly (see src/lib/mongodb.js).
};

export default nextConfig;
```

- [ ] **Step 3: Confirm nothing depended on `PROJECT_NAME`**

Run: `cd ~/zionsync && grep -rn "PROJECT_NAME" src/ || echo "unused"`
Expected: `unused`. If it is used, keep only that key in the `env` block.

- [ ] **Step 4: Confirm the PUT handler has no caller**

Run:

```bash
cd ~/zionsync && grep -rn "songsApproved\|partialApproval" src/components src/hooks 2>/dev/null || echo "no UI caller"
```

Expected: `no UI caller`.

- [ ] **Step 5: Remove the PUT handler**

In `src/app/api/worship-assignments/route.js`, delete the entire `export async function PUT(request) { ... }` block. Leave `GET` and `POST` untouched.

- [ ] **Step 6: Verify the stale env var reference is gone**

Run: `cd ~/zionsync && grep -rn "MONGODB_DB" src/ || echo "clean"`
Expected: `clean`.

- [ ] **Step 7: Run the suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -5`
Expected: `Tests: 0 failed`.

- [ ] **Step 8: Commit**

```bash
cd ~/zionsync
git add next.config.mjs src/app/api/worship-assignments/route.js
git commit -m "fix: stop exposing MONGODB_URI to the bundler; drop broken PUT handler

next.config listed MONGODB_URI in \`env\`, which Next inlines into any
bundle referencing it. Verified absent from the current client bundle,
but one client-side reference would have shipped the Atlas credential.

PUT /api/worship-assignments wrote to client.db(process.env.MONGODB_DB)
-- undefined everywhere in the repo -- and to a 'assignments' collection
nothing else uses. It had no UI caller.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 8: Fix the latent crash, the Next 16 breakage, and the unescaped regex

**(a)** `src/app/api/song-usage/route.js:27` calls `new ObjectId(songId)` but **never imports `ObjectId`**. The branch requires `?songId=…&rotation=true`; both current UI callers pass `?title=`, so it is unreachable today and would throw `ReferenceError` → 500 the moment anything used it.

**(b)** `src/app/api/reference-songs/[id]/route.js` accesses `params` synchronously in all three handlers. In Next 16 `params` is a Promise, so `const { id } = params` yields `undefined` and every request 400s with "Invalid song ID". The lockfile pins **Next 16.0.7**, so this is live, not future.

**(c)** `src/app/api/reference-songs/import/route.js:39` interpolates a user-supplied song title straight into a regex:

```javascript
title: { $regex: new RegExp(`^${referenceSong.title}$`, "i") },
```

A title containing regex metacharacters matches the wrong song or, with nested quantifiers, hangs the request. This route _is_ live — `QuickAddModal` posts to it.

**Files:**

- Modify: `src/app/api/song-usage/route.js`
- Modify: `src/app/api/reference-songs/[id]/route.js`
- Modify: `src/app/api/reference-songs/import/route.js`
- Create: `src/lib/escapeRegex.js`
- Create: `src/lib/escapeRegex.test.js`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Confirm both defects**

Run:

```bash
cd ~/zionsync
grep -n "new ObjectId" src/app/api/song-usage/route.js
grep -c "^import.*ObjectId" src/app/api/song-usage/route.js
grep -n "{ params }" "src/app/api/reference-songs/[id]/route.js"
node -e "console.log('next', require('./node_modules/next/package.json').version)"
```

Expected: one `new ObjectId` hit, import count `0`, three `{ params }` hits, next `16.0.7`.

- [ ] **Step 2: Add the missing import**

In `src/app/api/song-usage/route.js`, change:

```javascript
import clientPromise from "@/lib/mongodb";
```

to:

```javascript
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
```

- [ ] **Step 3: Guard the ObjectId construction**

`new ObjectId()` throws on a malformed id, which would surface as a 500. Replace the lookup line:

```javascript
        ? await db.collection("songs").findOne({ _id: new ObjectId(songId) })
```

with:

```javascript
        ? await db.collection("songs").findOne(
            ObjectId.isValid(songId) ? { _id: new ObjectId(songId) } : { _id: null },
          )
```

An invalid id now falls through to the existing "Song not found" 404 rather than a 500.

- [ ] **Step 4: Await `params` in all three handlers**

In `src/app/api/reference-songs/[id]/route.js`, change each of the three handler signatures' first statement. For `GET`, `PUT`, and `DELETE` alike, replace:

```javascript
const { id } = params;
```

with:

```javascript
const { id } = await params;
```

Then fix the three `catch` blocks, which also read `params` synchronously. Replace each occurrence of:

```javascript
console.error(`Error getting reference song ${params?.id}:`, e);
```

(and the `updating` / `deleting` variants) with the parameterless form:

```javascript
console.error("Error getting reference song:", e);
```

using `updating` / `deleting` to match each handler.

- [ ] **Step 5: Verify no synchronous params access remains**

Run:

```bash
cd ~/zionsync && grep -n "params?.id\|= params;" "src/app/api/reference-songs/[id]/route.js" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 6: Write the failing test for the regex escape**

Create `src/lib/escapeRegex.test.js`:

```javascript
import { escapeRegex } from "./escapeRegex.js";

describe("escapeRegex", () => {
  test("leaves an ordinary title untouched", () => {
    expect(escapeRegex("Amazing Grace")).toBe("Amazing Grace");
  });

  test("escapes regex metacharacters in a title", () => {
    expect(escapeRegex("Come, Thou Fount (v.2)")).toBe("Come, Thou Fount \\(v\\.2\\)");
  });

  test("an escaped title matches only itself", () => {
    const re = new RegExp(`^${escapeRegex("Rejoice! (Reprise)")}$`, "i");
    expect(re.test("Rejoice! (Reprise)")).toBe(true);
    expect(re.test("Rejoice Reprise")).toBe(false);
  });

  test("handles an empty string", () => {
    expect(escapeRegex("")).toBe("");
  });
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `cd ~/zionsync && npx jest src/lib/escapeRegex.test.js`
Expected: FAIL — `Cannot find module './escapeRegex.js'`.

- [ ] **Step 8: Write the helper**

Create `src/lib/escapeRegex.js`:

```javascript
/**
 * Escapes regex metacharacters so user-supplied text can be used inside a
 * RegExp literally. Song titles routinely contain parentheses, periods and
 * exclamation marks, which otherwise change the pattern's meaning -- or,
 * with nested quantifiers, hang the request.
 */
export function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

- [ ] **Step 9: Use it in the import route**

In `src/app/api/reference-songs/import/route.js`, add to the imports:

```javascript
import { escapeRegex } from "@/lib/escapeRegex.js";
```

and change line 39 from:

```javascript
      title: { $regex: new RegExp(`^${referenceSong.title}$`, "i") },
```

to:

```javascript
      title: { $regex: new RegExp(`^${escapeRegex(referenceSong.title)}$`, "i") },
```

- [ ] **Step 10: Verify no unescaped interpolation remains**

Run:

```bash
cd ~/zionsync && grep -rn 'new RegExp(`\^\${' src/app/api --include=route.js | grep -v escapeRegex || echo "clean"
```

Expected: `clean`.

- [ ] **Step 11: Run the suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -5`
Expected: `Tests: 0 failed`.

- [ ] **Step 12: Commit**

```bash
cd ~/zionsync
git add src/app/api/song-usage/route.js "src/app/api/reference-songs/[id]/route.js" \
        src/app/api/reference-songs/import/route.js \
        src/lib/escapeRegex.js src/lib/escapeRegex.test.js
git commit -m "fix(api): import ObjectId; await params for Next 16; escape regex input

song-usage used ObjectId without importing it -- a ReferenceError waiting
on the first ?songId= caller. reference-songs/[id] read params
synchronously; params is a Promise in Next 16 (pinned at 16.0.7 in the
lockfile), so every request was returning 'Invalid song ID'. The import
route interpolated a song title straight into a RegExp, so a title with
parentheses or a period matched the wrong song.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 9: One line classifier, with hymn slots separated from liturgical songs

There are **four** implementations of "what type is this line", and they disagree:

1. `parseServiceContent`'s inline chain — `PastorServiceInput.jsx`
2. `determineElementType` — `PastorServiceInput.jsx:320`
3. `parseServiceContent` server-side — `src/app/api/service-details/route.js`
4. `parseOrderOfWorship` — `AddCustomService.jsx:120`, vocabulary-driven with fuzzy matching

**(4) is the best implementation and is used only for custom services.** It also has a latent category bug: `liturgicalTerms.songs` mixes recurring liturgical songs (Kyrie, Alleluia, Create in Me) with hymn-slot labels ("Opening Hymn", "Hymn of the Day", "Sending Song"). Step 1 of that classifier catches the hymn labels first so it doesn't bite today, but the fuzzy fallback also reads that list — a near-miss on "Opening Hymn" would be filed `liturgical_song`, silently removing a slot the worship team needs.

Measured misclassification against the authored templates: `"The Lord's Prayer-Sung"` is authored `liturgical_song` and derived `liturgy` by both modal classifiers. That difference is display-only (amber `Music2` icon vs grey `Cross`), so it is cosmetic — but it is proof the classifiers and the templates have already drifted, with nothing detecting it.

**Files:**

- Create: `src/lib/elementClassifier.js`
- Create: `src/lib/elementClassifier.test.js`
- Modify: `src/components/ui/PastorServiceInput.jsx` (delete `determineElementType`, delegate from `parseServiceContent`)
- Modify: `src/components/ui/AddCustomService.jsx` (delegate from `parseOrderOfWorship`)
- Modify: `src/app/api/service-details/route.js` (delegate from its local `parseServiceContent`)

**Interfaces:**

- Consumes: `string-similarity` (already a direct dependency).
- Produces:
  - `ELEMENT_TYPES` — `{ LITURGY, SONG_HYMN, LITURGICAL_SONG, READING, MESSAGE }`
  - `HYMN_SLOT_TERMS: string[]` — labels that create a worship-team slot
  - `LITURGICAL_SONG_TERMS: string[]` — recurring songs, never selected
  - `classifyLine(line: string) => string` — one of `ELEMENT_TYPES`
  - `suggestTermForLine(line: string) => {suggestion: string, rating: number} | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/elementClassifier.test.js`:

```javascript
import { classifyLine, ELEMENT_TYPES } from "./elementClassifier.js";
import { getStandardServiceElements } from "@/components/ui/PastorServiceInput.jsx";

describe("classifyLine", () => {
  test("classifies hymn slots that the worship team must fill", () => {
    expect(classifyLine("Opening Hymn:")).toBe(ELEMENT_TYPES.SONG_HYMN);
    expect(classifyLine("Hymn of the Day:")).toBe(ELEMENT_TYPES.SONG_HYMN);
    expect(classifyLine("Sending Song:")).toBe(ELEMENT_TYPES.SONG_HYMN);
  });

  test("classifies recurring liturgical songs, which are never selected", () => {
    expect(classifyLine("Kyrie & Hymn of Praise")).toBe(ELEMENT_TYPES.LITURGICAL_SONG);
    expect(classifyLine("Gospel Acclamation - Alleluia (pg. 102)")).toBe(ELEMENT_TYPES.LITURGICAL_SONG);
    expect(classifyLine("The Lord's Prayer-Sung")).toBe(ELEMENT_TYPES.LITURGICAL_SONG);
  });

  test("does not treat the spoken Lord's Prayer as a song", () => {
    expect(classifyLine("The Lord's Prayer")).toBe(ELEMENT_TYPES.LITURGY);
  });

  test("classifies readings and messages", () => {
    expect(classifyLine("Gospel Reading:")).toBe(ELEMENT_TYPES.READING);
    expect(classifyLine("Sermon:")).toBe(ELEMENT_TYPES.MESSAGE);
  });

  test("treats a children's message as liturgy, not a sermon", () => {
    expect(classifyLine("Children's Message")).toBe(ELEMENT_TYPES.LITURGY);
  });

  test("REGRESSION: a hymn slot is never demoted to a liturgical song", () => {
    // "Opening Hymn" used to live in the liturgical-song vocabulary, so a
    // fuzzy match could file a real slot as a non-selectable song.
    expect(classifyLine("Openning Hymn:")).toBe(ELEMENT_TYPES.SONG_HYMN);
    expect(classifyLine("Opening Hymn")).toBe(ELEMENT_TYPES.SONG_HYMN);
  });

  test("falls back to liturgy for an unrecognized line", () => {
    expect(classifyLine("Prelude & Lighting of Candles")).toBe(ELEMENT_TYPES.LITURGY);
  });
});

describe("template round-trip", () => {
  // The authored templates are the contract. If the classifier and the
  // templates ever disagree, one of them is wrong -- this catches it.
  test("every authored template line classifies to its authored type", () => {
    const templates = getStandardServiceElements("1/5/25");
    const mismatches = [];

    Object.entries(templates).forEach(([serviceType, elements]) => {
      elements.forEach((element) => {
        const derived = classifyLine(element.content);
        if (derived !== element.type) {
          mismatches.push(`${serviceType}: "${element.content}" authored=${element.type} derived=${derived}`);
        }
      });
    });

    expect(mismatches).toEqual([]);
  });
});
```

- [ ] **Step 2: Export the templates so the round-trip test can read them**

In `src/components/ui/PastorServiceInput.jsx`, change:

```javascript
const getStandardServiceElements = (date) => ({
```

to:

```javascript
export const getStandardServiceElements = (date) => ({
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd ~/zionsync && npx jest src/lib/elementClassifier.test.js`
Expected: FAIL — `Cannot find module './elementClassifier.js'`.

- [ ] **Step 4: Write the implementation**

Create `src/lib/elementClassifier.js`:

```javascript
/**
 * Single implementation of "what kind of order-of-worship line is this".
 *
 * Previously duplicated four times (twice in PastorServiceInput, once in the
 * service-details API route, once in AddCustomService), with no test binding
 * them to the authored templates. They had already drifted.
 *
 * The two song categories are deliberately kept in separate vocabularies:
 *
 *   SONG_HYMN       - a slot the worship team must fill each week.
 *   LITURGICAL_SONG - a recurring sung element (Kyrie, Alleluia, ...) that
 *                     is sung most Sundays and is NEVER selected.
 *
 * Mixing them is a real hazard: a hymn slot misfiled as a liturgical song
 * silently disappears from the worship team's list.
 */
import stringSimilarity from "string-similarity";

export const ELEMENT_TYPES = {
  LITURGY: "liturgy",
  SONG_HYMN: "song_hymn",
  LITURGICAL_SONG: "liturgical_song",
  READING: "reading",
  MESSAGE: "message",
};

/** Labels that create a worship-team selection slot. */
export const HYMN_SLOT_TERMS = ["hymn:", "hymn of the day", "opening hymn", "sending song", "sending hymn", "closing hymn", "anthem:", "song:"];

/** Recurring sung elements. Never selected by the worship team. */
export const LITURGICAL_SONG_TERMS = ["kyrie", "alleluia", "gospel acclamation", "canticle", "create in me", "change my heart", "lamb of god", "glory to god", "this is the feast", "hymn of praise", "lord's prayer-sung"];

export const READING_TERMS = ["reading:", "lesson:", "psalm:", "gospel:", "first reading", "second reading", "gospel reading", "psalm reading"];

export const MESSAGE_TERMS = ["sermon:", "message:"];

const includesAny = (haystack, terms) => terms.some((term) => haystack.includes(term));

/**
 * @param {string} line a single order-of-worship line
 * @returns {string} one of ELEMENT_TYPES
 */
export function classifyLine(line) {
  const lower = (line || "").toLowerCase().trim();
  if (!lower) return ELEMENT_TYPES.LITURGY;

  // A children's message is liturgy, not a sermon. Checked first because
  // "message" would otherwise match MESSAGE_TERMS.
  if (lower.includes("children")) return ELEMENT_TYPES.LITURGY;

  // Hymn slots outrank liturgical songs: "Opening Hymn" must never be
  // demoted to a non-selectable liturgical song.
  if (includesAny(lower, HYMN_SLOT_TERMS)) return ELEMENT_TYPES.SONG_HYMN;

  if (includesAny(lower, LITURGICAL_SONG_TERMS)) return ELEMENT_TYPES.LITURGICAL_SONG;
  if (includesAny(lower, READING_TERMS)) return ELEMENT_TYPES.READING;
  if (includesAny(lower, MESSAGE_TERMS)) return ELEMENT_TYPES.MESSAGE;

  return ELEMENT_TYPES.LITURGY;
}

/**
 * Suggests a known term for a line that matched nothing, for the custom
 * service editor's "did you mean" hint. Suggestion only -- it never
 * changes a classification.
 *
 * @returns {{suggestion: string, rating: number} | null}
 */
export function suggestTermForLine(line) {
  const lower = (line || "").toLowerCase().trim();
  if (!lower) return null;

  const dictionary = [...HYMN_SLOT_TERMS, ...LITURGICAL_SONG_TERMS, ...READING_TERMS];
  if (dictionary.some((term) => lower.includes(term))) return null;

  const matches = stringSimilarity.findBestMatch(lower, dictionary);
  const threshold = lower.includes(" ") ? 0.8 : 0.6;
  if (matches.bestMatch.rating > threshold) {
    return {
      suggestion: dictionary[matches.bestMatchIndex],
      rating: matches.bestMatch.rating,
    };
  }
  return null;
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd ~/zionsync && npx jest src/lib/elementClassifier.test.js`
Expected: PASS, 8 tests — including the template round-trip.

- [ ] **Step 6: Delegate from `PastorServiceInput`**

Add to that file's imports:

```javascript
import { classifyLine } from "@/lib/elementClassifier.js";
```

Inside `parseServiceContent`, replace the entire inline `let type = "liturgy"; ... if/else-if` chain with:

```javascript
const type = classifyLine(line);
```

Then delete the whole `const determineElementType = (line) => { ... };` function (line ~320) and any references to it.

- [ ] **Step 7: Delegate from `AddCustomService`**

Add to its imports:

```javascript
import { classifyLine, suggestTermForLine } from "@/lib/elementClassifier.js";
```

Replace the body of `parseOrderOfWorship`'s `.map()` with:

```javascript
return lines.map((line) => {
  const type = classifyLine(line);
  const match = type === "liturgy" ? suggestTermForLine(line) : null;
  return { content: line.trim(), type, suggestion: match?.suggestion || null };
});
```

Then delete the now-unused local `liturgicalTerms` object and `findClosestMatch` function, and the `string-similarity` import if nothing else in the file uses it.

- [ ] **Step 8: Delegate from the API route**

In `src/app/api/service-details/route.js`, add:

```javascript
import { classifyLine } from "@/lib/elementClassifier.js";
```

and replace the local `parseServiceContent`'s inline type chain with `const type = classifyLine(line);`, keeping the surrounding `content.split("\n").map(...)` shape intact.

- [ ] **Step 9: Verify only one classifier remains**

Run:

```bash
cd ~/zionsync && grep -rn 'includes("kyrie")' src/ | grep -v elementClassifier || echo "single classifier"
```

Expected: `single classifier`.

- [ ] **Step 10: Run the suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -5`
Expected: `Tests: 0 failed`.

- [ ] **Step 11: Commit**

```bash
cd ~/zionsync
git add src/lib/elementClassifier.js src/lib/elementClassifier.test.js \
        src/components/ui/PastorServiceInput.jsx src/components/ui/AddCustomService.jsx \
        src/app/api/service-details/route.js
git commit -m "refactor: one line classifier, hymn slots split from liturgical songs

Four copies of the line-type rules existed and had already drifted --
\"The Lord's Prayer-Sung\" is authored liturgical_song and was derived as
liturgy. Consolidates them into src/lib/elementClassifier.js with a test
asserting every authored template line classifies to its authored type.

Splits the vocabulary: hymn slots (worship team must fill) can no longer
be confused with recurring liturgical songs (never selected). The old
custom-service fuzzy matcher read a list containing both, so a near-miss
on \"Opening Hymn\" could have silently removed a slot.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 10: Delete dead code

Ten modules are unreachable from any entry point (verified by import-graph traversal from `src/app/**/{page,layout,route}.js*`), and two API routes have no UI caller and are actively broken.

`POST /api/services/add-song` reads and writes `db.collection("service_details")` — **underscore** — while the whole app uses `"serviceDetails"`. It is talking to a collection nothing else can see, yet still writes to the real `service_songs` and `song_usage`. It introduces a third slot-identity scheme (`element.position`). Wiring it up would corrupt data.

`/api/worship-indexes` hardcodes a three-slot model (`opening`, `dayHymn`, `sending`) — the ancestor of today's positional model — and owns `worship_selections` and `song_history`, which nothing else touches.

**The five read-only `song-usage/*` analytics routes are NOT deleted.** They are finished backends with no UI — unfinished features, not dead code. Leave them.

**Files:**

- Delete: `src/components/debug/SongAutocompleteDebugger.jsx`, `src/components/shared/Toast.jsx`, `src/components/ui/SeasonalTips.jsx`, `src/components/ui/SimpleProgress.jsx`, `src/components/ui/progress.jsx`, `src/lib/CongregationComfortAnalyzer.js`, `src/lib/SongMatcher.js`, `src/lib/SongUsageAnalyzer.js`, `src/models/ReferenceSong.js`, `src/models/ServiceCalendar.js`
- Delete: `src/app/api/services/add-song/` (route + its test), `src/app/api/worship-indexes/`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Re-confirm unreachability immediately before deleting**

Run this from `~/zionsync`:

```bash
cd ~/zionsync && python3 - <<'EOF'
import os, re
files = {}
for dp, _, fns in os.walk('src'):
    for fn in fns:
        if fn.endswith(('.js', '.jsx')) and '.test.' not in fn:
            p = os.path.join(dp, fn)
            files[p] = open(p, encoding='utf8', errors='ignore').read()

def resolve(imp, cur):
    if imp.startswith('@/'): base = os.path.join('src', imp[2:])
    elif imp.startswith('.'): base = os.path.normpath(os.path.join(os.path.dirname(cur), imp))
    else: return None
    for c in (base, base + '.js', base + '.jsx', base + '/index.js', base + '/index.jsx'):
        if c in files: return c
    return None

graph = {f: set() for f in files}
for f, src in files.items():
    for imp in re.findall(r"from\s+['\"]([^'\"]+)['\"]", src):
        r = resolve(imp, f)
        if r: graph[f].add(r)

entries = [f for f in files if re.search(r'src/app/.*(page|layout|route)\.jsx?$', f)]
seen, stack = set(), list(entries)
while stack:
    n = stack.pop()
    if n in seen: continue
    seen.add(n); stack.extend(graph[n])

for d in sorted(set(files) - seen):
    if '/scripts/' not in d:
        print("DEAD:", d)
EOF
```

Expected: exactly the ten files listed above. **If the list differs, stop and reconcile before deleting anything.**

- [ ] **Step 2: Confirm the two routes have no caller**

Run:

```bash
cd ~/zionsync
grep -rn "services/add-song" src/components src/hooks src/lib 2>/dev/null || echo "add-song: no caller"
grep -rn "worship-indexes" src/components src/hooks src/lib 2>/dev/null || echo "worship-indexes: no caller"
```

Expected: both `no caller`.

- [ ] **Step 3: Delete the unreachable modules**

```bash
cd ~/zionsync
git rm src/components/debug/SongAutocompleteDebugger.jsx \
       src/components/shared/Toast.jsx \
       src/components/ui/SeasonalTips.jsx \
       src/components/ui/SimpleProgress.jsx \
       src/components/ui/progress.jsx \
       src/lib/CongregationComfortAnalyzer.js \
       src/lib/SongMatcher.js \
       src/lib/SongUsageAnalyzer.js \
       src/models/ReferenceSong.js \
       src/models/ServiceCalendar.js
```

- [ ] **Step 4: Delete the two broken routes**

```bash
cd ~/zionsync
git rm -r src/app/api/services/add-song src/app/api/worship-indexes
```

- [ ] **Step 5: Run the suite**

Run: `cd ~/zionsync && npm test 2>&1 | tail -6`
Expected: `Tests: 0 failed`. The suite count drops — `src/app/api/services/add-song/route.test.js` went with its route.

- [ ] **Step 6: Verify lint still passes**

Run: `cd ~/zionsync && npx eslint . --max-warnings 50 2>&1 | tail -5`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd ~/zionsync
git commit -m "chore: remove dead modules and two broken uncalled routes

Ten modules unreachable from any entry point by import-graph traversal.

POST /api/services/add-song read and wrote collection 'service_details'
(underscore) while the app uses 'serviceDetails' -- a collection nothing
else can see -- yet still wrote to the real service_songs and song_usage.
/api/worship-indexes is the superseded three-slot design.

The five read-only song-usage analytics routes are deliberately kept:
they are finished backends without a UI, not dead code.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017Fh6US2rNTU84nZjfsV27Z"
```

---

### Task 11: Verify the build and push

**Files:** none modified.

**Interfaces:**

- Consumes: every preceding task.
- Produces: a pushed `main`.

- [ ] **Step 1: Confirm `.env.local` exists**

Run: `cd ~/zionsync && test -f .env.local && echo present || echo MISSING`

`src/lib/mongodb.js` throws at module load without `MONGODB_URI`, so the build cannot complete without it. If `MISSING`, stop — the user must run `npx vercel env pull .env.local` first.

- [ ] **Step 2: Build**

Run: `cd ~/zionsync && npx next build 2>&1 | tail -25`
Expected: build completes; no `Failed to collect page data`.

- [ ] **Step 3: Full suite one more time**

Run: `cd ~/zionsync && npm test 2>&1 | tail -6`
Expected: `Tests: 0 failed`.

- [ ] **Step 4: Review the whole change set**

Run: `cd ~/zionsync && git log --oneline origin/main..HEAD && git diff --stat origin/main..HEAD | tail -5`
Expected: ten commits; only files named in this plan.

- [ ] **Step 5: Push**

```bash
cd ~/zionsync && git push origin main
```

Vercel deploys from this repository. Confirm the deployment succeeds before considering the plan complete.

---

## Deferred to a follow-on plan

Not in scope here, because each needs a data migration, live database access, or product decisions the user has not yet made:

- **Stable element IDs.** IDs are derived from `content`, which the worship team rewrites. Task 5 contains the symptom; the cure is a UUID assigned once at creation. Requires migrating stored `serviceDetails.elements`.
- **Slot state highlighting** — needs-selection / confirmed / orphaned-in-red, plus notifying the Worship tab when the pastor changes the song count. Depends on stable IDs.
- **`typeConfirmedByPastor` flag** so a confirmed line is never reclassified, plus the song-slot summary on the confirmation screen ("3 songs for the worship team: …").
- **Date storage.** `"M/D/YY"` strings are compared with `$gte`/`$lte` and sorted lexicographically, so `"12/25/24" < "1/5/25"` is true. Every date range and sort is wrong. Fixing it means migrating every collection keyed on the date string.
- **`GET /api/service-details` performs writes** on every read, looping the whole collection — on a route polled every 30-60s. Should become a one-off migration plus write-on-save.
- **`MainLayout`'s 60s poll is a full replace** (`setServiceDetails(detailsObj)`), which can revert an in-flight optimistic edit.
- **`songs/merge` has no transaction** across four dependent mutations.
- **Phantom collection cleanup** — `service_details`, `assignments`, `worship_selections`, `song_history`, `services`. Needs document counts from Atlas first; `worship_selections` may hold real historical data.
- **`recordSongUsage` runs last and unguarded** (`ServiceSongSelector.jsx:682`). If it throws, the songs are saved but the usage row is not, so the rotation and suggestion engines drift out of step with what was actually sung — and the user sees "Failed to save songs" for a save that succeeded. Needs its own try/catch plus a decision about whether to retry or surface a partial-success message; that is a product call, not a mechanical fix.
- **Seven dependencies still specify `"latest"`** in `package.json`: `react`, `react-dom`, `tailwindcss`, `eslint`, `postcss`, `autoprefixer`, `@radix-ui/react-icons`. The lockfile pins concrete versions so builds are reproducible _today_, but any regenerated lockfile can jump a major without a code change. Pinning them is a one-line-each edit, deliberately deferred so it lands in its own commit and can be reverted cleanly if a pin breaks the build.
- **Logging.** 125 `console.log` calls, several dumping request bodies into Vercel logs, while `src/utils/logger.js` is used by one file.
- **No `error.js` / `loading.js`** anywhere in the App Router — any render throw is a white screen.
- **`THE_RULES.md` Rule 5 is wrong** — it claims `package.json` sets `"type": "module"`. It does not.
