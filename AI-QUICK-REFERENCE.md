# 🚀 ZionSync AI Quick Reference

**Your Fast Guide to AI-Assisted Development**

---

## 📋 Common Request Templates

### Adding Features

```plaintext
✅ Good: "Add a button to export services to PDF, similar to the export
         feature on the worship dashboard"

❌ Bad:  "Add an export button"
```

### Fixing Bugs

```plaintext
✅ Good: "The calendar shows wrong dates on mobile. It worked yesterday
         and only breaks on screens smaller than 768px."

❌ Bad:  "Fix the calendar"
```

### Understanding Code

```plaintext
✅ Good: "How does the song suggestion system work? Show me the files
         involved and explain the matching algorithm."

❌ Bad:  "Explain the code"
```

---

## 🎯 VS Code Quick Actions

### Run Development Server

**Menu**: Terminal → Run Task → 🚀 Start Development Server
**Keyboard**: `Ctrl+Shift+B` (build menu) → select dev server
**URL**: http://localhost:3000

### Run Tests

**Menu**: Terminal → Run Task → 🧪 Run All Tests
**Keyboard**: `Ctrl+Shift+T` → select test task

### Format & Lint Code

**Menu**: Terminal → Run Task → 🔧 Lint & Fix
**Auto**: Saves automatically format (enabled in settings)

### Full Quality Check

**Menu**: Terminal → Run Task → ✅ Full Quality Check
**Does**: Lint → Format → Test (recommended before commits)

### Create Backup

**Menu**: Terminal → Run Task → 💾 Create Backup
**Does**: Runs backup-repo.ps1 script

---

## 🤖 Requesting AI Help

### Investigation Requests (Triggers Background Agents)

```plaintext
"Search the entire codebase for how we handle date formatting"
"Find all places where we fetch service data"
"Investigate how the calendar syncs with MongoDB"
"Show me all components that use the useResponsive hook"
```

### Implementation Requests

```plaintext
"Add [specific feature] using the same pattern as [existing feature]"
"Update the [component] to include [functionality]"
"Fix [specific bug] - here's the error message: [error]"
```

### Understanding Requests

```plaintext
"Explain how [feature] works in plain language"
"What files are involved in [functionality]?"
"Why is [component] structured this way?"
```

---

## ✅ After-Change Checklist

When AI makes changes, always request:

1. **Run the dev server** - "Please start the dev server to verify"
2. **Check for errors** - "Any console errors?"
3. **Test the feature** - "Does [feature] work as expected?"
4. **Verify responsive** - "Check mobile and desktop views"

---

## 🔍 Quality Assurance

### Automatic Checks (AI Does These)

- ✅ Codacy analysis after every edit
- ✅ Security scanning after dependency changes
- ✅ Format on save (VS Code)
- ✅ ESLint on save (VS Code)

### Manual Verification (You Approve)

- Test in browser
- Check mobile responsiveness
- Verify no console errors
- Confirm feature works as expected

---

## 📁 Key File Locations

| What You Need   | Where It Is                       |
| --------------- | --------------------------------- |
| Components      | `src/components/ui/[Name].jsx`    |
| API Routes      | `src/app/api/[endpoint]/route.js` |
| Styles          | `src/app/globals.css`             |
| Utils           | `src/lib/utils.js`                |
| Hooks           | `src/hooks/[hookName].js`         |
| Database Config | `src/lib/mongodb.js`              |
| AI Instructions | `.github/instructions/`           |
| Documentation   | `GuidingDocs/`                    |

---

## 🎨 Common Patterns You'll See

### Adding a Button

```javascript
import { Button } from "@/components/ui/Button";

<Button onClick={handleClick} className="your-tailwind-classes">
  Click Me
</Button>;
```

### Making API Calls

```javascript
const response = await fetch("/api/your-endpoint");
const data = await response.json();
```

### Responsive Design

```javascript
import useResponsive from "@/hooks/useResponsive";

const { isMobile } = useResponsive();

return <div>{isMobile ? <MobileView /> : <DesktopView />}</div>;
```

---

## 🚨 Common Issues & Solutions

### Issue: Dev server won't start

**Solution**: "Please clean and reinstall dependencies"
**Task**: Terminal → Run Task → 🔄 Clean & Reinstall Dependencies

### Issue: Changes not showing up

**Solution**:

1. Hard refresh browser (`Ctrl+Shift+R`)
2. Restart dev server
3. Clear `.next` folder

### Issue: Tests failing

**Solution**: "Run tests and show me the error messages"
**Then**: Let AI fix based on error output

### Issue: Code looks messy

**Solution**: "Format the code"
**Task**: Terminal → Run Task → 💅 Format Code

---

## 💡 Pro Tips

### 1. Reference Existing Features

Instead of: "Add a filter"
Say: "Add a filter like the one on the song library page"

### 2. Provide Context

Instead of: "It's broken"
Say: "The calendar shows wrong dates for December 2025. Error in console: [paste error]"

### 3. Test Before Committing

Always request: "Run the full quality check before I commit"

### 4. Create Backups Before Big Changes

Request: "Create a backup before we start this feature"

### 5. Ask for Explanations

Don't be shy: "Explain what you just changed in simple terms"

---

## 🔧 Development Workflow

### Starting a New Feature

1. **Backup**: "Create a backup"
2. **Plan**: "I want to add [feature]. Find similar implementations."
3. **Review Plan**: AI shows existing patterns
4. **Approve**: "Yes, proceed with that approach"
5. **Implement**: AI makes changes
6. **Verify**: "Run the dev server and test"
7. **Quality Check**: "Run full quality check"
8. **Commit**: Commit with clear message

### Fixing a Bug

1. **Describe**: "Here's the bug: [description]"
2. **Investigate**: AI searches for root cause
3. **Solution**: AI proposes fix based on findings
4. **Apply**: AI implements fix
5. **Test**: "Test this fix thoroughly"
6. **Verify**: Confirm bug is gone

---

## 📚 Documentation Quick Links

| Document                                                                                     | Purpose                         |
| -------------------------------------------------------------------------------------------- | ------------------------------- |
| [ai-agent-best-practices.md](GuidingDocs/ai-agent-best-practices.md)                         | How AI should behave            |
| [ai-background-agents-workflow-guide.md](GuidingDocs/ai-background-agents-workflow-guide.md) | Understanding background agents |
| [architecture-overview.md](GuidingDocs/architecture-overview.md)                             | How ZionSync is built           |
| [api-reference.md](GuidingDocs/api-reference.md)                                             | API documentation               |
| [component-library.md](GuidingDocs/component-library.md)                                     | Available components            |
| [zionsync-ai-context.md](.github/instructions/zionsync-ai-context.md)                        | Master AI context file          |

---

## 🎯 Quick Commands (Copy & Paste)

### Start Working

```
"Create a backup and start the dev server"
```

### Before Making Changes

```
"Search for similar implementations of [feature] in the codebase"
```

### After Changes

```
"Run the dev server, check for errors, and verify the changes work"
```

### Before Committing

```
"Run the full quality check including lint, format, and tests"
```

### Explain What Happened

```
"Summarize what you changed in plain language"
```

---

## 🌟 Best Practices Reminders

### ✅ DO

- Be specific about what you want
- Reference existing features
- Request testing after changes
- Ask for explanations
- Create backups before big changes
- Commit working code frequently

### ❌ DON'T

- Use vague requests
- Skip testing
- Ignore warnings or errors
- Proceed without understanding
- Make multiple big changes at once
- Forget to backup

---

## 🆘 Getting Help

### When Stuck

```plaintext
"I'm trying to [goal]. I've tried [what you tried].
The error says [error message]. Please investigate and propose a solution."
```

### When Confused

```plaintext
"I don't understand [concept]. Explain it like I'm not a programmer."
```

### When Something Breaks

```plaintext
"[Feature] broke after [recent change]. Here's the error: [error].
Please investigate what went wrong and fix it."
```

---

## 🎓 Learning as You Go

### Understand Changes

Always ask: "Explain what this code does"

### See Patterns

Request: "Show me other places in the codebase that do something similar"

### Build Knowledge

Keep notes: When you learn a pattern, write it down for reference

---

## 🚀 Keyboard Shortcuts (VS Code)

| Action           | Shortcut       |
| ---------------- | -------------- |
| Command Palette  | `Ctrl+Shift+P` |
| Quick Open       | `Ctrl+P`       |
| Terminal         | `Ctrl+` \`     |
| Run Task         | `Ctrl+Shift+B` |
| Search Files     | `Ctrl+Shift+F` |
| Go to Definition | `F12`          |
| Format Document  | `Shift+Alt+F`  |

---

## 📝 Request Templates

### Feature Addition

```
I want to add [feature description].

It should work like [existing similar feature].

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Please search for similar implementations first, then implement following
established patterns.
```

### Bug Fix

```
Bug: [What's broken]
Location: [Where it happens]
Steps to reproduce:
1. [Step 1]
2. [Step 2]
3. [Bug occurs]

Expected: [What should happen]
Actual: [What actually happens]
Error message: [If any]

Please investigate and fix.
```

### Code Improvement

```
The [component/feature] works but could be better.

Issues:
- [Issue 1]
- [Issue 2]

Goal: [What you want to achieve]

Please investigate the current implementation and suggest improvements
following best practices.
```

---

## ✨ Remember

**You don't need to understand the code to build great software.**

Your job is to:

1. Know what you want
2. Communicate clearly
3. Test thoroughly
4. Trust but verify

The AI's job is to:

1. Investigate patterns
2. Write quality code
3. Follow best practices
4. Explain clearly

Together, you build reliably! 🎉

---

**Last Updated**: January 17, 2026
**For**: ZionSync v2.3.0
**AI**: Claude Sonnet 4.5
