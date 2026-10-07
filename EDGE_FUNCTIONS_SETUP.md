# Edge Functions Setup Guide

## Issues Fixed

1. **CORS Errors**: Fixed CORS headers in both Edge Functions
2. **Error Handling**: Improved error messages for better user experience
3. **Activities Table**: Added graceful handling when table doesn't exist

## What Still Needs to Be Done

The Edge Functions (`mock-interview` and `speech-to-text`) need to be deployed to your Supabase project.

### Option 1: Install Supabase CLI (Windows - Recommended)

**IMPORTANT**: `npm install -g supabase` does NOT work! Use one of these methods:

#### Method A: Use the Installation Script (Easiest)

1. Open PowerShell as Administrator (Right-click → Run as Administrator)
2. Navigate to the project directory
3. Run the installation script:
   ```powershell
   .\install-supabase-cli.ps1
   ```
4. Restart your terminal after installation

#### Method B: Manual Installation

1. Download from: https://github.com/supabase/cli/releases/latest
2. Download the `supabase_X.X.X_windows_amd64.zip` file
3. Extract the `supabase.exe` file
4. Add it to your PATH or place it in a folder that's already in PATH

#### Method C: Using Scoop (if you have it)

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option 2: Deploy Functions via Supabase CLI

After installing the CLI:

1. Login to Supabase:
   ```powershell
   supabase login
   ```

2. Link your project:
   ```powershell
   supabase link --project-ref igyjbtkxvpasccrerovg
   ```

3. Deploy the functions:
   ```powershell
   supabase functions deploy mock-interview
   supabase functions deploy speech-to-text
   ```

4. Set the GEMINI_API_KEY secret:
   ```powershell
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Get your API key from: https://aistudio.google.com/app/apikey

### Option 2: Deploy via Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com/project/igyjbtkxvpasccrerovg
2. Navigate to Edge Functions
3. Create new functions and paste the code from:
   - `supabase/functions/mock-interview/index.ts`
   - `supabase/functions/speech-to-text/index.ts`
4. Set the `GEMINI_API_KEY` secret in the dashboard (Project Settings → Edge Functions → Secrets)

## Current Status

- ✅ CORS headers fixed
- ✅ Error handling improved
- ✅ App won't crash on function errors
- ⚠️ Edge Functions need to be deployed
- ⚠️ GEMINI_API_KEY needs to be configured (see GEMINI_API_SETUP.md)

## Note

The app will work for most features, but the Mock Interview feature requires the Edge Functions to be deployed and configured.

