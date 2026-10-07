# AI Interview Insights Dashboard Setup

## Overview

The AI Interview Insights Dashboard provides comprehensive analytics and AI-powered insights for your interview performance. It includes:

- **Bar Chart**: Skill comparison (Technical, Behavioral, Communication, Problem Solving, Leadership)
- **Line Chart**: Improvement trends in clarity and confidence over sessions
- **Radar Chart**: Overall skill assessment across 6 key competencies
- **AI-Powered Insights**: Real-time recommendations using Gemini AI
- **Print Functionality**: Export your insights report

## Features

1. **Performance Summary Card**: Overall score, total interviews, and monthly improvement
2. **Skill Comparison Bar Chart**: Visual comparison of 5 key skills
3. **Improvement Trends Line Chart**: Track clarity and confidence over time
4. **Skill Assessment Radar Chart**: Comprehensive 6-dimensional skill evaluation
5. **AI Recommendations**: 
   - Strengths identification
   - Focus areas for improvement
   - Performance trends
   - Benchmark comparison

## Setup Instructions

### Step 1: Deploy the Edge Function

The Interview Insights feature uses a Supabase Edge Function that integrates with Gemini AI. Deploy it using the Supabase CLI:

```powershell
# Navigate to your project directory
cd skill-spark-pro-40-main

# Deploy the interview-insights function
supabase functions deploy interview-insights
```

### Step 2: Verify Gemini API Key

The function uses the same `GEMINI_API_KEY` as the mock-interview function. Verify it's set:

```powershell
# Check if the secret is set (this will show the secret name, not the value)
supabase secrets list
```

If it's not set, set it:

```powershell
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

Or set it via the Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add or verify `GEMINI_API_KEY` is set

### Step 3: Access the Dashboard

1. Start your development server:
   ```powershell
   npm run dev
   ```

2. Navigate to the Interview Insights page:
   - Via Navigation: Click "Insights" in the navigation bar (only visible when logged in)
   - Via Profile: Click "Interview Insights" button in the Quick Actions section
   - Direct URL: `http://localhost:8080/interview-insights`

3. The dashboard will automatically:
   - Fetch your interview activities
   - Generate insights using AI
   - Display charts and recommendations

## How It Works

1. **Data Collection**: The dashboard fetches all interview-related activities from your database
2. **Score Calculation**: Calculates skill scores based on your interview performance
3. **AI Analysis**: Sends performance data to Gemini AI for personalized insights
4. **Visualization**: Displays data in three interactive charts using Recharts
5. **Recommendations**: Shows AI-generated strengths, focus areas, trends, and benchmarks

## Chart Details

### Bar Chart - Skill Comparison
- Shows scores (out of 10) for:
  - Technical Skills
  - Behavioral Skills
  - Communication
  - Problem Solving
  - Leadership

### Line Chart - Improvement Trends
- Tracks improvement over last 5 sessions
- Metrics:
  - Clarity: How clear your answers are
  - Confidence: Your confidence level during interviews

### Radar Chart - Skill Assessment
- 6-dimensional evaluation:
  - Technical
  - Communication
  - Problem Solving
  - Leadership
  - Teamwork
  - Adaptability

## AI Insights

The Gemini AI analyzes your performance and provides:

1. **Strengths**: 2-4 key areas where you excel
2. **Focus Areas**: 2-4 areas that need improvement
3. **Trends**: Performance trends (improving, declining, stable)
4. **Benchmark**: Performance level compared to industry standards
   - Above average: >80%
   - Average: 60-80%
   - Below average: <60%

## Print Report

Click the "Print Report" button to export your insights dashboard as a PDF or print it. The print view:
- Removes interactive elements
- Optimizes layout for printing
- Includes a footer with generation date

## Troubleshooting

### No Data Available

If you see "No Interview Data Available":
- Complete some mock interviews first
- Ensure activities are being saved to the database
- Check that activities have scores

### AI Insights Not Loading

If AI insights fail to generate:
- Verify `GEMINI_API_KEY` is set in Supabase secrets
- Check that the Edge Function is deployed
- Check browser console for error messages
- The dashboard will show fallback insights if AI is unavailable

### Charts Not Displaying

If charts don't appear:
- Ensure Recharts is installed: `npm install recharts`
- Check browser console for errors
- Verify you have completed interviews with scores

## Technical Details

- **Frontend**: React + TypeScript + Tailwind CSS
- **Charts**: Recharts library
- **Backend**: Supabase Edge Functions (Deno)
- **AI**: Google Gemini API (gemini-1.5-flash model)
- **Data Source**: Supabase `activities` table

## Next Steps

1. Complete more interviews to get better insights
2. Review your strengths and focus areas regularly
3. Use the trends to track your improvement over time
4. Print your report to share with mentors or coaches

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify all setup steps are completed
3. Ensure your Gemini API key is valid
4. Check Supabase function logs for backend errors

