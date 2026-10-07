import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { activities, scores, skillAssessment, totalInterviews, averageScore } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in Supabase secrets.');
    }

    console.log('Interview insights request:', { totalInterviews, averageScore });

    // Prepare prompt for Gemini AI
    const systemPrompt = `You are an expert career coach and interview analyst. Analyze the following interview performance data and provide detailed, actionable insights.

Interview Performance Data:
- Total Interviews: ${totalInterviews}
- Average Score: ${averageScore.toFixed(1)}%
- Technical Score: ${scores.technical}/10
- Behavioral Score: ${scores.behavioral}/10
- Communication Score: ${scores.communication}/10
- Problem Solving Score: ${scores.problemSolving}/10
- Leadership Score: ${scores.leadership}/10

Skill Assessment:
- Technical: ${skillAssessment.technical}/10
- Communication: ${skillAssessment.communication}/10
- Problem Solving: ${skillAssessment.problemSolving}/10
- Leadership: ${skillAssessment.leadership}/10
- Teamwork: ${skillAssessment.teamwork}/10
- Adaptability: ${skillAssessment.adaptability}/10

Recent Activities:
${activities.slice(0, 10).map((a: any, i: number) => 
  `${i + 1}. ${a.feature_name} - Score: ${a.score}% - Date: ${a.completed_at || 'N/A'}`
).join('\n')}

Please provide a JSON response with the following structure:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "focusAreas": ["area1", "area2", "area3"],
  "trends": ["trend1", "trend2"],
  "performanceBenchmark": "Above average" | "Average" | "Below average"
}

Guidelines:
1. Identify 2-4 key strengths based on the scores
2. Identify 2-4 focus areas that need improvement
3. Identify 1-3 trends in performance (improving, declining, stable, etc.)
4. Determine performance benchmark based on average score (Above average: >80%, Average: 60-80%, Below average: <60%)
5. Be specific and actionable in your recommendations
6. Use professional but encouraging tone
7. Return ONLY valid JSON, no additional text`;

    const geminiMessages = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      }
    ];

    // Call Google Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Invalid Gemini API key. Please check your configuration." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract response from Gemini API format
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response format from Gemini API");
    }
    
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON from the response (might be wrapped in markdown code blocks)
    let insights;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
      insights = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("AI Response:", aiResponse);
      // Fallback to default structure if parsing fails
      insights = {
        strengths: ["Continue analyzing your performance to identify key strengths"],
        focusAreas: ["Practice more interviews to get specific recommendations"],
        trends: ["Track your progress over time"],
        performanceBenchmark: averageScore >= 80 ? "Above average" : averageScore >= 60 ? "Average" : "Below average",
      };
    }

    // Validate and ensure required fields
    if (!insights.strengths || !Array.isArray(insights.strengths)) {
      insights.strengths = ["Strong performance across multiple areas"];
    }
    if (!insights.focusAreas || !Array.isArray(insights.focusAreas)) {
      insights.focusAreas = ["Continue practicing to improve"];
    }
    if (!insights.trends || !Array.isArray(insights.trends)) {
      insights.trends = ["Monitor your progress"];
    }
    if (!insights.performanceBenchmark) {
      insights.performanceBenchmark = averageScore >= 80 ? "Above average" : averageScore >= 60 ? "Average" : "Below average";
    }

    console.log('Insights generated successfully');

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in interview-insights function:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

