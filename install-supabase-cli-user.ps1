# Install Supabase CLI for Windows (User Installation - No Admin Required)
# This installs to your user directory instead of system-wide

Write-Host "Installing Supabase CLI (User Installation)..." -ForegroundColor Green

# Create local bin directory
$userBinPath = "$env:USERPROFILE\bin"
$supabasePath = "$userBinPath\supabase.exe"

New-Item -ItemType Directory -Force -Path $userBinPath | Out-Null

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

Write-Host "Downloading Supabase CLI..." -ForegroundColor Yellow
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

# Copy to user bin directory
Copy-Item -Path $exePath.FullName -Destination $supabasePath -Force
Write-Host "Installed to: $supabasePath" -ForegroundColor Green

# Add to user PATH if not already there
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$userBinPath*") {
    Write-Host "Adding to user PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$userBinPath", "User")
    $env:Path += ";$userBinPath"
    Write-Host "Added to PATH. You may need to restart your terminal." -ForegroundColor Green
} else {
    Write-Host "Already in PATH." -ForegroundColor Green
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCmd) {
    Write-Host "✓ Supabase CLI installed successfully!" -ForegroundColor Green
    & supabase --version
} else {
    Write-Host "Installation complete!" -ForegroundColor Green
    Write-Host "Location: $supabasePath" -ForegroundColor Cyan
    Write-Host "`nPlease restart your terminal, or run:" -ForegroundColor Yellow
    Write-Host "`$env:Path += ';$userBinPath'" -ForegroundColor White
    Write-Host "Then verify with: supabase --version" -ForegroundColor White
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Restart your terminal (or add to PATH manually)" -ForegroundColor White
Write-Host "2. Run: supabase login" -ForegroundColor White
Write-Host "3. Run: supabase link --project-ref igyjbtkxvpasccrerovg" -ForegroundColor White
Write-Host "4. Run: supabase functions deploy mock-interview" -ForegroundColor White
$speechTextCmd = "supabase functions deploy speech-to-text"
Write-Host "5. Run: $speechTextCmd" -ForegroundColor White

