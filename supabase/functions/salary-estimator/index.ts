import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { jobTitle, location, experience, keySkills, education, industry } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in Supabase secrets.');
    }

    console.log('Salary estimator request:', { jobTitle, industry, location });

    // Base salary calculation (same as client-side)
    const baseSalaries: { [key: string]: number } = {
      Technology: 85000,
      Finance: 90000,
      Healthcare: 75000,
      Retail: 65000,
      Manufacturing: 70000,
      Education: 60000,
      Consulting: 95000,
      Other: 70000,
    };

    const base = baseSalaries[industry] || 70000;

    const locationLower = location.toLowerCase();
    const locationMultipliers: { [key: string]: number } = {
      "new york": 1.4,
      "san francisco": 1.5,
      "chicago": 1.2,
      "austin": 1.1,
      "los angeles": 1.3,
      "seattle": 1.25,
      "boston": 1.3,
    };

    let locationMultiplier = 1;
    for (const [city, multiplier] of Object.entries(locationMultipliers)) {
      if (locationLower.includes(city)) {
        locationMultiplier = multiplier;
        break;
      }
    }

    const experienceMultipliers: { [key: string]: number } = {
      "0-2": 1,
      "3-5": 1.3,
      "6-8": 1.6,
      "9+": 2,
    };
    const experienceMultiplier = experienceMultipliers[experience] || 1;

    const educationMultipliers: { [key: string]: number } = {
      "High School": 1,
      "Bachelor's": 1.2,
      "Master's": 1.4,
      "PhD": 1.6,
    };
    const educationMultiplier = educationMultipliers[education] || 1;

    // Calculate base salary
    const baseAvg = Math.round(base * locationMultiplier * experienceMultiplier * educationMultiplier);

    // Use Gemini to adjust based on job title and skills
    const systemPrompt = `You are a salary estimation expert. Based on the job details, provide a salary adjustment factor (multiplier between 0.9 and 1.2) to refine the base calculation.

Job Title: ${jobTitle}
Industry: ${industry}
Location: ${location}
Experience: ${experience} years
Education: ${education}
Key Skills: ${keySkills}
Base Calculated Salary: $${baseAvg.toLocaleString()}

Return ONLY a JSON object with this structure:
{
  "adjustmentFactor": 1.0,
  "reasoning": "Brief explanation"
}

The adjustmentFactor should:
- Be between 0.9 and 1.2
- Account for job title seniority and specialization
- Consider in-demand skills
- Reflect market trends
- Return ONLY valid JSON, no additional text`;

    const geminiMessages = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      }
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 300,
        },
      }),
    });

    let adjustmentFactor = 1.0;

    if (response.ok) {
      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        try {
          const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
          const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
          const parsed = JSON.parse(jsonText.trim());
          const factor = parseFloat(parsed.adjustmentFactor);
          if (factor >= 0.9 && factor <= 1.2) {
            adjustmentFactor = factor;
          }
        } catch (parseError) {
          console.error("Error parsing AI adjustment:", parseError);
        }
      }
    }

    // Apply adjustment
    const avg = Math.round(baseAvg * adjustmentFactor);
    const min = Math.round(avg * 0.8);
    const max = Math.round(avg * 1.2);

    return new Response(
      JSON.stringify({ 
        salary: { min, avg, max },
        adjustmentFactor,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in salary-estimator function:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

