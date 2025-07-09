# ZionSync Troubleshooting Guide

# ZionSync Troubleshooting Guide

## Overview
This guide provides solutions to common issues encountered when developing, running, or using ZionSync. Issues are organized by category for quick resolution.

## Development Issues

### MongoDB Connection Problems

**Problem**: Application fails to connect to MongoDB database
```
Error: MongoServerError: Authentication failed
```

**Investigation Steps**:
```powershell
# Check MongoDB connection string format
echo $env:MONGODB_URI

# Test MongoDB connection directly
mongosh "your-connection-string"

# Verify environment file exists
ls .env.local
```

**Common Solutions**:
- Verify MongoDB connection string in `.env.local`
- Ensure database user has proper permissions
- Check network connectivity to MongoDB instance
- Confirm database name matches expected "church" database

### Build/Compilation Errors

**Problem**: Next.js build fails with import/export errors
```
Error: Cannot use import statement outside a module
```

**Investigation Steps**:
```powershell
# Check package.json module configuration
Get-Content package.json | Select-String '"type"'

# Verify file extensions in imports
grep -r "import.*from.*\." src/
```

**Solutions**:
- Ensure `"type": "module"` is set in package.json
- Add `.js` extensions to local file imports
- Check for mixed CommonJS/ESM usage

### Component Rendering Issues

**Problem**: Components not displaying correctly or throwing React errors

**Investigation Steps**:
```powershell
# Check browser console for errors
# Verify component imports
grep -r "import.*from.*components" src/

# Check for missing dependencies
npm ls
```

**Solutions**:
- Verify all component imports use correct paths with `@/` alias
- Ensure all required props are passed to components
- Check for missing key props in mapped components
- Verify responsive design classes are properly applied

## Runtime Issues

### Service Data Not Loading

**Problem**: Services don't appear or show outdated information

**Investigation Steps**:
- Check browser network tab for failed API requests
- Verify database collections have expected data
- Test API endpoints directly: `GET /api/service-details`

**Solutions**:
- Clear browser cache and localStorage
- Verify date format matches expected M/D/YY pattern
- Check MongoDB collection names match schema documentation
- Ensure API routes are properly configured

### Song Management Problems

**Problem**: Songs not appearing in search or duplicates not detected

**Investigation Steps**:
- Test song search API: `GET /api/songs?search=term`
- Check song collection data structure
- Verify SongMatcher algorithm is functioning

**Solutions**:
- Rebuild song search index if needed
- Check string similarity thresholds in SongMatcher
- Verify song data has required fields (title, artist, etc.)
- Clear and repopulate reference songs collection

### Liturgical Calendar Issues

**Problem**: Wrong seasonal colors or themes displayed

**Investigation Steps**:
```powershell
# Test liturgical calculation for specific date
node -e "const service = require('./src/lib/LiturgicalCalendarService.js'); console.log(service.getCurrentSeason('6/29/25'));"
```

**Solutions**:
- Verify date format matches service expectations
- Check Easter calculation algorithm for current year
- Confirm seasonal date ranges in LiturgicalSeasons.js
- Test with known liturgical dates (Christmas, Easter, etc.)

## User Experience Issues

### Mobile Responsiveness Problems

**Problem**: Interface doesn't work properly on mobile devices

**Investigation Steps**:
- Test with Chrome DevTools device emulation
- Check useResponsive hook implementation
- Verify Tailwind responsive classes are applied

**Solutions**:
- Ensure mobile breakpoints use appropriate Tailwind classes
- Check touch event handling for mobile interactions
- Verify viewport meta tag is properly configured
- Test swipe gestures on actual mobile devices

### Performance Issues

**Problem**: Application loads slowly or feels unresponsive

**Investigation Steps**:
```powershell
# Check bundle size
npm run build
npm run analyze  # if bundle analyzer is configured

# Monitor performance
# Use browser performance tab during testing
```

**Solutions**:
- Implement code splitting for large components
- Optimize MongoDB queries with proper indexing
- Use React.memo for expensive components
- Implement proper loading states
- Consider lazy loading for non-critical components

## Team Workflow Issues

### Cross-Team Data Synchronization

**Problem**: Teams see inconsistent or outdated service information

**Solutions**:
- Implement proper data refresh mechanisms
- Check API caching strategies
- Verify real-time update mechanisms
- Ensure proper error handling for failed updates

### Permission/Access Issues

**Problem**: Team members can't access their designated sections

**Solutions**:
- Verify team assignment logic
- Check user role validation
- Ensure proper team-based data filtering
- Test with different user scenarios

## Emergency Procedures

### Critical Service Day Issues

**High Priority Steps**:
1. Check if core API endpoints respond: `/api/service-details`
2. Verify database connectivity
3. Test basic team workflows (add service, select songs, assign AV)
4. Have backup manual coordination plan ready

### Database Recovery

**If MongoDB data is corrupted**:
1. Stop the application
2. Restore from most recent backup
3. Verify data integrity with test queries
4. Restart application and test core workflows

## Getting Help

### Information to Gather Before Reporting Issues

1. **Environment Details**:
   - Node.js version: `node --version`
   - NPM version: `npm --version`
   - Browser and version
   - Operating system

2. **Error Information**:
   - Complete error messages
   - Browser console logs
   - Network request failures
   - Steps to reproduce the issue

3. **Context**:
   - Which team workflow was being used
   - Specific service date or data involved
   - Recent changes or updates made

### Debug Mode
Enable verbose logging by setting environment variable:
```powershell
$env:DEBUG = "zionsync:*"
npm run dev
```

This will provide detailed logging for troubleshooting complex issues.

## Important Rules

- Always use best coding practice.
- Make informed decisions.
- No solution code is provided until explicit approval from the user
- Investigation continues until reaching high confidence (90-95%)
- Each step builds on information gathered from previous steps
- All analysis and reasoning is made transparent to the user

## Notes on Command Output

- For large projects, directory listing commands may produce outputs too large for chat windows
- Use more specific search queries or file pattern matching instead
- Consider using VS Code's search functionality (Ctrl+Shift+F) for targeted file content searches
- Break down large investigations into smaller, focused queries