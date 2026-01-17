# ZionSync Environment & Deployment Guide

_Specific setup and troubleshooting for your church management system_

## Current Status

✅ Your system is already configured and running at `http://localhost:3000`

## What You Already Have

- `.env.local` file with working MongoDB connection
- Development server configured and running
- Database: MongoDB "church" database with collections for:
  - `users`, `worship_users`, `av_users` (team members)
  - `serviceDetails`, `signups`, `worship_assignments` (service coordination)
  - `songs`, `song_usage` (music library and analytics)
  - `completed` (service completion tracking)

## If Something Breaks

### "Can't connect to database" errors

1. Check if `.env.local` file still exists in the root folder
2. Make sure MongoDB service is running (if using local MongoDB)
3. If using MongoDB Atlas, check if your IP address changed

### "MONGODB_URI is not defined" error

Your `.env.local` file is missing or corrupted. It should contain:

```bash
MONGODB_URI=[your existing connection string]
```

_Note: PROJECT_NAME is configured directly in the Next.js configuration file._

### Website won't load

1. Open terminal/command prompt
2. Navigate to the ZionSync folder
3. Run: `npm run dev`
4. Open browser to `http://localhost:3000`

### After computer restart

The development server doesn't auto-start. Run `npm run dev` in the ZionSync folder.

## For Production Deployment (When Ready)

When you want to deploy this for actual church use instead of just development:

1. **Vercel** (Recommended - free for small churches)
   - Connect your project to Vercel
   - Add your `MONGODB_URI` to Vercel environment variables
   - Automatic deployment from changes

2. **Other hosting** (if you prefer)
   - Make sure to set `MONGODB_URI` environment variable
   - Run `npm run build` then `npm start`

## Database Backup

Your church data is important! Consider:

- MongoDB Atlas has automatic backups (if using cloud)
- For local MongoDB, export database regularly: `mongodump --db church`

## Performance Notes

- System handles multiple users simultaneously
- Mobile-optimized for team members using phones/tablets
- Works offline for viewing (but needs internet for updates)
