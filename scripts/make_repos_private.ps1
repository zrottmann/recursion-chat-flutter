Write-Host "GitHub Repository Privacy Manager" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if gh is available
$ghPath = ".\gh.exe"
if (-not (Test-Path $ghPath)) {
    $ghPath = "gh"
}

# Check authentication status
Write-Host "Checking authentication status..." -ForegroundColor Yellow
$authCheck = & $ghPath auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "You need to authenticate first!" -ForegroundColor Red
    Write-Host "Running: gh auth login" -ForegroundColor Yellow
    & $ghPath auth login
    Write-Host ""
}

# Get username
Write-Host "Getting authenticated user..." -ForegroundColor Yellow
$username = & $ghPath api user --jq .login
Write-Host "Authenticated as: $username" -ForegroundColor Green
Write-Host ""

# Get all repositories
Write-Host "Fetching all repositories..." -ForegroundColor Yellow
$repos = & $ghPath repo list $username --limit 1000 --json nameWithOwner,visibility,isPrivate --jq '.[]'
$repoList = $repos | ConvertFrom-Json

Write-Host "Found $($repoList.Count) repositories" -ForegroundColor Cyan
Write-Host ""

# Count public repos
$publicRepos = $repoList | Where-Object { $_.visibility -eq "public" }
$privateRepos = $repoList | Where-Object { $_.visibility -eq "private" }

Write-Host "Current status:" -ForegroundColor Yellow
Write-Host "  Public repositories: $($publicRepos.Count)" -ForegroundColor Red
Write-Host "  Private repositories: $($privateRepos.Count)" -ForegroundColor Green
Write-Host ""

if ($publicRepos.Count -eq 0) {
    Write-Host "All repositories are already private!" -ForegroundColor Green
    exit
}

# Ask for confirmation
Write-Host "The following PUBLIC repositories will be made PRIVATE:" -ForegroundColor Yellow
$publicRepos | ForEach-Object {
    Write-Host "  - $($_.nameWithOwner)" -ForegroundColor White
}
Write-Host ""

$confirmation = Read-Host "Are you sure you want to make all $($publicRepos.Count) public repositories private? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit
}

# Make repositories private
Write-Host ""
Write-Host "Making repositories private..." -ForegroundColor Yellow
$successCount = 0
$failCount = 0

foreach ($repo in $publicRepos) {
    Write-Host "  Processing: $($repo.nameWithOwner)..." -NoNewline
    try {
        & $ghPath repo edit $repo.nameWithOwner --visibility private 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [SUCCESS]" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " [FAILED]" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host " [ERROR]" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Operation Complete!" -ForegroundColor Cyan
Write-Host "  Successfully made private: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  Failed: $failCount" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")