# Gemini API Integration Guide

## Overview

The application now uses Google's Gemini API directly for the Mock Interview feature. This guide will help you set up your Gemini API key.

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (it will look like: `AIzaSy...`)

## Step 2: Set the API Key in Supabase

You have two options to set the Gemini API key:

### Option A: Using Supabase CLI (Recommended)

After installing Supabase CLI and linking your project:

```powershell
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com/project/igyjbtkxvpasccrerovg
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Name: `GEMINI_API_KEY`
5. Value: Your Gemini API key
6. Click **Save**

## Step 3: Deploy the Updated Function

After setting the secret, deploy the updated function:

```powershell
supabase functions deploy mock-interview
```

## Step 4: Verify It Works

1. Go to your application: http://localhost:8080
2. Navigate to the Mock Interview page
3. Select a job role and start an interview
4. The interview should now work with Gemini API!

## Troubleshooting

### Error: "GEMINI_API_KEY is not configured"

- Make sure you've set the secret in Supabase
- Verify the secret name is exactly `GEMINI_API_KEY` (case-sensitive)
- Redeploy the function after setting the secret

### Error: "Invalid Gemini API key"

- Double-check your API key is correct
- Make sure you copied the entire key
- Verify the key is active in Google AI Studio

### Error: "Rate limit exceeded"

- You've hit Gemini API rate limits
- Wait a few minutes and try again
- Check your quota in Google AI Studio

## API Costs

Google Gemini API has a free tier:
- **Free tier**: 15 requests per minute (RPM)
- **Paid tier**: Higher limits available

Check current pricing: https://ai.google.dev/pricing

## Notes

- The function now uses `gemini-1.5-flash` model (fast and cost-effective)
- Temperature is set to 0.7 for balanced responses
- Max tokens: 500 per response

