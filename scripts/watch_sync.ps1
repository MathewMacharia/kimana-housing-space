
# Git Sync Monitor for Kimana Housing Space
# This script checks for remote changes every 5 minutes.

Write-Host "--- Git Sync Monitor Started ---" -ForegroundColor Cyan
Write-Host "Monitoring 'origin/main' for changes..."

while ($true) {
    # Fetch latest status from GitHub
    & "C:\Program Files\Git\cmd\git.exe" fetch origin main | Out-Null
    
    # Check status compared to upstream
    $status = & "C:\Program Files\Git\cmd\git.exe" status -sb
    
    # Example output: "## main...origin/main [behind 2]"
    if ($status -like "*behind*") {
        Write-Host "`n******************************************" -ForegroundColor Yellow
        Write-Host "WARNING: PARTNER HAS PUSHED CHANGES!" -ForegroundColor Yellow -BackgroundColor Red
        Write-Host "Please run: git pull origin main" -ForegroundColor Yellow
        Write-Host "******************************************`n" -ForegroundColor Yellow
        
        # Optional: Play a system beep
        [System.Console]::Beep()
    }
    elseif ($status -like "*ahead*") {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] You have local changes not yet pushed." -ForegroundColor Cyan
    }
    else {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Up to date with partner." -ForegroundColor Gray
    }

    # Wait for 5 minutes (300 seconds)
    Start-Sleep -Seconds 300
}
