# Service Calendar API Documentation

## Overview

API endpoints for managing algorithmically-generated church service dates. Replaces hardcoded DATES_2025 array with database-driven service generation.

---

## Endpoints

### 1. GET /api/service-calendar

**Fetch services for a specific year**

**Query Parameters:**

- `year` (required): Year to fetch (2024-2100)
- `includeInactive` (optional): Include overridden/inactive services (default: false)

**Success Response (200):**

```json
{
  "year": 2025,
  "services": [
    {
      "date": "2025-01-05T00:00:00.000Z",
      "dateString": "1/5/25",
      "dayOfWeek": "Sunday",
      "season": "CHRISTMAS",
      "seasonName": "Christmas",
      "seasonColor": "#D4AF37",
      "specialDay": null,
      "specialDayName": null,
      "isRegularSunday": true,
      "isSpecialWeekday": false,
      "isOverridden": false,
      "overrideReason": null
    }
  ],
  "metadata": {
    "totalServices": 63,
    "regularSundays": 52,
    "specialWeekdays": 11,
    "overriddenCount": 0
  },
  "keyDates": {
    "easter": "2025-04-20T00:00:00.000Z",
    "palmSunday": "2025-04-13T00:00:00.000Z",
    "ashWednesday": "2025-03-05T00:00:00.000Z"
  },
  "generatedAt": "2025-11-09T12:00:00.000Z",
  "algorithmVersion": "1.0.0",
  "validated": true
}
```

**Error Responses:**

- `400`: Invalid year parameter
- `404`: Year not found (needs generation)
- `500`: Server error

---

### 2. POST /api/service-calendar/generate

**Generate services for a new year**

**Request Body:**

```json
{
  "year": 2025,
  "overwrite": false
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Successfully generated 63 services for 2025",
  "year": 2025,
  "metadata": {
    "totalServices": 63,
    "regularSundays": 52,
    "specialWeekdays": 11,
    "overriddenCount": 0
  },
  "keyDates": {
    "easter": "Sun Apr 20 2025",
    "palmSunday": "Sun Apr 13 2025",
    "ashWednesday": "Wed Mar 05 2025"
  },
  "generatedAt": "2025-11-09T12:00:00.000Z",
  "overwritten": false
}
```

**Error Responses:**

- `400`: Invalid year
- `409`: Year already exists (set overwrite=true to replace)
- `500`: Generation failed or validation errors

---

### 3. GET /api/service-calendar/validate

**Validate stored services against algorithm**

**Query Parameters:**

- `year` (required): Year to validate (2024-2100)

**Success Response (200):**

```json
{
  "year": 2025,
  "valid": true,
  "issues": [],
  "warnings": [
    {
      "type": "ALGORITHM_VERSION_MISMATCH",
      "message": "Algorithm version changed: stored=\"1.0.0\", current=\"1.0.1\""
    }
  ],
  "summary": {
    "storedServices": 63,
    "expectedServices": 63,
    "overriddenServices": 2,
    "issueCount": 0,
    "warningCount": 1
  },
  "recommendation": "Minor warnings found. Review and regenerate if needed.",
  "storedGeneratedAt": "2025-01-01T00:00:00.000Z",
  "storedAlgorithmVersion": "1.0.0",
  "currentAlgorithmVersion": "1.0.1"
}
```

**Issue Types:**

- `SERVICE_COUNT_MISMATCH`: Different number of services
- `MISSING_SERVICE`: Service in algorithm but not in database
- `EXTRA_SERVICE`: Service in database but not in algorithm
- `SEASON_MISMATCH`: Different liturgical season
- `SPECIAL_DAY_MISMATCH`: Different special day designation
- `KEY_DATE_MISMATCH`: Key date (Easter, etc.) doesn't match

**Error Responses:**

- `400`: Invalid year
- `404`: Year not found
- `500`: Validation failed

---

### 4. PATCH /api/service-calendar/override

**Admin override for individual services**

**Request Body:**

```json
{
  "year": 2025,
  "dateString": "1/5/25",
  "overrides": {
    "seasonName": "Custom Season Name",
    "seasonColor": "#FF0000",
    "specialDayName": "Special Event",
    "isActive": true
  },
  "reason": "Pastor requested custom naming for special event",
  "userId": "admin123"
}
```

**Allowed Override Fields:**

- `seasonName`: Custom season display name
- `seasonColor`: Custom liturgical color (hex code)
- `specialDayName`: Custom special day name
- `isActive`: Enable/disable service

**Success Response (200):**

```json
{
  "success": true,
  "message": "Successfully overridden service for 1/5/25",
  "service": {
    "date": "2025-01-05T00:00:00.000Z",
    "dateString": "1/5/25",
    "dayOfWeek": "Sunday",
    "season": "CHRISTMAS",
    "seasonName": "Custom Season Name",
    "seasonColor": "#FF0000",
    "specialDay": null,
    "specialDayName": "Special Event",
    "isOverridden": true,
    "overrideReason": "Pastor requested custom naming for special event",
    "overriddenBy": "admin123",
    "overriddenAt": "2025-11-09T12:00:00.000Z",
    "isActive": true
  }
}
```

**Error Responses:**

- `400`: Missing required fields, invalid override fields, or invalid year
- `404`: Year or service not found
- `500`: Update failed

**Audit Trail:**
Every override automatically tracks:

- `isOverridden`: true
- `overrideReason`: Why the override was made
- `overriddenBy`: User ID who made the change
- `overriddenAt`: Timestamp of the override

---

## Usage Examples

### Fetching Services for 2025

```javascript
const response = await fetch("/api/service-calendar?year=2025");
const data = await response.json();
console.log(`Found ${data.services.length} services for 2025`);
```

### Generating Services for 2026

```javascript
const response = await fetch("/api/service-calendar/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ year: 2026, overwrite: false }),
});
const data = await response.json();
console.log(data.message);
```

### Validating Existing Services

```javascript
const response = await fetch("/api/service-calendar/validate?year=2025");
const data = await response.json();
if (!data.valid) {
  console.error("Validation issues:", data.issues);
}
```

### Overriding a Service

```javascript
const response = await fetch("/api/service-calendar/override", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    year: 2025,
    dateString: "12/25/25",
    overrides: { specialDayName: "Christmas Day Service" },
    reason: "Custom naming for bulletin",
    userId: "pastor@zion.org",
  }),
});
const data = await response.json();
console.log("Override applied:", data.service);
```

---

## Migration Path

### Step 1: Generate 2025 Services

```bash
POST /api/service-calendar/generate
{ "year": 2025 }
```

### Step 2: Validate Against Pastor's Schedule

```bash
GET /api/service-calendar/validate?year=2025
```

### Step 3: Update Frontend to Use New API

Replace:

```javascript
import { DATES_2025 } from "@/lib/constants";
```

With:

```javascript
const response = await fetch("/api/service-calendar?year=2025");
const { services } = await response.json();
```

### Step 4: Generate Future Years

```bash
POST /api/service-calendar/generate { "year": 2026 }
POST /api/service-calendar/generate { "year": 2027 }
```

---

## Algorithm Details

**Services Generated:**

- 52 Sundays per year
- Ash Wednesday
- 5 Midweek Lenten services (Wednesdays)
- Maundy Thursday
- Good Friday
- Ascension Day (Thursday)
- Thanksgiving Eve
- Christmas Eve (if not Sunday)

**Total: ~63 services per year**

**Liturgical Accuracy:**

- ✅ Computus algorithm for Easter calculation
- ✅ All special days calculated relative to Easter
- ✅ LCMC Lutheran traditions (All Saints first Sunday of November)
- ✅ Tested for years 2024-2100
- ✅ Handles early/late Easter correctly
- ✅ Verified against pastor's confirmed 2025 schedule (100% match)
