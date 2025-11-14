# ZionSync Team Workflow Guide

_Comprehensive workflows and processes for coordinated church service management_

---

## Table of Contents

- [Overview](#overview)
- [Service Lifecycle Management](#service-lifecycle-management)
- [Presentation Team Workflows](#presentation-team-workflows)
- [Worship Team Workflows](#worship-team-workflows)
- [Audio/Video Team Workflows](#audiovideo-team-workflows)
- [Cross-Team Coordination](#cross-team-coordination)
- [User Management Processes](#user-management-processes)
- [Data Synchronization & Real-Time Updates](#data-synchronization--real-time-updates)

---

## Overview

ZionSync coordinates three distinct teams through interconnected workflows that center around a shared service lifecycle. Each team has specific responsibilities while maintaining visibility and dependencies with other teams through real-time data synchronization.

### Team Structure & Responsibilities

| Team             | Primary Role                                | Key Deliverables                                           | Dependencies              |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| **Presentation** | Service coordination & volunteer management | Order of worship, service templates, volunteer assignments | None (initiates process)  |
| **Worship**      | Music planning & team assignments           | Song selections, team scheduling                           | Pastor's service details  |
| **Audio/Video**  | Technical operations & scheduling           | AV operator assignments, equipment readiness               | Service completion status |

### Color Coding System

- **Green**: Presentation Team elements and status
- **Purple**: Worship Team elements and status
- **Red**: Audio/Video Team elements and status

---

## Service Lifecycle Management

The service lifecycle follows a sequential workflow with clear handoffs between teams:

### Phase 1: Service Creation (Presentation Team)

```
Pastor Input → Service Details → Template Selection → Element Identification
```

### Phase 2: Music Planning (Worship Team)

```
Service Details Review → Song Selection → Team Assignment → Completion Marking
```

### Phase 3: Technical Preparation (Audio/Video Team)

```
Service Review → AV Assignment → Equipment Prep → Final Completion
```

### Service Status Indicators

Services display visual status indicators across all team interfaces:

- **📗 Green Book Icon**: Order of worship available (Presentation complete)
- **🎵 Purple Music Icon**: All songs selected (Worship complete)
- **✅ Checkmark**: Service marked complete (final status)

---

## Presentation Team Workflows

_Primary coordination team responsible for service setup and volunteer management_

### Core Workflow: Service Setup

#### 1. Initial Service Access

```
Navigate to Presentation Team → Select Service Date → Expand Service
```

#### 2. Pastor Service Input Process

**Standard Service Creation:**

1. Click "Pastor Edit" button in service header
2. Select service type via radio buttons:
   - **No Communion** (default for most Sundays)
   - **Communion** (1st Sunday with sung Lord's Prayer)
   - **Communion with Potluck** (3rd Sunday)
3. Edit order of worship in text area
4. System auto-identifies elements:
   - **Liturgical items** (Creed, Prayers)
   - **Song placeholders** [PENDING WORSHIP TEAM INPUT]
   - **Scripture readings** with reference fields
   - **Message/sermon** with content fields
5. Click "Save Service Details"

**Custom Service Creation:**

1. Click "Add New Custom Service" in dropdown
2. Enter unique service name
3. Input complete order of worship
4. Click "Review Elements" to verify:
   - Element type detection (liturgy, song, reading, message)
   - Adjust types if needed
5. Save template for reuse

#### 3. Content Preservation System

- **Editing Existing Services**: Song selections preserved during pastor edits
- **Incremental Updates**: Only modified elements updated
- **Reading/Sermon Persistence**: Previously entered content maintained

#### 4. Volunteer Coordination

**User Selection:**

1. Click user name button in header to activate for signups
2. Selected user highlighted across all services

**Service Signup Process:**

1. With active user selected, click "Sign Up" in service header
2. User name appears under service details
3. Click "Remove" to cancel signup

**Service Completion:**

1. Click "Mark Complete" after creating Proclaim presentation
2. Status updates visible to all teams
3. Completion tracked in database

### User Management Workflow

#### Adding Team Members

```
Manage Users → Add New User → Enter Name → Confirm
```

#### Removing Team Members

```
Manage Users → Select Users via Checkboxes → Remove Selected → Confirm
```

### Mobile Responsiveness

- **Touch-optimized interfaces** for tablet/phone access
- **Simplified mobile menus** with essential functions
- **Service cards** for easy navigation on smaller screens

---

## Worship Team Workflows

_Music planning and team assignment coordination_

### Core Workflow: Song Selection & Team Assignment

#### 1. User Authentication & Selection

```
User Selection → Choose Individual/Team → Activate for Planning
```

**Desktop Process:**

- Click user name button from available users
- Worship Leader indicated with special badge
- Selected user highlighted in purple

**Mobile Process:**

- Click "Select User" dropdown
- Choose from available team members
- Confirmation of selection

#### 2. Service Review & Music Planning

**Service Information Access:**

1. Expand service to view:
   - **Left Panel**: Scripture readings, sermon details, special notes
   - **Right Panel**: Song selection interface
2. Review liturgical season information (automatic seasonal awareness)
3. Identify required song positions based on service type

**Song Selection Interface:**

_Standard Service Positions:_

- Opening Hymn
- Hymn of the Day
- Sending Song

_Custom Service Positions:_

- Varies by Pastor's order of worship
- Additional hymns/songs as specified
- Different position names possible

#### 3. Song Entry Process

**Hymn Selection:**

1. Toggle to "Hymn" mode
2. Enter title with auto-complete assistance
3. Add hymn number
4. Select hymnal version:
   - Cranberry
   - Green
   - Blue
5. Add sheet music link (Hymnary.org default)
6. Optional YouTube reference
7. Optional notes field

**Contemporary Song Selection:**

1. Toggle to "Contemporary" mode
2. Enter title with auto-complete
3. Add artist/author information
4. Add sheet music link (SongSelect default)
5. Optional YouTube reference
6. Optional notes field

#### 4. Song Usage Validation

- **Automatic duplicate detection** (4-week lookback)
- **Usage date display** for recent uses
- **Warning system** for song variety maintenance
- **Override capability** for special circumstances

#### 5. Team Assignment Process

**Regular Team Assignment:**

1. Click team badge in service row
2. Select from available teams (pairs with "&" symbol)
3. Examples: "John & Sarah", "Mike & Lisa"

**Special Team Assignment:**

1. Access special teams category
2. Options include:
   - Worship Leader
   - Pastor
   - Confirmation teams
   - Sunday School teams

#### 6. Save & Completion

1. Click "Save Songs" after all selections
2. Updates immediately visible in Presentation Team
3. Purple music icon (🎵) appears when complete

### Advanced Features

#### Liturgical Integration

- **Seasonal awareness** with color-coded service headers
- **Special day indicators** for major church holidays
- **Season-appropriate suggestions** (future enhancement)

#### Worship Planning Access

- **Database management** via "Worship Planning" button
- **Song library administration**
- **Usage analytics** and reporting

### User Management Workflow

#### Adding Worship Team Members

```
Manage Users → + Add New User → Enter Name → Save
```

#### Removing Team Members

```
Manage Users → Click X next to user → Confirm Removal
```

---

## Audio/Video Team Workflows

_Technical operations scheduling and equipment management_

### Core Workflow: AV Team Scheduling

#### 1. Team Structure Understanding

**Three-Position System:**

- **Team Member 1**: Ben (Primary/Fixed position)
- **Team Member 2**: Automatic rotation (Doug → Jaimes → Justin → Brett)
- **Team Member 3**: Volunteer/flexible position

**Important Note**: Team member assignments indicate scheduling, not service roles. Actual equipment responsibilities determined before each service.

#### 2. Assignment Management

**Automatic Assignments:**

- Position 1 defaults to "Ben"
- Position 2 follows rotation schedule automatically
- Position 3 remains open for volunteer signup

**Manual Assignment Override:**

1. Click edit icon next to team member name
2. Select from user modal
3. Already-assigned members appear grayed out
4. Changes update immediately

**Volunteer Signup Process:**

1. Click "Sign Up" button for Position 3
2. Select from available team members
3. Name appears in position
4. Volunteer can remove themselves using trash icon

#### 3. User Selection Modal

**Assignment Interface:**

- **Available users** displayed with selection buttons
- **Current assignment** highlighted
- **Conflict prevention** (grayed out assigned users)
- **Remove assignment** button for easy changes
- **Cancel** option to exit without changes

#### 4. Schedule Management

**Service Display:**

- Date and day of week
- Service title/description
- Three team member positions
- Past dates shown with reduced opacity

**Assignment Tracking:**

- Real-time updates across all team interfaces
- Assignment history maintained
- Schedule balance monitoring

### User Management Workflow

#### Adding AV Team Members

```
Manage Users → + Add New User → Enter Name → Confirm
```

#### Removing Team Members

```
Manage Users → Select User → Click Trash Icon → Confirm
```

#### Initial Team Setup

System automatically initializes core team members:

- Ben, Doug, Jaimes, Laila, Brett, Justin

---

## Cross-Team Coordination

_Integrated workflows ensuring seamless team collaboration_

### Data Flow Architecture

```
Service Lifecycle Data Flow:

Presentation Team (Initiates)
├── Pastor Input → Service Details
├── Order of Worship → Element Structure
└── Service Type → Template Selection
                    ↓
            Shared Service State
                    ↓
Worship Team (Responds)
├── Service Details → Song Requirements
├── Song Selection → Music Planning
└── Team Assignment → Schedule Coordination
                    ↓
            Updated Service State
                    ↓
AV Team (Finalizes)
├── Service Review → Technical Planning
├── Team Assignment → AV Scheduling
└── Completion Status → Final Approval
```

### Real-Time Synchronization

#### Polling-Based Updates

- **30-second intervals** for automatic data refresh
- **Background synchronization** without user interruption
- **Optimistic updates** for immediate UI response

#### Cross-Team Visibility

**Presentation Team View:**

- Service status icons show Worship team progress
- Song selections display once Worship team completes
- AV completion status visible

**Worship Team View:**

- Pastor's service details immediately available
- Service type and readings visible for planning
- Song requirements automatically identified

**AV Team View:**

- Complete service information accessible
- All team assignments visible
- Service completion status trackable

### Status Communication System

#### Visual Indicators

```
📗 Order of Worship Available (Presentation → Worship)
🎵 Songs Selected (Worship → Presentation/AV)
✅ Service Complete (All Teams)
```

#### Progress Dependencies

1. **Presentation completes** → Worship can begin planning
2. **Worship completes** → Songs visible to Presentation
3. **All teams coordinate** → Service marked complete

### Conflict Resolution

#### Element Preservation

- **Song selections preserved** during pastor edits
- **Reading content maintained** across updates
- **Service type changes** handled gracefully

#### Change Management

- **Warning dialogs** for potentially destructive edits
- **Confirmation prompts** for major changes
- **Backup/recovery** for accidental deletions

---

## User Management Processes

_Standardized user administration across all teams_

### Universal User Management Patterns

#### Adding Users (All Teams)

```
1. Click "Manage Users" button
2. Select "+ Add New User"
3. Enter name in prompt dialog
4. User added to team roster immediately
5. Available for assignments/selections
```

#### Removing Users (All Teams)

```
1. Access "Manage Users" interface
2. Locate user in list
3. Click removal method (X icon, checkbox, trash icon)
4. Confirm removal action
5. User removed from system and assignments
```

### Team-Specific User Features

#### Presentation Team

- **Checkbox selection** for bulk user removal
- **Active user highlighting** for signup sessions
- **Honor-system access** (no authentication required)

#### Worship Team

- **Role indicators** (Leader badge for worship leader)
- **Individual vs team filtering** (exclude special groups)
- **User type categorization** (regular, special, pastor)

#### AV Team

- **Simplified management** (add/remove only)
- **Conflict checking** (prevent double-assignment)
- **Rotation member status** (core team vs. volunteers)

### User State Management

#### Session Persistence

- **Selected user maintained** across page navigation
- **User preferences** stored during session
- **Assignment state** preserved during updates

#### Cross-Team Recognition

- **Shared user database** where applicable
- **Team-specific roles** and permissions
- **Consistent naming** across team interfaces

---

## Data Synchronization & Real-Time Updates

_Technical coordination ensuring data consistency_

### Synchronization Architecture

#### Central State Management

```
MainLayout Component (Global Coordinator)
├── Service Details (Centralized)
├── User Sessions (Team-specific)
└── Real-time Polling (30-second cycle)
                    ↓
Team Components (Consumers)
├── Presentation Team → Service Management
├── Worship Team → Song Selection
└── AV Team → Schedule Management
```

#### Update Propagation

1. **User Action** triggers API call
2. **Optimistic Update** for immediate UI response
3. **API Synchronization** updates database
4. **Background Polling** spreads changes to other teams
5. **Conflict Resolution** handles concurrent edits

### Error Handling & Recovery

#### User Feedback System

- **Success messages** for completed actions
- **Error alerts** with actionable information
- **Loading indicators** during API operations
- **Timeout handling** for network issues

#### Data Integrity

- **Validation** before database updates
- **Rollback capability** for failed operations
- **Duplicate prevention** through unique constraints
- **Relationship maintenance** across collections

### Performance Optimization

#### Efficient Data Loading

- **Lazy loading** for non-critical data
- **Caching** for frequently accessed information
- **Pagination** for large datasets
- **Selective fetching** based on user context

#### Mobile Considerations

- **Responsive design** for all team interfaces
- **Touch-optimized** controls and navigation
- **Reduced data usage** through smart caching
- **Offline tolerance** for basic operations

---

## Conclusion

ZionSync's team workflows are designed for seamless coordination while maintaining each team's autonomy and specialized functions. The service lifecycle provides clear handoffs and dependencies, while real-time synchronization ensures all teams have current information for effective planning and execution.

### Key Workflow Principles

1. **Sequential Dependencies**: Each team builds upon previous team's work
2. **Real-Time Visibility**: All teams see current service status
3. **Preservation**: Important data protected during updates
4. **User-Friendly**: Honor-system access with intuitive interfaces
5. **Mobile-First**: Responsive design for various devices

### Success Metrics

- **Coordination Efficiency**: Reduced service planning time
- **Data Accuracy**: Eliminated manual handoffs
- **Team Satisfaction**: Streamlined individual workflows
- **Service Quality**: Better prepared and coordinated services

For technical implementation details, see [Architecture Overview](./architecture-overview.md) and [API Reference](./api-reference.md).
