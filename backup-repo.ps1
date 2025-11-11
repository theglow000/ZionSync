# Daily ZionSync Backup Script
# Run this manually or schedule it in Task Scheduler

$repoPath = "C:\Users\thegl\Desktop\Tech Projects\zionsync"
$backupPath = "C:\Users\thegl\Desktop\Tech Projects\zionsync-backups"
$date = Get-Date -Format "yyyy-MM-dd-HHmm"

# Create backup directory if it doesn't exist
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath
    Write-Host "✅ Created backup directory: $backupPath" -ForegroundColor Green
}

# Change to repo directory
Set-Location $repoPath

Write-Host "🔄 Starting ZionSync backup..." -ForegroundColor Cyan

# 1. Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $status
    $response = Read-Host "Stash them before backup? (y/n)"
    if ($response -eq 'y') {
        git stash push -m "Auto-backup stash $date"
        Write-Host "✅ Changes stashed" -ForegroundColor Green
    }
}

# 2. Create a git bundle (complete backup)
$bundlePath = "$backupPath\zionsync-$date.bundle"
git bundle create $bundlePath --all

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git bundle created: $bundlePath" -ForegroundColor Green
    
    # Get bundle size
    $size = (Get-Item $bundlePath).Length / 1MB
    Write-Host "   Size: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to create git bundle" -ForegroundColor Red
    exit 1
}

# 3. Create a backup branch on GitHub
$backupBranch = "backup/auto-$date"
git push origin main:$backupBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup branch created on GitHub: $backupBranch" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to push backup branch (not critical)" -ForegroundColor Yellow
}

# 4. Clean up old backups (keep last 30 days)
$oldBackups = Get-ChildItem $backupPath -Filter "*.bundle" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }

if ($oldBackups) {
    Write-Host "🗑️  Cleaning up old backups..." -ForegroundColor Yellow
    $oldBackups | ForEach-Object {
        Remove-Item $_.FullName
        Write-Host "   Deleted: $($_.Name)" -ForegroundColor Gray
    }
}

# 5. Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ BACKUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Backup location: $bundlePath"
Write-Host "GitHub branch:   $backupBranch"
Write-Host ""
Write-Host "To restore from this backup:" -ForegroundColor Yellow
Write-Host "  git clone $bundlePath zionsync-restored"
Write-Host "  # OR"
Write-Host "  git fetch origin $backupBranch"
Write-Host "  git checkout $backupBranch"
Write-Host ""

# Optional: Schedule this script
Write-Host "💡 TIP: Schedule this script to run daily in Task Scheduler" -ForegroundColor Cyan
Write-Host "   1. Open Task Scheduler"
Write-Host "   2. Create Basic Task"
Write-Host "   3. Set trigger: Daily at midnight"
Write-Host "   4. Action: powershell.exe -File '$PSCommandPath'"
Write-Host ""
