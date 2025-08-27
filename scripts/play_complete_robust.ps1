# Robust audio playback with multiple methods
$audioFile = "C:\Users\Zrott\OneDrive\Desktop\Claude\complete.mp3"

# Check if file exists
if (-not (Test-Path $audioFile)) {
    Write-Host "Error: Audio file not found at $audioFile"
    [console]::beep(500, 500)
    exit 1
}

$played = $false

# Method 1: Try Windows Media Player ActiveX
if (-not $played) {
    try {
        $wmplayer = New-Object -ComObject WMPlayer.OCX
        $wmplayer.settings.volume = 100
        $wmplayer.settings.autoStart = $true
        $wmplayer.URL = $audioFile
        Start-Sleep -Seconds 2
        $played = $true
        Write-Host "Played via WMPlayer.OCX"
    } catch {
        Write-Host "WMPlayer.OCX failed: $_"
    }
}

# Method 2: Try .NET SoundPlayer (works with WAV files, might work with MP3)
if (-not $played) {
    try {
        Add-Type -AssemblyName System.Media
        $sound = New-Object System.Media.SoundPlayer($audioFile)
        $sound.PlaySync()
        $played = $true
        Write-Host "Played via System.Media.SoundPlayer"
    } catch {
        Write-Host "SoundPlayer failed: $_"
    }
}

# Method 3: Try PresentationCore MediaPlayer
if (-not $played) {
    try {
        Add-Type -AssemblyName PresentationCore
        $mediaPlayer = New-Object System.Windows.Media.MediaPlayer
        $mediaPlayer.Open([Uri]"file:///$audioFile")
        Start-Sleep -Milliseconds 200  # Wait for media to load
        $mediaPlayer.Volume = 1.0
        $mediaPlayer.Play()
        Start-Sleep -Seconds 2  # Wait for playback
        $mediaPlayer.Close()
        $played = $true
        Write-Host "Played via PresentationCore.MediaPlayer"
    } catch {
        Write-Host "MediaPlayer failed: $_"
    }
}

# Method 4: Open with default application (silent)
if (-not $played) {
    try {
        Start-Process $audioFile -WindowStyle Hidden
        $played = $true
        Write-Host "Opened with default application"
    } catch {
        Write-Host "Default application failed: $_"
    }
}

# Method 5: Fallback to system beep
if (-not $played) {
    Write-Host "All audio methods failed, using system beep"
    [console]::beep(1000, 300)
    [console]::beep(1200, 300)
    [console]::beep(1000, 300)
}