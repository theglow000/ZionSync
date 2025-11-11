# 🔥 Phase 3: Pre-Production Smoke Test Checklist

**Purpose**: Manual validation of critical user flows before production deployment  
**Estimated Time**: 15-20 minutes  
**Environment**: Production build running locally (`npm run build && npm start`)

---

## 🎯 Critical User Flows - Sprint 4.1 & 4.2

### 1. Multi-Year Calendar System ⭐ NEW FEATURE

#### Test: Year Selector Functionality
**Location**: Settings → Calendar Manager tab

- [ ] **Open Settings page**
  - Click Settings button in main navigation
  - Verify Settings modal opens

- [ ] **Navigate to Calendar Manager**
  - Click "Calendar Manager" tab
  - Verify tab switches correctly

- [ ] **Test Year Selector**
  - [ ] Dropdown shows years 2024-2030
  - [ ] Current year (2025) is selected by default
  - [ ] Can select different year
  - [ ] Services update when year changes

- [ ] **Generate Services for New Year**
  - [ ] Select 2026 (or any non-generated year)
  - [ ] Click "Generate Services"
  - [ ] Progress indicator appears
  - [ ] Success message shows "63 services generated"
  - [ ] Service list populates with 2026 dates

- [ ] **View Liturgical Calendar**
  - [ ] Services are color-coded by season
  - [ ] Special days are marked (Easter, Ash Wednesday, etc.)
  - [ ] Metadata shows: Easter date, Advent start, etc.

**Expected Results**:
- ✅ Year selector works smoothly
- ✅ Service generation completes in <5 seconds
- ✅ All 63 services appear with correct seasons
- ✅ No console errors

---

### 2. Multi-Year Tab Navigation ⭐ NEW FEATURE

#### Test: Year Selector Across All Tabs

**Location**: Main dashboard (Presentation, Worship, A/V tabs)

- [ ] **Presentation Team Tab**
  - [ ] Year selector visible in tab header
  - [ ] Shows "↓ Year Service Schedule" format
  - [ ] Default year is 2025
  - [ ] Change to 2026
  - [ ] Service dates update to 2026
  - [ ] Loading spinner appears during fetch
  - [ ] Services display correctly

- [ ] **Worship Team Tab**
  - [ ] Year selector present and functional
  - [ ] Switching years updates service list
  - [ ] Song assignments persist across year changes
  - [ ] No data loss when switching back to 2025

- [ ] **A/V Team Tab**
  - [ ] Year selector works consistently
  - [ ] Team assignments load correctly per year
  - [ ] Performance is smooth (no lag)

**Expected Results**:
- ✅ Year selector persists across tabs
- ✅ Each tab shows services for selected year
- ✅ No DATES_2025 hardcoded values visible
- ✅ Smooth transitions, no flickering

---

### 3. Service Management Workflow

#### Test: Create and Edit Services

- [ ] **Presentation Team - Add Service**
  - [ ] Click "+ Add Custom Service"
  - [ ] Fill in date, title, type
  - [ ] Add Order of Worship elements
  - [ ] Click "Save Custom Service"
  - [ ] Service appears in list

- [ ] **Presentation Team - Edit Service**
  - [ ] Click edit icon on existing service
  - [ ] Modify service details
  - [ ] Click "Update Service Details"
  - [ ] Changes save successfully

- [ ] **Presentation Team - Sign Up**
  - [ ] Find future service
  - [ ] Click "Sign Up"
  - [ ] Your name appears in assignment
  - [ ] Success message shows

**Expected Results**:
- ✅ Custom services save correctly
- ✅ Edits persist after page refresh
- ✅ Sign-up workflow smooth

---

### 4. Song Selection & Management

#### Test: Quick Add Workflow (Updated in Sprint 4.2)

**Location**: Song Management tab

- [ ] **Song Discovery**
  - [ ] Navigate to "Song Management" tab
  - [ ] Scroll to "Song Rediscovery" panel
  - [ ] Intelligent Suggestions appear
  - [ ] Filter by season works
  - [ ] Search functionality works

- [ ] **Quick Add to Service**
  - [ ] Click "Add to Service" on a song
  - [ ] Modal opens with upcoming services
  - [ ] Services show correct dates (current year)
  - [ ] Select a service
  - [ ] Available song slots appear (Opening Hymn, Hymn of Day, etc.)
  - [ ] Click empty slot
  - [ ] Success message: "Song added successfully"

- [ ] **Replace Existing Song**
  - [ ] Try adding to filled slot
  - [ ] "Will replace existing" warning shows
  - [ ] Current song title displayed
  - [ ] Click to replace
  - [ ] Replacement happens without extra confirmation

**Expected Results**:
- ✅ Modal shows services from selected year
- ✅ Slot system works correctly
- ✅ Visual feedback is clear
- ✅ No prompt() dialogs (replaced with modal)

---

### 5. Worship Team Tab

#### Test: Song Assignments

- [ ] **View Services**
  - [ ] Services list loads
  - [ ] Season colors display correctly
  - [ ] Song slots visible

- [ ] **Assign Songs**
  - [ ] Click song slot
  - [ ] Song selector opens
  - [ ] Search for song
  - [ ] Select song
  - [ ] Song appears in slot

- [ ] **Assign Team Members**
  - [ ] Click "Edit Team" button
  - [ ] Add team members
  - [ ] Save assignments
  - [ ] Names appear correctly

**Expected Results**:
- ✅ Song assignments save
- ✅ Team assignments persist
- ✅ No data loss on refresh

---

### 6. A/V Team Tab

#### Test: Team Assignments

- [ ] **View Schedule**
  - [ ] Services load with dates
  - [ ] Assignment slots visible

- [ ] **Assign A/V Team**
  - [ ] Click dropdown for a service
  - [ ] Select team member
  - [ ] Assignment saves immediately
  - [ ] Success indicator appears

- [ ] **Add New Team Member**
  - [ ] Click "Add A/V User"
  - [ ] Modal opens (not prompt)
  - [ ] Enter name
  - [ ] Click "Add User"
  - [ ] User appears in dropdown

**Expected Results**:
- ✅ Debouncing works (no rapid-fire saves)
- ✅ Modal replaces old prompt()
- ✅ Smooth user experience

---

## 🐛 Error Cases to Test

### Network Errors
- [ ] **Disconnect internet**
  - [ ] Try loading services
  - [ ] Error message appears
  - [ ] "Try Again" button works
  - [ ] Reconnect and retry succeeds

### Invalid States
- [ ] **Select year with no services**
  - [ ] Error message clear
  - [ ] Prompt to generate services
  - [ ] Generation link works

### Edge Cases
- [ ] **Very old services (past dates)**
  - [ ] Appear correctly
  - [ ] Filtered when upcomingOnly=true

- [ ] **Future years (2030)**
  - [ ] Can be generated
  - [ ] Calendar calculations correct

---

## 📱 Responsive Design Check

### Mobile View (< 768px)
- [ ] **Resize browser to mobile width**
  - [ ] Year selector displays correctly
  - [ ] Tabs are swipeable
  - [ ] Cards stack vertically
  - [ ] Buttons are tappable
  - [ ] Modals are full-width
  - [ ] No horizontal scroll

### Tablet View (768px - 1024px)
- [ ] **Medium screen size**
  - [ ] Layout adapts appropriately
  - [ ] No awkward spacing
  - [ ] Readable text sizes

---

## 🎨 Visual Regression Check

### Liturgical Colors
- [ ] **Service cards show correct season colors**:
  - Advent: Blue/Purple
  - Christmas: White/Gold
  - Epiphany: Green/Gold
  - Lent: Purple
  - Easter: White
  - Pentecost: Red
  - Ordinary Time: Green

### Loading States
- [ ] **Spinners appear during data fetch**
  - Presentation: Green spinner
  - Worship: Purple spinner
  - A/V: Blue spinner

### Modals
- [ ] **AddUserModal** - Professional design, not prompt()
- [ ] **QuickAddModal** - Service cards with dates, slot buttons
- [ ] **Settings Modal** - Calendar Manager tab present

---

## ⚡ Performance Check

### Initial Load
- [ ] **Full page load < 3 seconds**
- [ ] **No flash of unstyled content**
- [ ] **Smooth animations**

### Interactions
- [ ] **Tab switching instant**
- [ ] **Year selector responsive**
- [ ] **Service loading < 1 second**
- [ ] **No lag when typing**

### Console
- [ ] **No errors** (except acceptable warnings)
- [ ] **No 404s**
- [ ] **API calls reasonable (not excessive)**

---

## 🔒 Data Integrity Check

### Critical: serviceDetails Protection
- [ ] **Open MongoDB Compass** (if available)
  - [ ] Check `serviceDetails` collection
  - [ ] Verify records unchanged by calendar generation
  - [ ] Pastor notes, song selections, assignments intact

### Multi-Year Data Separation
- [ ] **Check that 2025 and 2026 data don't interfere**
  - Switch between years multiple times
  - Verify services remain distinct
  - No date bleeding between years

---

## ✅ Sign-Off Checklist

Before pushing to production, confirm:

- [ ] All critical user flows work
- [ ] No console errors (except known warnings)
- [ ] Multi-year system functions correctly
- [ ] Year selector works across all tabs
- [ ] No hardcoded DATES_2025 visible
- [ ] Modal replacements for prompts complete
- [ ] Debouncing prevents rapid-fire actions
- [ ] Responsive design works on mobile
- [ ] Performance is acceptable (no lag)
- [ ] Data integrity preserved (serviceDetails untouched)
- [ ] Error handling is graceful
- [ ] Visual design consistent with liturgical colors

---

## 📝 Issue Tracking

If you find issues during smoke testing, document them here:

### Critical Issues (Must fix before deploy)
- [ ] Issue: ___________________________
  - Impact: ___________________________
  - Steps to reproduce: _______________

### Minor Issues (Can deploy, fix in next sprint)
- [ ] Issue: ___________________________
  - Impact: ___________________________
  - Priority: Low/Medium

### Nice-to-Have Enhancements
- [ ] Enhancement: _____________________
  - Benefit: __________________________

---

## 🚀 Final Recommendation

After completing this smoke test:

**If 0 critical issues**: ✅ **APPROVED FOR PRODUCTION**  
**If 1-2 minor issues**: ⚠️ **DEPLOY with notes** (fix in next sprint)  
**If any critical issues**: ❌ **HOLD** - Fix before deploy

---

**Tester**: _________________  
**Date**: November 10, 2025  
**Build Version**: Sprint 4.2  
**Sign-Off**: ☐ Approved ☐ Needs Work
