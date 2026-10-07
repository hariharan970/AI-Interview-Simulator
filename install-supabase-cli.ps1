# Install Supabase CLI for Windows
# Run this script as Administrator: Right-click PowerShell -> Run as Administrator

Write-Host "Installing Supabase CLI..." -ForegroundColor Green

# Create temp directory
$tempDir = "$env:TEMP\supabase-install"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Get latest version
Write-Host "Fetching latest Supabase CLI version..." -ForegroundColor Yellow
try {
    $latestRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/supabase/cli/releases/latest"
    $version = $latestRelease.tag_name -replace 'v', ''
    Write-Host "Latest version: $version" -ForegroundColor Green
} catch {
    Write-Host "Could not fetch latest version, using fallback..." -ForegroundColor Yellow
    $version = "1.200.0"
}

# Download Supabase CLI
$zipFile = "$tempDir\supabase.zip"
$downloadUrl = "https://github.com/supabase/cli/releases/download/v$version/supabase_${version}_windows_amd64.zip"

Write-Host "Downloading Supabase CLI from: $downloadUrl" -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Error downloading: $_" -ForegroundColor Red
    Write-Host "Please download manually from: https://github.com/supabase/cli/releases/latest" -ForegroundColor Yellow
    exit 1
}

# Extract
Write-Host "Extracting..." -ForegroundColor Yellow
Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force

# Find the executable
$exePath = Get-ChildItem -Path $tempDir -Filter "supabase.exe" -Recurse | Select-Object -First 1

if (-not $exePath) {
    Write-Host "Error: supabase.exe not found in archive" -ForegroundColor Red
    exit 1
}

# Install to a location in PATH
$installPath = "$env:ProgramFiles\Supabase"
New-Item -ItemType Directory -Force -Path $installPath | Out-Null

Copy-Item -Path $exePath.FullName -Destination "$installPath\supabase.exe" -Force

# Add to PATH if not already there
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$installPath*") {
    Write-Host "Adding Supabase to system PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installPath", "Machine")
    $env:Path += ";$installPath"
    Write-Host "Added to PATH. You may need to restart your terminal." -ForegroundColor Green
} else {
    Write-Host "Supabase is already in PATH." -ForegroundColor Green
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
$supabasePath = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabasePath) {
    Write-Host "✓ Supabase CLI installed successfully!" -ForegroundColor Green
    & supabase --version
} else {
    Write-Host "Installation complete, but 'supabase' command not found in current session." -ForegroundColor Yellow
    Write-Host "Please restart your terminal or run: `$env:Path += ';$installPath'" -ForegroundColor Yellow
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Restart your terminal (or run: `$env:Path += ';$installPath')" -ForegroundColor White
Write-Host "2. Run: supabase login" -ForegroundColor White
Write-Host "3. Run: supabase link --project-ref igyjbtkxvpasccrerovg" -ForegroundColor White
Write-Host "4. Run: supabase functions deploy mock-interview" -ForegroundColor White
$speechTextCmd = "supabase functions deploy speech-to-text"
Write-Host "5. Run: $speechTextCmd" -ForegroundColor White

