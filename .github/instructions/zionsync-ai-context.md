---
description: Master AI context file for ZionSync development - Core patterns, conventions, and project knowledge
applyTo: "**"
priority: critical
---

# ZionSync AI Development Context

## Purpose & Overview

This file provides comprehensive context for AI assistants working on ZionSync. It contains essential patterns, conventions, and project knowledge that MUST be followed for all code modifications.

**Project**: ZionSync - Church Service Management System
**Type**: Next.js 15 Web Application
**Database**: MongoDB
**User**: Non-technical user relying 100% on AI-assisted development
**Priority**: Code quality, consistency, and reliability

---

## CRITICAL: Investigation-First Protocol

### Before ANY Code Solution

**MANDATORY SEQUENCE:**

1. Search for existing implementations using `semantic_search`
2. Examine related files using `file_search` and `read_file`
3. Check dependencies using `list_code_usages`
4. Find reusable utilities using `grep_search`
5. ONLY THEN provide solution based on discovered patterns

**Never guess patterns. Always verify.**

---

## Technology Stack (Definitive)

### Core Framework

```json
{
  "next": "^16.0.7", // Next.js 15+ with App Router
  "react": "latest", // React 18+
  "mongodb": "^6.13.0", // Native driver (NOT Mongoose for queries)
  "tailwindcss": "latest" // Utility-first styling
}
```

### Key Libraries

- **UI Components**: Radix UI primitives (@radix-ui/react-\*)
- **Icons**: Lucide React (primary), React Icons (supplementary)
- **Rich Text**: TipTap (@tiptap/react, @tiptap/starter-kit)
- **Dates**: date-fns (for liturgical calculations)
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Styling Utility**: `cn()` function from @/lib/utils (combines clsx + tailwind-merge)

### Testing

- **Framework**: Jest with jsdom environment
- **Library**: React Testing Library
- **Config**: babel.config.jest.json, jest.config.js, jest.setup.js

---

## File Structure & Conventions

### Project Structure

```
zionsync/
├── src/
│   ├── app/              # Next.js 15 App Router
│   │   ├── api/          # API routes
│   │   ├── globals.css   # Global styles
│   │   ├── layout.jsx    # Root layout
│   │   └── page.jsx      # Home page
│   ├── components/       # React components
│   │   ├── ui/          # UI components (buttons, forms, etc.)
│   │   └── [feature]/   # Feature-specific components
│   ├── data/            # Static data files
│   ├── hooks/           # Custom React hooks
│   │   ├── index.js     # Hook exports
│   │   └── useResponsive.js  # Responsive breakpoint hook
│   ├── lib/             # Utilities and libraries
│   │   ├── mongodb.js   # MongoDB connection
│   │   └── utils.js     # cn() function
│   ├── models/          # Data models
│   ├── scripts/         # Utility scripts
│   └── utils/           # Helper functions
├── GuidingDocs/         # AI and developer documentation
├── .vscode/             # VS Code configuration
└── [config files]       # Various config files
```

### File Naming Conventions

| Type       | Convention                     | Example                     |
| ---------- | ------------------------------ | --------------------------- |
| Components | PascalCase.jsx                 | `ServiceEditor.jsx`         |
| Hooks      | camelCase.js with 'use' prefix | `useResponsive.js`          |
| Utils      | camelCase.js                   | `dateUtils.js`              |
| API Routes | kebab-case folders             | `api/song-library/route.js` |
| Test Files | .test.js suffix                | `ServiceEditor.test.js`     |

### Import Path Rules

**ALWAYS use `@/` for src imports:**

```javascript
// ✅ CORRECT
import { cn } from "@/lib/utils";
import useResponsive from "@/hooks/useResponsive";
import ServiceEditor from "@/components/ui/ServiceEditor";

// ❌ WRONG
import { cn } from "../../../lib/utils";
import useResponsive from "src/hooks/useResponsive";
```

**Extension rules:**

- Omit extensions for `.js` and `.jsx` files
- Include extensions for other file types

---

## Core Patterns & Standards

### 1. Component Structure (MANDATORY)

```javascript
// filepath: c:\Users\thegl\Desktop\Tech Projects\zionsync\src\components\ui\ExampleComponent.jsx

"use client"; // For client components (interactive, hooks, event handlers)

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import useResponsive from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";

/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.requiredProp - Description
 */
const ExampleComponent = ({ requiredProp, optionalProp = "default" }) => {
  // 1. Hooks
  const { isMobile } = useResponsive();
  const [state, setState] = useState(null);

  // 2. Effects with cleanup
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      // Fetch logic
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, []);

  // 4. Render
  return <div className={cn("base-classes", isMobile && "mobile-classes")}>{/* Content */}</div>;
};

export default ExampleComponent;
```

### 2. API Route Pattern (MANDATORY)

```javascript
// filepath: c:\Users\thegl\Desktop\Tech Projects\zionsync\src\app\api\example\route.js

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    const collection = db.collection("collectionName");

    // Query logic
    const data = await collection.find({}).toArray();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/example:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");
    const collection = db.collection("collectionName");

    // Validation
    if (!body.requiredField) {
      return NextResponse.json({ error: "Missing required field" }, { status: 400 });
    }

    // Insert/Update logic
    const result = await collection.insertOne(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/example:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3. Responsive Design Pattern (MANDATORY)

**ALWAYS use `useResponsive` hook:**

```javascript
import useResponsive from "@/hooks/useResponsive";

const MyComponent = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}

      {/* Or conditional classes */}
      <div className={cn("base-styles", isMobile ? "mobile-styles" : "desktop-styles")}>Content</div>
    </>
  );
};
```

**❌ NEVER use:**

- `window.innerWidth` directly
- Manual media queries in components
- `useMediaQuery` hooks directly

### 4. Styling Pattern (MANDATORY)

**Use Tailwind classes with `cn()` utility:**

```javascript
import { cn } from '@/lib/utils';

// ✅ CORRECT
<button className={cn(
  "px-4 py-2 rounded-lg",
  "bg-blue-500 hover:bg-blue-600",
  "text-white font-medium",
  isActive && "ring-2 ring-blue-300",
  disabled && "opacity-50 cursor-not-allowed"
)}>
  Click Me
</button>

// ❌ WRONG - Never use inline styles
<button style={{ padding: '8px 16px', background: 'blue' }}>
  Click Me
</button>
```

### 5. Error Handling Pattern (MANDATORY)

**All async operations MUST have error handling:**

```javascript
// ✅ CORRECT - Frontend
const handleSave = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    setSuccess(true);
  } catch (error) {
    console.error("Save failed:", error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// ✅ CORRECT - Backend (see API pattern above)
```

---

## Database Schema & Collections

### MongoDB Database: `church`

#### Collections:

1. **users** - User assignments and roles
2. **services** - Service definitions and schedules
3. **songs** - Song library with CCLI info
4. **assignments** - Team member assignments
5. **completed_services** - Historical service records
6. **statistics** - Usage analytics

### Key Schema Patterns

**Services Collection:**

```javascript
{
  _id: ObjectId,
  title: String,
  date: ISODate,
  liturgicalSeason: String,
  liturgicalColor: String,
  pastorContent: {
    // Rich text content
  },
  worshipSongs: [
    {
      id: String,
      title: String,
      ccliNumber: String,
      // ... song details
    }
  ],
  presentationTeam: [String], // User IDs
  worshipTeam: [String],
  avTeam: [String],
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Songs Collection:**

```javascript
{
  _id: ObjectId,
  title: String,
  ccliNumber: String,
  artist: String,
  themes: [String],
  liturgicalSeasons: [String],
  usageCount: Number,
  lastUsed: ISODate
}
```

---

## Common Patterns & Utilities

### 1. Liturgical Calendar Integration

**Importing liturgical functions:**

```javascript
import { getLiturgicalSeason, getLiturgicalColor, getSeasonalSongSuggestions } from "@/utils/liturgicalCalendar";

const season = getLiturgicalSeason(date);
const color = getLiturgicalColor(date);
```

### 2. Song Matching & Suggestions

```javascript
import { findSimilarSongs } from "@/utils/songMatching";

const suggestions = await findSimilarSongs({
  season: "advent",
  themes: ["hope", "waiting"],
  excludeRecent: true,
});
```

### 3. Data Fetching Pattern

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/endpoint");
      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      if (isMounted) {
        setData(result);
      }
    } catch (err) {
      if (isMounted) {
        setError(err.message);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  fetchData();
  return () => {
    isMounted = false;
  };
}, [dependency]);
```

---

## Team-Specific Contexts

### Presentation Team

- Manages service signup and user assignments
- Creates service outlines
- Assigns team members
- Integrates liturgical calendar

### Worship Team

- Selects songs for services
- Views song suggestions based on liturgical season
- Manages song library
- Tracks song usage

### AV Team

- Views all service details
- Prepares technical requirements
- Has read-only access to most content

---

## Common Mistakes to AVOID

### ❌ FORBIDDEN Patterns

1. **Class Components**

   ```javascript
   // ❌ NEVER
   class MyComponent extends React.Component {}
   ```

2. **Direct Window Access Without Checks**

   ```javascript
   // ❌ NEVER
   const width = window.innerWidth; // In SSR this fails!

   // ✅ CORRECT
   const { isMobile } = useResponsive(); // Uses SSR-safe hook
   ```

3. **Inline Styles**

   ```javascript
   // ❌ NEVER
   <div style={{ color: 'red' }}>Text</div>

   // ✅ CORRECT
   <div className="text-red-500">Text</div>
   ```

4. **Missing Cleanup in Effects**

   ```javascript
   // ❌ NEVER
   useEffect(() => {
     fetchData();
   }, []);

   // ✅ CORRECT
   useEffect(() => {
     let isMounted = true;
     const fetchData = async () => {
       if (!isMounted) return;
       // fetch
     };
     fetchData();
     return () => {
       isMounted = false;
     };
   }, []);
   ```

5. **Wrong MongoDB Connection**

   ```javascript
   // ❌ NEVER
   import mongoose from "mongoose";
   mongoose.connect(process.env.MONGODB_URI);

   // ✅ CORRECT
   import clientPromise from "@/lib/mongodb";
   const client = await clientPromise;
   const db = client.db("church");
   ```

---

## Code Quality Requirements

### Automatic Checks

1. **After EVERY file edit:**
   - Codacy analysis runs automatically
   - Security vulnerabilities checked via Trivy
   - Must address issues before proceeding

2. **After dependency changes:**
   - Security audit runs automatically
   - Vulnerabilities must be resolved

### Manual Verification (AI Should Request)

1. **Run dev server** - Verify changes work
2. **Run tests** - Ensure no regressions
3. **Check responsive** - Test mobile and desktop
4. **Verify console** - No errors or warnings

---

## Development Workflow (For AI)

### Standard Change Flow

1. **Investigate** - Search for existing patterns
2. **Plan** - Explain approach based on findings
3. **Implement** - Apply changes following patterns
4. **Verify** - Run automated checks (Codacy)
5. **Test** - Request testing verification
6. **Explain** - Summarize changes in plain language

### Quality Checklist Before ANY Code

- [ ] Searched for similar implementations
- [ ] Verified correct file extension (.jsx vs .js)
- [ ] Confirmed import paths use @/ prefix
- [ ] Checked responsive design requirements
- [ ] Included error handling
- [ ] Used established styling patterns (Tailwind + cn())
- [ ] Added cleanup to useEffect hooks
- [ ] Followed component structure template

---

## Communication Guidelines

### Responding to Non-Technical User

**Always:**

- Explain in plain language what you're doing
- Reference existing features when adding new ones
- Show confidence based on codebase patterns
- Request testing after changes
- Summarize what changed and why

**Never:**

- Use phrases like "this might work" or "try this"
- Provide solutions without investigation
- Assume user understands technical jargon
- Skip testing verification
- Make guesses about patterns

---

## Quick Reference: Key Files

| Purpose            | File Path                           |
| ------------------ | ----------------------------------- |
| MongoDB Connection | `src/lib/mongodb.js`                |
| Styling Utility    | `src/lib/utils.js` (cn function)    |
| Responsive Hook    | `src/hooks/useResponsive.js`        |
| Global Styles      | `src/app/globals.css`               |
| API Routes         | `src/app/api/[endpoint]/route.js`   |
| Components         | `src/components/ui/[Component].jsx` |

---

## Testing Patterns

### Component Tests

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("handles clicks", () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole("button"));
    // Assertions
  });
});
```

### API Route Tests

```javascript
// Test API routes by calling them and verifying responses
const response = await fetch("/api/endpoint");
expect(response.ok).toBe(true);
const data = await response.json();
expect(data).toHaveProperty("expectedField");
```

---

## Environment & Configuration

### Environment Variables (.env.local)

```bash
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
```

### Key Config Files

- `next.config.mjs` - Next.js configuration
- `tailwind.config.mjs` - Tailwind customization
- `eslint.config.mjs` - Linting rules
- `jest.config.js` - Test configuration
- `.vscode/settings.json` - Editor settings
- `.vscode/tasks.json` - Automated tasks
- `.vscode/launch.json` - Debug configurations

---

## Background Agent Usage

### When to Launch Agents

**Perfect for agents:**

- "Find all uses of [pattern] across codebase"
- "Investigate how [feature] works"
- "Search for similar implementations"
- "Trace data flow through components"

**Not needed:**

- Simple file modifications
- Direct documentation questions
- Quick explanations

---

## Version History & Updates

**Current Version**: 2.3.0
**Last Updated**: January 17, 2026
**Next.js Version**: 16.0.7
**React Version**: 18+

---

## Additional Documentation

For more detailed information, reference:

- [ai-agent-best-practices.md](ai-agent-best-practices.md) - Behavioral rules
- [architecture-overview.md](architecture-overview.md) - System architecture
- [api-reference.md](api-reference.md) - API documentation
- [component-library.md](component-library.md) - Component catalog
- [database-schema.md](database-schema.md) - Database details
- [song-management-system.md](song-management-system.md) - Song features
- [liturgical-calendar-integration.md](liturgical-calendar-integration.md) - Calendar features

---

## Summary: Core Principles

1. **Investigation First** - Always search before coding
2. **Follow Patterns** - Match existing implementations
3. **Quality Matters** - Run checks, handle errors, test thoroughly
4. **Responsive Always** - Use useResponsive hook
5. **MongoDB Native** - Use clientPromise pattern
6. **Tailwind Styling** - Use cn() utility, never inline styles
7. **Clear Communication** - Explain to non-technical user
8. **Test Everything** - Request verification after changes

---

_This context file ensures AI assistants are well-informed and produce consistent, high-quality code for ZionSync._
