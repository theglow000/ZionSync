# AI Agent Best Practices Guide for ZionSync Development

## Overview

This guide establishes behavioral rules and protocols for AI Agent assistance in ZionSync development. It focuses on preventing common AI errors, ensuring efficient investigation workflows, and maintaining code quality consistency. This is a living document that evolves with the project.

## Core AI Agent Behavioral Rules

### Rule 1: Investigation-First Protocol (MANDATORY)

**NEVER provide code solutions without thorough investigation first.**

**Investigation Sequence:**

1. **Understand the request** - What is the user actually trying to achieve?
2. **Search for existing patterns** - Use semantic_search to find similar implementations
3. **Examine related files** - Use file_search and read_file to understand context
4. **Identify dependencies** - Use list_code_usages to understand component relationships
5. **Check for existing utilities** - Use grep_search to find reusable functions

**Evidence Required Before Coding:**

- [ ] Located similar existing implementations in the codebase
- [ ] Identified the correct file structure and naming patterns
- [ ] Found relevant imports and dependencies
- [ ] Understood the data flow and state management patterns
- [ ] Verified responsive design requirements

### Rule 2: Never Guess, Always Verify

**Eliminate uncertainty by investigation, not assumption.**

**Forbidden Phrases in Solution Responses:**

- "This might work..."
- "You could try..."
- "This should probably..."
- "I think this would..."
- "Maybe you could..."

**Required Confidence Indicators:**

- "Based on the existing [Component/Pattern] implementation..."
- "Following the established pattern in [specific file]..."
- "Using the same approach as [existing feature]..."
- "This matches the convention used throughout the codebase..."

### Rule 3: Code Quality Enforcement

**Maintain ZionSync's established patterns and standards.**

**Before Providing Any Code:**

- [ ] Verified the correct file extension (.jsx, .js)
- [ ] Confirmed import path conventions (@ for src/, extensionless imports)
- [ ] Checked responsive design requirements (useResponsive hook usage)
- [ ] Identified error handling patterns in similar components
- [ ] Confirmed state management patterns (hooks, cleanup, etc.)
- [ ] Verified styling approach (Tailwind classes, not inline styles)

### Rule 4: Efficient File Handling

**Use appropriate tools for code application.**

**Always Include Filepath Comments:**

```javascript
// filepath: c:\Users\thegl\Desktop\Tech Projects\zionsync\src\components\ui\MyComponent.jsx
```

**File Modification Guidelines:**

- Use `insert_edit_into_file` for adding new code sections
- Use `replace_string_in_file` for modifying existing code
- Never output complete files > 300 lines
- Always show targeted changes with context
- Use "...existing code..." comments for unchanged sections

### Rule 5: Context Preservation

**Maintain awareness of the broader application context.**

**Always Consider:**

- How does this change affect other teams (Presentation/Worship/AV)?
- What is the impact on mobile vs desktop experience?
- Does this follow the established service data structure?
- Are there liturgical calendar implications?
- How does this affect the database schema?

## ZionSync-Specific AI Constraints

### Technology Stack Awareness

- **Framework**: Next.js 15 with App Router (not Pages Router)
- **Styling**: Tailwind CSS (never suggest inline styles)
- **Database**: MongoDB with native driver (not Mongoose)
- **State**: React hooks only (no class components, no external state management)
- **Icons**: Lucide React + React Icons (check existing usage)
- **Testing**: Jest + React Testing Library

### Component Architecture Rules

```javascript
// ✅ ALWAYS enforce this pattern
'use client'; // For interactive components

import React, { useState, useEffect, useCallback } from 'react';
import { ComponentName } from '@/components/ui/component';
import useResponsive from '@/hooks/useResponsive';

const MyComponent = ({ requiredProps }) => {
  const { isMobile } = useResponsive();
  // Component logic
  return (/* JSX */);
};

export default MyComponent;
```

### Database Operation Rules

```javascript
// ✅ ALWAYS use this MongoDB pattern
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    // Database operations
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/endpoint:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## Error Prevention Strategies

### Common AI Mistakes to Avoid

#### 1. Wrong Import Patterns

```javascript
// ❌ NEVER suggest these patterns
const component = require("./Component"); // Wrong module system
import { utils } from "src/lib/utils"; // Wrong path (use @/)

// ✅ ALWAYS use these patterns
import Component from "./Component";
import { utils } from "@/lib/utils";
```

#### 2. Incorrect Responsive Handling

```javascript
// ❌ NEVER suggest manual breakpoint checks
const isMobile = window.innerWidth < 768;
const isMobile = useMediaQuery("(max-width: 767px)"); // Direct usage

// ✅ ALWAYS use the established hook
const { isMobile } = useResponsive();
```

#### 3. Poor State Management

```javascript
// ❌ NEVER suggest these patterns
class MyComponent extends React.Component // No class components
useEffect(() => { fetchData(); }); // Missing cleanup

// ✅ ALWAYS include proper cleanup
useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    if (!isMounted) return;
    // fetch logic
  };

  fetchData();
  return () => { isMounted = false; };
}, []);
```

#### 4. Missing Error Handling

```javascript
// ❌ NEVER suggest code without error handling
const response = await fetch("/api/data");
const data = await response.json();

// ✅ ALWAYS include comprehensive error handling
try {
  const response = await fetch("/api/data");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
} catch (error) {
  console.error("API Error:", error);
  setError(error.message);
}
```

### Investigation Failure Recovery

If initial investigation doesn't provide enough context:

1. **Broaden the search** - Use different search terms
2. **Check related components** - Look at similar team components
3. **Examine parent/child relationships** - Use list_code_usages
4. **Review API endpoints** - Check related backend implementations
5. **Ask for clarification** - Rather than guess, ask specific questions

## Quality Assurance Protocols

### Pre-Code-Solution Checklist

Before providing any code solution, verify:

- [ ] **Investigation Complete**: Found and analyzed relevant existing code
- [ ] **Pattern Identified**: Located the established pattern to follow
- [ ] **Imports Correct**: Verified import paths and extensions
- [ ] **Responsive Design**: Confirmed mobile/desktop approach
- [ ] **Error Handling**: Identified error handling pattern to use
- [ ] **File Path**: Correct filepath comment for code application
- [ ] **Testing Impact**: Considered if tests need updates

### Code Quality Verification

For every code suggestion:

- [ ] **Follows ZionSync patterns**: Matches existing component structure
- [ ] **Proper cleanup**: useEffect includes cleanup functions
- [ ] **Type safety**: Props and state are properly typed (JSDoc if needed)
- [ ] **Performance**: Uses useCallback/useMemo appropriately
- [ ] **Accessibility**: Includes proper ARIA attributes if needed
- [ ] **Mobile-first**: Responsive design considered

### Response Quality Standards

#### Investigation Phase Response

```
I need to investigate how [similar feature] is implemented in ZionSync before providing a solution. Let me examine:

[List specific files/patterns being investigated]

[Results of investigation with specific file references]

Based on this analysis, here's the solution following the established pattern...
```

#### Code Solution Response

```
Based on the [existing pattern/component] implementation, here's the solution:

[Targeted code with proper filepath comments]

This follows the same pattern as [specific reference] and includes [specific quality features like error handling, responsive design, etc.].
```

## AI Agent Workflow Protocol

### Standard Operating Procedure

1. **Intake Phase**
   - Parse user request for actual intent
   - Identify scope and affected components
   - Determine investigation requirements

2. **Investigation Phase** (MANDATORY)
   - Execute tool-based investigation
   - Document findings with specific file references
   - Identify applicable patterns and conventions

3. **Solution Design Phase**
   - Plan solution based on existing patterns
   - Consider cross-component impacts
   - Design error handling and edge cases

4. **Implementation Phase**
   - Provide targeted code changes
   - Include proper filepath comments
   - Follow established quality patterns

5. **Validation Phase**
   - Verify solution follows ZionSync conventions
   - Check for common AI mistakes
   - Confirm completeness of solution

### Emergency Protocols

**If Investigation Fails:**

- Admit uncertainty rather than guess
- Ask specific clarifying questions
- Request additional context or examples

**If Pattern Unclear:**

- Search for alternative implementations
- Look at parent/child component relationships
- Ask user to show preferred existing pattern

**If Multiple Patterns Exist:**

- Default to the most recently used pattern
- Ask user which pattern to follow
- Document the choice for future consistency

## Performance and Efficiency Rules

### Tool Usage Optimization

- Use `semantic_search` for broad concept understanding
- Use `file_search` for specific file location
- Use `grep_search` for pattern matching within files
- Use `read_file` for detailed implementation analysis
- Use `list_code_usages` for dependency understanding

### Response Efficiency

- Combine investigation results into single comprehensive response
- Provide targeted solutions, not full file rewrites
- Include rationale for chosen approach
- Reference specific existing implementations

## Version Control and Updates

### When to Update This Guide

- New common AI mistakes identified
- ZionSync patterns evolve
- New tools or capabilities added
- User feedback on AI assistance quality

### Update Process

1. Document the issue or improvement
2. Add specific rules or examples
3. Update quality checklists
4. Version the change

---

**Version**: 1.1  
**Last Updated**: June 2025  
**Next Review**: As patterns evolve or issues arise

This guide ensures consistent, high-quality AI assistance that respects ZionSync's architecture and prevents common development errors.
