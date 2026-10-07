# Quick Setup Script for Gemini API Integration
# This script helps you set up your Gemini API key in Supabase

Write-Host "=== Gemini API Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "⚠️  Supabase CLI not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install Supabase CLI first:" -ForegroundColor White
    Write-Host "  .\install-supabase-cli-user.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✓ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Get API key from user
Write-Host "To get your Gemini API key:" -ForegroundColor Cyan
Write-Host "1. Visit: https://aistudio.google.com/app/apikey" -ForegroundColor White
Write-Host "2. Sign in with your Google account" -ForegroundColor White
Write-Host "3. Click 'Create API Key'" -ForegroundColor White
Write-Host "4. Copy your API key" -ForegroundColor White
Write-Host ""

$apiKey = Read-Host "Enter your Gemini API key (or press Enter to skip)"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host ""
    Write-Host "Skipped. You can set it later using:" -ForegroundColor Yellow
    Write-Host "  supabase secrets set GEMINI_API_KEY=your_key_here" -ForegroundColor White
    Write-Host ""
    Write-Host "Or via Dashboard:" -ForegroundColor Yellow
    Write-Host "  https://app.supabase.com/project/igyjbtkxvpasccrerovg/settings/functions" -ForegroundColor White
    exit 0
}

Write-Host ""
Write-Host "Setting GEMINI_API_KEY in Supabase..." -ForegroundColor Yellow

# Check if project is linked
try {
    $linkCheck = supabase status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "⚠️  Project not linked!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please link your project first:" -ForegroundColor White
        Write-Host "  1. supabase login" -ForegroundColor Yellow
        Write-Host "  2. supabase link --project-ref igyjbtkxvpasccrerovg" -ForegroundColor Yellow
        Write-Host "  3. Then run this script again" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host "⚠️  Could not check project status" -ForegroundColor Yellow
}

# Set the secret
try {
    supabase secrets set GEMINI_API_KEY=$apiKey
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ GEMINI_API_KEY set successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Deploy the updated function:" -ForegroundColor White
        Write-Host "   supabase functions deploy mock-interview" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "2. Test the Mock Interview feature in your app!" -ForegroundColor White
    } else {
        Write-Host "✗ Failed to set secret. Please check your Supabase CLI setup." -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error setting secret: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can set it manually via Dashboard:" -ForegroundColor Yellow
    Write-Host "  https://app.supabase.com/project/igyjbtkxvpasccrerovg/settings/functions" -ForegroundColor White
}

