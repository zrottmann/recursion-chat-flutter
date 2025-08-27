Add-Type -AssemblyName PresentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([Uri]"file:///C:/Users/Zrott/OneDrive/Desktop/Claude/complete.mp3")
$player.Play()
Start-Sleep -Seconds 2