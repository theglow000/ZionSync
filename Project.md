# ZionSync User Guide

## Overview
ZionSync is a church service management application designed to coordinate between Presentation, Worship, and Audio/Video teams. This guide explains how to use each team's features.

## Navigation
The application is divided into four main sections:
- **Home**: Return to splash screen
- **Presentation Team**: Service setup and volunteer coordination
- **Worship Team**: Music selection and team scheduling
- **Audio/Video Team**: Equipment operation assignments

## Splash Screen
The welcome screen provides direct navigation to each team's section. Features:
- Dynamic background animation
- Rotating ministry slogans
- Quick-access team selection

### Accessing Different Teams
1. Use the vertical navigation bar on the left
2. Click team name to access section
3. Click home icon to return to splash screen

## Getting Started

### First-Time Users
1. Select your team tab from navigation
2. No login required - teams are honor-system based
3. Add your name to the team roster when prompted

### Interface Elements
- Team-specific color coding
  - Presentation Team: Green
  - Worship Team: Purple
  - Audio/Video Team: Red
- Real-time updates every 30 seconds
- Mobile-responsive design for all devices

## Presentation Team

### User Interface
1. **Header Area**
   - Church logo and ZionSync logo
   - Row of user name buttons
   - "Manage Users" button

2. **User Management**
   - Click "Manage Users" button to:
     - See all team members
     - Add new user: Enter name in pop-up dialog
     - Remove users: Check boxes and click "Remove Selected"
   - Click your name button at top to activate for signups

### Service Management

1. **Service Status Icons**
   - 📗 Green book: Order of worship available
   - 🎵 Purple music: All songs selected

2. **Viewing Services**
   - Click service header to expand/collapse
   - Shows:
     - Complete order of worship with **bold labels**
     - Service type
     - Selected songs
     - Current signups
   > Note: Past dates remain visible but show with reduced opacity

3. **Service Elements Display**
   - Element labels (like "Opening Hymn:", "First Reading:") display in **bold**
   - Element content displays in regular text 
   - Song elements show different status indicators:
     - "Waiting for Worship Team song selection" when songs need to be selected
     - Selected song details once the Worship Team has made selections
     - "Loading..." briefly appears while song data is being fetched

4. **Service Signup**
   - Click your name button at top
   - Click "Sign Up" in service header
   - Your name appears under service
   - Click "Remove" to cancel signup

5. **Service Completion**
   - Click "Mark Complete" after creating Proclaim presentation
   - Updates status for all users

### Pastor Service Input

1. **Accessing Editor**
   - Expand service by clicking header
   - Click "Pastor Edit" button on right side
   - Opens service input modal window

2. **Standard Service Setup**
   - Choose service type (radio buttons):
     - No Communion
     - Communion
     - Communion with Potluck
   - Default selection based on Sunday:
     - 1st Sunday: Communion with sung Lord's Prayer
     - 3rd Sunday: Communion with Potluck
     - Other Sundays: No Communion

3. **Order of Worship Input**
   - Large text area shows service template
   - Edit or add content as needed
   - System identifies elements as you type:
     - Liturgical items (Creed, Prayers, etc.)
     - Songs/Hymns [PENDING WORSHIP TEAM INPUT]
     - Scripture readings
     - Message/sermon sections
   - Click "Save Service Details" to update
   > Note: Previously entered readings and sermon content are preserved when editing

4. **Content Preservation**
   - When editing an existing service:
     - Song selections are preserved
     - Reading and sermon content is maintained
     - Only modified elements are updated
   - This allows incremental updates without losing previously entered information

### Custom Service Management
> Note: Use for special services that don't follow standard templates

1. **Using Custom Services**
   - Click dropdown under "Or Select Custom Service"
   - Choose from saved templates
   - Order of worship loads automatically
   - Edit if needed
   - Click "Save Service Details"
   > Note: Custom services are saved with unique IDs for reuse across multiple dates

2. **Creating New Custom Service**
   - Click "Add New Custom Service" in dropdown
   - Enter service name
   - Input complete order of worship
   - Click "Review Elements" to verify:
     - System-identified elements
     - Element types (liturgy, song, reading, etc.)
     - Adjust types if needed
   - Save template for future use

3. **Managing Existing Custom Services**
   - Edit: Click pencil icon next to name
   - Delete: Click trash icon next to name
   - All templates available church-wide

### Mobile Support
- Full functionality preserved
- Touch-optimized interface
- Scrollable service list
- Bold labels for improved readability

## Worship Team

### Interface Overview
1. **Header Section**
   - Church logo and ZionSync logo
   - 2025 Service Schedule title
   - Mobile-optimized header with compact layout

2. **User Selection Bar**
   - Desktop: User buttons with role indicators
   - Mobile: Dropdown user selector
   - "Manage Users" button for team management
   - Worship Leader specially indicated

### Team Management

1. **User Management**
   - Access via "Manage Users" button
   - Add new team members:
     - Click "+ Add New User"
     - Enter name in prompt
     - Click Save
   - Remove team members:
     - Click X icon next to name
     - Confirm removal

2. **Team Assignment**
   - Click team name in service row
   - Select from categories:
     - Regular Teams (Team pairs with "&")
     - Special Teams (Leaders, Pastor, Confirmation, Sunday School)
   - Changes update immediately
   - Shows last update timestamp

### Service Management

1. **Service View**
   - Date and title display
   - Service type indicator
   - Team assignment badge
   - Expand/collapse functionality

2. **Expanded Service View**
   - Left panel: Readings and references
     - Scripture readings
     - Sermon details
     - Special notes
   - Right panel: Song selection interface

3. **Song Selection Interface**

   a. **Song Type Toggle**
   - Hymn: Traditional hymnal selections
   - Contemporary: Modern worship songs

   b. **Hymn Entry**
   - Title with auto-complete
   - Hymn number field
   - Hymnal selection:
     - Cranberry
     - Green
     - Blue

   c. **Contemporary Song Entry**
   - Title with auto-complete
   - Artist/Author field

   d. **Additional Song Details**
   - Sheet Music Link:
     - Hymnary.org for hymns
     - SongSelect for contemporary
   - YouTube reference link
   - Optional notes field

4. **Song Selection Features**
   - Auto-complete suggestions from database
   - Duplicate song detection (4-week window)
   - Warning for recent song usage
   - Reference links:
     - Hymnary.org
     - SongSelect
     - YouTube
   - Missing reference link warnings

### Song Selection Process

1. **Identifying Required Songs**
   - System shows service readings from Pastor's input:
     - Scripture readings
     - Sermon title
   - Standard service song positions:
     - Opening Hymn
     - Hymn of the Day
     - Sending Song
   - Custom service song positions:
     - Varies based on Pastor's order of worship
     - Could include additional hymns or songs
     - May have different position names

2. **Song Selection Interface**
   - Left panel shows service readings and sermon info
   - Right panel provides song input interface for all required positions
   - Required positions determined by service type and Pastor's input
   - Click "Save Songs" to update selections
   - Updates visible in Presentation Team tab after saving

3. **Song Usage Tracking**
   - System checks last 4 weeks of song usage
   - Warns of duplicate songs within this window
   - Shows dates of recent uses
   - Helps maintain song variety

4. **Completion Status**
   - 🎵 Purple music icon appears when all required songs selected
   - Indicates to Presentation Team that songs are ready

### Data Management

1. **Auto-save and Updates**
   - Real-time saving of changes
   - 30-second polling for updates
   - Visual confirmation of saves

2. **Song Database**
   - Saved songs appear in auto-complete
   - Tracks usage history
   - Maintains reference links

3. **Mobile Optimization**
   - Responsive layout
   - Touch-friendly interfaces
   - Simplified mobile menus

## Audio/Video Team

### Interface Overview
1. **Header Area**
   - Church logo and ZionSync logo
   - "Audio/Video Team" title in red
   - "2025 Service Schedule" subtitle
   - "Manage Users" button for team management

2. **User Selection**
   - Row of user name buttons at top
   - Each button shows active state when selected
   - "Manage Users" button on right

### Team Structure

1. **Fixed Positions**
   - Team Member 1: Ben (Primary Position)
   - Team Member 2: Rotation Schedule (Doug, Jaimes, Justin, Brett)
   - Team Member 3: Volunteer Position
   > Note: The rotation automatically cycles through the year, ensuring equal distribution of assignments. Team member assignment does not correlate with role during service. This is determined prior to each service.

2. **Rotation Schedule**
   - Automatically assigns Team Member 2
   - Follows order: Doug → Jaimes → Justin → Brett
   - Cycles through entire year

### Service Management

1. **Service Display**
   - Date and day of week
   - Service title/description
   - Three team member positions
   - Past dates shown with reduced opacity

2. **Team Member 1 (Ben's Position)**
   - Shows "Ben" by default
   - Can be temporarily reassigned if needed
   - Click edit icon to change

3. **Team Member 2 (Rotation)**
   - Shows automatically assigned member
   - Can be temporarily reassigned
   - Click edit icon to change

4. **Team Member 3 (Volunteer)**
   - "Sign Up" button when position open
   - Shows volunteer name when filled
   - Volunteer can remove themselves using trash icon

### User Assignment System

1. **Assignment Process**
   - Click edit icon or sign up button to open user selection modal
   - Select from available team members
   - Already-assigned team members appear grayed out
   - Changes update immediately

2. **Removing Assignments**
   - Team Member 3: Click trash icon next to name
   - Or use "Remove Assignment" from selection modal

3. **User Selection Modal**
   - Shows all available team members
   - Highlights currently assigned member
   - Grays out users already assigned to other positions
   - "Remove Assignment" button for easy unassignment
   - "Cancel" button to exit without changes

### User Management

1. **Adding Users**
   - Click "Manage Users"
   - Select "+ Add New User"
   - Enter name in prompt
   - New user appears in list

2. **Removing Users**
   - Click "Manage Users"
   - Find user in list
   - Click trash icon
   - User removed from system and any assignments

### Mobile Support
- Responsive design optimized for mobile devices
- Card-based interface for small screens
- Touch-friendly buttons
- Same functionality as desktop version
- Improved readability with black text on mobile cards