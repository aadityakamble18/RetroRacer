# retroRacer - Custom Installer
Add-Type -AssemblyName System.Windows.Forms
$AppSource = Join-Path $PSScriptRoot "release\RetroRacer-win32-x64"
$IconPath = Join-Path $PSScriptRoot "build\icon.png"

# 1. Ask for Installation Location
$FolderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
$FolderBrowser.Description = "Select Installation Folder for retroRacer"
$FolderBrowser.SelectedPath = "C:\Games\retroRacer"

if ($FolderBrowser.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $DestPath = $FolderBrowser.SelectedPath
    Write-Host "Installing to: $DestPath" -ForegroundColor Cyan
}
else {
    Write-Host "Installation Cancelled." -ForegroundColor Red
    exit
}

# 2. Copy Files
if (!(Test-Path $DestPath)) { New-Item -ItemType Directory -Path $DestPath }
Write-Host "Copying files..." -ForegroundColor Cyan
Copy-Item -Path "$AppSource\*" -Destination $DestPath -Recurse -Force

# Copy Icon as well
$DestIconPath = Join-Path $DestPath "icon.png"
if (Test-Path $IconPath) {
    Copy-Item -Path $IconPath -Destination $DestIconPath -Force
}

# 3. Ask for Shortcuts
$ShortcutDecision = [System.Windows.Forms.MessageBox]::Show("Create Desktop and Start Menu Shortcuts?", "Setup", [System.Windows.Forms.MessageBoxButtons]::YesNo)

if ($ShortcutDecision -eq [System.Windows.Forms.DialogResult]::Yes) {
    Write-Host "Creating shortcuts..." -ForegroundColor Cyan
    
    $WshShell = New-Object -ComObject WScript.Shell
    $ExePath = Join-Path $DestPath "retroRacer.exe"
    
    # Desktop Shortcut
    $DesktopPath = [System.Environment]::GetFolderPath("Desktop")
    $Shortcut = $WshShell.CreateShortcut((Join-Path $DesktopPath "retroRacer.lnk"))
    $Shortcut.TargetPath = $ExePath
    $Shortcut.WorkingDirectory = $DestPath
    # Using the EXE itself as the icon source is most reliable on Windows
    $Shortcut.IconLocation = $ExePath
    $Shortcut.Save()
    
    # Start Menu Shortcut
    $StartMenuPath = [System.Environment]::GetFolderPath("StartMenu")
    $ShortcutDir = Join-Path $StartMenuPath "Programs\retroRacer"
    if (!(Test-Path $ShortcutDir)) { New-Item -ItemType Directory -Path $ShortcutDir }
    $Shortcut = $WshShell.CreateShortcut((Join-Path $ShortcutDir "retroRacer.lnk"))
    $Shortcut.TargetPath = $ExePath
    $Shortcut.WorkingDirectory = $DestPath
    $Shortcut.IconLocation = $ExePath
    $Shortcut.Save()
}

[System.Windows.Forms.MessageBox]::Show("Installation Complete! Enjoy retroRacer.", "Success")
Write-Host "Installation Complete!" -ForegroundColor Green
