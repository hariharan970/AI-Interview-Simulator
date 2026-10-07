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

interface CodingQuestion {
  id: string;
  language: string;
  role: string;
  difficulty: "Easy" | "Medium" | "Hard";
  title: string;
  description: string;
  problemStatement: string;
  functionSignature: string;
  sampleInput: string;
  sampleOutput: string;
  constraints: string[];
  expectedTimeComplexity: string;
  expectedSpaceComplexity: string;
  correctSolution: string;
  solutionExplanation: string;
}

interface CodingTestSession {
  session_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  current_question_index: number;
  questions_json: CodingQuestion[];
  user_solutions: Array<{
    questionId: string;
    code: string;
    language: string;
    submittedAt: string;
    verdict: "pending" | "correct" | "wrong" | "timeout" | "compilation_error";
  }>;
  status: "ongoing" | "completed" | "expired";
}

function generateCodingTestPrompt(mode: string, roleOrLanguages: string[]): string {
  if (mode === "role") {
    const role = roleOrLanguages[0];
    return `You are an AI Coding Test Generator. Generate exactly 3 coding problems tailored for a ${role} role.

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 3 coding problems (no more, no less)
2. Difficulty Distribution: 1 Easy, 1 Medium, 1 Hard
3. Problems must be appropriate and relevant for a ${role}
4. Each problem must be solvable in TypeScript/JavaScript (preferred) but can include hints for other languages

EVERY PROBLEM MUST HAVE:
- Unique problem ID (P001-P003)
- Clear, complete problem statement with real-world context
- Function signature (in TypeScript/JavaScript)
- Sample input and output
- Clear constraints (time/space/input size limits)
- Expected time complexity
- Expected space complexity
- Complete correct solution
- Step-by-step explanation of the solution

OUTPUT MUST BE VALID JSON ONLY with this structure:
{
  "mode": "role",
  "selectedRole": "${role}",
  "questions": [
    {
      "id": "P001",
      "language": "TypeScript",
      "role": "${role}",
      "difficulty": "Easy",
      "title": "Problem Title",
      "description": "Short description",
      "problemStatement": "Full problem statement here",
      "functionSignature": "function solve(input: Type): ReturnType { }",
      "sampleInput": "Input example",
      "sampleOutput": "Expected output",
      "constraints": ["Constraint 1", "Constraint 2"],
      "expectedTimeComplexity": "O(n)",
      "expectedSpaceComplexity": "O(1)",
      "correctSolution": "Full solution code here",
      "solutionExplanation": "Step-by-step explanation"
    },
    // ... 2 more problems (one Medium, one Hard)
  ],
  "test_rules": {
    "total_questions": 3,
    "timer_minutes": 30,
    "plagiarism_check": true,
    "auto_mark_on_timeout": true
  }
}

Generate original, technically accurate, professional coding problems now.`;
  } else {
    const selectedLanguages = roleOrLanguages.join(", ");
    const problemCount = roleOrLanguages.length * 3;
    
    return `You are an AI Coding Test Generator. Generate exactly ${problemCount} coding problems.

CRITICAL REQUIREMENTS:
1. User selected languages: ${selectedLanguages}
2. Generate exactly 3 problems per language selected
3. Difficulty Distribution per language: 1 Easy, 1 Medium, 1 Hard
4. Each problem must be solvable in the selected language
5. Never repeat problems

EVERY PROBLEM MUST HAVE:
- Unique problem ID
- Language-specific function signature
- Clear, complete problem statement
- Sample input and output
- Clear constraints
- Expected time and space complexity
- Complete correct solution in the specified language
- Step-by-step explanation

OUTPUT MUST BE VALID JSON ONLY with this structure:
{
  "mode": "language",
  "selectedLanguages": [${roleOrLanguages.map(l => `"${l}"`).join(", ")}],
  "questions": [
    {
      "id": "P001",
      "language": "Language Name",
      "role": "Multi-Language",
      "difficulty": "Easy",
      "title": "Problem Title",
      "description": "Short description",
      "problemStatement": "Full problem statement",
      "functionSignature": "Language-specific function signature",
      "sampleInput": "Input example",
      "sampleOutput": "Expected output",
      "constraints": ["Constraint 1", "Constraint 2"],
      "expectedTimeComplexity": "O(n)",
      "expectedSpaceComplexity": "O(1)",
      "correctSolution": "Complete solution in specified language",
      "solutionExplanation": "Step-by-step explanation"
    }
    // ... ${problemCount - 1} more problems
  ],
  "test_rules": {
    "total_questions": ${problemCount},
    "timer_minutes": 30,
    "plagiarism_check": true,
    "auto_mark_on_timeout": true
  }
}

Generate original, technically accurate, professional coding problems now.`;
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
      const { mode, roleOrLanguages, userId } = await req.json();

      console.log('Generating coding test:', { mode, roleOrLanguages });

      const prompt = generateCodingTestPrompt(mode, roleOrLanguages);

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
        throw new Error(`Expected ${testData.test_rules.total_questions} problems, got ${testData.questions?.length || 0}`);
      }

      // Validate difficulty distribution (1 Easy, 1 Medium, 1 Hard per 3 problems)
      const difficulties: string[] = (testData.questions as Array<{ difficulty: string }>).map((q) => q.difficulty);
      const easyCount = difficulties.filter((d) => d === "Easy").length;
      const mediumCount = difficulties.filter((d) => d === "Medium").length;
      const hardCount = difficulties.filter((d) => d === "Hard").length;

      if (!(easyCount >= 1 && mediumCount >= 1 && hardCount >= 1)) {
        console.warn('Warning: Difficulty distribution not ideal', { easyCount, mediumCount, hardCount });
      }

      // Create session
      const sessionId = uuidv4();
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000); // 30 minutes

      const session: CodingTestSession = {
        session_id: sessionId,
        user_id: userId || 'anonymous',
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        current_question_index: 0,
        questions_json: testData.questions,
        user_solutions: [],
        status: 'ongoing'
      };

      // Store in database
      const { error: dbError } = await supabase
        .from('coding_test_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId || 'anonymous',
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          questions_json: testData.questions,
          user_solutions: [],
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

    } else if (action === 'get-problem') {
      const { sessionId, problemIndex } = await req.json();

      const { data: session, error } = await supabase
        .from('coding_test_sessions')
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
          .from('coding_test_sessions')
          .update({ status: 'expired' })
          .eq('session_id', sessionId);

        return new Response(
          JSON.stringify({ error: 'Test time expired', status: 'expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const problem = session.questions_json[problemIndex];
      const remainingTime = Math.max(0, Math.floor((new Date(session.end_time).getTime() - new Date().getTime()) / 1000));

      return new Response(
        JSON.stringify({
          problem,
          problemIndex,
          remainingTime,
          totalProblems: session.questions_json.length,
          userSolutions: session.user_solutions
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (action === 'submit-solution') {
      const { sessionId, problemIndex, code, language } = await req.json();

      const { data: session, error } = await supabase
        .from('coding_test_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const problem = session.questions_json[problemIndex];

      // Store solution (verdict assessment can be done server-side later)
      const updatedSolutions = [...session.user_solutions];
      updatedSolutions[problemIndex] = {
        questionId: problem.id,
        code,
        language,
        submittedAt: new Date().toISOString(),
        verdict: 'pending'
      };

      const nextIndex = problemIndex + 1;
      const newStatus = nextIndex >= session.questions_json.length ? 'completed' : 'ongoing';

      await supabase
        .from('coding_test_sessions')
        .update({
          user_solutions: updatedSolutions,
          current_question_index: nextIndex,
          status: newStatus
        })
        .eq('session_id', sessionId);

      return new Response(
        JSON.stringify({
          submitted: true,
          explanation: problem.solutionExplanation,
          nextIndex,
          status: newStatus,
          expectedComplexity: {
            time: problem.expectedTimeComplexity,
            space: problem.expectedSpaceComplexity
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (action === 'get-results') {
      const { sessionId } = await req.json();

      const { data: session, error } = await supabase
        .from('coding_test_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const timeTaken = Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / 1000);
      const totalSubmitted = session.user_solutions.length;
      const totalSkipped = session.questions_json.length - totalSubmitted;

      return new Response(
        JSON.stringify({
          totalProblems: session.questions_json.length,
          totalSubmitted,
          totalSkipped,
          totalTime: timeTaken,
          solutions: session.user_solutions,
          problems: session.questions_json
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
