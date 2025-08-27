# Claude Code Auto-Approval PowerShell Script
# Automatically approves safe bash commands for faster development

param(
    [Parameter(Mandatory=$true)]
    [string]$Command
)

# Safe commands that should be auto-approved
$SafeCommands = @(
    'ls', 'dir', 'cat', 'head', 'tail', 'find', 'tree', 'pwd', 'cd',
    'mkdir', 'cp', 'copy', 'mv', 'move', 'rm', 'del', 'touch',
    'git', 'npm', 'node', 'python', 'py', 'flutter', 'dart',
    'doctl', 'appwrite', 'curl', 'wget', 'ping', 'echo',
    'start', 'explorer', 'code', 'where', 'which',
    'tasklist', 'taskkill', 'set', 'whoami', 'hostname'
)

# Dangerous patterns to never auto-approve
$DangerousPatterns = @(
    'rm -rf /',
    'del /f /s /q c:\',
    'format c:',
    'shutdown',
    'reboot',
    'sudo rm',
    'chmod 777',
    'dd if='
)

function Test-SafeCommand {
    param([string]$Cmd)
    
    $normalizedCmd = $Cmd.ToLower().Trim()
    
    # Check for dangerous patterns first
    foreach ($pattern in $DangerousPatterns) {
        if ($normalizedCmd.Contains($pattern.ToLower())) {
            Write-Host "DANGEROUS: $pattern detected" -ForegroundColor Red
            return $false
        }
    }
    
    # Check for safe command patterns
    foreach ($safeCmd in $SafeCommands) {
        if ($normalizedCmd.StartsWith($safeCmd.ToLower())) {
            Write-Host "SAFE: $safeCmd pattern matched" -ForegroundColor Green
            return $true
        }
    }
    
    # Check for safe directory operations
    $safeDirectories = @(
        'C:\Users\Zrott\OneDrive\Desktop\Claude',
        'active-projects',
        'trading-post',
        'recursion-chat'
    )
    
    foreach ($dir in $safeDirectories) {
        if ($Cmd.Contains($dir)) {
            Write-Host "SAFE: Operating in safe directory $dir" -ForegroundColor Green
            return $true
        }
    }
    
    return $false
}

# Log the decision
$logPath = Join-Path $PSScriptRoot "auto-approve.log"
$logEntry = @{
    timestamp = Get-Date -Format 'o'
    command = $Command
    approved = Test-SafeCommand $Command
} | ConvertTo-Json -Compress

Add-Content -Path $logPath -Value $logEntry

# Return result
if (Test-SafeCommand $Command) {
    Write-Host "AUTO-APPROVED: $Command" -ForegroundColor Green
    exit 0
} else {
    Write-Host "MANUAL APPROVAL REQUIRED: $Command" -ForegroundColor Yellow
    exit 1
}