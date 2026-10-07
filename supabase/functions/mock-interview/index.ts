import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { action, jobRole, conversationHistory, userAnswer } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in Supabase secrets.');
    }

    console.log('Mock interview request:', { action, jobRole, historyLength: conversationHistory?.length });

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'start') {
      systemPrompt = `You are an expert technical interviewer conducting a professional job interview. Your role is to:
1. Ask relevant, challenging questions appropriate for a ${jobRole} position
2. Ask ONE question at a time
3. Keep questions concise and clear
4. Cover different aspects: technical skills, problem-solving, experience, and behavioral questions
5. Maintain a professional yet friendly tone

Start the interview by asking the first question directly without any preamble.`;
      
      userPrompt = `Begin the interview for the ${jobRole} position. Ask your first question.`;
    } else if (action === 'evaluate') {
      systemPrompt = `You are an expert interviewer providing feedback on interview answers. Analyze the candidate's response and:
1. Provide constructive, specific feedback on their answer
2. Highlight strengths and areas for improvement
3. Keep feedback concise (2-3 sentences)
4. Then ask the NEXT interview question
5. Maintain an encouraging but honest tone`;

      userPrompt = `The candidate answered: "${userAnswer}"\n\nProvide brief feedback on this answer, then ask the next interview question.`;
    }

    // Convert messages to Gemini format
    const geminiMessages = [];
    
    // Add system instruction as the first user message (Gemini doesn't have system role)
    if (systemPrompt) {
      geminiMessages.push({
        role: "user",
        parts: [{ text: systemPrompt }]
      });
      geminiMessages.push({
        role: "model",
        parts: [{ text: "I understand. I'm ready to conduct the interview." }]
      });
    }
    
    // Convert conversation history to Gemini format
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          geminiMessages.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          });
        }
      }
    }
    
    // Add current user prompt
    geminiMessages.push({
      role: "user",
      parts: [{ text: userPrompt }]
    });

    // Call Google Gemini API directly
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
          maxOutputTokens: 500,
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
    
    const assistantMessage = data.candidates[0].content.parts[0].text;

    console.log('Interview response generated successfully');

    // Update conversation history with the new assistant message
    const updatedHistory = [
      ...(conversationHistory || []),
      { role: "user", content: userPrompt },
      { role: "assistant", content: assistantMessage }
    ];

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        conversationHistory: updatedHistory
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in mock-interview function:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
