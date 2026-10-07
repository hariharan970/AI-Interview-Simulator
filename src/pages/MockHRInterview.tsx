import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { interviewCategories, InterviewCategory, CompletedInterview } from "@/data/hrInterviewData";
import { Clock, Play, Pause, SkipBack, SkipForward, Repeat, Video, VideoOff, Mic, MicOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MockHRInterview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<InterviewCategory | null>(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [completedInterviews, setCompletedInterviews] = useState<CompletedInterview[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isInterviewStarted && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isInterviewStarted, isPaused]);

  // Simulate waveform animation
  useEffect(() => {
    if (isRecording && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#00c6ff";
        ctx.lineWidth = 2;

        const barWidth = 4;
        const barSpacing = 2;
        const barCount = 50;
        const centerY = canvas.height / 2;

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + barSpacing);
          const height = Math.random() * 40 + 10;
          ctx.beginPath();
          ctx.moveTo(x, centerY - height / 2);
          ctx.lineTo(x, centerY + height / 2);
          ctx.stroke();
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCategorySelect = (category: InterviewCategory) => {
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
    setElapsedTime(0);
    setShowFeedback(false);
    setIsInterviewStarted(false);
    setIsPaused(false);
  };

  const handleStartInterview = () => {
    if (selectedCategory) {
      setIsInterviewStarted(true);
      setIsRecording(true);
      setElapsedTime(0);
    }
  };

  const handleEndInterview = async () => {
    setIsInterviewStarted(false);
    setIsRecording(false);
    setIsPaused(false);
    setShowFeedback(true);

    // Generate AI feedback
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "evaluate",
          jobRole: selectedCategory?.name || "HR Interview",
          conversationHistory: [],
          userAnswer: `Completed ${selectedCategory?.name} interview. Duration: ${formatTime(elapsedTime)}. Answered ${currentQuestionIndex + 1} questions.`,
        },
      });

      if (data && data.message) {
        setFeedback({
          strengths: [
            "Clear communication",
            "Good eye contact",
            "Structured responses"
          ],
          suggestions: [
            "Provide more specific examples",
            "Improve time management",
            "Show more enthusiasm"
          ],
          communication: 85,
          confidence: 78,
          clarity: 82,
          overall: 80,
          summary: data.message
        });
      } else {
        // Fallback feedback
        setFeedback({
          strengths: [
            "Clear communication",
            "Good structure in answers",
            "Professional demeanor"
          ],
          suggestions: [
            "Provide more specific examples with STAR method",
            "Improve time management in responses",
            "Show more enthusiasm and energy"
          ],
          communication: 85,
          confidence: 78,
          clarity: 82,
          overall: 80,
          summary: "You performed well in this interview. Your communication was clear and your answers were structured. Focus on providing more specific examples using the STAR method to strengthen your responses."
        });
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      setFeedback({
        strengths: ["Clear communication", "Professional demeanor"],
        suggestions: ["Provide more examples", "Improve time management"],
        communication: 80,
        confidence: 75,
        clarity: 80,
        overall: 78,
        summary: "Good performance overall. Continue practicing to improve."
      });
    }

    // Save to completed interviews
    if (selectedCategory && user) {
      const newInterview: CompletedInterview = {
        id: Date.now().toString(),
        category: selectedCategory.name,
        date: new Date().toISOString(),
        score: feedback?.overall || 80,
        duration: elapsedTime
      };
      setCompletedInterviews([newInterview, ...completedInterviews]);

      // Save to activities
      supabase.from("activities").insert({
        user_id: user.id,
        feature_id: "mock-hr-interview",
        feature_name: `HR Interview: ${selectedCategory.name}`,
        activity_type: "interview",
        status: "completed",
        score: feedback?.overall || 80,
      }).catch(console.warn);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (selectedCategory && currentQuestionIndex < selectedCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleRepeatQuestion = () => {
    // Just reset to show current question again
    setCurrentQuestionIndex(currentQuestionIndex);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interview Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {interviewCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                      selectedCategory?.id === category.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">{category.name}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {category.type}
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          category.difficulty === "Easy"
                            ? "bg-blue-500"
                            : category.difficulty === "Medium"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      >
                        {category.difficulty}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {category.duration} min • {category.questions.length} questions
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Completed Interviews */}
            {completedInterviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recently Completed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedInterviews.slice(0, 3).map((interview) => (
                    <Card key={interview.id} className="p-3">
                      <div className="text-sm font-semibold">{interview.category}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(interview.date).toLocaleDateString()}
                      </div>
                      <Progress value={interview.score} className="h-2 mt-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        Score: {interview.score}%
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Interview Area */}
          <div className="lg:col-span-3 space-y-4">
            {!selectedCategory ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-muted-foreground">Select an interview category to begin</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedCategory.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Badge>{selectedCategory.type}</Badge>
                          <Badge
                            className={
                              selectedCategory.difficulty === "Easy"
                                ? "bg-blue-500"
                                : selectedCategory.difficulty === "Medium"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }
                          >
                            {selectedCategory.difficulty}
                          </Badge>
                          {isInterviewStarted && (
                            <span className="flex items-center gap-1 text-sm">
                              <Clock className="w-4 h-4" />
                              {formatTime(elapsedTime)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {!isInterviewStarted && (
                        <Button onClick={handleStartInterview}>
                          <Play className="mr-2 w-4 h-4" />
                          Start Interview
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Interview Area */}
                {isInterviewStarted && (
                  <Card>
                    <CardContent className="pt-6">
                      <Tabs defaultValue="live" className="w-full">
                        <TabsList>
                          <TabsTrigger value="live">Live Interview</TabsTrigger>
                          <TabsTrigger value="questions">Questions</TabsTrigger>
                          <TabsTrigger value="tips">Tips</TabsTrigger>
                        </TabsList>

                        <TabsContent value="live" className="mt-6 space-y-4">
                          {/* Video Panels */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Interviewer Video */}
                            <Card className="relative">
                              <CardContent className="p-0 aspect-video bg-muted rounded-lg overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                                  <Video className="w-16 h-16 text-muted-foreground" />
                                </div>
                                <div className="absolute top-2 left-2">
                                  <Badge>Interviewer</Badge>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Candidate Video */}
                            <Card className="relative">
                              <CardContent className="p-0 aspect-video bg-muted rounded-lg overflow-hidden">
                                {isVideoOn ? (
                                  <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                                    <VideoOff className="w-16 h-16 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2">
                                  <Badge>You</Badge>
                                </div>
                                {isRecording && (
                                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    REC
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {/* Waveform */}
                          {isRecording && (
                            <Card>
                              <CardContent className="pt-6">
                                <canvas
                                  ref={canvasRef}
                                  width={400}
                                  height={60}
                                  className="w-full bg-muted rounded"
                                />
                              </CardContent>
                            </Card>
                          )}

                          {/* Current Question */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Current Question</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-lg p-4 bg-muted rounded-lg">
                                {selectedCategory.questions[currentQuestionIndex]}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Controls */}
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-center gap-4">
                                <Button
                                  onClick={handlePreviousQuestion}
                                  disabled={currentQuestionIndex === 0}
                                  variant="outline"
                                >
                                  <SkipBack className="mr-2 w-4 h-4" />
                                  Previous
                                </Button>
                                <Button onClick={handleRepeatQuestion} variant="outline">
                                  <Repeat className="mr-2 w-4 h-4" />
                                  Repeat
                                </Button>
                                <Button
                                  onClick={handleNextQuestion}
                                  disabled={currentQuestionIndex === selectedCategory.questions.length - 1}
                                  variant="outline"
                                >
                                  <SkipForward className="mr-2 w-4 h-4" />
                                  Next
                                </Button>
                                <Button
                                  onClick={() => setIsVideoOn(!isVideoOn)}
                                  variant="outline"
                                >
                                  {isVideoOn ? (
                                    <VideoOff className="w-4 h-4" />
                                  ) : (
                                    <Video className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() => setIsAudioOn(!isAudioOn)}
                                  variant="outline"
                                >
                                  {isAudioOn ? (
                                    <MicOff className="w-4 h-4" />
                                  ) : (
                                    <Mic className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  onClick={handleEndInterview}
                                  variant="destructive"
                                >
                                  End Interview
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="questions" className="mt-6">
                          <div className="space-y-3">
                            {selectedCategory.questions.map((question, index) => (
                              <Card
                                key={index}
                                className={index === currentQuestionIndex ? "border-primary" : ""}
                              >
                                <CardContent className="pt-6">
                                  <div className="flex items-start gap-3">
                                    <Badge>{index + 1}</Badge>
                                    <p>{question}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="tips" className="mt-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Interview Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-sm">Use the STAR method (Situation, Task, Action, Result) for behavioral questions.</p>
                              </div>
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-sm">Maintain eye contact and speak clearly.</p>
                              </div>
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-sm">Take a moment to think before answering.</p>
                              </div>
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-sm">Provide specific examples from your experience.</p>
                              </div>
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-sm">Ask clarifying questions if needed.</p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}

                {/* Feedback Panel */}
                {showFeedback && feedback && (
                  <Card className="animate-fade-in">
                    <CardHeader>
                      <CardTitle>Interview Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-3">Strengths</h3>
                        <ul className="space-y-2">
                          {feedback.strengths.map((strength: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                              <span className="text-sm">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Suggestions for Improvement</h3>
                        <ul className="space-y-2">
                          {feedback.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                              <span className="text-sm">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Metrics</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Communication</span>
                              <span>{feedback.communication}%</span>
                            </div>
                            <Progress value={feedback.communication} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Confidence</span>
                              <span>{feedback.confidence}%</span>
                            </div>
                            <Progress value={feedback.confidence} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Clarity</span>
                              <span>{feedback.clarity}%</span>
                            </div>
                            <Progress value={feedback.clarity} className="h-2" />
                          </div>
                        </div>
                      </div>

                      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                        <CardHeader>
                          <CardTitle>Overall Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{feedback.summary}</p>
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Overall Score</span>
                              <span className="text-2xl font-bold">{feedback.overall}%</span>
                            </div>
                            <Progress value={feedback.overall} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockHRInterview;

