# Enhanced audio playback script with better error handling
Add-Type -AssemblyName PresentationCore

try {
    $audioFile = "C:\Users\Zrott\OneDrive\Desktop\Claude\complete.mp3"
    
    # Check if file exists
    if (-not (Test-Path $audioFile)) {
        Write-Host "Audio file not found: $audioFile"
        exit 1
    }
    
    # Create MediaPlayer
    $player = New-Object System.Windows.Media.MediaPlayer
    $player.Open([Uri]"file:///$audioFile")
    
    # Wait for media to load
    Start-Sleep -Milliseconds 100
    
    # Set volume to maximum
    $player.Volume = 1.0
    
    # Play the audio
    $player.Play()
    
    # Keep script alive until audio finishes (estimate 2 seconds)
    Start-Sleep -Seconds 2
    
    # Clean up
    $player.Close()
    
    Write-Host "Audio played successfully"
} catch {
    Write-Host "Error playing audio: $_"
    
    # Fallback to system beep
    [console]::beep(1000, 500)
}