# 🚀 Quick Push to Git Main - PowerShell Script
# Usage: .\push.ps1 "commit message"
# Example: .\push.ps1 "feat: add new feature"

param(
    [string]$Message = ""
)

# Set location to script directory
Set-Location $PSScriptRoot

# Check if Node.js is available
try {
    $null = Get-Command node -ErrorAction Stop
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js to use this command." -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

# Run the Node.js script with the message
if ($Message) {
    node push-to-main.js $Message
} else {
    node push-to-main.js
}

Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
Read-Host