import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { discussionTopics, DiscussionTopic, FeedbackMetrics } from "@/data/groupDiscussionData";
import { Clock, Video, VideoOff, Mic, MicOff, MessageSquare, PhoneOff, X } from "lucide-react";

const GroupDiscussion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);
  const [isInRoom, setIsInRoom] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<FeedbackMetrics | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isInRoom && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleEndCall();
            return 0;
          }
          return prev - 1;
        });
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
  }, [isInRoom, timeLeft]);

  useEffect(() => {
    if (isFeedbackOpen && isInRoom) {
      feedbackTimerRef.current = setInterval(() => {
        // Simulate feedback updates
        setFeedback((prev) => {
          if (!prev) {
            return {
              speakingTime: Math.floor(Math.random() * 30) + 20,
              engagement: Math.floor(Math.random() * 20) + 70,
              keyPoints: [
                "Made relevant points about the topic",
                "Engaged with other participants",
                "Provided thoughtful insights"
              ],
              suggestions: [
                "Try to speak more frequently",
                "Build on others' ideas",
                "Ask clarifying questions"
              ],
            };
          }
          return {
            ...prev,
            speakingTime: Math.min(100, prev.speakingTime + Math.random() * 2),
            engagement: Math.min(100, prev.engagement + Math.random() * 1),
          };
        });
      }, 3000);
    } else {
      if (feedbackTimerRef.current) {
        clearInterval(feedbackTimerRef.current);
      }
    }

    return () => {
      if (feedbackTimerRef.current) {
        clearInterval(feedbackTimerRef.current);
      }
    };
  }, [isFeedbackOpen, isInRoom]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTopicSelect = async (topic: DiscussionTopic) => {
    setSelectedTopic(topic);
    setTimeLeft(topic.durationMinutes * 60);
    setIsFeedbackOpen(false);
    setFeedback(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setIsInRoom(true);
    } catch (error) {
      console.error("Error accessing camera/mic:", error);
      alert("Please allow camera and microphone access to join the discussion.");
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsInRoom(false);
    setSelectedTopic(null);
    setIsFeedbackOpen(false);
    setFeedback(null);
    setTimeLeft(900);
  };

  const handleVideoToggle = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const handleAudioToggle = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

  if (!user) {
    return null;
  }

  // Topic Selection View
  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold mb-4">Group Discussion</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Practice your group discussion skills with AI participants. Each session lasts 15 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {discussionTopics.map((topic) => (
              <Card
                key={topic.id}
                className="hover-lift animate-fade-in cursor-pointer"
                onClick={() => handleTopicSelect(topic)}
              >
                <CardHeader>
                  <CardTitle>{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {topic.durationMinutes} min
                    </div>
                    <Badge>{topic.participants} participants</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Discussion Room View
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
      {/* Timer */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="shadow-lg">
          <CardContent className="pt-4">
            <div className="text-2xl font-mono font-bold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Discussion Area */}
          <div className={isFeedbackOpen ? "lg:col-span-3 transition-all duration-300" : "lg:col-span-4 transition-all duration-300"}>
            <Card>
              <CardHeader>
                <CardTitle>{selectedTopic?.title}</CardTitle>
                <CardDescription>{selectedTopic?.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Video Grid - 6 participants (1 local + 5 AI) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {/* Local Video */}
                  <Card className="relative aspect-video">
                    <CardContent className="p-0 h-full">
                      {isVideoOn ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                          <VideoOff className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2">
                        <Badge>You</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Participants */}
                  {[...Array(5)].map((_, index) => (
                    <Card key={index} className="relative aspect-video">
                      <CardContent className="p-0 h-full">
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/30 mx-auto mb-2 flex items-center justify-center">
                              <span className="text-2xl font-bold">
                                {String.fromCharCode(65 + index)}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              AI Participant {index + 1}
                            </Badge>
                          </div>
                        </div>
                        {/* Pulsing border to show "active" */}
                        <div className="absolute inset-0 border-2 border-primary/50 rounded-lg animate-pulse" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Panel */}
          {isFeedbackOpen && (
            <div className="lg:col-span-1 animate-fade-in">
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Real-time Feedback</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFeedbackOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {feedback && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Speaking Time</span>
                          <span className="font-semibold">{Math.round(feedback.speakingTime)}%</span>
                        </div>
                        <Progress value={feedback.speakingTime} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Engagement</span>
                          <span className="font-semibold">{Math.round(feedback.engagement)}%</span>
                        </div>
                        <Progress value={feedback.engagement} className="h-2" />
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Key Points</h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {feedback.keyPoints.map((point, index) => (
                            <li key={index}>• {point}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Suggestions</h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {feedback.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="shadow-lg">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAudioToggle}
                variant={isAudioOn ? "default" : "outline"}
                size="icon"
              >
                {isAudioOn ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </Button>
              <Button
                onClick={handleVideoToggle}
                variant={isVideoOn ? "default" : "outline"}
                size="icon"
              >
                {isVideoOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>
              <Button
                onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
                variant={isFeedbackOpen ? "default" : "outline"}
                size="icon"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleEndCall}
                variant="destructive"
                size="icon"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupDiscussion;

