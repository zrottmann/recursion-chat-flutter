# PowerShell script to install Docker Desktop on Windows

Write-Host "Docker Desktop Installation Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Check Windows version
$winVersion = [System.Environment]::OSVersion.Version
if ($winVersion.Major -lt 10 -or ($winVersion.Major -eq 10 -and $winVersion.Build -lt 19041)) {
    Write-Host "Docker Desktop requires Windows 10 version 2004 or higher (Build 19041 or higher)" -ForegroundColor Red
    exit 1
}

# Enable required Windows features
Write-Host "Enabling required Windows features..." -ForegroundColor Yellow

# Enable WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Download and install WSL2 Linux kernel update
Write-Host "Downloading WSL2 Linux kernel update..." -ForegroundColor Yellow
$wslUpdateUrl = "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi"
$wslUpdatePath = "$env:TEMP\wsl_update_x64.msi"
Invoke-WebRequest -Uri $wslUpdateUrl -OutFile $wslUpdatePath
Start-Process msiexec.exe -Wait -ArgumentList "/i $wslUpdatePath /quiet"

# Set WSL 2 as default
wsl --set-default-version 2

# Download Docker Desktop
Write-Host "Downloading Docker Desktop..." -ForegroundColor Yellow
$dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"
Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller

# Install Docker Desktop
Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
Start-Process -Wait -FilePath $dockerInstaller -ArgumentList "install", "--quiet", "--accept-license"

Write-Host "Docker Desktop installation completed!" -ForegroundColor Green
Write-Host "Please restart your computer to complete the installation." -ForegroundColor Yellow
Write-Host ""
Write-Host "After restart:" -ForegroundColor Cyan
Write-Host "1. Start Docker Desktop from the Start Menu" -ForegroundColor White
Write-Host "2. Wait for Docker to initialize (icon in system tray will stop animating)" -ForegroundColor White
Write-Host "3. Run the deployment script: docker compose up -d" -ForegroundColor White