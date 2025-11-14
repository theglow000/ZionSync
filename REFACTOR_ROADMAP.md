# Tab Component Refactor Roadmap

## Purpose & Philosophy

This roadmap outlines a **comprehensive, systematic refactor** of the three main tab components to achieve reliable, durable, and maintainable code following React best practices.

**We are NOT doing quick fixes.** Every change serves the long-term architectural integrity of the codebase. If mobile auto-scroll is broken, we fix it as part of establishing the correct architecture, not as a band-aid.

## Goals

**Primary Goal:** Establish clean, maintainable component architecture

- True conditional rendering (no double-rendering)
- Single source of truth for refs
- Consistent, well-defined scroll container patterns
- Auto-scroll that works reliably on both platforms

**Secondary Goals:**

- Reduce DOM bloat (~40-50% fewer nodes per tab)
- Improve performance (20-30% faster renders)
- Eliminate code duplication
- Follow React best practices throughout

## Current State Analysis

**Architectural Issues:**

- ❌ Both desktop and mobile views render simultaneously (one hidden via CSS/conditional)
- ❌ Doubles DOM nodes (~200+ unnecessary elements per tab)
- ❌ Dual ref systems (`desktopDateRefs`, `mobileDateRefs`) creating unnecessary complexity
- ❌ Inconsistent scroll container patterns across components
- ❌ MainLayout has problematic nested/conflicting scroll containers

**Functional Issues:**

- ❌ **Mobile auto-scroll doesn't work** - scroll containers not properly configured
- ❌ Desktop has nested scroll containers (performance impact)

**Root Causes:**

1. **MainLayout mobile:** `overflow-hidden` parent blocks `overflow-y-auto` child (line 337)
2. **MainLayout desktop:** Unnecessary `overflow-y-auto` creates nested scroll (line 430)
3. **Components:** Render both views, use separate ref objects per viewport
4. **WorshipTeam inconsistency:** Uses conditional rendering while others use CSS hiding

**The Good:**

- Auto-scroll algorithm is well-designed and robust
- Desktop views work correctly (despite nested scroll overhead)
- Core functionality is solid, just needs architectural cleanup

---

## Refactor Strategy

### The Right Way vs. The Quick Way

**We're choosing the RIGHT way:**

1. Fix architectural issues at their root (MainLayout scroll containers)
2. Implement conditional rendering properly across all components
3. Consolidate refs into single source of truth
4. Standardize patterns for long-term maintainability

**Why not quick fixes:**

- Quick fixes create technical debt
- We'd have to refactor the quick fixes later anyway
- Proper architecture is more reliable long-term
- The effort difference is minimal (8 hours vs. 15 minutes + later cleanup)

### Execution Approach

**All-or-nothing:** We complete all phases in sequence, test thoroughly, then deploy as a single cohesive update.

**Dependencies matter:** Each phase builds on the previous one. Skipping or reordering phases will cause issues.

**Testing is critical:** Extensive testing after each phase ensures we catch regressions immediately.

---

## Phase 1: Fix Scroll Container Architecture (Foundation)

**Priority:** CRITICAL - DO THIS FIRST  
**Estimated Effort:** 1-2 hours  
**Risk Level:** Low  
**Dependencies:** None

### Objective

Establish correct scroll container architecture in MainLayout for both desktop and mobile. This creates the foundation for everything else.

**Why this comes first:** Without proper scroll containers, we can't reliably test auto-scroll or component behavior. This is the root cause that needs fixing before we touch components.

### Changes Required

#### 1.1 Fix MainLayout Mobile Scroll Container

**File:** `src/components/MainLayout.jsx`

**Current Structure (lines 335-343):**

```jsx
<div className="flex-1">
  <div className="bg-white shadow-md h-full overflow-hidden">
    {isLoading ? (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    ) : (
      <div className="h-full overflow-y-auto" style={{ paddingBottom: "76px" }}>
```

**Target Structure:**

```jsx
<div className="flex-1 overflow-hidden">
  <div className="bg-white shadow-md h-full flex flex-col">
    {isLoading ? (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    ) : (
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "76px" }}>
```

**Specific Changes:**

- [ ] Line 335: Add `overflow-hidden` to outer flex container
- [ ] Line 336: Remove `overflow-hidden`, add `flex flex-col`
- [ ] Line 343: Change `h-full` to `flex-1` (allows proper flexbox sizing)

**Why This Works:**

1. Outer container (`flex-1 overflow-hidden`) establishes the height boundary
2. Middle container (`flex flex-col`) creates vertical flex layout
3. Inner container (`flex-1 overflow-y-auto`) becomes the functional scroll container
4. Auto-scroll logic can now find and use this scroll container

**Testing:**

- [ ] Mobile: Navigate to any tab
- [ ] Mobile: Verify page scrolls to current/upcoming date on load
- [ ] Mobile: Test all three tabs (Presentation, Worship, A/V)
- [ ] Desktop: Verify no regressions (should still work)

**Success Criteria:**

- [ ] Mobile auto-scroll works on all three tabs
- [ ] Desktop auto-scroll continues to work
- [ ] No scroll conflicts or double scrollbars
- [ ] Scroll containers detectable by `getComputedStyle(element).overflowY === 'auto'`

---

## Phase 2: Conditional Rendering Refactor

**Priority:** HIGH  
**Estimated Effort:** 3-4 hours  
**Risk Level:** Low-Medium  
**Dependencies:** Phase 1 must be complete

### Objective

Replace CSS-based view hiding and mixed conditional patterns with true conditional rendering based on `isMobile` state. Only render the view appropriate for the current viewport. This is the core architectural improvement.

### Changes Required

#### 1.1 SignupSheet.jsx

**Current Structure (Lines ~1094-1400):**

```jsx
<div className="h-full">
  {/* Desktop Table View */}
  <div className="hidden md:block h-full">
    {dates.map((item) => (
      <tr ref={(el) => (desktopDateRefs.current[item.date] = el)}>
        {/* Desktop table row content */}
      </tr>
    ))}
  </div>

  {/* Mobile Card View */}
  <div className="md:hidden">
    {dates.map((item) => (
      <div ref={(el) => (mobileDateRefs.current[item.date] = el)}>
        <MobileServiceCard {...props} />
      </div>
    ))}
  </div>
</div>
```

**Target Structure:**

```jsx
<div className="h-full">
  {isMobile ? (
    // Mobile View - Only renders on mobile
    dates.map((item) => (
      <div key={item.date} ref={(el) => (dateRefs.current[item.date] = el)}>
        <MobileServiceCard {...props} />
      </div>
    ))
  ) : (
    // Desktop View - Only renders on desktop
    <div className="overflow-y-auto h-full">
      <table className="w-full">
        <thead className="sticky top-0 z-10">{/* Table headers */}</thead>
        <tbody>
          {dates.map((item, index) => (
            <React.Fragment key={item.date}>
              <tr ref={(el) => (dateRefs.current[item.date] = el)}>
                {/* Desktop table row content */}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

**Specific Changes:**

- [ ] Remove `desktopDateRefs` and `mobileDateRefs` refs (line ~66)
- [ ] Replace with single `dateRefs = useRef({})`
- [ ] Wrap desktop table structure in `!isMobile` condition
- [ ] Wrap mobile card structure in `isMobile` condition
- [ ] Update all `desktopDateRefs.current` to `dateRefs.current`
- [ ] Update all `mobileDateRefs.current` to `dateRefs.current`
- [ ] Update useEffect auto-scroll to use single `dateRefs` (line ~458-463)
- [ ] Remove `isMobile` conditional logic from auto-scroll (line ~461)
- [ ] Test: Verify only one view renders in React DevTools

**Files Modified:**

- `src/components/ui/SignupSheet.jsx`

**Testing Requirements:**

- [ ] Desktop: Table renders, mobile cards do not exist in DOM
- [ ] Mobile: Cards render, table does not exist in DOM
- [ ] Resize window: View switches correctly
- [ ] Auto-scroll works on both desktop and mobile
- [ ] Refs are set correctly for visible elements only
- [ ] No console errors or warnings

---

#### 1.2 WorshipTeam.jsx

**Current Structure (Lines ~697-830):**

```jsx
<div className="h-full overflow-y-auto">
  <div className="space-y-4 p-4">
    {/* Desktop View */}
    {!isMobile &&
      dates.map((item) => (
        <div ref={(el) => (desktopDateRefs.current[item.date] = el)}>
          <ServiceSongSelector {...props} />
        </div>
      ))}

    {/* Mobile View */}
    {isMobile &&
      dates.map((item) => (
        <div ref={(el) => (mobileDateRefs.current[item.date] = el)}>
          <MobileWorshipServiceCard {...props} />
        </div>
      ))}
  </div>
</div>
```

**Target Structure:**

```jsx
<div className="h-full overflow-y-auto">
  <div className="space-y-4 p-4">
    {isMobile
      ? // Mobile View - Only renders on mobile
        dates.map((item) => (
          <div key={item.date} ref={(el) => (dateRefs.current[item.date] = el)}>
            <MobileWorshipServiceCard {...props} />
          </div>
        ))
      : // Desktop View - Only renders on desktop
        dates.map((item) => (
          <div key={item.date} ref={(el) => (dateRefs.current[item.date] = el)}>
            <ServiceSongSelector {...props} />
          </div>
        ))}
  </div>
</div>
```

**Specific Changes:**

- [ ] Remove `desktopDateRefs` and `mobileDateRefs` refs (line ~56-57)
- [ ] Replace with single `dateRefs = useRef({})`
- [ ] Replace `{!isMobile && dates.map(...)}` with ternary conditional
- [ ] Replace `{isMobile && dates.map(...)}` with ternary conditional
- [ ] Update all ref assignments to use `dateRefs.current`
- [ ] Update useEffect auto-scroll to use single `dateRefs` (line ~144-147)
- [ ] Remove `isMobile` conditional from auto-scroll logic (line ~146)
- [ ] Test: Verify only one view renders in React DevTools

**Files Modified:**

- `src/components/ui/WorshipTeam.jsx`

**Testing Requirements:**

- [ ] Desktop: ServiceSongSelector renders, MobileWorshipServiceCard does not exist in DOM
- [ ] Mobile: MobileWorshipServiceCard renders, ServiceSongSelector does not exist in DOM
- [ ] Resize window: View switches correctly
- [ ] Auto-scroll works on both desktop and mobile
- [ ] Song selection functionality works on both views
- [ ] No console errors or warnings

---

#### 1.3 AVTeam.jsx

**Current Structure (Lines ~520-650):**

```jsx
<div className="h-full">
  {/* Desktop Table View */}
  <div className="hidden md:block h-full">
    {dates.map((item) => (
      <tr ref={(el) => (desktopDateRefs.current[item.date] = el)}>
        {/* Desktop table row content */}
      </tr>
    ))}
  </div>

  {/* Mobile View */}
  {isMobile && (
    <div className="p-4 overflow-y-auto h-full">
      {dates.map((item) => (
        <div ref={(el) => (mobileDateRefs.current[item.date] = el)}>
          {/* Mobile card content */}
        </div>
      ))}
    </div>
  )}
</div>
```

**Target Structure:**

```jsx
<div className="h-full">
  {isMobile ? (
    // Mobile View - Only renders on mobile
    <div className="p-4 overflow-y-auto h-full">
      {dates.map((item, index) => (
        <div key={item.date} ref={(el) => (dateRefs.current[item.date] = el)}>
          {/* Mobile card content */}
        </div>
      ))}
    </div>
  ) : (
    // Desktop View - Only renders on desktop
    <div className="overflow-y-auto h-full">
      <table className="w-full">
        <thead className="sticky top-0 z-10">{/* Table headers */}</thead>
        <tbody>
          {dates.map((item, index) => (
            <tr
              key={item.date}
              ref={(el) => (dateRefs.current[item.date] = el)}
            >
              {/* Desktop table row content */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

**Specific Changes:**

- [ ] Remove `desktopDateRefs` and `mobileDateRefs` refs (line ~30-31)
- [ ] Replace with single `dateRefs = React.useRef({})`
- [ ] Wrap desktop table structure in `!isMobile` condition
- [ ] Replace `{isMobile && (...)}` with ternary conditional
- [ ] Update all ref assignments to use `dateRefs.current`
- [ ] Update useEffect auto-scroll to use single `dateRefs` (line ~125-128)
- [ ] Remove `isMobile` conditional from auto-scroll (line ~127)
- [ ] Test: Verify only one view renders in React DevTools

**Files Modified:**

- `src/components/ui/AVTeam.jsx`

**Testing Requirements:**

- [ ] Desktop: Table renders, mobile cards do not exist in DOM
- [ ] Mobile: Cards render, table does not exist in DOM
- [ ] Resize window: View switches correctly
- [ ] Auto-scroll works on both desktop and mobile
- [ ] Team member assignment works on both views
- [ ] No console errors or warnings

---

### Phase 1 Success Criteria

**Performance Metrics:**

- [ ] DOM node count reduced by ~40-50% when switching tabs
- [ ] Component re-renders only trigger single view update
- [ ] Memory usage decreases (verify in Chrome DevTools Performance)

**Functional Requirements:**

- [ ] All three tabs render correctly on desktop
- [ ] All three tabs render correctly on mobile
- [ ] Auto-scroll to current date works on all tabs, both viewports
- [ ] Window resize switches views without errors
- [ ] All user interactions work identically to before refactor

**Code Quality:**

- [ ] No duplicate rendering logic
- [ ] Single source of truth for refs (`dateRefs`)
- [ ] Consistent conditional rendering pattern across all components
- [ ] No unused CSS classes (remove `hidden md:block`, `md:hidden`)

---

## Phase 3: Scroll Container Verification & Cleanup

**Priority:** MEDIUM  
**Estimated Effort:** 2-3 hours  
**Risk Level:** Low  
**Dependencies:** Phases 1 & 2 must be complete

### Objective

Verify that all component scroll containers follow the established patterns from Phase 1. Remove debug logging from auto-scroll logic since it's now working correctly.

**Note:** The auto-scroll algorithm itself is excellent and doesn't need changes. We're just cleaning up debug code and verifying consistency.

### Key Architectural Decisions

**Desktop Philosophy:**

- Components control their own scrolling internally
- MainLayout wrapper should NOT scroll
- Each component has ONE `.overflow-y-auto` scroll container
- Headers are sticky within component scroll

**Mobile Philosophy:**

- MainLayout controls all scrolling externally (fixed in Phase 0)
- Components have NO internal scroll containers
- Headers scroll with content naturally
- Simpler, more native mobile feel

### Changes Required

#### 2.0 Fix MainLayout Desktop Scroll Container (REQUIRED FIRST)

**File:** `src/components/MainLayout.jsx`

**Current Structure (line ~430):**

```jsx
<div className="flex-1 overflow-y-auto">
  {activeTab === 'presentation' && (
    <ErrorBoundary>
      <SignupSheet ... />
    </ErrorBoundary>
  )}
  {/* ... other tabs */}
</div>
```

**Target Structure:**

```jsx
<div className="flex-1 overflow-hidden">
  {activeTab === 'presentation' && (
    <ErrorBoundary>
      <SignupSheet ... />
    </ErrorBoundary>
  )}
  {/* ... other tabs */}
</div>
```

**Specific Changes:**

- [ ] Line ~430: Change `overflow-y-auto` to `overflow-hidden`

**Why This Works:**

- Eliminates nested scroll containers on desktop
- Forces components to handle their own scrolling
- Prevents scroll conflicts and improves performance
- Components already have internal scroll containers that will work properly

**Testing:**

- [ ] Desktop: All tabs scroll correctly within their content area
- [ ] Desktop: Headers remain sticky
- [ ] Desktop: No double scrollbars appear

---

**Current Issues:**

- SignupSheet: Has internal `.overflow-y-auto` (correct)
- WorshipTeam: Has internal `.overflow-y-auto` but different structure
- AVTeam: Has internal `.overflow-y-auto` (correct)
- Inconsistent wrapper div hierarchy

**Target Structure:**

```jsx
<Card
  ref={componentRootRef}
  className="w-full h-full mx-auto relative bg-white shadow-lg"
>
  <div className="flex flex-col h-full">
    {/* Fixed Header - Does NOT scroll */}
    <div className="sticky top-0 z-10 bg-white">
      <CardHeader className="border-b border-gray-200">
        {/* Logo, title, year selector */}
      </CardHeader>
      <div className="p-4 border-b border-gray-200">
        {/* User management, action buttons */}
      </div>
    </div>

    {/* Scrollable Content - ONLY this scrolls on desktop */}
    <div className="flex-1 overflow-hidden">
      <CardContent className="h-full p-0">
        {!isMobile && (
          <div className="overflow-y-auto h-full">
            {/* Table or cards that scroll internally */}
          </div>
        )}
      </CardContent>
    </div>
  </div>
</Card>
```

**Specific Changes:**

- [ ] SignupSheet: Already correct structure, verify sticky header behavior
- [ ] WorshipTeam: Adjust wrapper divs to match standard (line ~682-700)
- [ ] AVTeam: Already correct structure, verify sticky header behavior
- [ ] All: Ensure `.flex-1 overflow-hidden` wrapper exists
- [ ] All: Ensure `.overflow-y-auto h-full` is ONLY on desktop view

**Files Modified:**

- `src/components/ui/SignupSheet.jsx` (verify only)
- `src/components/ui/WorshipTeam.jsx` (restructure)
- `src/components/ui/AVTeam.jsx` (verify only)

---

#### 2.2 Mobile Scroll Structure (All Components)

**Current Issues:**

- Mobile views have varying scroll container setups
- Some have internal overflow, some rely on external
- Inconsistent with MainLayout's scroll container

**Target Structure:**

```jsx
<Card
  ref={componentRootRef}
  className="w-full h-full mx-auto relative bg-white shadow-lg"
>
  <div className="flex flex-col h-full">
    {/* Header - Will scroll with content on mobile */}
    <div className="sticky top-0 z-10 bg-white">
      <CardHeader className="border-b border-gray-200">
        {/* Logo, title, year selector */}
      </CardHeader>
      <div className="p-4 border-b border-gray-200">
        {/* User management, action buttons */}
      </div>
    </div>

    {/* Content - No internal scroll container on mobile */}
    <div className="flex-1">
      <CardContent className="h-full p-0">
        {isMobile && (
          <div className="p-4">
            {/* Cards that rely on MainLayout scroll */}
          </div>
        )}
      </CardContent>
    </div>
  </div>
</Card>
```

**Key Differences from Desktop:**

- NO `.overflow-hidden` on wrapper
- NO `.overflow-y-auto` on content
- MainLayout's scroll container handles all scrolling

**Specific Changes:**

- [ ] SignupSheet: Remove any mobile overflow containers (verify ~1315)
- [ ] WorshipTeam: Remove any mobile overflow containers (verify ~806)
- [ ] AVTeam: Update mobile view to remove `.overflow-y-auto` (line ~633)
- [ ] All: Ensure mobile cards are wrapped in simple div with padding only

**Files Modified:**

- `src/components/ui/SignupSheet.jsx`
- `src/components/ui/WorshipTeam.jsx`
- `src/components/ui/AVTeam.jsx`

---

#### 2.3 Auto-Scroll Logic - Verification Only

**Current Status:**
The existing auto-scroll logic is actually well-implemented and robust. It intelligently searches for scroll containers in the correct order:

1. Internal (for desktop)
2. External (for mobile)

**Why It Works Now:**
After Phase 0 and Phase 2.0, the scroll containers will be properly configured:

- Mobile: External scroll container in MainLayout works
- Desktop: Internal scroll containers in components work
- Auto-scroll finds the right container automatically

**RECOMMENDATION: Keep existing logic, just remove debug logging**

The current implementation (as seen in all three components) is production-ready:

```jsx
useEffect(() => {
  if (!dates.length || isLoading || datesLoading) return;

  const timer = setTimeout(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDateIndex = dates.findIndex((item) => {
      const [month, day, year] = item.date
        .split("/")
        .map((num) => parseInt(num, 10));
      const itemDate = new Date(2000 + year, month - 1, day);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate >= today;
    });

    if (currentDateIndex !== -1) {
      const currentDate = dates[currentDateIndex].date;
      const currentDateRefs = isMobile ? mobileDateRefs : desktopDateRefs;
      const targetElement = currentDateRefs.current[currentDate];

      if (targetElement && componentRootRef.current) {
        let scrollParent = null;

        // Step 1: Search WITHIN component (desktop internal scroll)
        let element = targetElement.parentElement;
        while (element && element !== componentRootRef.current) {
          const style = window.getComputedStyle(element);
          if (style.overflowY === "auto" || style.overflowY === "scroll") {
            scrollParent = element;
            break;
          }
          element = element.parentElement;
        }

        // Step 2: Search OUTSIDE component (mobile external scroll)
        if (!scrollParent) {
          element = componentRootRef.current.parentElement;
          while (element && element !== document.body) {
            const style = window.getComputedStyle(element);
            if (style.overflowY === "auto" || style.overflowY === "scroll") {
              scrollParent = element;
              break;
            }
            element = element.parentElement;
          }
        }

        if (scrollParent && scrollParent !== document.body) {
          const targetRect = targetElement.getBoundingClientRect();
          const containerRect = scrollParent.getBoundingClientRect();
          const relativeTop =
            targetRect.top - containerRect.top + scrollParent.scrollTop;

          scrollParent.scrollTo({
            top: Math.max(0, relativeTop - 100),
            behavior: "smooth",
          });
        }
      }
    }
  }, 500);

  return () => clearTimeout(timer);
}, [dates, isLoading, datesLoading, isMobile]);
```

**This logic is elegant and handles both cases perfectly:**

- Finds desktop internal scroll containers automatically
- Falls back to mobile external scroll if no internal found
- Uses proper relative positioning math
- Has appropriate timeout for DOM rendering

**Changes Required:**

- [ ] SignupSheet: Remove debug console.log statements ONLY (lines 456-499)
- [ ] WorshipTeam: Verify logic is identical (no changes needed)
- [ ] AVTeam: Verify logic is identical (no changes needed)
- [ ] Keep the dual refs for now (will be fixed in Phase 1)

**Files Modified:**

- `src/components/ui/SignupSheet.jsx` (remove console.log only)

**After Phase 0 & 2.0 Complete:**
This logic will work perfectly because:

- Mobile: Will find the fixed MainLayout scroll container
- Desktop: Will find component internal scroll container (after MainLayout fix)
- No changes to the core algorithm needed!

---

### Phase 2 Success Criteria

**Desktop Behavior:**

- [ ] Headers stay fixed at top when scrolling
- [ ] Only content area scrolls (table/cards)
- [ ] Scroll bars appear only on content area
- [ ] Auto-scroll moves content area, not whole page

**Mobile Behavior:**

- [ ] Entire page scrolls (headers scroll with content)
- [ ] No internal scroll containers
- [ ] MainLayout scroll container handles all scrolling
- [ ] Auto-scroll moves entire page

**Code Quality:**

- [ ] Consistent scroll container pattern across all components
- [ ] Simplified auto-scroll logic (no complex boundary detection)
- [ ] Clear separation of desktop vs mobile scroll behavior

---

## Phase 3: Simplified Auto-Scroll (Cleanup)

**Priority:** MEDIUM  
**Estimated Effort:** 1 hour  
**Risk Level:** Low  
**Dependencies:** Phase 1 & 2 must be complete

### Objective

Remove all debugging console.log statements and consolidate auto-scroll logic into reusable utility.

### Changes Required

#### 3.1 Remove Debug Logging

**Current Issue:**
Many console.log statements exist from debugging auto-scroll feature.

**Specific Changes:**

- [ ] SignupSheet: Remove all `console.log('[SignupSheet]...')` (lines ~456-460, 465, 469, 478, 482, 489, 499)
- [ ] WorshipTeam: Remove any debug logging from auto-scroll
- [ ] AVTeam: Remove any debug logging from auto-scroll

**Files Modified:**

- `src/components/ui/SignupSheet.jsx`
- `src/components/ui/WorshipTeam.jsx`
- `src/components/ui/AVTeam.jsx`

---

#### 3.2 Extract Scroll Utility (Optional - Future Enhancement)

**Objective:**
Create shared utility function for auto-scroll logic to avoid duplication.

**Target Structure:**

```jsx
// src/utils/scrollUtils.js
export const scrollToCurrentDate = (
  dates,
  dateRefs,
  componentRootRef,
  isMobile,
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDateIndex = dates.findIndex((item) => {
    const [month, day, year] = item.date
      .split("/")
      .map((num) => parseInt(num, 10));
    const itemDate = new Date(2000 + year, month - 1, day);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate >= today;
  });

  if (currentDateIndex === -1) return;

  const targetElement = dateRefs.current[dates[currentDateIndex].date];
  if (!targetElement || !componentRootRef.current) return;

  // ... scroll logic
};

// Usage in components:
useEffect(() => {
  if (!dates.length || isLoading || datesLoading) return;

  const timer = setTimeout(() => {
    scrollToCurrentDate(dates, dateRefs, componentRootRef, isMobile);
  }, 500);

  return () => clearTimeout(timer);
}, [dates, isLoading, datesLoading, isMobile]);
```

**Note:** This is optional and can be done in a future refactor if desired.

---

### Phase 3 Success Criteria

**Code Quality:**

- [ ] No console.log statements in production code
- [ ] Auto-scroll logic is identical across all three components
- [ ] Code is clean and maintainable

---

## Phase 4: Shared Component Extraction (Future Enhancement)

**Priority:** LOW  
**Estimated Effort:** 3-4 hours  
**Risk Level:** Medium  
**Dependencies:** Phases 1-3 complete

### Objective

Extract common patterns into shared components to reduce code duplication.

### Potential Shared Components

#### 4.1 TeamHeader Component

Consolidate header structure used by all three tabs.

#### 4.2 ServiceDateRow Component

Shared table row structure for SignupSheet and AVTeam.

#### 4.3 MobileServiceCard Wrapper

Shared mobile card wrapper with consistent styling.

**Note:** This phase is NOT required for the current refactor. Can be planned for future sprint.

---

## Testing Strategy

### Unit Testing

- [ ] Create tests for conditional rendering behavior
- [ ] Test auto-scroll utility function
- [ ] Test ref assignment in both mobile and desktop

### Integration Testing

- [ ] Test tab switching on desktop
- [ ] Test tab switching on mobile
- [ ] Test window resize behavior
- [ ] Test auto-scroll on page load

### Manual Testing Checklist

**Desktop Testing:**

- [ ] Presentation tab renders correctly
- [ ] Worship tab renders correctly
- [ ] A/V tab renders correctly
- [ ] Auto-scroll works on all tabs
- [ ] Only content area scrolls, headers stay fixed
- [ ] All user interactions work (signup, assignments, etc.)

**Mobile Testing:**

- [ ] Presentation tab renders correctly
- [ ] Worship tab renders correctly
- [ ] A/V tab renders correctly
- [ ] Auto-scroll works on all tabs
- [ ] Entire page scrolls (headers scroll with content)
- [ ] All user interactions work (signup, assignments, etc.)

**Cross-Browser Testing:**

- [ ] Chrome (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Edge (desktop)

---

## Rollback Plan

### If Issues Arise During Phase 1:

1. Revert to using separate `desktopDateRefs` and `mobileDateRefs`
2. Keep both views rendering but ensure refs don't conflict
3. Document issue and plan alternative approach

### If Issues Arise During Phase 2:

1. Revert scroll container changes
2. Keep Phase 1 refactor (conditional rendering is still valuable)
3. Document scroll container issues for future investigation

### Git Strategy:

- Create feature branch: `refactor/conditional-rendering`
- Commit after each component is refactored
- Create PR for review before merging to main
- Tag working version before starting refactor: `v1.0-pre-refactor`

---

## Implementation Timeline

### Execution Strategy: Complete Refactor

Execute all phases sequentially as a single coordinated effort. Test thoroughly after each phase. Deploy only when all phases are complete and tested.

**Week 1:**

- **Day 1 (2-3 hours):** Phase 1 - Fix MainLayout scroll containers for both desktop and mobile
  - Test extensively on both platforms
  - Verify auto-scroll works on mobile
  - Verify desktop scroll still works correctly
- **Day 2-3 (3-4 hours):** Phase 2 - Conditional rendering refactor
  - 2.1: SignupSheet
  - 2.2: WorshipTeam
  - 2.3: AVTeam
  - Test after each component
- **Day 4 (2-3 hours):** Phase 3 - Scroll container verification and cleanup
  - Verify patterns are consistent
  - Remove debug logging
  - Final component testing

**Week 2:**

- **Day 1-2 (2-3 hours):** Phase 4 - Final cleanup and polish
- **Day 3-4 (4-6 hours):** Comprehensive testing
  - All tabs, both platforms
  - Auto-scroll functionality
  - All user interactions
  - Performance testing
- **Day 5:** Documentation and code review

**Total Effort:** 12-18 hours including comprehensive testing

---

## Success Metrics

### Phase 1 Success Criteria

- ✅ Mobile auto-scroll works on all three tabs
- ✅ Desktop auto-scroll continues to work
- ✅ No nested scroll containers
- ✅ Clean scroll container architecture

### Phase 2 Success Criteria

- ✅ DOM node count reduced by 40-50% per tab
- ✅ Only one view renders at a time (verified in DevTools)
- ✅ Single ref system across all components
- ✅ Consistent conditional rendering pattern

### Phase 3 Success Criteria

- ✅ No debug logging in production code
- ✅ Consistent scroll patterns across all components
- ✅ Auto-scroll logic verified and clean

### Phase 4 Success Criteria

- ✅ Code follows React best practices
- ✅ No code duplication
- ✅ Clean, maintainable architecture

### Overall Success

- **Performance:** 20-30% render time improvement
- **Reliability:** Auto-scroll works 100% of the time on both platforms
- **Maintainability:** Single source of truth, consistent patterns
- **Bug-Free:** No regressions in existing functionality

---

## Post-Refactor Documentation

### Update Required Documentation:

- [ ] Add comments explaining conditional rendering pattern
- [ ] Document scroll container architecture
- [ ] Update component README files (if they exist)
- [ ] Create architecture decision record (ADR) for refactor choices

### Knowledge Sharing:

- [ ] Code review with team
- [ ] Demo new structure and performance improvements
- [ ] Document lessons learned

---

## Questions to Answer Before Starting

1. **Testing:** Do we have automated tests for these components? If not, should we write them first?
2. **Browser Support:** What's our minimum browser support? (affects CSS and JS approaches)
3. **Performance Baseline:** Should we record performance metrics before refactor for comparison?
4. **Deployment Window:** When is the best time to deploy these changes to minimize user impact?
5. **Rollback Plan:** How quickly can we rollback if issues are discovered?

---

## Final Notes

**This is a proper refactor, not a quick fix:**

- All phases must be completed in sequence
- Each phase builds on the previous one
- Testing is thorough and systematic
- We deploy once, after everything is complete and verified

**Why this approach:**

- Creates sustainable, maintainable architecture
- Fixes root causes, not symptoms
- Follows React best practices throughout
- Results in reliable, durable code

**Estimated total time:** 12-18 hours including comprehensive testing

**Risk level:** Low-Medium (with proper testing)

**Value delivered:**

- Mobile auto-scroll works reliably
- 40-50% reduction in DOM nodes
- 20-30% performance improvement
- Clean, maintainable codebase
- Foundation for future development
- All existing functionality must work identically after refactor
- Performance improvements are a bonus, not the primary goal
- Code maintainability and bug-free behavior are the priorities
