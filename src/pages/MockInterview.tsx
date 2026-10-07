import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, Send, RotateCcw, Mic, MicOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const jobRoles = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
  "DevOps Engineer",
  "Business Analyst",
  "Marketing Manager",
  "Sales Representative",
];

const MockInterview = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const startInterview = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose a job role to begin your mock interview",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: { 
          action: "start", 
          jobRole: selectedRole,
          conversationHistory: []
        },
      });

      if (error) {
        // Handle CORS or function not deployed errors
        if (error.message?.includes('CORS') || error.message?.includes('Failed to send')) {
          throw new Error("The interview service is not available. Please ensure the Supabase Edge Function is deployed and configured.");
        }
        throw error;
      }

      if (!data || !data.message) {
        throw new Error("Invalid response from interview service");
      }

      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages([assistantMessage]);
      setConversationHistory(data.conversationHistory || [assistantMessage]);
      setInterviewStarted(true);

      toast({
        title: "Interview started!",
        description: "Answer the questions to the best of your ability",
      });
    } catch (error: any) {
      console.error("Error starting interview:", error);
      const errorMessage = error?.message || "Failed to start interview. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({
        title: "Please provide an answer",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: userAnswer };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setUserAnswer("");

    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "evaluate",
          jobRole: selectedRole,
          conversationHistory,
          userAnswer: userAnswer,
        },
      });

      if (error) {
        // Handle CORS or function not deployed errors
        if (error.message?.includes('CORS') || error.message?.includes('Failed to send')) {
          throw new Error("The interview service is not available. Please ensure the Supabase Edge Function is deployed and configured.");
        }
        throw error;
      }

      if (!data || !data.message) {
        throw new Error("Invalid response from interview service");
      }

      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages((prev) => [...prev, assistantMessage]);
      setConversationHistory(data.conversationHistory || [...conversationHistory, userMessage, assistantMessage]);

      // Save activity to database (silently fail if table doesn't exist)
      try {
        await supabase.from("activities").insert({
          user_id: user.id,
          feature_id: "mock-interview",
          feature_name: "AI Mock Interview",
          activity_type: "interview",
          status: "in-progress",
        });
      } catch (dbError) {
        // Silently fail - activities table might not exist or RLS might block it
        console.warn("Could not save activity:", dbError);
      }

    } catch (error: any) {
      console.error("Error submitting answer:", error);
      const errorMessage = error?.message || "Failed to process your answer. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setMessages([]);
    setUserAnswer("");
    setConversationHistory([]);
    setSelectedRole("");
    if (isRecording) {
      stopRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Speak your answer clearly",
      });
    } catch (error: any) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const { data, error } = await supabase.functions.invoke("speech-to-text", {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (data.text) {
          setUserAnswer(data.text);
          toast({
            title: "Transcription complete",
            description: "Your answer has been transcribed",
          });
        }
      };
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">AI Mock Interview</h1>
          <p className="text-lg text-muted-foreground">
            Practice your interview skills with AI-powered feedback
          </p>
        </div>

        {!interviewStarted ? (
          <Card>
            <CardHeader>
              <CardTitle>Start Your Mock Interview</CardTitle>
              <CardDescription>
                Select a job role to begin. The AI will ask relevant questions and provide feedback on your answers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Job Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a job role" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={startInterview}
                disabled={isLoading || !selectedRole}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Interview: {selectedRole}</CardTitle>
                    <CardDescription>Answer questions and receive feedback</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetInterview}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        message.role === "assistant"
                          ? "bg-muted"
                          : "bg-primary/10 ml-8"
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {message.role === "assistant" ? "Interviewer" : "You"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your answer here or use voice recording..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={isLoading || isTranscribing}
                    rows={4}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        submitAnswer();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading || isTranscribing}
                      variant="outline"
                      className="flex-1"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          Stop Recording
                        </>
                      ) : isTranscribing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Voice Answer
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={submitAnswer}
                      disabled={isLoading || !userAnswer.trim() || isTranscribing}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
