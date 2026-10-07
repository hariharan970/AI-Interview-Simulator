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
    const { careerPaths, userId } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in Supabase secrets.');
    }

    console.log('Career roadmap request:', { userId, careerPathsCount: careerPaths?.length });

    const systemPrompt = `You are an expert career coach. Based on the user's career path progress, generate personalized recommended resources.

Career Paths Progress:
${careerPaths.map((p: any, i: number) => `${i + 1}. ${p.title}: ${p.progress}% progress`).join('\n')}

Generate a JSON response with exactly 4 recommended resources in this format:
{
  "resources": [
    {
      "label": "Resource name",
      "description": "Brief description",
      "link": "https://example.com or # if not available",
      "category": "courses|mentorship|projects|certification"
    }
  ]
}

Guidelines:
1. Provide resources relevant to the career paths with progress
2. Include mix of: online courses, mentorship programs, practice projects, and certification guides
3. Be specific and actionable
4. Return ONLY valid JSON, no additional text`;

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
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response format from Gemini API");
    }
    
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    let resources;
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
      const parsed = JSON.parse(jsonText.trim());
      resources = parsed.resources || [];
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      resources = [];
    }

    // Map to expected format with icons
    const iconMap: { [key: string]: string } = {
      courses: "📚",
      mentorship: "👥",
      projects: "🎯",
      certification: "📜",
    };

    const formattedResources = resources.map((r: any) => ({
      icon: iconMap[r.category] || "📚",
      label: r.label || "Resource",
      link: r.link || "#",
      description: r.description || "",
    }));

    // Ensure we have at least 4 resources
    while (formattedResources.length < 4) {
      formattedResources.push({
        icon: "📚",
        label: "Online Courses Platform Access",
        link: "#",
        description: "",
      });
    }

    return new Response(
      JSON.stringify({ resources: formattedResources.slice(0, 4) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in career-roadmap function:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage, resources: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

