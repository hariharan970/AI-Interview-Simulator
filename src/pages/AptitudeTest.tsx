import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { testData, categoryMeta, Question } from "@/data/aptitudeTestData";
import { Clock, TrendingUp, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// NOTE: client-side use of @google/generative-ai is for local testing only.
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY ?? "");

// ---------- Helper fetchers (proxy-first, then client fallback) ----------
async function fetchResearchPapersProxy(query: string, max = 5) {
  try {
    const res = await fetch(`/api/research?q=${encodeURIComponent(query)}&num=${max}`);
    if (!res.ok) throw new Error("proxy failed " + res.status);
    const data = await res.json();
    const items = data.items || data;
    return (items || []).map((it: any) => ({
      title: it.title || it.snippet || "Untitled",
      snippet: it.snippet || "",
      link: it.link || it.formattedUrl || it.url || "",
      displayLink: it.displayLink || it.displayUrl || "",
    }));
  } catch (err) {
    console.warn("CSE proxy failed:", err);
    return null;
  }
}

async function fetchYoutubeProxy(query: string, max = 5) {
  try {
    const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}&max=${max}`);
    if (!res.ok) throw new Error("proxy failed " + res.status);
    const data = await res.json();
    const items = data.items || data;
    return (items || [])
      .map((it: any) => {
        const vId = it.id?.videoId || (it.id?.kind === "youtube#video" && it.id?.videoId) || it.resourceId?.videoId || null;
        if (!vId) return null;
        return {
          videoId: vId,
          title: it.snippet?.title || "",
          description: it.snippet?.description || "",
          channelTitle: it.snippet?.channelTitle || "",
          publishTime: it.snippet?.publishTime || "",
          thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || "",
          url: `https://www.youtube.com/watch?v=${vId}`,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn("YT proxy failed:", err);
    return null;
  }
}

async function fetchResearchPapersClient(query: string, maxResults = 5) {
  try {
    const key = import.meta.env.VITE_GOOGLE_CSE_KEY;
    const cx = import.meta.env.VITE_GOOGLE_CSE_CX;
    if (!key || !cx) {
      console.warn("CSE keys missing (client)");
      return [];
    }
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=${maxResults}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("CSE client error", res.status);
      return [];
    }
    const data = await res.json();
    const items = data.items || [];
    return items.map((it: any) => ({
      title: it.title || it.snippet || "Untitled",
      snippet: it.snippet || "",
      link: it.link || it.formattedUrl || "",
      displayLink: it.displayLink || "",
    }));
  } catch (err) {
    console.error("fetchResearchPapersClient error", err);
    return [];
  }
}

async function fetchYoutubeVideosClient(query: string, maxResults = 5) {
  try {
    const key = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!key) {
      console.warn("YT key missing (client)");
      return [];
    }
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("YT client error", res.status);
      return [];
    }
    const data = await res.json();
    const items = data.items || [];
    return items
      .map((item: any) => {
        const videoId = item.id?.videoId || (item.id?.kind === "youtube#video" && item.id?.videoId) || null;
        if (!videoId) return null;
        return {
          videoId,
          title: item.snippet?.title || "",
          description: item.snippet?.description || "",
          channelTitle: item.snippet?.channelTitle || "",
          publishTime: item.snippet?.publishTime || "",
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("fetchYoutubeVideosClient error", err);
    return [];
  }
}
// ----------------------------------------------------------------------

const AptitudeTest: React.FC = () => {
  console.log("ENV", {
    CSE: Boolean(import.meta.env.VITE_GOOGLE_CSE_KEY && import.meta.env.VITE_GOOGLE_CSE_CX),
    YT: Boolean(import.meta.env.VITE_YOUTUBE_API_KEY),
    GEMINI: Boolean(import.meta.env.VITE_GEMINI_API_KEY),
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  // core state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [isTestStarted, setIsTestStarted] = useState<boolean>(false);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [percentile, setPercentile] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // recommendations
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [recommendedPapers, setRecommendedPapers] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Normalize questions (ensure numeric id and numeric correctAnswer)
  const normalizeQuestions = (qs: any[]): Question[] =>
    (qs || []).map((q: any, idx: number) => {
      const rawCorrect = q.correctAnswer;
      let correctAnswerIndex = 0;
      if (typeof rawCorrect === "number") correctAnswerIndex = rawCorrect;
      else if (typeof rawCorrect === "string") {
        const asNum = Number(rawCorrect);
        if (!Number.isNaN(asNum)) correctAnswerIndex = asNum;
        else if (rawCorrect.length === 1 && /[A-Da-d]/.test(rawCorrect)) correctAnswerIndex = rawCorrect.toUpperCase().charCodeAt(0) - 65;
      }
      return {
        id: Number(q.id ?? idx),
        question: q.question ?? `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["A", "B", "C", "D"],
        correctAnswer: correctAnswerIndex,
        category: q.category ?? null,
        difficulty: q.difficulty ?? null,
        explanation: q.explanation ?? null,
        tip: q.tip ?? null,
      } as Question;
    });

  // AI generation
  const generateAIQuestions = async (category: string): Promise<Question[] | null> => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
Generate exactly 20 aptitude questions for the category "${category}".
Return a JSON array (ONLY JSON, no explanation) of 20 objects with this schema:
{
  "id": number,
  "question": string,
  "options": [string, string, string, string],
  "correctAnswer": number,
  "category": string,
  "difficulty": string,
  "explanation": string,
  "tip": string
}
Return JSON array only.
`.trim();

      let result: any;
      try {
        result = await model.generateContent(prompt);
      } catch {
        result = await model.generateContent({ contents: [prompt] });
      }
      if (!result) throw new Error("Empty model result");

      let text: string | null = null;
      if (typeof result?.response?.text === "function") text = result.response.text();
      else if (typeof result?.response?.text === "string") text = result.response.text;
      else if (Array.isArray(result?.candidates) && result.candidates[0]) text = result.candidates[0]?.content?.text ?? null;
      else if (typeof result?.output?.text === "string") text = result.output.text;

      if (!text) throw new Error("No text from AI");
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const match = text.match(/(\[.*\])/s);
        if (match) parsed = JSON.parse(match[1]);
        else throw e;
      }

      if (!Array.isArray(parsed) || parsed.length !== 20) {
        console.warn("AI returned invalid array length:", parsed?.length);
        return null;
      }

      return normalizeQuestions(parsed);
    } catch (err) {
      console.error("AI generation error:", err);
      return null;
    }
  };

  // Recommendations loader
  const loadRecommendations = async (weakAreas: string[], selectedCat: string | null) => {
    setRecLoading(true);
    setRecommendedPapers([]);
    setRecommendedVideos([]);
    try {
      const base = selectedCat ?? "Aptitude Test";
      const frag = weakAreas && weakAreas.length ? " " + weakAreas.join(" ") : "";
      const query = `${base}${frag} tutorial OR explanation site:arxiv.org OR site:edu`;

      let papers = await fetchResearchPapersProxy(query, 5);
      let videos = await fetchYoutubeProxy(query, 5);

      if (papers === null) papers = await fetchResearchPapersClient(query, 5);
      if (videos === null) videos = await fetchYoutubeVideosClient(query, 5);

      setRecommendedPapers(papers || []);
      setRecommendedVideos(videos || []);
      console.log("Recommendations loaded", { papers: (papers || []).length, videos: (videos || []).length });
    } catch (err) {
      console.error("loadRecommendations failed", err);
      setRecommendedPapers([]);
      setRecommendedVideos([]);
    } finally {
      setRecLoading(false);
    }
  };

  // Calculate results
  const calculateResults = useCallback(() => {
    console.log("[TEST] calculateResults START", { questionsLength: questions.length, answers });
    try {
      let correct = 0;
      questions.forEach((question) => {
        const qId = Number(question.id);
        const userAns = answers[qId];
        const correctIndex = Number(question.correctAnswer);
        if (userAns === correctIndex) correct++;
      });

      const percentage = questions.length ? Math.round((correct / questions.length) * 100) : 0;
      setScore(correct);
      setPercentile(percentage);
      setIsTestFinished(true);

      // Save activity (safe pattern)
      if (user) {
        const insertData: any = {
          user_id: user.id,
          feature_id: "aptitude-test",
          feature_name: `Aptitude Test: ${selectedCategory}`,
          activity_type: "aptitude",
          status: "completed",
          score: percentage,
          completed_at: new Date().toISOString(),
        };
        (async () => {
          try {
            const { data, error } = await supabase.from("activities").insert(insertData);
            if (error) console.warn("Failed to save activity:", error);
          } catch (e) {
            console.warn("Failed to save activity (exception):", e);
          }
        })();
      }

      // Compute weak areas and fetch recs
      const wrong = questions.filter((q) => {
        const qId = Number(q.id);
        const userAns = answers[qId];
        const correctIndex = Number(q.correctAnswer);
        return userAns === undefined || userAns !== correctIndex;
      });

      const weakSet = new Set<string>();
      for (let i = 0; i < Math.min(6, wrong.length); i++) {
        const q: any = wrong[i];
        if (q.category) weakSet.add(q.category);
        else if (q.difficulty) weakSet.add(q.difficulty);
        else {
          const keywords = (q.question || "").split(/\s+/).slice(0, 4);
          keywords.forEach((w) => weakSet.add(w.replace(/[^a-zA-Z]/g, "")));
        }
      }
      const weakAreas = Array.from(weakSet).filter(Boolean);
      loadRecommendations(weakAreas, selectedCategory);
    } catch (err) {
      console.error("[TEST] calculateResults ERROR", err);
    }
  }, [answers, questions, selectedCategory, user]);

  const handleAutoSubmit = useCallback(() => {
    setIsTestStarted(false);
    calculateResults();
  }, [calculateResults]);

  useEffect(() => {
    if (isTestStarted && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestStarted, timeLeft, handleAutoSubmit]);

  // Handlers
  const handleStartTest = async (category: string) => {
    setSelectedCategory(category);
    setIsTestFinished(false); // ensure results view cleared
    setTimeLeft(categoryMeta[category].timeMinutes * 60);
    setIsTestStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setStartTime(Date.now());
    setTimeTaken(0);
    setRecommendedPapers([]);
    setRecommendedVideos([]);

    const aiQuestions = await generateAIQuestions(category);
    if (aiQuestions && aiQuestions.length === 20) setQuestions(normalizeQuestions(aiQuestions));
    else {
      console.warn("Using fallback questions because AI failed");
      const fallback = testData[category as keyof typeof testData] || [];
      setQuestions(normalizeQuestions(fallback));
    }
  };

  const handleAnswerChange = (questionId: number | string, answerIndex: number) => {
    const idNum = Number(questionId);
    setAnswers((prev) => ({ ...prev, [idNum]: answerIndex }));
  };

  const handleNext = () => setCurrentQuestionIndex((i) => Math.min(i + 1, questions.length - 1));
  const handlePrevious = () => setCurrentQuestionIndex((i) => Math.max(i - 1, 0));
  const handleQuestionClick = (index: number) => setCurrentQuestionIndex(index);

  const handleFinish = () => {
    console.log("[TEST] handleFinish called", { currentQuestionIndex, answersLength: Object.keys(answers).length });
    setIsTestStarted(false);
    setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
    calculateResults();
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setIsTestStarted(false);
    setIsTestFinished(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setScore(0);
    setPercentile(0);
    setTimeLeft(1800);
    setRecommendedPapers([]);
    setRecommendedVideos([]);
  };

  const loadDummyRecommendations = () => {
    setRecommendedVideos([
      {
        title: "Dummy: Improve Logical Reasoning — Crash Course",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "",
        channelTitle: "Dummy Channel",
        publishTime: new Date().toISOString(),
        description: "A dummy video to verify UI rendering.",
      },
    ]);
    setRecommendedPapers([
      {
        title: "Dummy Paper on Reasoning",
        link: "https://arxiv.org/abs/0000.0000",
        snippet: "Dummy snippet for testing.",
        displayLink: "arxiv.org",
      },
    ]);
  };

  const timerColor = timeLeft <= 300 ? "text-red-500" : "text-foreground";

  // ---------- RENDER ----------

  // 1) RESULTS view must be checked before "category selection" to avoid flipping
  if (isTestFinished) {
    const review = questions.map((q) => {
      const userAns = answers[Number(q.id)];
      const correctIndex = Number(q.correctAnswer);
      return {
        ...q,
        userAns,
        userChoiceLabel: typeof userAns === "number" ? String.fromCharCode(65 + userAns) : "N/A",
        correctLabel: typeof correctIndex === "number" ? String.fromCharCode(65 + correctIndex) : "N/A",
        explanation: (q as any).explanation || "Explanation not provided.",
        tip: (q as any).tip || `Tip: Review core ${q.category || "concepts"} and practice similar problems.`,
      };
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Test Results</CardTitle>
              <CardDescription className="text-center capitalize">{selectedCategory} Aptitude Test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{score}/{questions.length}</div>
                    <div className="text-sm text-muted-foreground mt-2">Correct Answers</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{percentile}%</div>
                    <div className="text-sm text-muted-foreground mt-2">Percentile</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{formatTime(timeTaken)}</div>
                    <div className="text-sm text-muted-foreground mt-2">Time Taken</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Instant Feedback — Question-by-question review</h3>
                <div className="space-y-4">
                  {review.map((r, idx) => (
                    <Card key={r.id} className="border">
                      <CardContent>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">Q{idx + 1}. {r.question}</div>
                            <div className="mt-2 space-y-1">
                              {r.options.map((opt: string, i: number) => {
                                const label = String.fromCharCode(65 + i);
                                const isUser = r.userAns === i;
                                const isCorrect = r.correctAnswer === i;
                                return (
                                  <div key={i} className={`flex items-center gap-3 p-2 rounded ${isCorrect ? "bg-green-50 border border-green-200" : isUser ? "bg-yellow-50 border border-yellow-200" : ""}`}>
                                    <div className="w-6 font-semibold">{label}.</div>
                                    <div className="flex-1">{opt}</div>
                                    {isCorrect && <Badge variant="outline">Correct</Badge>}
                                    {!isCorrect && isUser && <Badge variant="secondary">Your answer</Badge>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Category: {(r as any).category || "—"}</div>
                            <div className="text-sm text-muted-foreground">Difficulty: {(r as any).difficulty || "—"}</div>
                          </div>
                        </div>

                        <hr className="my-3" />

                        <div>
                          <div className="font-semibold">Correct Answer: {r.correctLabel}</div>
                          <div className="mt-2 text-sm">{r.explanation}</div>
                          <div className="mt-2 text-sm italic text-muted-foreground">{r.tip}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Recommended next steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {score >= 16 ? "Excellent — try harder sets and projects." : score >= 12 ? "Good — focus on weak areas listed above." : "Revise fundamentals; practice targeted problems."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suggested Videos & Papers</CardTitle>
                  <CardDescription>Resources selected by keywords from your incorrect answers</CardDescription>
                </CardHeader>
                <CardContent>
                  {recLoading ? (
                    <div>Loading resources...</div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">YouTube / Courses</h4>
                        {recommendedVideos.length === 0 && <div className="text-sm text-muted-foreground">No video recommendations found.</div>}
                        <ul className="space-y-3">
                          {recommendedVideos.map((v, i) => (
                            <li key={i} className="flex gap-3 items-start">
                              {v.thumbnail && <img src={v.thumbnail} alt={v.title} className="w-36 h-20 object-cover rounded" />}
                              <div>
                                <a href={v.url} target="_blank" rel="noopener noreferrer" className="font-medium">{v.title}</a>
                                <div className="text-xs text-muted-foreground">{v.channelTitle} • {v.publishTime ? new Date(v.publishTime).toLocaleDateString() : ""}</div>
                                <p className="text-sm mt-1">{v.description?.slice(0, 160)}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Research Papers / Articles</h4>
                        {recommendedPapers.length === 0 && <div className="text-sm text-muted-foreground">No papers found.</div>}
                        <ul className="space-y-2">
                          {recommendedPapers.map((p, i) => (
                            <li key={i}>
                              <a href={p.link} target="_blank" rel="noopener noreferrer" className="font-medium">{p.title}</a>
                              <div className="text-sm text-muted-foreground">{p.displayLink}</div>
                              <p className="text-sm">{p.snippet?.slice(0, 200)}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button onClick={handleReset} variant="outline" className="flex-1">Take Another Test</Button>
                <Button onClick={loadDummyRecommendations} variant="ghost" className="flex-1">Load Dummy Recommendations</Button>
                <Button onClick={() => navigate("/profile")} className="flex-1">View Profile</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 2) Category selection (only after results check)
  if (!selectedCategory || !isTestStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">AI Aptitude Test</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose a category to generate 20 questions (30 minutes).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {Object.keys(categoryMeta).map((category) => (
              <Card key={category} className="hover-lift animate-fade-in cursor-pointer" onClick={() => handleStartTest(category)}>
                <CardHeader>
                  <CardTitle className="capitalize flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    {category}
                  </CardTitle>
                  <CardDescription>{categoryMeta[category].total} questions • {categoryMeta[category].timeMinutes} minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Test</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3) Defensive: loading questions
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading questions…</div>
      </div>
    );
  }

  // 4) Test view
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Question not available</div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
      <div className="fixed top-20 right-4 z-50">
        <Card className="shadow-lg">
          <CardContent className="pt-4">
            <div className={`text-2xl font-mono font-bold ${timerColor} flex items-center gap-2`}>
              <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{answeredCount} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
              <CardDescription>{(currentQuestion as any).category ?? ""} • {(currentQuestion as any).difficulty ?? ""}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg">{currentQuestion.question}</div>

              <RadioGroup
                value={answers[currentQuestion.id] !== undefined ? answers[currentQuestion.id].toString() : ""}
                onValueChange={(v) => handleAnswerChange(currentQuestion.id, parseInt(v))}
              >
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                      <RadioGroupItem value={i.toString()} id={`opt-${currentQuestion.id}-${i}`} />
                      <Label htmlFor={`opt-${currentQuestion.id}-${i}`} className="flex-1 cursor-pointer">
                        {String.fromCharCode(65 + i)}. {opt}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="flex gap-3">
                <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0} variant="outline">Previous</Button>
                <Button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1} variant="outline">Next</Button>
                <Button onClick={handleFinish} className="ml-auto bg-gradient-to-r from-[#00c6ff] to-[#0072ff]">Finish Test</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AptitudeTest;
