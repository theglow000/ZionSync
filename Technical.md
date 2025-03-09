# Technical Documentation

## Component Relationships and Data Flow
```javascript
MainLayout (Service Data Management)
├── SplashScreen (Entry Point)
│   ├── DotMatrix (Background Animation)
│   └── RotatingSlogan (Dynamic Text Display)
├── SignupSheet (Presentation Team)
│   ├── PastorServiceInput (Service Details Entry)
│   │   └── AddCustomService (Template Management)
│   └── User Management
├── WorshipTeam (Worship Planning)
│   ├── ServiceSongSelector (Song Management)
│   │   ├── SongSection (Individual Song Entry)
│   │   │   └── Auto-complete Suggestions
│   │   ├── Duplicate Detection
│   │   └── Song Usage Tracking
│   ├── TeamSelector (Schedule Management)
│   └── User Management
└── AVTeam (AV Planning)
    ├── Schedule Display
    ├── Team Rotation
    └── User Management

Data Flow:
MainLayout
├── API Interactions
│   ├── /api/service-details ←→ All Components
│   ├── /api/users ←→ User Management
│   └── /api/completed ←→ Status Tracking
└── State Distribution
    ├── serviceDetails → All Components
    ├── currentUser → Team-specific Components
    └── completion → Team-specific Components
```

## Component and Data Flow Architecture

```javascript
1. Core Data Flow
MainLayout
├── Global State
│   ├── serviceDetails (All service information)
│   └── currentUser (Active user session)
└── Data Distribution
    ├── Presentation Team
    │   └── SignupSheet
    ├── Worship Team
    │   └── ServiceSongSelector
    └── AV Team
        └── TeamRotation

2. Team-Specific Data Management
Presentation Team
├── Data: Users, Signups, Service Details
├── Operations: Add/Remove Users, Service Signups
└── Updates: Real-time Service Status

Worship Team
├── Data: Songs, Teams, Service Elements
├── Operations: Song Selection, Team Assignment
└── Updates: Usage Tracking, Duplicates

AV Team
├── Data: Team Rotation, Assignments
├── Operations: Schedule Management, Position Assignments
└── Updates: Team Member Tracking, Service Coverage

3. Data Synchronization
├── Real-time Updates
│   ├── Service Details (30s polling)
│   ├── Team Assignments
│   └── Completion Status
└── Optimistic Updates
    ├── User Actions
    ├── Team Changes
    └── Service Modifications
```

## Core Data Relationships

### Service Management
- **Service Details** → All Components
  - Order of worship
  - Service type
  - Team assignments
  - Completion status

### User Management
- **User Data** → Team-specific Components
  - Permissions
  - Team assignments
  - Historical data

### Integration Points
- **Service Details** ↔ **Team Management**
- **Song Selection** ↔ **Service Elements**
- **User Assignments** ↔ **Service Schedule**

## Core Components

### MainLayout.jsx
**Location**: `/src/components/MainLayout.jsx`  
**Type**: Client-side React component  
**Purpose**: Core navigation and layout management for the application

#### Component Architecture

1. **Data Fetching**
- Endpoint: `/api/service-details`
- Polling Interval: 30 seconds
- Data Structure: Converts array response to object with date keys
- Error Handling: Includes try-catch with console error logging

2. **Sub-Components**
- `TabButton`: Custom navigation button component
  - Props: `active`, `label`, `onClick`, `colors`, `isHome`
  - Supports vertical text rotation for non-home tabs
  - Implements hover and active states

3. **Navigation Structure**
```javascript
const tabs = [
  { id: 'home', label: 'Home', colors: {} },
  { id: 'presentation', label: 'Presentation Team', colors: {} },
  { id: 'worship', label: 'Worship Team', colors: {} },
  { id: 'av', label: 'Audio/Video Team', colors: {} }
]
```

4. **Layout Implementation**
- Responsive design using Tailwind CSS
- Dynamic background images based on active tab
- Main content area with overflow handling
- Loading spinner during data fetches

5. **Child Component Integration**
```javascript
// Component mapping
{activeTab === 'presentation' && <SignupSheet {...props} />}
{activeTab === 'worship' && <WorshipTeam {...props} />}
{activeTab === 'av' && <AVTeam />}
```

6. **Props Passed to Child Components**
- `serviceDetails`: Object containing service data
- `setServiceDetails`: Function to update service data

7. **Dependencies**
- React Icons: `IoHomeOutline`
- React Hooks: `useState`, `useEffect`

#### Technical Notes
- Uses client-side rendering (`'use client'` directive)
- Maintains z-index hierarchy for tab overlays
- Handles component cleanup via useEffect return function

### SignupSheet.jsx
**Location**: `/src/components/ui/SignupSheet.jsx`  
**Type**: Client-side React component  
**Purpose**: Manages the presentation team signup interface and service details

#### Component Architecture

1. **Data Fetching**
- Endpoints:
  - `/api/users` (GET, POST, DELETE): User management
  - `/api/signups` (GET, POST, DELETE): Service signups
  - `/api/service-details` (GET, POST): Service information
  - `/api/completed` (GET, POST): Completion status
  - `/api/custom-services` (GET): Custom service types

2. **Key Functions**
- `handleAddUser()`: Creates new users
- `handleRemoveUser()`: Deletes users and their signups
- `handleSignup()`: Manages service date assignments
- `handleServiceDetailChange()`: Updates service information
- `handleCompleted()`: Toggles service completion status
- `handleCalendarDownload()`: Generates .ics calendar files

3. **Features**
- Calendar event export with .ics format
- User management system
- Service completion tracking
- Order of worship display
- Mobile-responsive design
- Real-time data updates

4. **UI Components**
- Desktop table view with sticky header
- Mobile card view for responsive design
- User management modal
- Pastor service input modal
- Alert system for user feedback

5. **Props**
```javascript
{
  serviceDetails: Object,     // Service information
  setServiceDetails: Function // Update service information
}
```

6. **Dependencies**
- React Icons
- ICS (calendar file generation)
- Tailwind CSS for styling

#### Technical Notes
- Implements polling for service details (30-second interval)
- Uses optimistic updates for better UX
- Includes error handling and user feedback
- Maintains separate mobile/desktop layouts
- Implements debounced service detail updates

### WorshipTeam.jsx
**Location**: `/src/components/ui/WorshipTeam.jsx`  
**Type**: Client-side React component  
**Purpose**: Manages worship team assignments and song selections for church services

#### Component Architecture

1. **Data Fetching**
- **Endpoints**:
  - `/api/worship-assignments`: Team assignments
  - `/api/users/worship`: Worship team users
  - `/api/songs`: Available songs
  - `/api/service-details`: Service information
  - `/api/custom-services`: Custom service types
- **Polling Interval**: 30 seconds for service details

2. **Sub-Components**
- `TeamSelectorModal`: Team assignment interface
- `ServiceSongSelector`: Song selection interface
- `MobileWorshipSelect`: Mobile user selection interface

3. **Features**
- Service schedule display (Jan-Dec 2025)
- Team assignment management
- Song selection system
- User management system
- Service type tracking
- Mobile-responsive design

4. **Service Data Structure**
```javascript
{
  date: String,          // Service date
  title: String,         // Service title
  type: String,          // Service type (communion, no_communion, etc.)
  elements: Array,       // Service elements including songs
  team: String          // Assigned team
}
```

5. **User Types**
- Regular team members
- Special teams
- Worship leader
- Pastor
- Confirmation/Sunday School teams

6. **Dependencies**
- React Icons and Lucide Icons
- Custom UI components (Card, Alert)
- Custom hooks (useState, useEffect, useMemo, useCallback)

#### Technical Notes
- Implements optimistic updates for team assignments
- Uses real-time data synchronization
- Includes error handling with user feedback
- Maintains separate desktop/mobile interfaces
- Implements service type customization

### AVTeam.jsx
**Location**: `/src/components/ui/AVTeam.jsx`  
**Type**: Client-side React component  
**Purpose**: Manages audio/video team assignments and scheduling for church services

#### Component Architecture

1. **Data Fetching**
- **Endpoints**:
  - `/api/av-users`: User management (GET, POST)
  - `/api/av-team`: Team assignments (GET, POST)
- **Initial Data Load**: 
  - Fetches existing assignments
  - Initializes default team members
  - Polling interval: 30 seconds

2. **Core Functions**
- `initializeUsers()`: Sets up initial team roster
- `handleSignup()`: Manages service assignments
- `handleRemoveAssignment()`: Removes user assignments
- `handleAddUser()`: Adds new team members
- `handleAssignment()`: Updates specific position assignments
- `isPastDate()`: Validates date against current date

3. **Data Structures**
```javascript
// Service Assignment Structure
{
  [date]: {
    team_member_1: String,  // Always 'Ben'
    team_member_2: String,  // Rotation member
    team_member_3: String   // Additional volunteer
  }
}

// Default Team Members
const rotationMembers = ['Doug', 'Jaimes', 'Laila', 'Brett'];
```

4. **UI Components**
- Desktop:
  - Full-width table with sticky header
  - User selection bar
  - Service schedule grid
- Mobile:
  - Card-based service display
  - Collapsible user selector
  - Responsive service cards

5. **Features**
- Automatic team rotation system
- Past date handling
- User management modal
- Position-specific assignments
- Real-time updates
- Mobile-responsive design

6. **Dependencies**
- React Icons and Lucide Icons
- Custom UI components (Card, Alert)
- Tailwind CSS for styling

#### Technical Notes
- Uses optimistic updates for assignments
- Implements position-based permissions
- Maintains separate mobile/desktop layouts
- Handles alert positioning dynamically
- Includes error handling with user feedback

### SplashScreen.jsx
**Location**: `/src/components/SplashScreen.jsx`  
**Type**: Client-side React component  
**Purpose**: Landing page with team selection interface

#### Component Architecture

1. **Props**
```javascript
{
  onEnter: Function,     // Controls splash screen exit
  setActiveTab: Function // Sets selected team tab
}
```

2. **UI Components**
- Background:
  - DotMatrix animation
  - Gradient overlays
  - Noise texture effect
- Logo display using Next.js Image component
- RotatingSlogan component
- Team selection buttons

3. **Animation System**
- Uses Framer Motion for:
  - Initial fade-in
  - Button hover/tap effects
  - Vertical transitions
- Button animations:
  - Scale: 1.05 on hover
  - Y-axis shift: -5px on hover
  - Scale: 0.95 on tap

4. **Dependencies**
- Framer Motion
- Next/Image
- DotMatrix component
- RotatingSlogan component

### RotatingSlogan.jsx
**Location**: `/src/components/RotatingSlogan.jsx`  
**Type**: Client-side React component  
**Purpose**: Animated slogan rotation display

#### Component Architecture

1. **State Management**
```javascript
const [currentIndex, setCurrentIndex] = useState(0);
const [isTransitioning, setIsTransitioning] = useState(false);
```

2. **Constants**
```javascript
const DISPLAY_DURATION = 8000; // 8 seconds per slogan
```

3. **Animation System**
- Uses Framer Motion's AnimatePresence
- Transition properties:
  - Duration: 1 second
  - Opacity duration: 0.8 seconds
  - Easing: "easeOut"
- 3D rotation effect with rotateX

### DotMatrix.jsx
**Location**: `/src/components/DotMatrix.jsx`  
**Type**: Client-side React component  
**Purpose**: Animated background pattern using HTML Canvas

#### Component Architecture

1. **Canvas Management**
- Uses useRef for canvas element
- Full viewport coverage
- Dynamic resizing support

2. **Animation Parameters**
```javascript
const spacing = 35;           // Dot grid spacing
const time += 0.01;          // Animation speed
const offsetX = Math.sin(time + y * 0.03) * 3;  // Horizontal movement
const offsetY = Math.cos(time + x * 0.03) * 3;  // Vertical movement
```

3. **Technical Features**
- Responsive canvas sizing
- Dynamic dot size based on distance from center
- Sine/Cosine based movement patterns
- RequestAnimationFrame for smooth animation
- Automatic cleanup on unmount

4. **Performance Optimizations**
- Cancels animation frame on unmount
- Removes resize listener on cleanup
- Uses RAF for smooth animation loop

### Presentation Team Components

#### Card.jsx
**Location**: `/src/components/ui/card.jsx`  
**Type**: Reusable React component  
**Purpose**: Base component for consistent card styling

**Sub-Components**:
1. `Card`: Main container component
2. `CardHeader`: Card header section
3. `CardContent`: Card content section

**Implementation**:
```javascript
// Core styling using Tailwind CSS
Card: "rounded-lg border bg-card text-card-foreground shadow-sm"
CardHeader: "flex flex-col space-y-1.5 p-6"
CardContent: "p-6 pt-0"
```

### AddCustomService.jsx
**Location**: `/src/components/ui/AddCustomService.jsx`  
**Type**: Client-side React component  
**Purpose**: Modal interface for creating and editing custom service templates

#### Component Architecture

1. **Props**
```javascript
{
  existingService: Object,      // Service data for editing mode
onClose: Function,           // Modal close handler
  onClose: Function,           // Modal close handler
  onSave: Function,           // Save handler
  setSelectedType: Function,   // Updates service type
  setIsCustomService: Function,// Updates custom service flag
  setOrderOfWorship: Function, // Updates worship order
  setHasExistingContent: Function, // Updates content flag
  setCustomServices: Function  // Updates services list
}
```

2. **Data Processing**
```javascript
// Liturgical Dictionary Categories
const liturgicalTerms = {
  songs: ['Kyrie', 'Alleluia', 'Gospel Acclamation'...],
  readings: ['First Reading', 'Second Reading'...],
  liturgy: ['Confession and Forgiveness', 'Apostle\'s Creed'...]
}
```

3. **Core Functions**
- `findClosestMatch()`: Fuzzy matching for liturgical terms
- `parseOrderOfWorship()`: Converts text to structured elements
- `ElementTypeSelect`: Sub-component for element type selection

4. **Service Element Types**
- liturgy
- song_hymn
- liturgical_song
- reading
- message

5. **State Management**
```javascript
const [step, setStep] = useState('input');
const [serviceName, setServiceName] = useState('');
const [rawOrder, setRawOrder] = useState('');
const [parsedElements, setParsedElements] = useState([]);
const [isSaving, setIsSaving] = useState(false);
```

### PastorServiceInput.jsx
**Location**: `/src/components/ui/PastorServiceInput.jsx`  
**Type**: Client-side React component  
**Purpose**: Interface for pastor to input and manage service details

#### Component Architecture

1. **Helper Functions**
- `getSundayInfo()`: Calculates Sunday-specific information
- `getDefaultServiceType()`: Determines service type based on date
- `getLordsPrayerFormat()`: Determines prayer format
- `parseServiceContent()`: Converts service content to elements

2. **Service Types**
```javascript
const mainServiceTypes = [
  { id: 'no_communion', name: 'No Communion' },
  { id: 'communion', name: 'Communion' },
  { id: 'communion_potluck', name: 'Communion with Potluck' }
];
```

3. **State Management**
```javascript
const [selectedType, setSelectedType] = useState('');
const [orderOfWorship, setOrderOfWorship] = useState('');
const [showCustomDropdown, setShowCustomDropdown] = useState(false);
const [showAddCustom, setShowAddCustom] = useState(false);
const [editingService, setEditingService] = useState(null);
const [customServices, setCustomServices] = useState([]);
const [hasExistingContent, setHasExistingContent] = useState(false);
const [isCustomService, setIsCustomService] = useState(false);
```

4. **Data Management**
- Automatic service template selection based on date
- Custom service template handling
- Real-time content synchronization
- Service type persistence

5. **UI Features**
- Service type selection
- Custom service management
- Order of worship editor
- Mobile-responsive layout

6. **Dependencies**
- Lucide Icons
- Custom UI components (Card)
- AddCustomService component
 
### ServiceSongSelector.jsx
**Location**: `/src/components/ui/ServiceSongSelector.jsx`  
**Type**: Client-side React component  
**Purpose**: Manages song selection and tracking for worship services

#### Component Architecture

1. **State Management**
```javascript
const [serviceSongStates, setServiceSongStates] = useState({});
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [showAlert, setShowAlert] = useState(false);
const [alertMessage, setAlertMessage] = useState('');
const [alertType, setAlertType] = useState('success');
const [alertPosition, setAlertPosition] = useState({ x: 0, y: 0 });
```

2. **Core Functions**
- `checkForDuplicateSongs()`: Checks for recent song usage
- `recordSongUsage()`: Records song usage history
- `handleSubmit()`: Processes song selections
- `getReadingSections()`: Extracts readings from service
- `getRequiredSongSections()`: Gets required song slots
- `cleanSongSelections()`: Sanitizes song data

3. **Helper Functions**
```javascript
const getWeekInfo = (dateStr) => {
  const [month, day, year] = dateStr.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);
  // Returns week information and styling classes
}

const formatHymnalName = (hymnal) => {
  return hymnal.charAt(0).toUpperCase() + hymnal.slice(1);
}
```

4. **Data Validation**
- Song duplication checking (4-week window)
- URL validation for external links
- Required field validation
- Date validation

5. **Props**
```javascript
{
  date: String,                    // Service date
  currentUser: Object,             // Current user info
  serviceDetails: Object,          // Service information
  setServiceDetails: Function,     // Update service details
  expanded: Boolean,               // Expansion state
  onToggleExpand: Function,       // Toggle handler
  team: String,                   // Team assignment
  onEditTeam: Function,           // Team edit handler
  customServices: Array,          // Custom service types
  availableSongs: Object,         // Song database
  header: Node                    // Optional header content
}
```

### SongSection.jsx
**Location**: `/src/components/ui/SongSection.jsx`  
**Type**: Client-side React component  
**Purpose**: Individual song input and management interface

#### Component Architecture

1. **State Management**
```javascript
const [suggestions, setSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
```

2. **Props**
```javascript
{
  slot: String,                    // Song position identifier
  label: String,                   // Section label
  songState: Object,               // Current song data
  onSongStateUpdate: Function,     // Update handler
  availableSongs: Object,          // Song database
  currentUser: Ob,ect,             // User informatihymnalVersions: Array           // Available hymnals
on
  hymnalVersions: Array           // Available hymnals
}
```

3. **Features**
- Auto-complete song suggestions
- Hymn/Contemporary toggle
- External link validation
- Dynamic form fields based on song type
- Reference link management

4. **Song Data Structure**
```javascript
{
  type: String,          // 'hymn' or 'contemporary'
  title: String,         // Song title
  number: String,        // Hymn number (hymns only)
  hymnal: String,        // Hymnal version (hymns only)
  author: String,        // Author/Artist (contemporary only)
  sheetMusic: String,    // Hymnary/SongSelect link
  youtube: String,       // YouTube reference
  notes: String         // Additional notes
}
```

5. **Technical Features**
- Debounced search implementation
- Click-outside handling for suggestions
- Mobile-responsive layout
- Real-time validation
- Optimized re-rendering (React.memo)

## Utility Functions

### Logger.js
**Location**: `/src/utils/logger.js`  
**Type**: Utility Class  
**Purpose**: Logging service for development environment

#### Implementation Details
1. **Configuration**
```javascript
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};
```

2. **Static Properties**
- `context`: Current logging context
- `enabled`: Only active in development
- `level`: Current logging level

3. **Core Methods**
- `setContext(context)`: Sets logging context
- `setLevel(level)`: Sets logging threshold
- `formatMessage(level, message, data)`: Standardizes log format

4. **Logging Methods**
- `debug(message, data)`
- `info(message, data)`
- `warn(message, data)`
- `error(message, error)`

5. **Message Format**
`{timestamp}{context} [{level}] {message}{data}`

### utils.js
**Location**: `/src/lib/utils.js`  
**Type**: Utility Functions  
**Purpose**: Shared utility functions

#### Functions
1. **cn(...inputs)**
- Merges Tailwind classes using `clsx` and `tailwind-merge`
- Handles class name conflicts
- Optimizes final class string

### mongodb.js
**Location**: `/src/lib/mongodb.js`  
**Type**: Database Configuration  
**Purpose**: MongoDB connection management

#### Configuration
1. **Connection Options**
```javascript
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
  wtimeoutMS: 30000,
  monitorCommands: true
}
```

2. **Environment Handling**
- Development: Reuses global connection
- Production: Creates new connection

3. **Connection Events**
- Monitors connection establishment
- Logs connection errors
- Validates MONGODB_URI environment variable

4. **Exports**
- `clientPromise`: MongoDB client connection promise

## API Structure

### Core API Routes

#### User Management
1. **/api/users**
- GET: Fetches all users
- POST: Creates new user
- DELETE: Removes user and associated signups

2. **/api/users/worship**
- GET: Fetches worship team users
- POST: Creates worship team user
- DELETE: Removes worship team user

3. **/api/av-users**
- GET: Fetches AV team users
- POST: Creates AV team user

#### Service Management
1. **/api/service-details**
- GET: Fetches service information
  - Query params: `date` (optional)
  - Returns parsed service elements
- POST: Updates service details

2. **/api/custom-services**
- GET: Fetches all custom service templates
- POST: Creates new custom service
- PUT: Updates existing service
- DELETE: Removes service template

3. **/api/service-songs**
- GET: Fetches song selections for services
  - Query params: `date` (optional)
- POST: Updates song selections and service details

#### Team Management
1. **/api/worship-assignments**
- GET: Fetches team assignments
  - Query params: `date`, `startDate`, `endDate`, `limit`
- POST: Updates team assignments
- PUT: Updates assignment details

2. **/api/av-team**
- GET: Fetches team members, assignments, completion status
- POST: Updates assignments or completion status
  - Types: 'signup', 'completed'

3. **/api/signups**
- GET: Fetches all presentation team signups
- POST: Creates new signup
- DELETE: Removes signup

#### Song Management
1. **/api/songs**
- GET: Fetches all songs
- POST: Creates/updates songs
  - Handles both hymns and contemporary songs

2. **/api/song-usage**
- GET: Fetches song usage history
  - Query params: `title`, `months`
- POST: Records song usage

3. **/api/worship-indexes**
- POST: Updates song selections
- PUT: Checks recent song usage

#### Status Tracking
1. **/api/completed**
- GET: Fetches completion status
- POST: Updates completion status

### Database Structure

#### Collections
1. **users**: Presentation team users
2. **worship_users**: Worship team members
3. **av_users**: AV team members
4. **serviceDetails**: Service information
5. **custom_services**: Service templates
6. **signups**: Service assignments
7. **worship_assignments**: Team schedules
8. **songs**: Song database
9. **song_usage**: Usage tracking
10. **completed**: Service completion status

### Error Handling
- Standard error response:
```javascript
{
  error: String,    // Error message
  status: Number    // HTTP status code
}
```
- Logging implementation for all routes
- Client-side error feedback
- Development-mode detailed errors

## Styling and UI Elements

### Global Styling (globals.css)
**Location**: `/src/app/globals.css`  
**Purpose**: Core styling and animations

1. **CSS Variables**
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

2. **Base Styles**
- Tailwind base, components, utilities
- System font stack
- Color scheme adaptability

### Tailwind Configuration (tailwind.config.mjs)
**Location**: `/src/components/tailwind.config.mjs`  
**Purpose**: Tailwind CSS framework configuration

1. **Content Paths**
```javascript
content: [
  "./src/**/*.{js,jsx,ts,tsx}",
  "./src/components/**/*.{js,jsx,ts,tsx}",
  "./src/app/**/*.{js,jsx,ts,tsx}",
]
```

2. **Theme Extensions**
```javascript
theme: {
  extend: {
    colors: {
      background: "var(--background)",
      foreground: "var(--foreground)",
    },
  },
}
```

### Reusable Components

#### Card Component
**Location**: `/src/components/ui/card.jsx`  
**Purpose**: Base card structure for consistent styling

1. **Sub-Components**
```javascript
Card: "rounded-lg border bg-card text-card-foreground shadow-sm"
CardHeader: "flex flex-col space-y-1.5 p-6"
CardContent: "p-6 pt-0"
```

2. **Implementation**
- Uses React.forwardRef for ref forwarding
- Implements className merging via cn utility
- Maintains consistent spacing patterns

## API and Component Relationships

### Core Data Flow
```javascript
MainLayout
└── Data Management
    ├── Service Details
    │   ├── Primary: /api/service-details
    │   └── Collections: serviceDetails, custom_services
    │
    ├── Team Management
    │   ├── Presentation: /api/users, /api/signups
    │   ├── Worship: /api/worship-users, /api/worship-assignments
    │   └── AV: /api/av-users, /api/av-team
    │
    └── Content Management
        ├── Songs: /api/songs, /api/song-usage
        └── Status: /api/completed

Database Schema
└── Collections
    ├── Users
    │   ├── users (Presentation)
    │   ├── worship_users
    │   └── av_users
    │
    ├── Services
    │   ├── serviceDetails
    │   └── custom_services
    │
    ├── Team Management
    │   ├── signups
    │   ├── worship_assignments
    │   └── av_assignments
    │
    └── Content
        ├── songs
        ├── song_usage
        └── completed
```

### Data Synchronization
1. **Real-time Updates**
   - Service details polling (30s)
   - Team assignments polling (30s)
   - Status updates polling (30s)

2. **Write Operations**
   - Optimistic updates for UI responsiveness
   - Backend validation before persistence
   - Error state handling and recovery

3. **Data Dependencies**
   - Service details → All components
   - User permissions → Team access
   - Song history → Selection validation

### Error Handling
1. **API Response Structure**
```javascript
{
  success: Boolean,
  data?: Object,
  error?: {
    message: String,
    code: Number
  }
}
```

2. **Common Error Patterns**
   - Network connectivity
   - Database operations
   - Validation failures
   - Authorization issues

3. **Recovery Strategies**
   - Automatic retry for transient failures
   - Cache fallback for read operations
   - User feedback for permanent failures

## Database Architecture

### Collection Structure
```javascript
Database (ZionSync)
├── User Collections
│   ├── users
│   │   ├── _id: ObjectId
│   │   ├── name: String
│   │   └── timestamp: Date
│   ├── av_users
│   │   ├── _id: ObjectId
│   │   ├── name: String
│   │   └── timestamp: Date
│   └── worship_users
│       ├── _id: ObjectId
│       ├── name: String
│       ├── role: String (team_member/leader/pastor)
│       ├── created: Date
│       └── lastUpdated: Date
│
├── Service Collections
│   ├── serviceDetails
│   │   ├── _id: ObjectId
│   │   ├── content: String
│   │   ├── date: String
│   │   ├── elements: Array
│   │   ├── type: String
│   │   ├── lastUpdated: Date
│   │   └── setting: String
│   └── custom_services
│       ├── _id: ObjectId
│       ├── elements: Array
│       ├── name: String
│       ├── order: String
│       ├── template: String
│       ├── createdAt: Date
│       └── updatedAt: Date
│
└── Music Collections
    ├── songs
    │   ├── _id: ObjectId
    │   ├── title: String
    │   ├── type: String (hymn/contemporary)
    │   ├── author: String
    │   ├── hymnal: String
    │   ├── number: String
    │   └── references: Object
    └── song_usage
        ├── _id: ObjectId
        ├── songData: Object
        ├── uses: Array
        ├── dateUsed: Date
        └── serviceType: String
└── Assignment Collections
    ├── assignments
    │   ├── _id: ObjectId
    │   ├── date: String
    │   ├── team_member_1: String
    │   ├── team_member_2: String
    │   ├── team_member_3: String
    │   ├── lastUpdated: Date
    │   ├── partialApproval: Boolean
    │   └── songsApproved: Boolean
    │
    └── worship_songs
        ├── _id: ObjectId
        ├── date: String
        ├── songData: Object
        ├── songTypes: {
        │   dayHymn: String,
        │   opening: String,
        │   sending: String
        │ }
        └── lastUpdated: Date
```

### Core Data Models

1. **Service Data**
```javascript
serviceDetails: {
  _id: ObjectId,
  date: String,         // Format: "MM/DD/YY"
  type: String,         // Enum: ['communion', 'no_communion', 'communion_potluck']
  elements: [{

    type: String,      // Enum: ['liturgy', 'song_hymn', 'liturgical_song', 'reading']
    content: String,
    note: String,
    reference: String
  }],
  setting: String,      // Future expansion field
  lastUpdated: Date
}
```

### Key Relationships

1. **Service Management**
   - serviceDetails → custom_services (template reference)
   - serviceDetails → songs (through elements array)
   - serviceDetails → assignments (date-based linking)

2. **User Management**
   - users → signups (name reference)
   - worship_users → worship_assignments (name reference)
   - av_users → assignments (name reference)

3. **Music Management**
   - songs → song_usage (direct reference)
   - song_usage → serviceDetails (date-based linking)

### Data Patterns

1. **Timestamps**
   - Creation: ISODate format
   - Updates: lastUpdated field
   - User-facing dates: String format (e.g., "1/5/25")

2. **Service Types**
```javascript
const serviceTypes = [
  'no_communion',
  'communion',
  'communion_potluck',
  'service'
];
```

3. **Indexing Strategy**
   - Default _id index on all collections
   - Date-based queries optimize service lookups
   - Name fields for user searches

4. **Data Validation**
   - Required fields: _id, date/timestamp
   - Service type enumeration
   - Role-based user validation

### Additional Data Validation Rules
1. **Service Types**
   - Must match predefined enum values
   - Cannot be empty/null
   - Must be present in serviceDetails

2. **Assignment Validation**
   - team_member_1 is always 'Ben'
   - team_member_2 must be from rotationMembers array
   - team_member_3 is optional volunteer

## State Management

### Global State Pattern
```javascript
MainLayout
├── Primary States
│   ├── showSplash: Boolean      // Controls splash screen visibility
│   ├── activeTab: String        // Current active tab
│   ├── serviceDetails: Object   // Core service data
│   └── isLoading: Boolean      // Loading state
│
└── State Distribution
    ├── SignupSheet
    │   ├── Receives: serviceDetails
    │   └── Can Modify: setServiceDetails
    ├── WorshipTeam
    │   ├── Receives: serviceDetails
    │   └── Can Modify: setServiceDetails
    └── AVTeam
        └── Independent state management
```

### Data Synchronization
1. **Service Details**
   - Polling interval: 30 seconds
   - Data transformation: Array to keyed object
   - Error handling with loading states
   - Cleanup on unmount

2. **State Update Patterns**
   - Top-down props flow
   - Lift state changes through callbacks
   - Optimistic updates in child components
   - Real-time data synchronization

3. **Performance Optimizations**
   - Component-level state isolation
   - Controlled re-render patterns
   - Background data refresh
   - Loading state management

### Component State Patterns
1. **Presentation Team**
   - User management
   - Service signups
   - Completion tracking

2. **Worship Team**
   - Song selection
   - Team assignments
   - Usage tracking

3. **AV Team**
   - Schedule management
   - Team rotation
   - Position tracking

### State Update Workflow
```javascript
Data Flow Example:
1. User Updates Service Detail
   └── Child Component
       ├── Local State Update
       ├── API Call
       ├── Success
       │   └── setServiceDetails() in MainLayout
       └── Error
           └── Revert Local State
```

## Error Handling Architecture

### API Error Patterns
```javascript
1. Standard API Response
{
  success: Boolean,
  data?: any,
  error?: {
    message: String,
    status: Number
  }
}

2. Error Status Codes
- 400: Validation errors
- 404: Resource not found
- 500: Server errors
```

### Client-Side Error Management

1. **API Request Pattern**
```javascript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) throw new Error('API Error');
  const data = await response.json();
} catch (error) {
  console.error('Operation failed:', error);
  setAlertMessage('Error message for user');
  setShowAlert(true);
  setTimeout(() => setShowAlert(false), 3000);
}
```

2. **User Feedback System**
- Alert Component
  - Message display
  - Auto-dismiss (3 seconds)
  - Position control
  - Type classification (success/error)

3. **Data Operations**
- Optimistic Updates
  - Local state update first
  - API call
  - Revert on failure
- Validation
  - Pre-submission checks
  - Server response validation
  - Data type verification

### Recovery Strategies

1. **Network Issues**
- Automatic retries for transient failures
- Polling recovery for real-time updates
- Connection status monitoring

2. **Data Integrity**
- Validation before state updates
- Rollback mechanisms
- Data consistency checks

3. **User Operations**
- Confirmation dialogs for destructive actions
- Undo capability for critical operations
- Session recovery on reload

### Error Boundaries
```javascript
// Development vs Production Error Handling
if (process.env.NODE_ENV === 'development') {
  console.error('Detailed error:', error);
} else {
  // Production logging
  Logger.error('Operation failed', error);
}
```

## Performance Considerations

### Data Management Strategy
```javascript
// Core Data Flow
MainLayout
├── Primary Service Data
│   ├── 30s polling interval
│   └── Optimistic updates
└── On-Demand Data
    ├── User data
    ├── Team assignments
    └── Historical records
```

### Key Optimizations
1. **State Updates**
   - Component-level memoization (React.memo)
   - Debounced search inputs (300ms)
   - Polling interval management

2. **Data Loading**
   - Progressive historical data
   - Cached song suggestions
   - Background synchronization