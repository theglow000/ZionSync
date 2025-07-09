# ZionSync API Reference

## Overview

ZionSync provides a RESTful API built with Next.js 15 App Router for managing church services, songs, users, and analytics. All endpoints are located under `/api/` and use standard HTTP methods with JSON request/response bodies.

**Base URL**: `http://localhost:3000/api` (development)  
**Database**: MongoDB ("church" database)  
**Authentication**: None (open endpoints)  
**Rate Limiting**: None implemented  

## General Patterns

### Request/Response Format
- **Content-Type**: `application/json`
- **Response Format**: JSON objects or arrays
- **Date Format**: MM/DD/YY (e.g., "3/15/25")
- **Timestamps**: ISO 8601 format

### Error Handling
Error response formats vary by endpoint. Common patterns include:

**Standard Pattern**:
```json
{
  "error": "Error message"
}
```

**Reference Songs Pattern**:
```json
{
  "message": "Error description"
}
```

**Some endpoints may include both fields**:
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Standard HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Query Parameters
Many endpoints support optional query parameters:
- `limit` - Number of results to return
- `date` - Filter by specific date
- `startDate` / `endDate` - Date range filtering
- `type` - Filter by resource type
- `recent` - Filter for recent items

---

## User Management

### Users
Manage general application users.

#### GET /api/users
Retrieve all users.

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "name": "string",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/users
Create a new user.

**Request**:
```json
{
  "name": "string"
}
```

**Response**:
```json
{
  "insertedId": "ObjectId",
  "acknowledged": true
}
```

#### DELETE /api/users
Delete a user and their associated signups.

**Request**:
```json
{
  "name": "string"
}
```

**Response**:
```json
{
  "success": true
}
```

### Worship Team Users
Manage worship team members.

#### GET /api/users/worship
Retrieve all worship team users.

**Response**:
```json
{
  "users": [
    {
      "_id": "ObjectId",
      "name": "string",
      "role": "team_member|leader",
      "created": "2024-01-01T00:00:00.000Z",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "success": true
}
```

#### POST /api/users/worship
Create a new worship team user.

**Request**:
```json
{
  "name": "string",
  "role": "team_member|leader"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "name": "string",
    "role": "team_member",
    "_id": "ObjectId"
  }
}
```

#### DELETE /api/users/worship
Delete a worship team user.

**Request**:
```json
{
  "name": "string"
}
```

**Response**:
```json
{
  "success": true,
  "deleted": true
}
```

### AV Team Users
Manage audio/video team members.

#### GET /api/av-users
Retrieve all AV team users.

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "name": "string",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/av-users
Create a new AV team user.

**Request**:
```json
{
  "name": "string"
}
```

**Response**:
```json
{
  "insertedId": "ObjectId",
  "acknowledged": true
}
```

---

## Song Management

### Songs
Manage hymns and contemporary songs.

#### GET /api/songs
Retrieve songs with optional filtering.

**Query Parameters**:
- `recent` - Filter for recent songs ("true")
- `months` - Number of months for recent filter (default: 3)

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "title": "string",
    "type": "hymn|contemporary",
    "notes": "string",
    "youtubeLink": "string",
    "seasonalTags": ["string"],
    "seasonalTagsConfidence": {},
    "created": "2024-01-01T00:00:00.000Z",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    // Hymn-specific fields
    "number": "string",
    "hymnal": "string", 
    "hymnaryLink": "string",
    // Contemporary-specific fields
    "author": "string",
    "songSelectLink": "string"
  }
]
```

**Note**: The `rotationStatus` field is not currently implemented in the API, despite being referenced in other parts of the system.

#### POST /api/songs
Create or update a song.

**Request**:
```json
{
  "_id": "ObjectId", // Optional, for updates
  "title": "string",
  "type": "hymn|contemporary",
  "notes": "string",
  "youtubeLink": "string",
  "seasonalTags": ["string"],
  "seasonalTagsConfidence": {},
  // Hymn-specific fields
  "number": "string",
  "hymnal": "string",
  "hymnaryLink": "string",
  // Contemporary-specific fields  
  "author": "string",
  "songSelectLink": "string"
}
```

**Response**:
```json
{
  "insertedId": "ObjectId", // For new songs
  "acknowledged": true,
  "modifiedCount": 1 // For updates
}
```

**Note**: The endpoint automatically detects updates vs. inserts based on presence of `_id` field or existing song with same title.

#### DELETE /api/songs
Delete a song and handle usage history.

**Query Parameters**:
- `id` - Song ObjectId (required)

**Response**:
```json
{
  "success": true,
  "hadUsageHistory": true
}
```

### Song Merging
Merge duplicate songs and consolidate usage history.

#### POST /api/songs/merge
Merge two songs into one.

**Request**:
```json
{
  "sourceId": "ObjectId",
  "targetId": "ObjectId"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Songs merged successfully"
}
```

### Reference Songs
Manage reference songs for seasonal recommendations.

#### GET /api/reference-songs
Retrieve reference songs with filtering.

**Query Parameters**:
- `season` - Filter by seasonal tag
- `type` - Filter by song type (hymn|contemporary)
- `query` - Text search in title or author fields
- `limit` - Number of results (not enforced)

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "title": "string",
    "type": "hymn|contemporary",
    "seasonalTags": ["string"],
    "created": "string", // ISO timestamp
    "lastUpdated": "string" // ISO timestamp
  }
]
```

**Note**: The `confidenceScore` field shown in some examples is not present in the actual API response.

#### POST /api/reference-songs
Create a new reference song.

**Request**:
```json
{
  "title": "string",
  "type": "hymn|contemporary",
  "seasonalTags": ["string"],
  "number": "string", // Required for hymns
  "hymnal": "string",
  "author": "string"
}
```

**Response**:
```json
{
  "message": "Reference song created successfully",
  "id": "ObjectId",
  "success": true
}
```

#### GET /api/reference-songs/{id}
Retrieve a specific reference song.

**Response**:
```json
{
  "_id": "ObjectId",
  "title": "string",
  "type": "hymn|contemporary",
  "seasonalTags": ["string"]
}
```

#### PUT /api/reference-songs/{id}
Update a reference song.

**Request**:
```json
{
  "title": "string",
  "type": "hymn|contemporary",
  "seasonalTags": ["string"],
  "number": "string", // Required for hymns
  "hymnal": "string",
  "author": "string" // Required for contemporary
}
```

**Response**:
```json
{
  "message": "Reference song updated successfully",
  "success": true
}
```

#### DELETE /api/reference-songs/{id}
Delete a reference song.

**Response**:
```json
{
  "message": "Reference song deleted successfully",
  "success": true
}
```

#### POST /api/reference-songs/import
Import a reference song to the main songs collection and optionally add to a service.

**Request**:
```json
{
  "referenceSongId": "ObjectId",
  "serviceDate": "3/15/25",
  "position": "opening|closing|communion",
  "songData": {
    "title": "string",
    "type": "hymn|contemporary",
    "seasonalTags": ["string"],
    // Additional song fields...
  }
}
```

**Response**:
```json
{
  "success": true,
  "songId": "ObjectId",
  "message": "Song imported successfully"
}
```

**Note**: This endpoint handles complex import logic including duplicate detection and service assignment.

---

## Service Management

### Service Details
Manage comprehensive service information.

#### GET /api/service-details
Retrieve service details with optional cache-busting.

**Query Parameters**:
- `date` - Specific service date (MM/DD/YY)
- `_t` - Cache-busting timestamp

**Response**:
```json
{
  "_id": "ObjectId",
  "date": "3/15/25",
  "title": "string",
  "liturgical": {
    "seasonId": "string",
    "seasonName": "string",
    "weekInSeason": 1,
    "color": "string"
  },
  "type": "regular|special",
  "elements": [
    {
      "type": "song_hymn|song_contemporary|reading|message|liturgy",
      "position": "opening|closing|communion",
      "title": "string",
      "content": "string",
      "reference": "string"
    }
  ]
}
```

**Note**: Liturgical information is automatically injected by the API using the LiturgicalCalendarService. Content parsing is performed automatically when legacy content fields are present.

#### POST /api/service-details
Create or update service details with element parsing.

**Request**:
```json
{
  "date": "3/15/25",
  "title": "string",
  "type": "regular|special",
  "elements": [
    {
      "type": "song_hymn|song_contemporary|reading|message|liturgy",
      "position": "opening|closing|communion",
      "title": "string",
      "content": "string",
      "reference": "string"
    }
  ],
  "content": "string" // Legacy field, will be parsed into elements
}
```

**Response**:
```json
{
  "_id": "ObjectId",
  "date": "3/15/25",
  "title": "string",
  "elements": [], // Parsed or provided elements
  "liturgical": {} // Auto-injected liturgical data
}
```

**Note**: If legacy `content` field is provided, it will be automatically parsed into structured elements.

#### DELETE /api/service-details
Delete service details.

**Query Parameters**:
- `date` - Service date (required)

**Response**:
```json
{
  "message": "Service details deleted successfully"
}
```

### Upcoming Services
Retrieve upcoming services with date filtering.

#### GET /api/upcoming-services
Get upcoming services sorted by date.

**Query Parameters**:
- `limit` - Number of services to return (default: 8)

**Response**:
```json
[
  {
    "date": "3/15/25",
    "title": "Palm Sunday Service - 3/15/25",
    "liturgical": {
      "seasonName": "Lent",
      "weekInSeason": 6
    },
    "type": "regular",
    "elements": []
  }
]
```

### Service Songs
Manage songs within services.

#### GET /api/service-songs
Retrieve songs for a specific service.

**Query Parameters**:
- `date` - Service date (required for specific service, optional for all)

**Response**:
```json
[
  {
    "title": "string",
    "type": "hymn|contemporary",
    "position": "opening|closing",
    "hymnNumber": "string",
    "hymnal": "Lutheran Book of Worship",
    "liturgical": {
      "season": "string",
      "seasonName": "string", 
      "color": "string",
      "specialDay": "string"
    }
  }
]
```

**Note**: This endpoint automatically injects liturgical information if missing and saves it back to the database. Uses the LiturgicalCalendarService for date-based liturgical calculations.

#### POST /api/service-songs
Add or update songs in a service.

**Request**:
```json
{
  "date": "3/15/25",
  "songs": [
    {
      "title": "string",
      "position": "opening",
      "type": "hymn"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "updated": true
}
```

**Note**: This endpoint performs complex operations including:
- Automatic liturgical information injection
- Updates both `service_songs` and `serviceDetails` collections
- Surgically updates only song elements in service details

### Custom Services
Manage service templates and custom services.

#### GET /api/custom-services
Retrieve all custom service templates.

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "id": "string",
    "name": "string",
    "elements": [],
    "order": 1,
    "template": "string", // Content template, not boolean
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/custom-services
Create a new custom service template.

**Request**:
```json
{
  "id": "string",
  "name": "string", 
  "elements": [],
  "order": 1,
  "template": "string" // Content template
}
```

**Response**:
```json
{
  "_id": "ObjectId",
  "id": "string",
  "name": "string",
  "elements": [],
  "order": 1,
  "template": "string", // Generated from elements content
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /api/custom-services
Update an existing custom service.

**Request**:
```json
{
  "id": "string", // Required
  "name": "string",
  "elements": [],
  "order": 1,
  "template": "string" // Generated from elements
}
```

**Response**:
```json
{
  "_id": "ObjectId",
  "id": "string",
  "name": "string",
  "elements": [],
  "order": 1,
  "template": "string",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /api/custom-services
Delete a custom service.

**Request**:
```json
{
  "id": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

#### POST /api/services/add-song
Add a song to a service with full integration.

**Request**:
```json
{
  "songId": "ObjectId", // Note: expects ObjectId, not string
  "serviceDate": "3/15/25",
  "position": "opening|closing|communion|offertory|general",
  "notes": "string" // Optional
}
```

**Response**:
```json
{
  "success": true,
  "message": "Song added to service on date",
  "serviceDate": "3/15/25",
  "songTitle": "string"
}
```

**Note**: This endpoint performs complex operations including:
- Updates `service_details` collection (note underscore vs camelCase)
- Updates `service_songs` collection  
- Records usage in `song_usage` collection
- Handles different position labels and song formatting

---

## Song Usage Analytics

### Usage Tracking
Track and analyze song usage patterns.

#### GET /api/song-usage
Retrieve usage history for a song.

**Query Parameters**:
- `songTitle` - Song title (alternative: `title`)
- `songId` - Song ObjectId (alternative to title)
- `months` - Number of months to analyze (default: 3, not 12)
- `rotation` - Include rotation status ("true")

**Response**:
```json
{
  "song": {
    "title": "string",
    "_id": "ObjectId",
    "type": "hymn|contemporary"
  },
  "usage": [
    {
      "title": "string",
      "dateUsed": "2024-01-01T00:00:00.000Z",
      "service": "string",
      "addedBy": "string"
    }
  ]
}
```

**Note**: The `rotationStatus` field is only included when the `rotation=true` query parameter is used, and requires the song to exist in the main songs collection.

#### POST /api/song-usage
Record song usage for a service.

**Request**:
```json
{
  "title": "string",
  "date": "3/15/25",
  "service": "string",
  "addedBy": "string"
}
```

**Response**:
```json
{
  "acknowledged": true,
  "modifiedCount": 1
}
```

#### PUT /api/song-usage
Update rotation status for all songs.

**Response**:
```json
{
  "updatedCount": 150,
  "songsInRotation": 45,
  "songsLearning": 12
}
```

#### GET /api/song-usage/check
Check if a song was used on a specific date.

**Query Parameters**:
- `title` - Song title (required)
- `date` - Date to check (required)

**Response**:
```json
{
  "exists": true,
  "title": "string",
  "date": "3/15/25"
}
```

### Usage Analytics Endpoints

#### GET /api/song-usage/suggestions
Get song suggestions based on usage patterns.

**Query Parameters**:
- `limit` - Number of suggestions (default: 10)
- `unusedMonths` - Months since last use (default: 6)
- `type` - Song type filter
- `season` - Seasonal filter
- `refresh` - Force refresh cache

**Response**:
```json
{
  "suggestions": [
    {
      "title": "string",
      "type": "hymn|contemporary",
      "lastUsed": "2024-01-01T00:00:00.000Z",
      "monthsSinceLastUse": 8,
      "seasonalTags": ["string"],
      "suggestionScore": 0.85
    }
  ],
  "count": 10,
  "unusedMonths": 6,
  "seasonId": "lent"
}
```

#### GET /api/song-usage/congregation-comfort
Analyze congregation comfort levels with songs.

**Query Parameters**:
- `months` - Analysis period (default: 12)

**Response**:
```json
{
  "metrics": [
    {
      "name": "High Comfort",
      "value": 45
    }
  ],
  "groups": {
    "high": [],
    "learning": [],
    "low": [],
    "unknown": []
  },
  "seasonal": {},
  "totalSongs": 150
}
```

#### GET /api/song-usage/new-songs
Analyze adoption of recently added songs.

**Query Parameters**:
- `months` - Period to analyze (default: 6)
- `limit` - Number of songs (default: 10)

**Response**:
```json
{
  "newSongs": [
    {
      "title": "string",
      "created": "2024-01-01T00:00:00.000Z",
      "daysSinceAddition": 45,
      "usageCount": 3,
      "lastUsed": "2024-01-01T00:00:00.000Z",
      "avgDaysBetweenUses": 15,
      "adoptionScore": 0.75,
      "usageDates": [
        {
          "date": "2024-01-01T00:00:00.000Z",
          "service": "string"
        }
      ],
      "seasonalTags": ["string"]
    }
  ],
  "totalCount": 15
}
```

#### GET /api/song-usage/seasonal-type-distribution
Analyze distribution of song types by season.

**Response**:
```json
{
  "seasonalDistribution": {
    "advent": {
      "hymn": 15,
      "contemporary": 8,
      "total": 23
    }
  },
  "typeDistribution": {
    "hymn": 85,
    "contemporary": 65
  }
}
```

#### GET /api/song-usage/seasonal-gaps
Identify gaps in seasonal song coverage.

**Response**:
```json
{
  "gaps": [
    {
      "season": "epiphany",
      "songCount": 3,
      "recommended": 8,
      "deficit": 5
    }
  ],
  "totalDeficit": 25
}
```

---

## Team Management

### Worship Assignments
Manage worship team assignments and approvals.

#### GET /api/worship-assignments
Retrieve worship team assignments.

**Query Parameters**:
- `date` - Specific date
- `startDate` / `endDate` - Date range
- `limit` - Number of results

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "date": "3/15/25",
    "team": ["string"],
    "songsApproved": true,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/worship-assignments
Create or update worship assignments.

**Request**:
```json
{
  "date": "3/15/25",
  "team": ["string"],
  "songsApproved": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "date": "3/15/25",
    "team": ["string"],
    "songsApproved": true
  }
}
```

#### PUT /api/worship-assignments
Bulk update worship assignments.

**Request**:
```json
{
  "assignments": [
    {
      "date": "3/15/25",
      "team": ["string"]
    }
  ]
}
```

**Response**:
```json
{
  "success": true
}
```

**Note**: The PUT method uses a different collection name (`assignments` instead of `worship_assignments`) and database reference, which is an implementation inconsistency.

### AV Team Management
Manage audio/video team assignments.

#### GET /api/av-team
Retrieve AV team data including members, assignments, and completion status.

**Response**:
```json
{
  "teamMembers": [], // from av_team_members collection
  "assignments": [   // from av_assignments collection
    {
      "_id": "ObjectId",
      "date": "3/15/25",
      "team_member_1": "string",
      "team_member_2": "string",
      "team_member_3": "string",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "completed": [     // from av_completed collection
    {
      "_id": "ObjectId",
      "date": "3/15/25", 
      "completed": true
    }
  ]
}
```

**Note**: This endpoint aggregates data from multiple collections: `av_team_members`, `av_assignments`, and `av_completed`.

#### POST /api/av-team
Create or update AV team assignments.

**Request**:
```json
{
  "type": "signup|completed",
  "date": "3/15/25",
  "position": 1,
  "name": "string",
  "completed": true
}
```

**Response**:
```json
{
  "acknowledged": true,
  "modifiedCount": 1
}
```

### Worship Indexes
Manage worship planning indexes and song history.

#### GET /api/worship-indexes
Retrieve worship planning indexes.

**Query Parameters**:
- `date` - Specific date
- `limit` - Number of results

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "date": "3/15/25",
    "songs": ["string"],
    "notes": "string"
  }
]
```

#### POST /api/worship-indexes
Create or update worship indexes.

**Request**:
```json
{
  "date": "3/15/25",
  "songs": ["string"],
  "notes": "string"
}
```

#### PUT /api/worship-indexes
Check song usage history and update indexes.

**Request**:
```json
{
  "songs": ["string"],
  "date": "3/15/25"
}
```

**Response**:
```json
{
  "songHistory": [
    {
      "title": "string",
      "lastUsed": "2024-01-01T00:00:00.000Z",
      "usageCount": 5
    }
  ]
}
```

---

## Liturgical Calendar

### Current Liturgical Information
Retrieve current liturgical season and calendar data.

#### GET /api/liturgical/current
Get current liturgical season information.

**Response**:
```json
{
  "seasonId": "string",
  "seasonName": "string", 
  "weekInSeason": 4,
  "color": "string",
  "startDate": "2024-02-14T00:00:00.000Z",
  "endDate": "2024-03-31T00:00:00.000Z",
  "daysRemaining": 15,
  "nextSeasonId": "string",
  "nextSeasonName": "string",
  "nextSeasonStartDate": "2024-04-01T00:00:00.000Z"
}
```

**Note**: Response structure is determined by the LiturgicalCalendarService and includes more fields than previously documented.

### Seasonal Transitions
Analyze readiness for seasonal transitions.

#### GET /api/liturgical/seasonal-transition
Analyze congregation readiness for upcoming seasonal changes.

**Response**:
```json
{
  "currentSeason": {
    "seasonId": "string",
    "seasonName": "string",
    "color": "string",
    "totalSongs": 15,
    "highComfortSongs": 12,
    "daysRemaining": 15,
    "readinessScore": 85
  },
  "nextSeason": {
    "seasonId": "string", 
    "seasonName": "string",
    "color": "string",
    "totalSongs": 10,
    "highComfortSongs": 6,
    "readinessScore": 60
  },
  "transitionReady": false,
  "songsNeedingPractice": [
    {
      "title": "string",
      "type": "hymn|contemporary",
      "comfortScore": 3
    }
  ]
}
```

**Note**: This endpoint performs complex analysis of song comfort levels and seasonal readiness using usage data from the song_usage collection.

---

## Administrative

### Signups
Manage general signups and volunteer coordination.

#### GET /api/signups
Retrieve all signups.

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "date": "3/15/25",
    "name": "string",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/signups
Create a new signup.

**Request**:
```json
{
  "date": "3/15/25",
  "name": "string"
}
```

**Response**:
```json
{
  "insertedId": "ObjectId",
  "acknowledged": true
}
```

#### DELETE /api/signups
Delete a signup.

**Request**:
```json
{
  "date": "3/15/25",
  "name": "string"
}
```

**Response**:
```json
{
  "deletedCount": 1,
  "acknowledged": true
}
```

### Completion Tracking
Track completion status of tasks and assignments.

#### GET /api/completed
Retrieve completion status records.

**Response**:
```json
[
  {
    "_id": "ObjectId",
    "date": "3/15/25",
    "completed": true
  }
]
```

#### POST /api/completed
Update completion status.

**Request**:
```json
{
  "date": "3/15/25",
  "completed": true
}
```

**Response**:
```json
{
  "acknowledged": true,
  "modifiedCount": 1
}
```

---

## Implementation Notes

### Database Connection
All endpoints use the same MongoDB connection pattern:
```javascript
const client = await clientPromise;
const db = client.db("church");
```

### Database Collections
The API uses the following MongoDB collections:
- `songs` - Main song library
- `reference_songs` - Curated seasonal song references  
- `song_usage` - Song usage tracking and analytics
- `serviceDetails` - Service planning and liturgical data (primary collection)
- `service_details` - Alternative collection name used in some endpoints
- `service_songs` - Service song selections and assignments
- `custom_services` - Service templates
- `users` - General application users
- `worship_users` - Worship team members  
- `av_users` - Audio/video team members
- `av_team_members` - AV team member roster
- `av_assignments` - AV team assignments
- `av_completed` - AV completion tracking
- `worship_assignments` - Worship team scheduling
- `assignments` - Alternative collection name used in PUT operations (inconsistency)
- `worship_indexes` - Worship planning indexes
- `signups` - General volunteer signups
- `completed` - Task completion tracking

**Note**: There are collection naming inconsistencies in the codebase that should be addressed for consistency.

### Error Handling Pattern
Consistent try-catch blocks across all endpoints:
```javascript
try {
  // API logic
  return NextResponse.json(data);
} catch (e) {
  console.error('Error in [METHOD] [endpoint]:', e);
  return NextResponse.json({ error: e.message }, { status: 500 });
}
```

### Query Parameter Parsing
Standard URL parameter parsing:
```javascript
const { searchParams } = new URL(request.url);
const param = searchParams.get('paramName');
```

### Date Handling
- Input dates in MM/DD/YY format (e.g., "3/15/25")
- Complex date parsing and comparison logic for string-based dates
- Database storage as Date objects or formatted strings depending on collection
- Timezone handling with standardized noon timestamps for song usage
- Service date filtering uses custom comparison logic due to string storage

### Content Parsing
Service details support automatic content parsing:
- Legacy content fields are automatically parsed into structured elements
- Element types: `song_hymn`, `song_contemporary`, `reading`, `message`, `liturgy`
- Parsed elements are saved back to the database for future requests

### Liturgical Integration  
- Service details automatically receive liturgical information via LiturgicalCalendarService
- Liturgical data includes season name, week number, color, and season ID
- Integration occurs during GET requests if liturgical data is missing

### Caching Strategy
- Cache-busting via `_t` timestamp parameter
- No server-side caching implemented
- Client-side polling for real-time updates

### Known Limitations and Notes
- **Songs API**: `rotationStatus` field referenced in usage analytics but not implemented in main songs endpoints
- **Reference Songs Import**: Complex endpoint that handles service assignment in addition to song import
- **Date Filtering**: String-based date storage requires custom comparison logic in several endpoints
- **Error Responses**: Inconsistent error response formats across different endpoint groups
- **Validation**: Reference songs endpoints have comprehensive validation that may not be fully documented
- **Collection Naming**: Inconsistent collection names across endpoints:
  - `serviceDetails` vs `service_details` 
  - `worship_assignments` vs `assignments` (in PUT operations)
  - Multiple AV-related collections (`av_users`, `av_team_members`, `av_assignments`, `av_completed`)
- **Missing DELETE**: AV users endpoint lacks DELETE method despite other user endpoints having it

### Development Notes
- Worship users collection has path mismatch in code comments (`/api/worship-users` vs actual `/api/users/worship`)
- Service details includes sophisticated content parsing not mentioned in basic documentation
- Song usage analytics include rotation status calculations that reference non-existent song fields
- Some endpoints return MongoDB operation results directly (`acknowledged`, `modifiedCount`, etc.)

---

## API Inconsistencies and Roadmap

### Current Implementation Gaps
1. **Rotation Status**: Referenced throughout analytics but not implemented in songs API
2. **Error Response Standardization**: Different endpoints use different error response formats
3. **Field Validation**: Some endpoints have extensive validation not reflected in documentation
4. **Date Storage**: Mixed storage formats (strings vs Date objects) create complexity
5. **Collection Naming**: Inconsistent collection names across related endpoints
6. **Missing Methods**: AV users lack DELETE endpoint unlike other user management endpoints
7. **Database References**: Some endpoints use different database references (e.g., `process.env.MONGODB_DB` vs `"church"`)

### Recommended Improvements
1. Implement `rotationStatus` field in songs API or remove references from analytics
2. Standardize error response formats across all endpoints
3. Document all validation rules and required fields clearly
4. Standardize date storage format across collections
5. Resolve collection naming inconsistencies (`serviceDetails` vs `service_details`, `worship_assignments` vs `assignments`)
6. Add missing DELETE endpoints where appropriate (e.g., AV users)
7. Standardize database connection patterns across all endpoints
8. Consolidate AV-related collections or clearly document the separation of concerns

### Recent Updates (July 2025)
This documentation has been updated to reflect the actual API implementation as of July 2025. Previous versions contained significant inaccuracies in response structures, field names, and endpoint behavior.

---

## Related Documentation

- [Architecture Overview](./architecture-overview.md) - System architecture and component relationships
- [Database Schema](./database-schema.md) - Complete MongoDB schema reference  
- [AI Agent Best Practices](./ai-agent-best-practices.md) - Development guidelines and patterns

---

*This document is part of the ZionSync technical documentation suite. Last updated: July 2025. For questions or contributions, refer to the main project documentation.*
