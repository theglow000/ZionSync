# Song Management System Guide

## Overview
ZionSync's song management system is a comprehensive solution for managing the church's music library, tracking usage patterns, and facilitating song discovery. The system integrates multiple data sources, provides intelligent duplicate detection, and offers advanced analytics to optimize worship planning.

## Table of Contents
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Usage Tracking & Analytics](#usage-tracking--analytics)
- [External Integrations](#external-integrations)
- [Quick-Add Functionality](#quick-add-functionality)
- [Duplicate Detection & Merging](#duplicate-detection--merging)
- [Song Discovery & Rediscovery](#song-discovery--rediscovery)
- [User Interface Components](#user-interface-components)
- [API Reference](#api-reference)
- [Configuration & Setup](#configuration--setup)
- [Troubleshooting](#troubleshooting)

## System Architecture

### Core Components
The song management system consists of several interconnected components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Song Management System                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Song Database │  │ Reference Songs │  │ Usage        │ │
│  │   - songs       │  │ - reference_    │  │ Tracking     │ │
│  │   - service_    │  │   songs         │  │ - song_usage │ │
│  │     songs       │  │ - external_     │  │ - analytics  │ │
│  │                 │  │   imports       │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Suggestion      │  │ Duplicate       │  │ External     │ │
│  │ Engine          │  │ Detection       │  │ Integrations │ │
│  │ - algorithms    │  │ - matching      │  │ - Hymnary    │ │
│  │ - rediscovery   │  │ - merging       │  │ - SongSelect │ │
│  │ - variety       │  │ - validation    │  │ - YouTube    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Song Entry**: Songs entered via Quick-Add Modal or bulk import
2. **Validation**: Duplicate detection and data validation
3. **Storage**: Stored in songs collection with metadata
4. **Usage Tracking**: Service usage recorded in song_usage collection
5. **Analytics**: Usage patterns analyzed for suggestions and insights
6. **Discovery**: Rediscovery algorithms surface underused songs

## Database Schema

### Primary Collections

#### Songs Collection
```javascript
{
  _id: ObjectId,
  title: String,           // Song title (required)
  type: String,           // "hymn", "contemporary", "spiritual", etc.
  number: String,         // Song number (for hymnal songs)
  hymnal: String,         // Hymnal identifier ("cranberry", "blue", etc.)
  author: String,         // Author/composer name
  hymnaryLink: String,    // Link to Hymnary.org resource
  songSelectLink: String, // Link to SongSelect resource
  youtubeLink: String,    // Link to YouTube video
  notes: String,          // Performance notes or additional info
  songOrder: String,      // Component order for Proclaim presentations (e.g., "Verse 1, Chorus, Verse 2, Chorus")
  created: Date,          // Date record was created
  lastUpdated: Date,      // Date of last modification
  usageCount: Number,     // Total times this song has been used (for analytics efficiency)
  
  // Optional fields (added by system processes)
  seasonalTags: [String],        // Auto-generated seasonal tags
  seasonalTagsConfidence: Number, // Confidence score for tags (0-1)
  rotationStatus: String         // "active", "retired", "seasonal"
}
```

**Schema Notes:**
- The `songs` collection uses a simplified hymnal-focused schema
- `type` distinguishes between hymnal songs and contemporary music
- `hymnal` and `number` are used for traditional hymnal references
- `songOrder` enables integration with Proclaim for presentation planning
- `usageCount` provides efficient analytics without expensive queries
- Seasonal tagging is handled automatically by background processes
- External links provide access to additional resources

#### Reference Songs Collection
```javascript
{
  _id: ObjectId,
  title: String,           // Song title
  type: String,           // Song type ("hymn", "contemporary", etc.)
  seasonalTags: [String], // Seasonal/liturgical tags
  source: String,         // Import source identifier
  hymnal: String,         // Hymnal reference (if applicable)
  number: String,         // Song number in hymnal
  arrangement: String,    // Musical arrangement type
  tempo: String,          // Tempo marking
  theme: String           // Primary liturgical theme
}
```

**Schema Notes:**
- Reference songs are used for importing and matching against the main song database
- Contains metadata for seasonal and liturgical categorization
- Supports both hymnal references and contemporary song data
- Used by import processes and suggestion algorithms

#### Service Songs Collection
```javascript
{
  _id: ObjectId,
  serviceId: ObjectId,     // Reference to service
  songId: ObjectId,        // Reference to song
  songTitle: String,       // Denormalized for performance
  position: Number,        // Order in service
  context: String,         // "opening", "worship", "closing", etc.
  date: Date,              // Service date
  team: String,            // Worship team identifier
  notes: String            // Service-specific notes
}
```

#### Song Usage Collection
```javascript
{
  _id: ObjectId,
  title: String,           // Song title (denormalized for performance)
  songData: Object,        // Cached song information
  type: String,            // Song type ("hymn", "contemporary", etc.)
  uses: [                  // Array of usage records
    {
      dateUsed: Date,      // Date song was used in service
      service: String,     // Service identifier or type
      addedBy: String      // User who added the usage record
    }
  ]
}
```

**Schema Notes:**
- Uses a nested structure with a `uses` array for multiple usage records
- Song title and type are denormalized for query performance
- Each usage record captures when, where, and who recorded the usage
- `songData` contains cached song information to reduce joins

### Related Collections
- **services**: Contains service information referenced by usage tracking
- **teams**: Team information for usage analytics
- **liturgical_calendar**: Seasonal context for song selection

*For complete schema details, see [Database Schema Guide](./database-schema.md)*

## Usage Tracking & Analytics

### SongUsageAnalyzer
**File**: `src/lib/SongUsageAnalyzer.js`

The `SongUsageAnalyzer` provides comprehensive analytics for song usage patterns:

#### Core Functionality
```javascript
class SongUsageAnalyzer {
  // Analyze usage patterns for songs with rotation metrics
  static async analyzeSongUsagePatterns(options = {})
  
  // Update rotation status for all songs based on usage patterns  
  static async updateSongRotationStatus()
  
  // Get songs currently in learning phase (consecutive usage)
  static async getLearningPhraseSongs()
  
  // Get songs actively in rotation
  static async getActiveRotationSongs()
}
```

#### Key Methods

##### Usage Pattern Analysis
```javascript
// Analyzes song usage patterns with rotation metrics
const patterns = await SongUsageAnalyzer.analyzeSongUsagePatterns({
  consecutiveThreshold: 2,    // Services in a row = learning
  recentServicesWindow: 6,    // Recent services to consider  
  inRotationThreshold: 3      // Uses in window = in rotation
});
// Returns: Array of songs with isLearning, isInRotation, rotationScore
```

##### Rotation Status Updates
```javascript
// Updates all songs with current rotation status
const updateResult = await SongUsageAnalyzer.updateSongRotationStatus();
// Returns: { totalSongs, updatedSongs, songDetails[] }
```

##### Learning Phase Detection
```javascript
// Get songs currently being learned (consecutive usage)
const learningSongs = await SongUsageAnalyzer.getLearningPhraseSongs();
// Returns: Songs marked as isLearning: true
```

##### Active Rotation Tracking
```javascript
// Get songs currently in active rotation
const activeSongs = await SongUsageAnalyzer.getActiveRotationSongs();
// Returns: Songs marked as isInRotation: true
```

### Specialized Analytics APIs
**Architecture**: Purpose-built endpoints for specific analytics needs

#### Available Analytics Endpoints
- `GET /api/song-usage/suggestions` - Intelligent song recommendations based on usage patterns
- `GET /api/song-usage/congregation-comfort` - Congregation familiarity analysis by comfort level
- `GET /api/song-usage/seasonal-type-distribution` - Distribution analysis by season and song type
- `GET /api/song-usage/seasonal-gaps` - Identify gaps in seasonal song usage
- `GET /api/song-usage/new-songs` - Track adoption patterns of recently added songs
- `GET /api/song-usage/check` - Check if specific songs were used on given dates
- `POST /api/song-usage` - Record song usage for services
- `PUT /api/song-usage` - Update rotation status for all songs

**Design Philosophy**: Rather than generic analytics endpoints, the system provides specialized endpoints that serve specific worship planning needs with optimized data structures.

#### Song Suggestions Response Example
```javascript
// GET /api/song-usage/suggestions?season=advent&limit=5
{
  suggestions: [
    {
      title: "O Come, O Come, Emmanuel",
      type: "hymn",
      hymnal: "cranberry", 
      number: "116",
      lastUsed: "2024-10-15T00:00:00.000Z",
      monthsSinceLastUse: 3,
      seasonalTags: ["advent", "longing"],
      suggestionScore: 0.95,
      reason: "High seasonal relevance for Advent"
    }
  ],
  count: 5,
  seasonId: "advent",
  metadata: {
    totalSuggestions: 25,
    seasonalRelevanceWeight: 0.7,
    congregationComfortWeight: 0.3
  }
}
```

#### Congregation Comfort Analysis Example  
```javascript
// GET /api/song-usage/congregation-comfort
{
  distribution: {
    high: 45,      // Songs congregation knows well
    learning: 12,  // Songs being learned  
    low: 8         // Unfamiliar songs
  },
  groups: {
    high: [
      {
        title: "How Great Thou Art",
        comfortScore: 0.92,
        usageCount: 15,
        lastUsed: "2024-11-20T00:00:00.000Z"
      }
    ],
    learning: [...],
    low: [...]
  }
}
```

## External Integrations

### Integration Architecture
ZionSync integrates with multiple external song databases and services:

```
┌─────────────────────────────────────────────────────────────┐
│                 External Integrations                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  Hymnary    │    │ SongSelect  │    │  YouTube    │    │
│  │  - Metadata │    │ - Licensing │    │ - Media     │    │
│  │  - History  │    │ - Lyrics    │    │ - Links     │    │
│  │  - Themes   │    │ - Keys      │    │ - Validation│    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                   │                   │         │
│         └───────────────────┼───────────────────┘         │
│                             │                             │
│              ┌─────────────┐│┌─────────────┐              │
│              │ Import API  │││ Quick-Add   │              │
│              │ - Batch     │││ - Real-time │              │
│              │ - Seasonal  │││ - Validation│              │
│              └─────────────┘└┘└─────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Hymnary Integration
**Source**: Traditional hymns and historical song data

#### Features
- **Metadata Enrichment**: Historical context, themes, seasonal associations
- **Liturgical Mapping**: Automatic season and theme tagging
- **Bulk Import**: Seasonal song collections

#### Implementation
```javascript
// Hymnary data structure
const hymnaryData = {
  id: "h123",
  title: "Amazing Grace",
  authors: ["John Newton"],
  year: 1779,
  themes: ["grace", "redemption", "testimony"],
  seasons: ["ordinary-time", "lent"],
  liturgicalUses: ["confession", "assurance"],
  hymnals: ["Methodist", "Presbyterian", "Lutheran"]
};
```

### SongSelect Integration
**Source**: CCLI's SongSelect service for contemporary Christian music

#### Features
- **Licensing Data**: CCLI numbers and usage rights
- **Contemporary Catalog**: Modern worship songs
- **Lyric Synchronization**: Official lyrics and chord charts

#### Implementation
```javascript
// SongSelect integration points
const songSelectData = {
  ccliNumber: "7104870",
  title: "Way Maker",
  authors: ["Osinachi Kalu Okoro Egbu"],
  copyright: "2016 Integrity Music Europe",
  themes: ["faith", "trust", "miracles"],
  key: "Bb",
  tempo: "Medium"
};
```

### YouTube Integration
**Source**: Video content and media validation

#### Features
- **Media Links**: Associated video content
- **Validation**: Automatic link verification
- **Metadata Extraction**: Video titles, descriptions, duration

#### Implementation
```javascript
// YouTube data integration
const youtubeData = {
  videoId: "dQw4w9WgXcQ",
  title: "Amazing Grace (Live)",
  duration: "PT4M32S",
  channelName: "Worship Together",
  validatedAt: new Date(),
  isAvailable: true
};
```

### Import Scripts
**File**: `src/scripts/import-seasonal-songs.js`

Automated import of seasonal song collections:

```javascript
// Import seasonal songs from external sources
const importSeasonal = async (season, source) => {
  const songs = await fetchFromSource(source, { season });
  
  for (const song of songs) {
    // Duplicate detection
    const existing = await detectDuplicate(song);
    
    if (!existing) {
      // Create reference song for review
      await createReferenceSong(song, source);
    } else {
      // Update existing with new metadata
      await enrichSongMetadata(existing, song);
    }
  }
};
```

## Quick-Add Functionality

### QuickAddModal Component
**File**: `src/components/ui/QuickAddModal.jsx`

The Quick-Add functionality provides rapid song entry with real-time validation and duplicate detection.

#### Features
- **Real-time Search**: Instant search across local and external databases
- **Duplicate Prevention**: Live duplicate detection as user types
- **Smart Suggestions**: Context-aware song suggestions
- **Bulk Entry**: Multiple song addition in one workflow
- **External Lookup**: Automatic metadata enrichment

#### Component Structure
```jsx
const QuickAddModal = ({ isOpen, onClose, serviceId, onSongAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Real-time search and validation
  useEffect(() => {
    if (searchTerm.length > 2) {
      debounceSearch(searchTerm);
    }
  }, [searchTerm]);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <SearchInput 
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search songs or enter new song title..."
      />
      
      <SuggestionsList 
        suggestions={suggestions}
        onSelect={handleSongSelect}
      />
      
      <DuplicateWarnings 
        warnings={duplicateWarnings}
        onResolve={handleDuplicateResolve}
      />
      
      <QuickAddForm 
        onSubmit={handleQuickAdd}
        isValidating={isValidating}
      />
    </Modal>
  );
};
```

#### Quick-Add Workflow
1. **Initial Search**: User enters song title or search term
2. **Real-time Suggestions**: System provides matching suggestions from:
   - Local song database
   - Reference songs (external imports)
   - External APIs (when configured)
3. **Duplicate Detection**: Live matching against existing songs
4. **Selection or Creation**:
   - **Existing Song**: Select from suggestions
   - **New Song**: Create with minimal required fields
5. **Validation**: Data validation and CCLI lookup if available
6. **Addition**: Song added to service or general database

### Reference Songs Import API
**Endpoint**: `/api/reference-songs/import`

Handles bulk import and processing of reference songs:

```javascript
// POST /api/reference-songs/import
{
  source: "hymnary",           // Source identifier
  songs: [                     // Array of song objects
    {
      title: "Be Still My Soul",
      artist: "Katharina von Schlegel",
      sourceId: "h456",
      metadata: {
        year: 1752,
        themes: ["trust", "peace"],
        seasons: ["lent", "ordinary-time"]
      }
    }
  ],
  options: {
    skipDuplicates: true,      // Skip existing matches
    enrichMetadata: true,      // Enhance with external data
    autoApprove: false         // Require manual review
  }
}
```

## Duplicate Detection & Merging

### SongMatcher Component
**File**: `src/lib/SongMatcher.js`

The `SongMatcher` provides sophisticated duplicate detection and merging capabilities:

#### Core Functionality
```javascript
class SongMatcher {
  // Find potential duplicates
  async findPotentialDuplicates(song, options = {})
  
  // Calculate similarity score
  calculateSimilarity(song1, song2)
  
  // Merge songs
  async mergeSongs(primarySongId, duplicateSongIds, options = {})
  
  // Validate merge operation
  validateMerge(primarySong, duplicates)
}
```

#### Matching Algorithms

##### Title Matching
```javascript
// Fuzzy string matching for song titles
const titleSimilarity = (title1, title2) => {
  // Normalize titles (remove articles, punctuation)
  const normalized1 = normalizeTitle(title1);
  const normalized2 = normalizeTitle(title2);
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  
  // Return similarity score (0-1)
  return 1 - (distance / Math.max(normalized1.length, normalized2.length));
};
```

##### Multi-field Matching
```javascript
// Comprehensive matching across multiple fields
const calculateSimilarity = (song1, song2) => {
  const weights = {
    title: 0.4,      // Title similarity weight
    artist: 0.3,     // Artist similarity weight
    ccli: 0.2,       // CCLI exact match bonus
    duration: 0.1    // Duration similarity
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  // Title comparison
  if (song1.title && song2.title) {
    totalScore += titleSimilarity(song1.title, song2.title) * weights.title;
    totalWeight += weights.title;
  }
  
  // Artist comparison
  if (song1.artist && song2.artist) {
    totalScore += artistSimilarity(song1.artist, song2.artist) * weights.artist;
    totalWeight += weights.artist;
  }
  
  // CCLI exact match
  if (song1.ccliNumber && song2.ccliNumber) {
    const ccliMatch = song1.ccliNumber === song2.ccliNumber ? 1.0 : 0.0;
    totalScore += ccliMatch * weights.ccli;
    totalWeight += weights.ccli;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
};
```

#### Duplicate Detection Workflow
1. **Pre-processing**: Normalize song data (titles, artist names)
2. **Initial Screening**: Quick filters (CCLI matches, exact title matches)
3. **Similarity Calculation**: Multi-field similarity scoring
4. **Threshold Filtering**: Filter results above similarity threshold (0.8)
5. **Manual Review**: Present high-confidence matches for user review
6. **Merge Processing**: Execute approved merges with data consolidation

### Song Merging API
**Endpoint**: `/api/songs/merge`

Handles the merging of duplicate songs:

```javascript
// POST /api/songs/merge
{
  primarySongId: "64f5...",    // Song to keep
  duplicateSongIds: [          // Songs to merge
    "64f6...",
    "64f7..."
  ],
  mergeOptions: {
    preserveUsageHistory: true, // Keep all usage records
    consolidateMetadata: true,  // Merge metadata fields
    notifyTeams: true          // Notify affected teams
  }
}
```

#### Merge Process
1. **Validation**: Verify songs exist and user permissions
2. **Data Consolidation**: Merge metadata, preserving best data
3. **Usage Transfer**: Update service_songs and song_usage references
4. **History Preservation**: Maintain audit trail of merge operation
5. **Cleanup**: Mark duplicate songs as inactive, preserve for rollback
6. **Notification**: Alert relevant teams of merge completion

### Duplicate Prevention
Real-time duplicate prevention during song entry:

```javascript
// Real-time duplicate detection in QuickAddModal
const checkForDuplicates = debounce(async (songData) => {
  const matches = await SongMatcher.findPotentialDuplicates(songData, {
    threshold: 0.7,
    includeInactive: false
  });
  
  if (matches.length > 0) {
    setDuplicateWarnings(matches.map(match => ({
      song: match.song,
      similarity: match.similarity,
      confidence: match.confidence,
      suggestion: match.similarity > 0.9 ? 'likely_duplicate' : 'possible_duplicate'
    })));
  }
}, 300);
```

## Song Discovery & Rediscovery

### SongRediscoveryPanel Component
**File**: `src/components/ui/SongRediscoveryPanel.jsx`

The rediscovery system helps worship teams find underutilized songs and maintain variety in their repertoire.

#### Features
- **Underused Song Detection**: Identify songs not used recently
- **Seasonal Recommendations**: Surface seasonally appropriate songs
- **Variety Analysis**: Analyze style and theme diversity
- **Smart Suggestions**: Context-aware song recommendations

#### Component Structure
```jsx
const SongRediscoveryPanel = ({ teamId, serviceDate, seasonContext }) => {
  const [rediscoveryData, setRediscoveryData] = useState(null);
  const [filters, setFilters] = useState({
    timeframe: 'last-6-months',
    minUsageGap: 90,        // Days since last use
    includeSeasons: true,
    includeStyles: true
  });
  
  useEffect(() => {
    loadRediscoveryData();
  }, [teamId, filters]);
  
  return (
    <Panel title="Song Rediscovery">
      <FilterControls 
        filters={filters}
        onChange={setFilters}
      />
      
      <RediscoveryCategories 
        data={rediscoveryData}
        onSongSelect={handleSongSelect}
      />
      
      <VarietyMetrics 
        metrics={rediscoveryData?.varietyMetrics}
      />
    </Panel>
  );
};
```

### SongSuggestionEngine
**File**: `src/lib/SongSuggestionEngine.js`

Core algorithm engine for song recommendations and rediscovery:

#### Key Methods

##### Underused Song Detection
```javascript
// Find songs that haven't been used recently
async findUnderusedSongs(teamId, options = {}) {
  const {
    minDaysSinceUse = 90,
    seasonContext = null,
    maxResults = 20
  } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - minDaysSinceUse);
  
  const underusedSongs = await this.db.collection('songs').aggregate([
    {
      $lookup: {
        from: 'song_usage',
        localField: '_id',
        foreignField: 'songId',
        as: 'usageHistory'
      }
    },
    {
      $match: {
        isActive: true,
        $or: [
          { 'usageHistory': { $size: 0 } },  // Never used
          { 
            'usageHistory': {
              $not: {
                $elemMatch: {
                  date: { $gte: cutoffDate },
                  team: teamId
                }
              }
            }
          }
        ]
      }
    },
    {
      $addFields: {
        daysSinceLastUse: {
          $cond: {
            if: { $eq: [{ $size: '$usageHistory' }, 0] },
            then: 9999,  // Never used
            else: {
              $divide: [
                { $subtract: [new Date(), { $max: '$usageHistory.date' }] },
                86400000  // Convert to days
              ]
            }
          }
        }
      }
    },
    { $sort: { daysSinceLastUse: -1 } },
    { $limit: maxResults }
  ]).toArray();
  
  return underusedSongs;
}
```

##### Seasonal Recommendations
```javascript
// Get seasonally appropriate song suggestions
async getSeasonalRecommendations(seasonContext, teamId, options = {}) {
  const {
    includeUnderused = true,
    varietyBoost = true,
    maxResults = 15
  } = options;
  
  // Base query for seasonal songs
  let query = {
    isActive: true,
    seasons: { $in: [seasonContext] }
  };
  
  // Add underused filter if requested
  if (includeUnderused) {
    const recentUsage = await this.getRecentUsage(teamId, 60); // Last 60 days
    const recentSongIds = recentUsage.map(usage => usage.songId);
    query._id = { $nin: recentSongIds };
  }
  
  let songs = await this.db.collection('songs')
    .find(query)
    .limit(maxResults * 2)  // Get extra for variety filtering
    .toArray();
  
  // Apply variety boost if requested
  if (varietyBoost) {
    songs = this.applyVarietyFilter(songs, teamId);
  }
  
  return songs.slice(0, maxResults);
}
```

##### Variety Analysis
```javascript
// Analyze variety in recent song selections
async analyzeVariety(teamId, timeframe = 90) {
  const recentUsage = await this.getRecentUsage(teamId, timeframe);
  
  // Group by various attributes
  const styleDistribution = {};
  const tempoDistribution = {};
  const themeDistribution = {};
  const keyDistribution = {};
  
  for (const usage of recentUsage) {
    const song = await this.getSongById(usage.songId);
    
    // Count styles
    if (song.style) {
      styleDistribution[song.style] = (styleDistribution[song.style] || 0) + 1;
    }
    
    // Count tempos
    if (song.tempo) {
      tempoDistribution[song.tempo] = (tempoDistribution[song.tempo] || 0) + 1;
    }
    
    // Count themes
    if (song.themes) {
      song.themes.forEach(theme => {
        themeDistribution[theme] = (themeDistribution[theme] || 0) + 1;
      });
    }
    
    // Count keys
    if (song.key) {
      keyDistribution[song.key] = (keyDistribution[song.key] || 0) + 1;
    }
  }
  
  // Calculate variety scores (higher = more diverse)
  const calculateVarietyScore = (distribution) => {
    const values = Object.values(distribution);
    const total = values.reduce((sum, count) => sum + count, 0);
    const uniqueItems = Object.keys(distribution).length;
    
    if (uniqueItems <= 1) return 0;
    
    // Calculate entropy-based score
    const entropy = values.reduce((entropy, count) => {
      const probability = count / total;
      return entropy - (probability * Math.log2(probability));
    }, 0);
    
    const maxEntropy = Math.log2(uniqueItems);
    return entropy / maxEntropy;  // Normalize to 0-1
  };
  
  return {
    styleVariety: calculateVarietyScore(styleDistribution),
    tempoVariety: calculateVarietyScore(tempoDistribution),
    themeVariety: calculateVarietyScore(themeDistribution),
    keyVariety: calculateVarietyScore(keyDistribution),
    distributions: {
      styles: styleDistribution,
      tempos: tempoDistribution,
      themes: themeDistribution,
      keys: keyDistribution
    },
    overallScore: [
      calculateVarietyScore(styleDistribution),
      calculateVarietyScore(tempoDistribution),
      calculateVarietyScore(themeDistribution),
      calculateVarietyScore(keyDistribution)
    ].reduce((sum, score) => sum + score, 0) / 4
  };
}
```

### Rediscovery Algorithms

#### Usage Gap Analysis
```javascript
// Identify songs with significant usage gaps
const identifyUsageGaps = async (teamId, analysisWindow = 365) => {
  const usageData = await SongUsageAnalyzer.getDetailedUsage(teamId, analysisWindow);
  
  const gapAnalysis = usageData.map(song => {
    const usageDates = song.usageHistory
      .map(usage => new Date(usage.date))
      .sort((a, b) => a - b);
    
    let maxGap = 0;
    let currentGap = 0;
    let gapDetails = [];
    
    for (let i = 1; i < usageDates.length; i++) {
      const gap = Math.floor((usageDates[i] - usageDates[i-1]) / (1000 * 60 * 60 * 24));
      
      if (gap > maxGap) {
        maxGap = gap;
      }
      
      if (gap > 60) {  // Significant gap threshold
        gapDetails.push({
          startDate: usageDates[i-1],
          endDate: usageDates[i],
          days: gap
        });
      }
    }
    
    // Check gap since last use
    const daysSinceLastUse = usageDates.length > 0 
      ? Math.floor((new Date() - usageDates[usageDates.length - 1]) / (1000 * 60 * 60 * 24))
      : 9999;
    
    return {
      song,
      maxGap,
      daysSinceLastUse,
      significantGaps: gapDetails,
      rediscoveryScore: calculateRediscoveryScore(maxGap, daysSinceLastUse, song.usageCount)
    };
  });
  
  return gapAnalysis.sort((a, b) => b.rediscoveryScore - a.rediscoveryScore);
};
```

## User Interface Components

### SongDatabase Component
**File**: `src/components/ui/SongDatabase.jsx`

Main interface for song management and database operations:

#### Key Features
- **Song List Management**: Paginated, searchable song list
- **Filtering & Sorting**: Multi-field filtering and sorting options
- **Bulk Operations**: Select and operate on multiple songs
- **Quick Actions**: Rapid song operations (edit, duplicate, archive)
- **Usage Analytics**: Integrated usage statistics display

#### Component Structure
```jsx
const SongDatabase = () => {
  const [songs, setSongs] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    style: 'all',
    season: 'all',
    usageRange: 'all'
  });
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: 'title',
    direction: 'asc'
  });
  
  return (
    <div className="song-database">
      <SongDatabaseHeader 
        onAddSong={handleAddSong}
        onImport={handleImport}
        totalCount={songs.length}
      />
      
      <SongFilters 
        filters={filters}
        onChange={setFilters}
      />
      
      <SongTable 
        songs={songs}
        sortConfig={sortConfig}
        onSort={setSortConfig}
        selectedSongs={selectedSongs}
        onSelectionChange={setSelectedSongs}
        onSongAction={handleSongAction}
      />
      
      <BulkActions 
        selectedSongs={selectedSongs}
        onBulkAction={handleBulkAction}
      />
    </div>
  );
};
```

### ServiceSongSelector Component
**File**: `src/components/ui/ServiceSongSelector.jsx`

Song selection interface for service planning:

#### Features
- **Context-Aware Suggestions**: Suggestions based on service type and season
- **Usage Validation**: Warnings for overused songs
- **Quick Preview**: Song details and history preview
- **Drag & Drop**: Reorder songs within service

```jsx
const ServiceSongSelector = ({ serviceId, serviceDate, seasonContext }) => {
  const [availableSongs, setAvailableSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [usageWarnings, setUsageWarnings] = useState([]);
  
  return (
    <div className="service-song-selector">
      <SuggestionPanel 
        suggestions={suggestions}
        seasonContext={seasonContext}
        onSongAdd={handleSongAdd}
      />
      
      <SongSearchAndFilter 
        songs={availableSongs}
        filters={searchFilters}
        onFilterChange={setSearchFilters}
      />
      
      <SelectedSongsList 
        songs={selectedSongs}
        usageWarnings={usageWarnings}
        onReorder={handleReorder}
        onRemove={handleRemove}
      />
      
      <RediscoveryPrompts 
        underusedSongs={rediscoveryData}
        onSongSelect={handleSongAdd}
      />
    </div>
  );
};
```

## API Reference

### Core Song APIs

#### Songs Collection API
**Base**: `/api/songs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/songs` | List all songs with filtering |
| POST | `/api/songs` | Create new song |
| GET | `/api/songs/:id` | Get specific song |
| PUT | `/api/songs/:id` | Update song |
| DELETE | `/api/songs/:id` | Archive song |
| POST | `/api/songs/search` | Advanced song search |
| POST | `/api/songs/merge` | Merge duplicate songs |

#### Usage Tracking APIs
**Base**: `/api/song-usage`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/song-usage` | Basic usage tracking |
| GET | `/api/song-usage/suggestions` | Song suggestions based on usage |
| GET | `/api/song-usage/seasonal-type-distribution` | Distribution by season and type |
| GET | `/api/song-usage/seasonal-gaps` | Identify seasonal usage gaps |
| GET | `/api/song-usage/new-songs` | Recently added songs tracking |
| GET | `/api/song-usage/check` | Check usage status |
| GET | `/api/song-usage/congregation-comfort` | Congregation familiarity analysis |

**Note**: The system provides specialized endpoints focused on seasonal planning and congregation comfort analysis, rather than generic analytics endpoints.

#### Reference Songs APIs
**Base**: `/api/reference-songs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reference-songs` | List reference songs |
| POST | `/api/reference-songs/import` | Import reference songs |
| PUT | `/api/reference-songs/:id/approve` | Approve reference song |
| DELETE | `/api/reference-songs/:id` | Reject reference song |

### API Request/Response Examples

#### Create New Song
```javascript
// POST /api/songs
{
  title: "Great Is Thy Faithfulness",
  type: "hymn",
  number: "89",
  hymnal: "cranberry",
  author: "Thomas Chisholm & William M. Runyan",
  hymnaryLink: "https://hymnary.org/text/great_is_thy_faithfulness_o_god_my_fathe",
  songSelectLink: "https://songselect.ccli.com/Songs/18723",
  youtubeLink: "https://www.youtube.com/watch?v=example",
  notes: "Traditional arrangement, familiar to congregation"
}

// Response
{
  success: true,
  songId: "64f5a1b2c3d4e5f6g7h8i9j0",
  duplicateCheck: {
    potentialDuplicates: [],
    confidence: "low"
  },
  message: "Song added successfully"
}
```

#### Get Song Suggestions
```javascript
// GET /api/song-usage/suggestions?season=advent&limit=10

// Response
{
  success: true,
  season: "advent",
  suggestions: [
    {
      songId: "64f5a1b2c3d4e5f6g7h8i9j0",
      title: "O Come, O Come, Emmanuel",
      type: "hymn",
      hymnal: "cranberry",
      number: "116",
      score: 0.95,
      reason: "High seasonal relevance for Advent"
    },
    {
      songId: "64f6b2c3d4e5f6g7h8i9j1",
      title: "Come, Thou Long-Expected Jesus",
      type: "hymn", 
      hymnal: "cranberry",
      number: "125",
      score: 0.88,
      reason: "Traditional Advent hymn, familiar to congregation"
    }
  ],
  metadata: {
    totalSuggestions: 25,
    seasonalRelevanceWeight: 0.7,
    congregationComfortWeight: 0.3
  }
}
```
}
```

#### Import Reference Songs
```javascript
// POST /api/reference-songs/import
{
  source: "hymnary",
  seasonContext: "advent",
  songs: [
    {
      title: "O Come, O Come Emmanuel",
      artist: "Traditional",
      sourceId: "h789",
      metadata: {
        year: "9th century",
        themes: ["advent", "expectation", "longing"],
        liturgicalUse: ["advent-wreath", "processional"]
      }
    }
  ],
  options: {
    skipDuplicates: true,
    requireReview: true,
    enrichMetadata: true
  }
}

// Response
{
  success: true,
  imported: 1,
  skipped: 0,
  requiresReview: 1,
  referenceIds: ["64f7a1b2c3d4e5f6g7h8i9j1"],
  duplicateMatches: [],
  message: "Import completed. 1 song requires review."
}
```

*For complete API documentation, see [API Reference Guide](./api-reference.md)*

## Configuration & Setup

### Environment Variables
```bash
# External API Configuration
HYMNARY_API_KEY=your_hymnary_key
SONGSELECT_API_KEY=your_songselect_key
YOUTUBE_API_KEY=your_youtube_key

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/zionsync
MONGODB_DB_NAME=zionsync

# Feature Flags
ENABLE_EXTERNAL_IMPORTS=true
ENABLE_AUTO_DUPLICATE_DETECTION=true
ENABLE_USAGE_ANALYTICS=true
```

### Database Indexes
Ensure proper indexes for performance:

```javascript
// Songs collection indexes
db.songs.createIndex({ title: "text", artist: "text", lyrics: "text" });
db.songs.createIndex({ ccliNumber: 1 });
db.songs.createIndex({ seasons: 1 });
db.songs.createIndex({ themes: 1 });
db.songs.createIndex({ lastUsed: -1 });
db.songs.createIndex({ usageCount: -1 });

// Song usage collection indexes
db.song_usage.createIndex({ songId: 1, date: -1 });
db.song_usage.createIndex({ date: -1 });
db.song_usage.createIndex({ team: 1, date: -1 });
db.song_usage.createIndex({ seasonContext: 1 });

// Service songs collection indexes
db.service_songs.createIndex({ serviceId: 1, position: 1 });
db.service_songs.createIndex({ songId: 1, date: -1 });
```

### Performance Optimization

#### Caching Strategy
```javascript
// Redis caching for frequently accessed data
const cacheKeys = {
  songUsageAnalytics: 'usage:analytics:{teamId}:{timeframe}',
  seasonalSuggestions: 'suggestions:seasonal:{season}:{teamId}',
  duplicateMatches: 'duplicates:matches:{songId}',
  varietyMetrics: 'variety:metrics:{teamId}:{timeframe}'
};

// Cache TTL settings
const cacheTTL = {
  usageAnalytics: 3600,    // 1 hour
  seasonalSuggestions: 7200, // 2 hours
  duplicateMatches: 86400,   // 24 hours
  varietyMetrics: 1800       // 30 minutes
};
```

## Troubleshooting

### Common Issues

#### Duplicate Detection Not Working
```bash
# Check song matcher configuration
curl -X POST http://localhost:3000/api/songs/duplicates/test \
  -H "Content-Type: application/json" \
  -d '{"title": "Amazing Grace", "artist": "John Newton"}'

# Verify database indexes
db.songs.getIndexes()
```

#### Usage Analytics Missing Data
```javascript
// Check song_usage collection
db.song_usage.find().sort({date: -1}).limit(5);

// Verify usage tracking API
curl http://localhost:3000/api/song-usage/analytics?teamId=main
```

#### External Import Failures
```bash
# Check API credentials
echo $HYMNARY_API_KEY
echo $SONGSELECT_API_KEY

# Test external API connectivity
curl -H "Authorization: Bearer $HYMNARY_API_KEY" \
  https://api.hymnary.org/search?query=amazing+grace
```

#### Performance Issues
```javascript
// Check slow queries
db.setProfilingLevel(2);
db.system.profile.find().sort({ts: -1}).limit(5);

// Analyze song database size
db.songs.stats();
db.song_usage.stats();
```

### Debug Utilities

#### Song Database Analysis
```bash
# Run database structure check
node src/scripts/check-song-structure.js

# Analyze usage patterns
node src/scripts/analyze-song-usage.js --team=main --timeframe=6months

# Check for duplicate songs
node src/scripts/find-duplicates.js --threshold=0.8
```

#### Performance Monitoring
```javascript
// Monitor API response times
const performanceMetrics = {
  songSearch: [],
  usageAnalytics: [],
  duplicateDetection: []
};

// Log slow operations
if (responseTime > 1000) {
  console.warn(`Slow operation: ${operation} took ${responseTime}ms`);
}
```

### Support Resources

- **Database Schema**: [database-schema.md](./database-schema.md)
- **API Documentation**: [api-reference.md](./api-reference.md)
- **Component Library**: [component-library.md](./component-library.md)
- **General Troubleshooting**: [troubleshooting-guide.md](./troubleshooting-guide.md)

---

*This guide covers the comprehensive song management system in ZionSync. For additional technical details or specific implementation questions, refer to the source code and related documentation files.*
