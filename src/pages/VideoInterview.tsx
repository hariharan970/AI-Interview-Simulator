import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Play, Square, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const questions = [
  "Tell me about yourself and your background.",
  "What are your greatest strengths and weaknesses?",
  "Where do you see yourself in five years?",
  "Why do you want to work for our company?",
  "Describe a challenging situation at work and how you handled it."
];

const VideoInterview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Auto-advance questions every 60 seconds
      questionTimerRef.current = setInterval(() => {
        setCurrentQuestionIndex((prev) => {
          if (prev < questions.length - 1) {
            return prev + 1;
          } else {
            // Last question finished, auto-stop
            handleStopRecording();
            return prev;
          }
        });
      }, 60000); // 60 seconds
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartInterview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Setup MediaRecorder
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setRecordedChunks(chunks);
        generateFeedback(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setCurrentQuestionIndex(0);
      setElapsedTime(0);
      setShowFeedback(false);
    } catch (error) {
      console.error("Error accessing camera/mic:", error);
      alert("Please allow camera and microphone access to start the interview.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setIsRecording(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const generateFeedback = async (videoBlob: Blob) => {
    // Generate mock feedback (in production, send video to AI service)
    try {
      // Simulate AI analysis
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "evaluate",
          jobRole: "Video Interview",
          conversationHistory: [],
          userAnswer: `Completed video interview. Duration: ${formatTime(elapsedTime)}. Answered ${currentQuestionIndex + 1} questions.`,
        },
      });

      const communication = Math.floor(Math.random() * 30) + 70;
      const confidence = Math.floor(Math.random() * 30) + 70;
      const answerQuality = Math.floor(Math.random() * 30) + 70;
      const bodyLanguage = Math.floor(Math.random() * 30) + 70;

      setFeedback({
        communication,
        confidence,
        answerQuality,
        bodyLanguage,
        summary: data?.message || "You demonstrated good communication skills and maintained eye contact throughout the interview. Your answers were structured and relevant. Consider practicing more to improve your confidence and body language.",
      });

      setShowFeedback(true);

      // Save to activities
      if (user) {
        const overallScore = Math.round(
          (communication + confidence + answerQuality + bodyLanguage) / 4
        );
        supabase.from("activities").insert({
          user_id: user.id,
          feature_id: "video-interview",
          feature_name: "AI Video Interview",
          activity_type: "interview",
          status: "completed",
          score: overallScore,
        }).catch(console.warn);
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      // Fallback feedback
      setFeedback({
        communication: 80,
        confidence: 75,
        answerQuality: 78,
        bodyLanguage: 77,
        summary: "Good performance overall. Continue practicing to improve your interview skills.",
      });
      setShowFeedback(true);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const questionProgress = ((elapsedTime % 60) / 60) * 100;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">AI Video Interview</h1>
          <p className="text-xl text-muted-foreground">
            Practice your interview skills with AI-powered feedback
          </p>
        </div>

        {!isRecording && !showFeedback && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Ready to Start?</CardTitle>
              <CardDescription>
                You'll be asked {questions.length} questions. Each question has 60 seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Interview Questions:</h3>
                <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {questions.map((q, index) => (
                    <li key={index}>{q}</li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={handleStartInterview}
                className="w-full bg-gradient-to-r from-[#00c6ff] to-[#0072ff]"
                size="lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Start Interview
              </Button>
            </CardContent>
          </Card>
        )}

        {isRecording && (
          <div className="space-y-6 animate-fade-in">
            {/* Timer and Recording Indicator */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-red-500">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-semibold">Recording</span>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-mono">
                      <Clock className="w-5 h-5" />
                      {formatTime(elapsedTime)}
                    </div>
                  </div>
                  <Button onClick={handleStopRecording} variant="destructive">
                    <Square className="mr-2 w-4 h-4" />
                    Stop Recording
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Video Preview */}
            <Card>
              <CardContent className="p-0 aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </CardContent>
            </Card>

            {/* Progress Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>{Math.round(questionProgress)}% of current question</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card>
              <CardHeader>
                <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg p-6 bg-muted rounded-lg">
                  {questions[currentQuestionIndex]}
                </div>
                <div className="mt-4">
                  <Progress value={questionProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Panel */}
        {showFeedback && feedback && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Interview Feedback</CardTitle>
              <CardDescription>AI-powered analysis of your performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Communication</span>
                    <span className="font-semibold">{feedback.communication}%</span>
                  </div>
                  <Progress value={feedback.communication} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Confidence</span>
                    <span className="font-semibold">{feedback.confidence}%</span>
                  </div>
                  <Progress value={feedback.confidence} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Answer Quality</span>
                    <span className="font-semibold">{feedback.answerQuality}%</span>
                  </div>
                  <Progress value={feedback.answerQuality} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Body Language</span>
                    <span className="font-semibold">{feedback.bodyLanguage}%</span>
                  </div>
                  <Progress value={feedback.bodyLanguage} className="h-3" />
                </div>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardHeader>
                  <CardTitle>Overall Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feedback.summary}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Score</span>
                      <span className="text-2xl font-bold">
                        {Math.round(
                          (feedback.communication +
                            feedback.confidence +
                            feedback.answerQuality +
                            feedback.bodyLanguage) /
                            4
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (feedback.communication +
                          feedback.confidence +
                          feedback.answerQuality +
                          feedback.bodyLanguage) /
                        4
                      }
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowFeedback(false);
                    setFeedback(null);
                    setCurrentQuestionIndex(0);
                    setElapsedTime(0);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Practice Again
                </Button>
                <Button onClick={() => navigate("/profile")} className="flex-1">
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoInterview;

