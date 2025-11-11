# Git Safety & Recovery Guide

## 🛡️ Protection Strategies

### 1. **Never Force Push Without Safety**
Always use `--force-with-lease` instead of `--force`:
```bash
# ❌ DANGEROUS - Can lose work
git push --force

# ✅ SAFE - Aborts if remote changed
git push --force-with-lease
```

### 2. **Create Backup Branches Before Risky Operations**
```bash
# Before any merge, rebase, or force push:
git branch backup-$(date +%Y%m%d-%H%M%S)

# Or simpler:
git branch backup-before-merge
```

### 3. **Use Git Reflog to Recovery Lost Work**
Git keeps a 90-day history of all HEAD movements:
```bash
# View recent changes
git reflog

# Find lost commits
git fsck --lost-found

# Recover from a specific point
git checkout <commit-hash>
git branch recovered-work
```

### 4. **Enable Git Autosave (Stash)**
Before pulling or merging:
```bash
# Save uncommitted work automatically
git stash push -m "WIP: $(date)"

# List all stashes
git stash list

# Recover when needed
git stash pop
```

---

## 🔄 Daily Workflow Safety Checklist

### Before Starting Work:
- [ ] `git status` - Check you're on the right branch
- [ ] `git pull origin main` - Get latest changes
- [ ] Create a feature branch if making big changes

### During Work:
- [ ] Commit frequently (every 30 minutes to 1 hour)
- [ ] Write descriptive commit messages
- [ ] Push to GitHub regularly (don't let work sit locally for days)

### Before Merging/Pushing:
- [ ] `git status` - Verify what's changed
- [ ] `git log --oneline -5` - Review recent commits
- [ ] Create backup branch if unsure
- [ ] Test locally before pushing

---

## 🚨 Emergency Recovery Commands

### If You Accidentally Delete/Lose Work:

```bash
# 1. DON'T PANIC - Git rarely loses data permanently

# 2. Check reflog immediately
git reflog --all -20

# 3. Look for dangling commits
git fsck --lost-found

# 4. Find your lost commit
git log --all --oneline --graph | grep "your-commit-message"

# 5. Create recovery branch from found commit
git checkout -b recovery-branch <commit-hash>

# 6. Merge back to main
git checkout main
git merge recovery-branch
```

### If Merge Goes Wrong:
```bash
# Abort the merge
git merge --abort

# Or reset to before merge
git reset --hard HEAD~1

# Or reset to specific commit
git reset --hard <commit-hash>
```

---

## 📦 External Backup Strategy

### Option 1: GitHub Branch Protection
1. Go to GitHub repo Settings → Branches
2. Add branch protection rule for `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Include administrators (protects you from yourself!)

### Option 2: Automatic Daily Backups
Create a scheduled task to backup your work daily:

**Windows (PowerShell):**
```powershell
# backup-repo.ps1
$date = Get-Date -Format "yyyy-MM-dd"
cd "C:\Users\thegl\Desktop\Tech Projects\zionsync"
git bundle create "../backups/zionsync-$date.bundle" --all
```

Schedule this in Windows Task Scheduler to run daily.

### Option 3: Remote Backup Branch
```bash
# Push to a backup branch regularly
git push origin main:backup/main-$(date +%Y%m%d)

# This creates dated snapshots you can always recover from
```

---

## 🎯 Quick Reference

### Safe Push Commands:
```bash
# Standard push (safe)
git push origin main

# Force push (ONLY with lease)
git push origin main --force-with-lease

# Push with tags
git push origin main --follow-tags
```

### Safe Pull Commands:
```bash
# Standard pull
git pull origin main

# Pull with rebase (cleaner history)
git pull --rebase origin main

# Fetch without merging (safest)
git fetch origin
git log origin/main..main  # Review differences
git merge origin/main      # Merge when ready
```

### Recovery Commands:
```bash
# Find lost commits
git reflog
git fsck --lost-found

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo last push (DANGEROUS)
git reset --hard HEAD~1
git push --force-with-lease origin main
```

---

## 📝 What Caused Your Issue

Based on your recovery, here's what likely happened:

1. You had completed work in commit `6184069`
2. During a merge/rebase operation, this commit became "dangling" (disconnected from main branch)
3. The remote was force-pushed, overwriting your local work
4. Your completed work existed in Git's object database but wasn't attached to any branch

**Prevention:** Always create a backup branch before risky Git operations!

---

## ✅ Recommended Setup

1. **Install Git GUI Tool:**
   - GitKraken (free for personal use)
   - GitHub Desktop (simpler, free)
   - Sourcetree (free)
   
   These provide visual safeguards against dangerous operations.

2. **Set Up Git Aliases:**
```bash
# Add to ~/.gitconfig or run these commands:
git config --global alias.safe-push 'push --force-with-lease'
git config --global alias.backup 'branch backup-$(date +%Y%m%d-%H%M%S)'
git config --global alias.undo 'reset --soft HEAD~1'
git config --global alias.recovery 'reflog --all -20'
```

3. **Enable Git Auto-Backup in VS Code:**
   - Install "Git History" extension
   - Install "Local History" extension (auto-saves file versions)

---

## 🆘 When Things Go Wrong - Contact Points

1. **Git Reflog** - First line of defense (90 days of history)
2. **Dangling Commits** - Use `git fsck --lost-found`
3. **GitHub Support** - Can sometimes recover recently deleted branches
4. **This Guide** - Keep it handy!

---

## 🎓 Learn More

- [Git Reflog Documentation](https://git-scm.com/docs/git-reflog)
- [Oh Shit, Git!?!](https://ohshitgit.com/) - Friendly recovery guide
- [Git Flight Rules](https://github.com/k88hudson/git-flight-rules) - Emergency procedures

---

**Remember:** Git is designed to protect your work. It's very hard to permanently lose committed data. When in doubt, create a backup branch first!
