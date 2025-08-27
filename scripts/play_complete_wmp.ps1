# Windows Media Player COM object method
try {
    $audioFile = "C:\Users\Zrott\OneDrive\Desktop\Claude\complete.mp3"
    
    # Check if file exists
    if (-not (Test-Path $audioFile)) {
        Write-Host "Audio file not found: $audioFile"
        [console]::beep(800, 500)
        exit 1
    }
    
    # Create Windows Media Player COM object
    $wmplayer = New-Object -ComObject WMPlayer.OCX
    $wmplayer.settings.volume = 100
    $wmplayer.URL = $audioFile
    $wmplayer.controls.play()
    
    # Wait for playback to complete
    while ($wmplayer.playState -ne 1) {
        Start-Sleep -Milliseconds 100
    }
    
    Write-Host "Audio played successfully via WMP"
} catch {
    Write-Host "Error with WMP, trying .NET method..."
    
    # Fallback to .NET method
    try {
        Add-Type -AssemblyName System.Media
        $sound = New-Object System.Media.SoundPlayer
        $sound.SoundLocation = "C:\Users\Zrott\OneDrive\Desktop\Claude\complete.mp3"
        $sound.PlaySync()
        Write-Host "Audio played successfully via .NET"
    } catch {
        Write-Host "All methods failed, using system beep"
        [console]::beep(1000, 500)
    }
}