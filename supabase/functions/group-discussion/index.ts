// @ts-expect-error - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno runtime imports  
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error - Deno runtime imports
import { v4 as uuidv4 } from "https://deno.land/std@0.194.0/uuid/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface Avatar {
  id: string;
  name: string;
  personality: string;
  speakingStyle: string;
  tone: string;
  perspective: string;
  ttsVoiceProfile: {
    pitch: number;
    speed: number;
    emotion: string;
  };
  animation: {
    facialExpressions: string[];
    lipSync: boolean;
    headMovements: boolean;
    gestureAnimations: string[];
  };
}

interface GDSession {
  session_id: string;
  user_id: string;
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  avatars: Avatar[];
  start_time: string;
  discussion_flow: Array<{
    speaker: string;
    message: string;
    timestamp: string;
    audioUrl?: string;
    animation: {
      lipSyncCommand: string;
      facialExpression: string;
      headMovement: string;
    };
  }>;
  user_performance: {
    communicationScore: number;
    fluencyScore: number;
    confidenceScore: number;
    leadershipScore: number;
    teamworkScore: number;
    relevanceScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  status: "active" | "completed";
}

const predefinedTopics = [
  "Impact of Artificial Intelligence on Job Markets",
  "Remote Work vs Office Culture: Which is Better?",
  "The Role of Social Media in Modern Society",
  "Climate Change: Individual vs Corporate Responsibility",
  "Education in the Digital Age",
  "Mental Health Awareness in the Workplace",
  "The Gig Economy and Its Effects",
  "Cybersecurity and Privacy Concerns",
  "Work-Life Balance: Is It Possible?",
  "Innovation and Failure: Learning from Mistakes"
];

const avatarTemplates = [
  {
    name: "Rajesh Kumar",
    personality: "Analytical and logical",
    speakingStyle: "Structured and methodical",
    tone: "Neutral to positive",
    perspective: "Tech-savvy, data-driven",
    ttsVoiceProfile: { pitch: 1.0, speed: 0.95, emotion: "neutral" },
    animation: {
      facialExpressions: ["thoughtful", "confident", "questioning"],
      lipSync: true,
      headMovements: true,
      gestureAnimations: ["pointing", "nodding", "hand-gestures"]
    }
  },
  {
    name: "Priya Singh",
    personality: "Creative and expressive",
    speakingStyle: "Conversational and engaging",
    tone: "Warm and encouraging",
    perspective: "People-focused, innovative",
    ttsVoiceProfile: { pitch: 1.2, speed: 1.0, emotion: "positive" },
    animation: {
      facialExpressions: ["smiling", "engaged", "excited"],
      lipSync: true,
      headMovements: true,
      gestureAnimations: ["open-arms", "nodding", "emphasizing"]
    }
  },
  {
    name: "Arjun Patel",
    personality: "Critical and questioning",
    speakingStyle: "Challenging and probing",
    tone: "Skeptical but fair",
    perspective: "Devil's advocate, practical",
    ttsVoiceProfile: { pitch: 0.95, speed: 1.05, emotion: "serious" },
    animation: {
      facialExpressions: ["skeptical", "thinking", "serious"],
      lipSync: true,
      headMovements: true,
      gestureAnimations: ["pointing", "shaking-head", "questioning"]
    }
  },
  {
    name: "Neha Sharma",
    personality: "Diplomatic and balanced",
    speakingStyle: "Measured and thoughtful",
    tone: "Professional and calm",
    perspective: "Balanced view, consensus-builder",
    ttsVoiceProfile: { pitch: 1.1, speed: 0.9, emotion: "calm" },
    animation: {
      facialExpressions: ["neutral", "listening", "thoughtful"],
      lipSync: true,
      headMovements: true,
      gestureAnimations: ["balancing-hands", "nodding", "open-palms"]
    }
  },
  {
    name: "Vikram Desai",
    personality: "Energetic and passionate",
    speakingStyle: "Enthusiastic and animated",
    tone: "Excited and motivating",
    perspective: "Visionary, action-oriented",
    ttsVoiceProfile: { pitch: 1.05, speed: 1.1, emotion: "enthusiastic" },
    animation: {
      facialExpressions: ["excited", "confident", "passionate"],
      lipSync: true,
      headMovements: true,
      gestureAnimations: ["pointing-up", "clapping", "dynamic-gestures"]
    }
  }
];

function generateGDSessionPrompt(topic: string, difficulty: string): string {
  const difficultyLevel = difficulty === "Beginner" 
    ? "beginner-friendly with basic concepts"
    : difficulty === "Intermediate"
    ? "intermediate with some complexity"
    : "advanced with critical analysis required";

  return `You are an expert Group Discussion (GD) Facilitator creating a realistic, ${difficultyLevel} group discussion simulation on the topic: "${topic}"

You will manage 5 distinct AI participants with unique personalities and perspectives. Generate opening statements and discussion flow that is natural, engaging, and simulates a real professional group discussion.

CRITICAL REQUIREMENTS:
1. Generate opening statements from 4-5 unique participants with different viewpoints on the topic
2. Each participant should have a unique personality, speaking style, and perspective
3. Create a realistic discussion flow where participants respond to each other naturally
4. Include agreement, disagreement, and constructive challenges
5. Maintain professional and respectful tone throughout
6. Include at least 1 counter-argument to challenge groupthink

PARTICIPANT STYLES:
- Analytical: Data-driven, logical, questioning
- Creative: Innovative ideas, expressive, engaging
- Critical: Challenging views, probing deeper, skeptical
- Diplomatic: Balanced views, consensus-building
- Passionate: Enthusiastic, action-oriented, motivating

OUTPUT MUST BE VALID JSON ONLY:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "avatars": [
    {
      "id": "avatar_1",
      "name": "Name",
      "personality": "Description",
      "speakingStyle": "Style",
      "tone": "Tone",
      "perspective": "Unique perspective",
      "openingStatement": "Opening statement here"
    },
    // ... 4-5 total avatars
  ],
  "discussionFlow": [
    {
      "speaker": "Avatar Name",
      "message": "What they say",
      "animation": {
        "facialExpression": "emotion",
        "headMovement": "movement type",
        "gesture": "gesture type"
      }
    },
    // ... more discussion turns
  ],
  "evaluationCriteria": {
    "communicationQuality": "How to evaluate clarity and expression",
    "fluency": "How to evaluate smooth speaking",
    "confidence": "How to evaluate self-assurance",
    "leadership": "How to evaluate influence and direction",
    "teamwork": "How to evaluate collaboration",
    "relevance": "How to evaluate point relevance"
  }
}

Create a dynamic, realistic, and engaging group discussion now. Include natural transitions and real conversational flow.`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // @ts-expect-error - Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    // @ts-expect-error - Deno global
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    // @ts-expect-error - Deno global
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') as string;

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'start-session') {
      const { userId, topic, difficulty = "Intermediate" } = await req.json();

      const selectedTopic = topic || predefinedTopics[Math.floor(Math.random() * predefinedTopics.length)];

      console.log('Starting GD session:', { topic: selectedTopic, difficulty });

      // Generate discussion using Gemini
      const prompt = generateGDSessionPrompt(selectedTopic, difficulty);

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 5000,
          }
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
      }

      const geminiData = await geminiResponse.json();
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini');
      }

      const gdData = JSON.parse(jsonMatch[0]);

      // Create session
      const sessionId = uuidv4();
      const now = new Date();

      // Prepare avatars with enhanced animation data
      const avatars = ((gdData.avatars || []) as Array<Record<string, unknown>>).map((avatar, index: number): Avatar => ({
        id: `avatar_${index + 1}`,
        name: (avatar.name as string) || `Avatar ${index + 1}`,
        personality: (avatar.personality as string) || "Neutral",
        speakingStyle: (avatar.speakingStyle as string) || "Standard",
        tone: (avatar.tone as string) || "Professional",
        perspective: (avatar.perspective as string) || "Balanced",
        ttsVoiceProfile: (avatar.ttsVoiceProfile as { pitch: number; speed: number; emotion: string }) || {
          pitch: 0.9 + Math.random() * 0.4,
          speed: 0.9 + Math.random() * 0.2,
          emotion: ["neutral", "positive", "serious", "enthusiastic"][Math.floor(Math.random() * 4)]
        },
        animation: {
          facialExpressions: ["neutral", "thinking", "engaged", "smiling", "serious"],
          lipSync: true,
          headMovements: true,
          gestureAnimations: ["pointing", "nodding", "hand-gestures", "emphasizing"]
        }
      }));

      // Initial discussion flow with opening statements
      const discussionFlow = [];
      if (avatars.length > 0) {
        discussionFlow.push({
          speaker: "System",
          message: `Today's topic: "${selectedTopic}". Let's hear from our panelists.`,
          timestamp: now.toISOString(),
          animation: {
            lipSyncCommand: "speaking",
            facialExpression: "neutral",
            headMovement: "neutral"
          }
        });

        // Add opening statements
        avatars.forEach((avatar, index) => {
          discussionFlow.push({
            speaker: avatar.name,
            message: gdData.avatars[index]?.openingStatement || `I think ${selectedTopic.toLowerCase()} is an important topic.`,
            timestamp: new Date(now.getTime() + (index + 1) * 3000).toISOString(),
            animation: {
              lipSyncCommand: "talking",
              facialExpression: ["thinking", "confident", "engaged", "passionate"][Math.floor(Math.random() * 4)],
              headMovement: "nodding"
            }
          });
        });
      }

      const session: GDSession = {
        session_id: sessionId,
        user_id: userId || 'anonymous',
        topic: selectedTopic,
        difficulty,
        avatars,
        start_time: now.toISOString(),
        discussion_flow: discussionFlow,
        user_performance: {
          communicationScore: 0,
          fluencyScore: 0,
          confidenceScore: 0,
          leadershipScore: 0,
          teamworkScore: 0,
          relevanceScore: 0,
          strengths: [],
          weaknesses: [],
          suggestions: []
        },
        status: 'active'
      };

      // Store in database
      const { error: dbError } = await supabase
        .from('gd_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId || 'anonymous',
          topic: selectedTopic,
          difficulty,
          avatars,
          discussion_flow: discussionFlow,
          user_performance: session.user_performance,
          status: 'active'
        });

      if (dbError) {
        console.log('DB Error (might be table not existing yet):', dbError);
      }

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          topic: selectedTopic,
          difficulty,
          avatars,
          initial_discussion: discussionFlow
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } else if (action === 'user-input') {
      const { sessionId, userMessage, audioData } = await req.json();

      const { data: session, error } = await supabase
        .from('gd_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Generate AI responses to user input
      const responsePrompt = `In a group discussion about "${session.topic}", the user just said: "${userMessage}"

You are managing ${session.avatars.length} participants. Generate 2-3 responses from different avatars that:
1. React naturally to the user's statement
2. Either agree, disagree, or extend the discussion
3. Show diverse perspectives
4. Are concise (1-2 sentences each)

Return a JSON array with this format:
[
  {
    "speaker": "Avatar Name",
    "response": "What they say",
    "facialExpression": "emotion",
    "gesture": "gesture type"
  }
]`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: responsePrompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
          }
        })
      });

      const geminiData = await geminiResponse.json();
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      const jsonMatch = responseText?.match(/\[[\s\S]*\]/);
      const responses: Array<{ speaker: string; response: string; facialExpression: string; gesture: string }> = [];
      if (jsonMatch) {
        responses.push(...JSON.parse(jsonMatch[0]));
      }

      // Add user message and responses to discussion flow
      const updatedFlow = [...session.discussion_flow];
      updatedFlow.push({
        speaker: "User",
        message: userMessage,
        timestamp: new Date().toISOString(),
        animation: {
          lipSyncCommand: "talking",
          facialExpression: "speaking",
          headMovement: "neutral"
        }
      });

      responses.forEach((response) => {
        updatedFlow.push({
          speaker: response.speaker,
          message: response.response,
          timestamp: new Date().toISOString(),
          animation: {
            lipSyncCommand: "talking",
            facialExpression: response.facialExpression || "neutral",
            headMovement: "nodding"
          }
        });
      });

      await supabase
        .from('gd_sessions')
        .update({ discussion_flow: updatedFlow })
        .eq('session_id', sessionId);

      return new Response(
        JSON.stringify({
          user_message_recorded: true,
          avatar_responses: responses
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (action === 'end-session') {
      const { sessionId } = await req.json();

      const { data: session, error } = await supabase
        .from('gd_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Evaluate user performance
      const evaluationPrompt = `Based on this group discussion on "${session.topic}":

${session.discussion_flow
  .filter((msg) => (msg as { speaker: string }).speaker === "User")
  .map((msg) => `User: ${(msg as { message: string }).message}`)
  .join('\n')}

Evaluate the user on a scale of 1-10 (or 0 if not applicable) for:
1. Communication Quality (clarity, articulation)
2. Fluency (smooth speaking without hesitation)
3. Confidence (self-assurance and assertiveness)
4. Leadership (influence and direction-setting)
5. Teamwork (collaboration and respect for others)
6. Relevance (how relevant points are to the topic)

Also identify 3 strengths, 3 areas for improvement, and 3 actionable suggestions.

Return JSON:
{
  "scores": {
    "communicationScore": number,
    "fluencyScore": number,
    "confidenceScore": number,
    "leadershipScore": number,
    "teamworkScore": number,
    "relevanceScore": number
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

      const geminiUrl2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const geminiResponse2 = await fetch(geminiUrl2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: evaluationPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      const geminiData = await geminiResponse2.json();
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      let evaluation = session.user_performance;
      const jsonMatch = responseText?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        evaluation = {
          ...session.user_performance,
          ...parsed.scores,
          strengths: parsed.strengths,
          weaknesses: parsed.weaknesses,
          suggestions: parsed.suggestions
        };
      }

      await supabase
        .from('gd_sessions')
        .update({
          status: 'completed',
          user_performance: evaluation
        })
        .eq('session_id', sessionId);

      return new Response(
        JSON.stringify({
          sessionId,
          evaluation,
          discussionSummary: {
            topic: session.topic,
            participantCount: session.avatars.length,
            messageCount: session.discussion_flow.length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
