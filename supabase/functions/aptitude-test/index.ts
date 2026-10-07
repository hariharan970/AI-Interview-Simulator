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

interface Question {
  id: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
}

interface TestSession {
  session_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  current_question_index: number;
  questions_json: Question[];
  user_answers: Array<{
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
    timestamp: string;
    is_submitted: boolean;
  }>;
  status: "ongoing" | "completed" | "expired";
}

function generateAptitudeTestPrompt(mode: string, roleOrCategories: string[]): string {
  const categories = ["Logical Reasoning", "Numerical Ability", "Verbal Ability", "Pattern Recognition", "Role-Specific Aptitude"];
  
  if (mode === "role") {
    const role = roleOrCategories[0];
    return `You are an AI Aptitude Test Generator. Generate exactly 20 unique aptitude test questions tailored for a ${role} role. 

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 20 questions (no more, no less)
2. Difficulty Distribution: 40% Easy (8 questions), 40% Medium (8 questions), 20% Hard (4 questions)
3. For ${role}, include role-specific aptitude questions appropriate for this position
4. Balance categories: Logical Reasoning, Numerical Ability, Verbal Ability, Pattern Recognition, and Role-Specific Aptitude

EVERY QUESTION MUST HAVE:
- Unique question ID (Q001-Q020)
- Category (one of: ${categories.join(", ")})
- Difficulty level (Easy, Medium, or Hard)
- Clear, complete question text
- Four options (A, B, C, D) that are believable and not obviously wrong
- Correct answer (single letter: A, B, C, or D)
- Detailed explanation (2-3 sentences explaining why the answer is correct and why others are wrong)

OUTPUT MUST BE VALID JSON ONLY with this structure:
{
  "mode": "role",
  "selectedRole": "${role}",
  "questions": [
    {
      "id": "Q001",
      "category": "Category Name",
      "difficulty": "Easy|Medium|Hard",
      "question": "Question text here",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "A",
      "explanation": "Explanation text"
    }
    // ... 19 more questions
  ],
  "test_rules": {
    "total_questions": 20,
    "timer_minutes": 30,
    "auto_mark_on_timeout": true
  }
}

Generate original, logically sound, professional aptitude questions now.`;
  } else {
    const selectedCategories = roleOrCategories.join(", ");
    const questionCount = roleOrCategories.length * 20;
    
    return `You are an AI Aptitude Test Generator. Generate exactly ${questionCount} unique aptitude test questions.

CRITICAL REQUIREMENTS:
1. User selected categories: ${selectedCategories}
2. Generate exactly 20 questions per category selected
3. Difficulty Distribution per category: 40% Easy (8 questions), 40% Medium (8 questions), 20% Hard (4 questions)
4. Questions must come STRICTLY from the selected categories
5. Never repeat questions

EVERY QUESTION MUST HAVE:
- Unique question ID (Q001-Q0XX based on total count)
- Category (one of the selected: ${selectedCategories})
- Difficulty level (Easy, Medium, or Hard)
- Clear, complete question text
- Four options (A, B, C, D) that are believable and not obviously wrong
- Correct answer (single letter: A, B, C, or D)
- Detailed explanation (2-3 sentences explaining why the answer is correct)

OUTPUT MUST BE VALID JSON ONLY with this structure:
{
  "mode": "category",
  "selectedCategories": [${roleOrCategories.map(c => `"${c}"`).join(", ")}],
  "questions": [
    {
      "id": "Q001",
      "category": "Category Name",
      "difficulty": "Easy|Medium|Hard",
      "question": "Question text here",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "A",
      "explanation": "Explanation text"
    }
    // ... ${questionCount - 1} more questions
  ],
  "test_rules": {
    "total_questions": ${questionCount},
    "timer_minutes": 30,
    "auto_mark_on_timeout": true
  }
}

Generate original, logically sound, professional aptitude questions now.`;
  }
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

    if (action === 'generate') {
      const { mode, roleOrCategories, userId } = await req.json();

      console.log('Generating aptitude test:', { mode, roleOrCategories });

      const prompt = generateAptitudeTestPrompt(mode, roleOrCategories);

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
            temperature: 0.7,
            maxOutputTokens: 8000,
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

      const testData = JSON.parse(jsonMatch[0]);

      // Validate test structure
      if (!testData.questions || testData.questions.length !== testData.test_rules.total_questions) {
        throw new Error(`Expected ${testData.test_rules.total_questions} questions, got ${testData.questions?.length || 0}`);
      }

      // Create session
      const sessionId = uuidv4();
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000); // 30 minutes

      const session: TestSession = {
        session_id: sessionId,
        user_id: userId || 'anonymous',
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        current_question_index: 0,
        questions_json: testData.questions,
        user_answers: [],
        status: 'ongoing'
      };

      // Store in database
      const { error: dbError } = await supabase
        .from('aptitude_test_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId || 'anonymous',
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          questions_json: testData.questions,
          user_answers: [],
          current_question_index: 0,
          status: 'ongoing'
        });

      if (dbError) {
        console.log('DB Error (might be table not existing yet):', dbError);
      }

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          total_questions: testData.test_rules.total_questions,
          timer_minutes: testData.test_rules.timer_minutes,
          first_question: testData.questions[0]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } else if (action === 'get-question') {
      const { sessionId, questionIndex } = await req.json();

      const { data: session, error } = await supabase
        .from('aptitude_test_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Check if expired
      if (new Date() > new Date(session.end_time)) {
        await supabase
          .from('aptitude_test_sessions')
          .update({ status: 'expired' })
          .eq('session_id', sessionId);

        return new Response(
          JSON.stringify({ error: 'Test time expired', status: 'expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const question = session.questions_json[questionIndex];
      const remainingTime = Math.max(0, Math.floor((new Date(session.end_time).getTime() - new Date().getTime()) / 1000));

      return new Response(
        JSON.stringify({
          question,
          questionIndex,
          remainingTime,
          totalQuestions: session.questions_json.length,
          userAnswers: session.user_answers
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (action === 'submit-answer') {
      const { sessionId, questionIndex, selectedOption } = await req.json();

      const { data: session, error } = await supabase
        .from('aptitude_test_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const question = session.questions_json[questionIndex];
      const isCorrect = question.correctAnswer === selectedOption;

      const updatedAnswers = [...session.user_answers];
      updatedAnswers[questionIndex] = {
        questionId: question.id,
        selectedOption,
        isCorrect,
        timestamp: new Date().toISOString(),
        is_submitted: true
      };

      const nextIndex = questionIndex + 1;
      const newStatus = nextIndex >= session.questions_json.length ? 'completed' : 'ongoing';

      await supabase
        .from('aptitude_test_sessions')
        .update({
          user_answers: updatedAnswers,
          current_question_index: nextIndex,
          status: newStatus
        })
        .eq('session_id', sessionId);

      return new Response(
        JSON.stringify({
          isCorrect,
          explanation: question.explanation,
          nextIndex,
          status: newStatus
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (action === 'get-results') {
      const { sessionId } = await req.json();

      const { data: session, error } = await supabase
        .from('aptitude_test_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const totalCorrect = (session.user_answers as unknown[]).filter((a) => (a as Record<string, unknown>).isCorrect).length;
      const totalWrong = (session.user_answers as unknown[]).filter((a) => !(a as Record<string, unknown>).isCorrect).length;
      const totalSkipped = session.questions_json.length - session.user_answers.length;
      const timeTaken = Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / 1000);

      return new Response(
        JSON.stringify({
          totalCorrect,
          totalWrong,
          totalSkipped,
          totalTime: timeTaken,
          score: Math.round((totalCorrect / session.questions_json.length) * 100),
          answers: session.user_answers
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
