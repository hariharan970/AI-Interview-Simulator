# Set Gemini API Key - Quick Guide

## Your API Key
```
AIzaSyAumcrJcIYLt_VZafizfJtL-jVN4yhhqFc
```

## Method 1: Via Supabase Dashboard (Easiest - No CLI needed)

1. **Go to your Supabase Dashboard:**
   https://app.supabase.com/project/igyjbtkxvpasccrerovg/settings/functions

2. **Navigate to Secrets:**
   - Click on **"Edge Functions"** in the left sidebar
   - Click on **"Secrets"** tab

3. **Add the Secret:**
   - Click **"Add Secret"** or **"New Secret"**
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyAumcrJcIYLt_VZafizfJtL-jVN4yhhqFc`
   - Click **"Save"** or **"Add"**

4. **Deploy the Function:**
   - Go to **Edge Functions** → **mock-interview**
   - Click **"Deploy"** or update the function code
   - The function will automatically use the secret

## Method 2: Using Supabase CLI (After Installation)

1. **Install Supabase CLI first:**
   ```powershell
   .\install-supabase-cli-user.ps1
   ```

2. **Login and link project:**
   ```powershell
   supabase login
   supabase link --project-ref igyjbtkxvpasccrerovg
   ```

3. **Set the secret:**
   ```powershell
   supabase secrets set GEMINI_API_KEY=AIzaSyAumcrJcIYLt_VZafizfJtL-jVN4yhhqFc
   ```

4. **Deploy the function:**
   ```powershell
   supabase functions deploy mock-interview
   ```

## Verify It Works

After setting the key and deploying:
1. Go to your app: http://localhost:8080
2. Navigate to Mock Interview
3. Select a job role and start an interview
4. It should work with your Gemini API key!

## Important Notes

- ⚠️ **Keep your API key secure** - Don't share it publicly
- ✅ The key is stored securely in Supabase secrets
- ✅ The function will automatically use it when deployed
- ✅ You can update it anytime in the dashboard

