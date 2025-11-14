# ZionSync Component Library Reference

## Overview

ZionSync uses a component-driven architecture built on React with a combination of shadcn/ui primitives and custom application-specific components. This document provides comprehensive documentation for all UI components, custom hooks, styling patterns, and implementation guidelines.

### Architecture Principles

- **Component composition** over complex inheritance
- **Responsive-first design** with mobile and desktop variants
- **Consistent styling** using Tailwind CSS utility classes
- **Accessibility-focused** with proper ARIA attributes and keyboard navigation
- **Reusable primitives** for consistent UI patterns across the application

---

## Core UI Primitives

### Button Component

**Location**: `src/components/ui/button.jsx`  
**Purpose**: Primary interactive element with consistent styling and behavior

#### Named Exports

- **Button**: Main button component with variant and size support
- **buttonVariants**: Object containing variant class definitions

#### Props

```javascript
{
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link',
  size: 'default' | 'sm' | 'lg' | 'icon',
  className: string,
  children: ReactNode,
  ...props: HTMLButtonElement
}
```

#### Variants

- **default**: Purple primary button (`bg-purple-700 text-white hover:bg-purple-800`)
- **destructive**: Red danger button (`bg-red-500 text-white hover:bg-red-600`)
- **outline**: Bordered button (`border border-gray-300 bg-white text-gray-700`)
- **secondary**: Gray secondary button (`bg-gray-100 text-gray-800`)
- **ghost**: Transparent hover button (`hover:bg-gray-100`)
- **link**: Text link style (`text-purple-700 underline`)

#### Usage Example

```jsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg" onClick={handleClick}>
  Primary Action
</Button>;
```

### Card Component

**Location**: `src/components/ui/card.jsx`  
**Purpose**: Container component for grouped content with consistent styling

#### Named Exports

- **Card**: Main container with rounded borders and shadow
- **CardHeader**: Header section with padding and flex layout
- **CardTitle**: Styled heading element with large font
- **CardDescription**: Subtitle text with muted color
- **CardContent**: Main content area with padding
- **CardFooter**: Footer section with flex layout

#### Props Structure

```javascript
Card: {
  className: string,
  children: ReactNode,
  ...props: HTMLDivElement
}
```

#### Usage Example

```jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Service Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Service content goes here</p>
  </CardContent>
</Card>;
```

### Input Component

**Location**: `src/components/ui/input.jsx`  
**Purpose**: Text input with consistent styling and focus states

#### Named Exports

- **Input**: Styled input component with focus ring and shadow

#### Props

```javascript
{
  type: string,
  className: string,
  placeholder: string,
  ...props: HTMLInputElement
}
```

#### Styling

- Base classes: `h-9 w-full rounded-md border px-3 py-1 text-sm`
- Focus state: `focus-visible:ring-1 focus-visible:ring-ring`
- Disabled state: `disabled:opacity-50`

### Alert Component

**Location**: `src/components/ui/alert.jsx`  
**Purpose**: Notification and status messages with variant styling

#### Named Exports

- **Alert**: Main container for alert messages
- **AlertTitle**: Bold heading for alert
- **AlertDescription**: Message content for alert

#### Variants

- **default**: Standard alert styling
- **destructive**: Error/warning styling with red accent

#### Usage Example

```jsx
import { Alert, AlertDescription } from "@/components/ui/alert";

<Alert>
  <AlertDescription>
    Your changes have been saved successfully.
  </AlertDescription>
</Alert>;
```

### Tabs Component

**Location**: `src/components/ui/tabs.jsx`  
**Purpose**: Tabbed interface using Radix UI primitives

#### Named Exports

- **Tabs**: Root container for tab system
- **TabsList**: Container for tab buttons
- **TabsTrigger**: Individual tab button
- **TabsContent**: Content panel for each tab

#### Styling

- Active tab: `data-[state=active]:bg-white data-[state=active]:text-purple-700`
- Inactive tab: `text-gray-600`

### Progress Component

**Location**: `src/components/ui/progress.jsx`  
**Purpose**: Progress bar using Radix UI primitives

#### Named Exports

- **Progress**: Radix-based progress component

#### Props

```javascript
{
  value: number, // 0-100 percentage
  className: string
}
```

#### Simple Progress Variant

**Location**: `src/components/ui/SimpleProgress.jsx`  
**Purpose**: Lightweight progress bar without Radix dependency

```jsx
<SimpleProgress value={75} bgColor="bg-gray-200" valueColor="bg-blue-500" />
```

---

## Application Components

### Layout Components

#### MainLayout

**Location**: `src/components/MainLayout.jsx`  
**Purpose**: Primary application layout with responsive navigation

#### Key Features

- **Responsive design**: Desktop sidebar tabs, mobile bottom navigation
- **Tab management**: Handles team selection and navigation
- **Background theming**: Dynamic backgrounds per team
- **Service data**: Centralized service details management

#### Props

```javascript
// No direct props - uses internal state management
```

#### Tab Configuration

```javascript
const tabs = [
  {
    id: "home",
    label: "Home",
    colors: { bg: "bg-gray-800", text: "text-white" },
    isHome: true,
  },
  {
    id: "presentation",
    label: "Presentation",
    colors: { bg: "bg-[#6B8E23]", text: "text-white" },
    background: 'url("/palms.jpg")',
  },
  // ... other tabs
];
```

#### SplashScreen

**Location**: `src/components/SplashScreen.jsx`  
**Purpose**: Landing page with team selection interface

#### Features

- **Framer Motion animations**: Smooth transitions and hover effects
- **Team selection**: Direct navigation to team interfaces
- **Background effects**: Animated dot matrix and gradients
- **Responsive layout**: Adapts to mobile and desktop

#### Props

```javascript
{
  onEnter: Function,     // Callback for screen exit
  setActiveTab: Function // Team selection handler
}
```

### Team Components

#### SignupSheet

**Location**: `src/components/ui/SignupSheet.jsx`  
**Purpose**: Presentation team service scheduling and management

#### Key Features

- **Service management**: Create, edit, and organize services
- **User assignments**: Team member signup and management
- **Responsive views**: Desktop table and mobile card layouts
- **Calendar integration**: ICS file generation for calendar imports
- **Batch operations**: Multi-service completion and management

#### Props

```javascript
{
  serviceDetails: Object,     // Service information from MainLayout
  setServiceDetails: Function // Service update callback
}
```

#### Major Sub-Components

- **PastorServiceInput**: Service content creation and editing
- **UserSelectionModal**: Team member selection interface
- **MobileServiceCard**: Mobile-optimized service display

#### WorshipTeam

**Location**: `src/components/ui/WorshipTeam.jsx`  
**Purpose**: Worship team scheduling and song management

#### Key Features

- **Team assignments**: Worship leader and team scheduling
- **Song selection**: Integration with song database
- **Service content**: Worship service planning tools
- **Liturgical integration**: Season-aware styling and content

#### Props

```javascript
{
  serviceDetails: Object,     // Service information
  setServiceDetails: Function // Service update callback
}
```

#### Major Sub-Components

- **ServiceSongSelector**: Song selection and management
- **MobileWorshipServiceCard**: Mobile service display
- **TeamSelectorModal**: Team assignment interface

#### AVTeam

**Location**: `src/components/ui/AVTeam.jsx`  
**Purpose**: Audio/Visual team scheduling and management

#### Key Features

- **Team assignments**: AV operator scheduling
- **Three-position system**: Primary, secondary, and volunteer slots
- **Responsive design**: Desktop table and mobile card views
- **User management**: AV team member administration

#### Props

```javascript
// No props - manages internal state
```

#### Sub-Components

- **MobileAVTeamCard**: Mobile-optimized AV assignment display
- **UserSelectionModal**: Team member selection

### Mobile Components

#### MobileServiceCard

**Location**: `src/components/ui/MobileServiceCard.jsx`  
**Purpose**: Mobile-optimized presentation service card display

#### Key Features

- **Expandable design**: Collapsible service details
- **Assignment management**: User assignment and removal
- **Service editing**: In-line service content editing
- **Completion tracking**: Service completion status
- **Custom service support**: Template-based service creation

#### Props

```javascript
{
  item: Object,              // Service data
  signups: Object,           // User assignments
  completed: Array,          // Completed service IDs
  selectedDates: Array,      // Selected date range
  serviceDetails: Object,    // Service detail information
  availableUsers: Array,     // Available team members
  onAssignUser: Function,    // User assignment handler
  onRemoveAssignment: Function, // Assignment removal handler
  onComplete: Function,      // Service completion handler
  // ... additional handlers
}
```

#### MobileWorshipServiceCard

**Location**: `src/components/ui/MobileWorshipServiceCard.jsx`  
**Purpose**: Mobile-optimized worship service display

#### Key Features

- **Song management**: Service song selection and ordering
- **Team assignments**: Worship team member assignment
- **Liturgical awareness**: Season-appropriate styling
- **Service completion**: Worship service completion tracking

#### MobileAVTeamCard

**Location**: `src/components/ui/MobileAVTeamCard.jsx`  
**Purpose**: Mobile-optimized AV team assignment display

#### Key Features

- **Three-position display**: Primary, secondary, volunteer positions
- **User assignment**: Quick team member assignment
- **Visual indicators**: Assignment status and coverage
- **Responsive layout**: Optimized for mobile interaction

### Input Components

#### PastorServiceInput

**Location**: `src/components/ui/PastorServiceInput.jsx`  
**Purpose**: Service content creation and editing interface

#### Key Features

- **Rich text editing**: Multi-line service content input
- **Template support**: Pre-defined service templates
- **Auto-save**: Automatic content saving
- **Validation**: Content validation and error handling

#### Props

```javascript
{
  serviceDetails: Object,     // Current service information
  setServiceDetails: Function, // Service update callback
  date: string,              // Service date
  onSave: Function          // Save completion callback
}
```

### Modal Components

#### UserSelectionModal

**Location**: `src/components/ui/UserSelectionModal.jsx`  
**Purpose**: Reusable user selection interface

#### Props

```javascript
{
  showModal: boolean,
  onClose: Function,
  availableUsers: Array,
  onSelect: Function,
  onDelete: Function,
  initialUserName: string,
  title: string,
  showDeleteButton: boolean,
  currentAssignments: Object,
  currentPosition: string
}
```

#### Features

- **Conflict detection**: Prevents double-booking users
- **Responsive design**: Mobile and desktop optimized
- **User management**: Add/remove user functionality

#### QuickAddModal

**Location**: `src/components/ui/QuickAddModal.jsx`  
**Purpose**: Quick song addition to database

#### Props

```javascript
{
  isOpen: boolean,
  onClose: Function,
  onSongAdded: Function,
  prefillTitle: string,
  prefillType: string
}
```

#### AddCustomService

**Location**: `src/components/ui/AddCustomService.jsx`  
**Purpose**: Custom service template creation

#### Key Features

- **Template parsing**: Intelligent service content analysis
- **Element typing**: Automatic categorization of service elements
- **Preview mode**: Service template review before saving
- **Validation**: Content validation and error handling

#### ReferenceSongManageModal

**Location**: `src/components/ui/ReferenceSongManageModal.jsx`  
**Purpose**: Reference song database management interface

#### Key Features

- **External song integration**: Import from external databases
- **Bulk operations**: Multiple song management
- **Metadata editing**: Song information management
- **Category assignment**: Liturgical season tagging

### Song Management Components

#### SongDatabase

**Location**: `src/components/ui/SongDatabase.jsx`  
**Purpose**: Comprehensive song library management

#### Key Features

- **Multi-tab interface**: Browse, manage, and analyze songs
- **Search and filtering**: Advanced song discovery tools
- **Seasonal tagging**: Liturgical season assignment
- **Reference integration**: External song recommendations
- **Usage analytics**: Song performance tracking

#### Major Sub-Components

- **SeasonalTaggingTool**: Bulk season assignment
- **ReferenceSongPanel**: External song recommendations
- **SongRediscoveryPanel**: Usage analytics and recommendations
- **SeasonalPlanningGuide**: Liturgical planning assistance

#### ServiceSongSelector

**Location**: `src/components/ui/ServiceSongSelector.jsx`  
**Purpose**: Song selection for worship services

#### Props

```javascript
{
  date: string,
  serviceDetails: Object,
  setServiceDetails: Function,
  availableSongs: Object,
  onSongSelect: Function,
  liturgicalInfo: Object
}
```

#### Features

- **Position-based selection**: Opening, hymn, sending song slots
- **Search functionality**: Real-time song filtering
- **Liturgical awareness**: Season-appropriate suggestions
- **Usage tracking**: Song selection analytics

#### SeasonalTaggingTool

**Location**: `src/components/ui/SeasonalTaggingTool.jsx`  
**Purpose**: Bulk liturgical season assignment for songs

#### Key Features

- **Batch processing**: Multiple song season assignment
- **Visual feedback**: Progress and completion indicators
- **Undo functionality**: Revert tagging operations
- **Smart suggestions**: AI-powered season recommendations

#### SongRediscoveryPanel

**Location**: `src/components/ui/SongRediscoveryPanel.jsx`  
**Purpose**: Song usage analytics and rediscovery recommendations

#### Key Features

- **Usage tracking**: Historical song performance data
- **Recommendation engine**: Suggest underused songs
- **Trend analysis**: Song popularity over time
- **Seasonal insights**: Season-specific usage patterns

#### ReferenceSongPanel

**Location**: `src/components/ui/ReferenceSongPanel.jsx`  
**Purpose**: External song database integration and recommendations

#### Key Features

- **External database access**: CCLI, Hymnary, and other sources
- **Import functionality**: Add external songs to local database
- **Metadata enrichment**: Enhanced song information
- **License tracking**: Copyright and usage permissions

#### SongSection

**Location**: `src/components/ui/SongSection.jsx`  
**Purpose**: Individual song section component for service display

#### Key Features

- **Song positioning**: Opening, hymn, sending song display
- **Edit functionality**: In-line song editing
- **Removal handling**: Song removal from services
- **Visual indicators**: Song selection status

#### SeasonalTips

**Location**: `src/components/ui/SeasonalTips.jsx`  
**Purpose**: Liturgical season guidance and tips

#### Key Features

- **Contextual guidance**: Season-specific planning advice
- **Musical suggestions**: Appropriate musical styles and themes
- **Resource links**: External planning resources
- **Calendar integration**: Important liturgical dates

### Liturgical Components

#### LiturgicalStyling

**Location**: `src/components/liturgical/LiturgicalStyling.jsx`  
**Purpose**: Season-aware styling and visual indicators

#### Named Exports

- **getSeasonClass**: Returns CSS classes for liturgical seasons
- **getSpecialServiceType**: Identifies special liturgical days
- **getHeaderClass**: Provides header styling for seasons
- **SpecialServiceIndicator**: Visual component for special days
- **isTransitionDate**: Detects liturgical season transitions

#### Key Functions

```javascript
getSeasonClass(dateStr); // Returns season identifier
getHeaderClass(dateStr); // Returns header CSS classes
isTransitionDate(dateStr); // Boolean for transition periods
```

#### Season Color Mapping

```javascript
const seasonColors = {
  ADVENT: "#4b0082", // Purple
  CHRISTMAS: "#b8860b", // Gold
  EPIPHANY: "#006400", // Green
  LENT: "#800080", // Purple
  EASTER: "#ffd700", // Gold
  PENTECOST: "#FF4500", // Red
  ORDINARY_TIME: "#008000", // Green
};
```

#### LiturgicalDebug

**Location**: `src/components/liturgical/LiturgicalDebug.jsx`  
**Purpose**: Development tool for liturgical calendar debugging

#### Key Features

- **Calendar visualization**: Interactive liturgical calendar display
- **Date calculation testing**: Verify liturgical date algorithms
- **Season transition debugging**: Identify transition issues
- **Development mode only**: Not included in production builds

#### SeasonalPlanningGuide

**Location**: `src/components/ui/SeasonalPlanningGuide.jsx`  
**Purpose**: Liturgical season planning assistance

#### Features

- **Season selection**: Interactive season browser
- **Progress tracking**: Season timeline visualization
- **Thematic guidance**: Musical and theological direction
- **Planning tips**: Practical implementation advice

### Responsive Mobile Components

#### MobileWorshipSelect

**Location**: `src/components/ui/MobileWorshipSelect.jsx`  
**Purpose**: Mobile-optimized worship team selection interface

#### Key Features

- **Touch-optimized selection**: Large touch targets for mobile
- **Quick assignment**: Rapid team member assignment
- **Visual feedback**: Clear selection indicators
- **Conflict prevention**: Prevents scheduling conflicts

---

## Custom Hooks

### useResponsive

**Location**: `src/hooks/useResponsive.js`  
**Purpose**: Responsive design utilities

#### Returns

```javascript
{
  isMobile: boolean,      // (max-width: 767px)
  isTablet: boolean,      // (768px - 1023px)
  isDesktop: boolean,     // (min-width: 1024px)
  windowSize: {
    width: number,
    height: number
  }
}
```

#### Usage Example

```jsx
import useResponsive from "@/hooks/useResponsive";

const Component = () => {
  const { isMobile } = useResponsive();

  return <div>{isMobile ? <MobileComponent /> : <DesktopComponent />}</div>;
};
```

### useMediaQuery

**Location**: `src/hooks/useMediaQuery.js`  
**Purpose**: Media query matching hook

#### Props

```javascript
{
  query: string; // CSS media query string
}
```

#### Returns

```javascript
boolean; // Whether the media query matches
```

#### Usage Example

```jsx
import useMediaQuery from "@/hooks/useMediaQuery";

const Component = () => {
  const isLargeScreen = useMediaQuery("(min-width: 1200px)");

  return (
    <div className={isLargeScreen ? "large-layout" : "compact-layout"}>
      Content
    </div>
  );
};
```

---

## Styling Conventions

### Tailwind CSS Patterns

#### Color Palette

- **Primary**: `bg-purple-700` (Worship team)
- **Secondary**: `bg-[#6B8E23]` (Presentation team)
- **Accent**: `bg-red-700` (AV team)
- **Neutral**: `bg-gray-100`, `bg-gray-200`, etc.

#### Spacing System

- **Consistent padding**: `p-4`, `p-6` for cards and containers
- **Component spacing**: `space-y-4`, `gap-4` for element groups
- **Section margins**: `mb-4`, `mb-6` for major sections

#### Typography

- **Headings**: `text-xl font-bold`, `text-lg font-semibold`
- **Body text**: `text-sm`, `text-base` for readability
- **Captions**: `text-xs` for metadata and hints

#### Interactive States

- **Hover**: `hover:bg-gray-50`, `hover:bg-purple-800`
- **Focus**: `focus:ring-1 focus:ring-purple-700`
- **Active**: `bg-purple-700 text-white`
- **Disabled**: `opacity-50 cursor-not-allowed`

### Responsive Design Patterns

#### Mobile-First Approach

```jsx
// Base styles for mobile, then desktop overrides
<div className="w-full md:w-1/2 lg:w-1/3">
  <div className="p-4 md:p-6">
    <h2 className="text-lg md:text-xl">Title</h2>
  </div>
</div>
```

#### Conditional Rendering

```jsx
// Component-level responsive switches
{
  isMobile ? <MobileComponent /> : <DesktopComponent />;
}
```

#### Responsive Utilities

```jsx
// Hidden/visible patterns
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Team Color Theming

#### Theme Configuration

```javascript
const teamThemes = {
  presentation: {
    bg: "bg-[#6B8E23]",
    bgLight: "bg-[#e4ecd4]",
    text: "text-white",
    textLight: "text-[#6B8E23]",
  },
  worship: {
    bg: "bg-purple-700",
    bgLight: "bg-purple-50",
    text: "text-white",
    textLight: "text-purple-700",
  },
  av: {
    bg: "bg-red-700",
    bgLight: "bg-red-50",
    text: "text-white",
    textLight: "text-red-700",
  },
};
```

#### Dynamic Theming

```jsx
// Apply theme colors based on active team
<div className={`${activeTheme.bg} ${activeTheme.text}`}>
  Team-specific content
</div>
```

### Liturgical Styling

#### Season-Based Styling

```jsx
// CSS file: src/styles/liturgical-themes.css
.season-advent { border-left: 4px solid #4b0082; }
.season-christmas { border-left: 4px solid #b8860b; }
.season-lent { border-left: 4px solid #800080; }
```

#### Dynamic Season Colors

```jsx
// Programmatic color application
<div className="border-l-4" style={{ borderColor: getSeasonColor(seasonId) }}>
  Season content
</div>
```

---

## Implementation Guidelines

### Component Creation Best Practices

#### File Structure

```
src/components/
├── ui/                 # Reusable UI primitives
├── liturgical/         # Liturgical-specific components
├── MainLayout.jsx      # Main layout component
├── SplashScreen.jsx    # Landing page
├── DotMatrix.jsx       # Background effects
└── RotatingSlogan.jsx  # Animated text
```

#### Component Template

```jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import useResponsive from "@/hooks/useResponsive";

const ComponentName = ({ prop1, prop2, ...props }) => {
  const [state, setState] = useState(initialValue);
  const { isMobile } = useResponsive();

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <div className="container-styles">
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
};

export default ComponentName;
```

#### Props Documentation

```javascript
/**
 * Component description
 * @param {string} prop1 - Description of prop1
 * @param {Function} prop2 - Description of prop2
 * @param {Object} prop3 - Description of prop3
 * @param {boolean} [optionalProp] - Optional prop description
 */
```

### State Management Patterns

#### Local State

```jsx
// Component-level state for UI interactions
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
```

#### Prop Drilling

```jsx
// Pass state through component hierarchy
<ParentComponent>
  <ChildComponent data={data} onUpdate={handleUpdate} />
</ParentComponent>
```

#### Event-Based Communication

```jsx
// Custom events for cross-component communication
const handleRefreshEvent = (event) => {
  setServiceDetails(event.detail);
};

window.addEventListener("refreshServiceDetails", handleRefreshEvent);
```

### Error Handling

#### Component Error Boundaries

```jsx
// Error boundary for component isolation
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

#### Graceful Degradation

```jsx
// Handle missing data gracefully
const Component = ({ data }) => {
  if (!data) {
    return <div>Loading...</div>;
  }

  return <div>{data.content}</div>;
};
```

### Performance Optimization

#### React.memo

```jsx
// Memoize components to prevent unnecessary re-renders
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data.content}</div>;
});
```

#### useCallback and useMemo

```jsx
// Memoize expensive calculations and callbacks
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const handleClick = useCallback(() => {
  onAction(selectedItem);
}, [selectedItem, onAction]);
```

### Accessibility Guidelines

#### ARIA Attributes

```jsx
// Proper ARIA labeling
<button aria-label="Close modal" aria-expanded={isOpen} onClick={handleClose}>
  <X className="w-4 h-4" />
</button>
```

#### Keyboard Navigation

```jsx
// Handle keyboard events
<div
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleAction();
    }
  }}
>
  Interactive element
</div>
```

#### Focus Management

```jsx
// Manage focus for modals and navigation
useEffect(() => {
  if (isOpen) {
    focusFirstElement();
  }
}, [isOpen]);
```

---

## Testing Patterns

### Component Testing

```jsx
// Basic component test structure
import { render, screen } from "@testing-library/react";
import Component from "./Component";

test("renders component correctly", () => {
  render(<Component prop="value" />);
  expect(screen.getByText("Expected text")).toBeInTheDocument();
});
```

### Custom Hook Testing

```jsx
// Custom hook testing
import { renderHook } from "@testing-library/react";
import useCustomHook from "./useCustomHook";

test("custom hook returns expected values", () => {
  const { result } = renderHook(() => useCustomHook());
  expect(result.current.value).toBe(expectedValue);
});
```

---

## Migration and Maintenance

### Component Versioning

- **Semantic versioning** for breaking changes
- **Deprecation warnings** for obsolete components
- **Migration guides** for major updates

### Documentation Updates

- **Component changes** require documentation updates
- **Props modifications** must be reflected in documentation
- **Usage examples** should be kept current

### Dependency Management

- **Regular updates** of UI library dependencies
- **Breaking change assessment** before major updates
- **Compatibility testing** across component library

---

_This component library reference serves as the definitive guide for UI development in ZionSync. For architectural context, see `architecture-overview.md`. For database integration patterns, see `database-schema.md`. For API integration, see `api-reference.md`._
