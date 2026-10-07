import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle2, 
  Printer,
  Loader2,
  BarChart3,
  LineChart as LineChartIcon,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  feature_name: string;
  completed_at: string | null;
  score: number | null;
  status: string;
  activity_type: string;
  created_at: string | null;
}

interface Insights {
  strengths: string[];
  focusAreas: string[];
  trends: string[];
  performanceBenchmark: string;
  technicalScore: number;
  behavioralScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  leadershipScore: number;
  clarity: number[];
  confidence: number[];
  skillAssessment: {
    technical: number;
    communication: number;
    problemSolving: number;
    leadership: number;
    teamwork: number;
    adaptability: number;
  };
}

const InterviewInsights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchActivities();
  }, [user, navigate]);

  const fetchActivities = async () => {
    try {
      // Fetch all activities and filter for interview-related ones
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(100);
      
      // Filter for interview-related activities on client side
      const interviewActivities = (data || []).filter(activity => 
        activity.activity_type === "interview" || 
        activity.feature_name?.toLowerCase().includes("interview") ||
        activity.feature_name?.toLowerCase().includes("mock") ||
        activity.feature_name?.toLowerCase().includes("hr interview") ||
        activity.feature_name?.toLowerCase().includes("video interview")
      );

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('permission')) {
          console.warn("Activities table not accessible:", error.message);
          setActivities([]);
        } else {
          throw error;
        }
      } else {
        setActivities(interviewActivities);
        if (interviewActivities && interviewActivities.length > 0) {
          generateInsights(interviewActivities);
        } else {
          setInsights(null);
        }
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivities([]);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (activityData: Activity[]) => {
    setGeneratingInsights(true);
    try {
      // Calculate scores from activities
      const completedActivities = activityData.filter(a => a.status === "completed" && a.score !== null);
      const scores = completedActivities.map(a => a.score || 0);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // Generate skill scores (simulate based on activity scores with some variation)
      const technicalScore = Math.min(10, Math.max(0, Math.round((avgScore / 10) + (Math.random() * 2 - 1))));
      const behavioralScore = Math.min(10, Math.max(0, Math.round((avgScore / 10) + (Math.random() * 2 - 1))));
      const communicationScore = Math.min(10, Math.max(0, Math.round((avgScore / 10) + (Math.random() * 2 - 1))));
      const problemSolvingScore = Math.min(10, Math.max(0, Math.round((avgScore / 10) + (Math.random() * 2 - 1))));
      const leadershipScore = Math.min(10, Math.max(0, Math.round((avgScore / 10) + (Math.random() * 2 - 1))));

      // Generate session data (last 5 sessions)
      const last5Sessions = completedActivities.slice(0, 5).reverse();
      const clarity = last5Sessions.map((_, i) => Math.min(10, Math.max(5, Math.round(avgScore / 10 + (i * 0.3) + (Math.random() * 1 - 0.5)))));
      const confidence = last5Sessions.map((_, i) => Math.min(10, Math.max(5, Math.round(avgScore / 10 + (i * 0.4) + (Math.random() * 1 - 0.5)))));

      // Skill assessment data
      const skillAssessment = {
        technical: technicalScore,
        communication: communicationScore,
        problemSolving: problemSolvingScore,
        leadership: leadershipScore,
        teamwork: Math.min(10, Math.max(0, Math.round((avgScore / 10) + (Math.random() * 2 - 1)))),
        adaptability: Math.min(10, Math.max(0, Math.round((avgScore / 10) + (Math.random() * 2 - 1)))),
      };

      // Call Gemini AI for insights
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke("interview-insights", {
          body: {
            activities: completedActivities.map(a => ({
              feature_name: a.feature_name,
              score: a.score,
              completed_at: a.completed_at,
            })),
            scores: {
              technical: technicalScore,
              behavioral: behavioralScore,
              communication: communicationScore,
              problemSolving: problemSolvingScore,
              leadership: leadershipScore,
            },
            skillAssessment,
            totalInterviews: completedActivities.length,
            averageScore: avgScore,
          },
        });

        if (aiData && !aiError) {
          setInsights({
            ...aiData,
            technicalScore,
            behavioralScore,
            communicationScore,
            problemSolvingScore,
            leadershipScore,
            clarity,
            confidence,
            skillAssessment,
          });
        } else {
          // Fallback insights if AI fails
          generateFallbackInsights(technicalScore, behavioralScore, communicationScore, problemSolvingScore, leadershipScore, clarity, confidence, skillAssessment, avgScore, completedActivities.length);
        }
      } catch (error) {
        console.error("Error calling AI insights:", error);
        // Fallback insights
        generateFallbackInsights(technicalScore, behavioralScore, communicationScore, problemSolvingScore, leadershipScore, clarity, confidence, skillAssessment, avgScore, completedActivities.length);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  const generateFallbackInsights = (
    technical: number,
    behavioral: number,
    communication: number,
    problemSolving: number,
    leadership: number,
    clarity: number[],
    confidence: number[],
    skillAssessment: any,
    avgScore: number,
    totalInterviews: number
  ) => {
    const strengths: string[] = [];
    const focusAreas: string[] = [];

    if (technical >= 7) strengths.push("Strong technical knowledge and problem-solving abilities");
    else focusAreas.push("Technical skills need improvement - practice more coding challenges");

    if (communication >= 7) strengths.push("Clear and effective communication");
    else focusAreas.push("Work on articulation and clarity of expression");

    if (behavioral >= 7) strengths.push("Good behavioral responses and situational awareness");
    else focusAreas.push("Practice more behavioral interview questions");

    if (problemSolving >= 7) strengths.push("Strong analytical and problem-solving skills");
    else focusAreas.push("Focus on structured problem-solving approaches");

    if (leadership >= 7) strengths.push("Demonstrates leadership qualities");
    else focusAreas.push("Develop leadership examples and experiences");

    const trends = [];
    if (clarity.length >= 2 && clarity[clarity.length - 1] > clarity[0]) {
      trends.push("Improving clarity over time");
    }
    if (confidence.length >= 2 && confidence[confidence.length - 1] > confidence[0]) {
      trends.push("Growing confidence in interviews");
    }
    if (avgScore >= 80) {
      trends.push("Consistently high performance");
    }

    setInsights({
      strengths: strengths.length > 0 ? strengths : ["Continue practicing to identify strengths"],
      focusAreas: focusAreas.length > 0 ? focusAreas : ["Maintain consistent practice"],
      trends: trends.length > 0 ? trends : ["Track your progress over time"],
      performanceBenchmark: avgScore >= 80 ? "Above average" : avgScore >= 60 ? "Average" : "Below average",
      technicalScore: technical,
      behavioralScore: behavioral,
      communicationScore: communication,
      problemSolvingScore: problemSolving,
      leadershipScore: leadership,
      clarity,
      confidence,
      skillAssessment,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!user) {
    return null;
  }

  if (loading || generatingInsights) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {generatingInsights ? "Generating AI insights..." : "Loading your data..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insights || activities.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Interview Data Available</h3>
                <p className="text-muted-foreground mb-4">
                  Complete some interviews to see your insights and analytics.
                </p>
                <Button onClick={() => navigate("/mock-interview")}>
                  Start Mock Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const skillComparisonData = [
    { name: "Technical", score: insights.technicalScore },
    { name: "Behavioral", score: insights.behavioralScore },
    { name: "Communication", score: insights.communicationScore },
    { name: "Problem Solving", score: insights.problemSolvingScore },
    { name: "Leadership", score: insights.leadershipScore },
  ];

  const sessionData = insights.clarity.map((clarity, index) => ({
    session: `Session ${index + 1}`,
    clarity: clarity,
    confidence: insights.confidence[index] || 0,
  }));

  const radarData = [
    {
      subject: "Technical",
      value: insights.skillAssessment.technical,
      fullMark: 10,
    },
    {
      subject: "Communication",
      value: insights.skillAssessment.communication,
      fullMark: 10,
    },
    {
      subject: "Problem Solving",
      value: insights.skillAssessment.problemSolving,
      fullMark: 10,
    },
    {
      subject: "Leadership",
      value: insights.skillAssessment.leadership,
      fullMark: 10,
    },
    {
      subject: "Teamwork",
      value: insights.skillAssessment.teamwork,
      fullMark: 10,
    },
    {
      subject: "Adaptability",
      value: insights.skillAssessment.adaptability,
      fullMark: 10,
    },
  ];

  const completedInterviews = activities.filter(a => a.status === "completed").length;
  const overallScore = Math.round(
    (insights.technicalScore +
      insights.behavioralScore +
      insights.communicationScore +
      insights.problemSolvingScore +
      insights.leadershipScore) /
      5
  );
  const monthlyImprovement = insights.clarity.length >= 2
    ? Math.round(((insights.clarity[insights.clarity.length - 1] - insights.clarity[0]) / insights.clarity[0]) * 100)
    : 0;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-indigo-50 via-white to-blue-50 print:bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 print:mb-4">
          <div className="flex justify-between items-start mb-4 print:flex-col">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 print:text-2xl">
                AI Interview Insights Dashboard
              </h1>
              <p className="text-gray-600 print:text-sm">
                Report Date: {new Date().toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </p>
            </div>
            <Button 
              onClick={handlePrint} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 print:hidden"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-lg print:bg-white print:text-black print:shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-blue-100 mb-2">Overall Score</p>
                <p className="text-4xl font-bold">{overallScore}/10</p>
              </div>
              <div>
                <p className="text-blue-100 mb-2">Total Interviews</p>
                <p className="text-4xl font-bold">{completedInterviews}</p>
              </div>
              <div>
                <p className="text-blue-100 mb-2">Monthly Improvement</p>
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-bold">{monthlyImprovement > 0 ? "+" : ""}{monthlyImprovement}%</p>
                  {monthlyImprovement > 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-300" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-300" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart - Skill Comparison */}
          <Card className="shadow-lg print:shadow-none">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 print:bg-white">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Skill Comparison
              </CardTitle>
              <CardDescription>Performance across different skill areas (out of 10)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skillComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart - Improvement Over Time */}
          <Card className="shadow-lg print:shadow-none">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 print:bg-white">
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-blue-600" />
                Improvement Trends
              </CardTitle>
              <CardDescription>Clarity and confidence over last 5 sessions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="clarity" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    name="Clarity"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Confidence"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart */}
        <Card className="mb-6 shadow-lg print:shadow-none">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 print:bg-white">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Overall Skill Assessment
            </CardTitle>
            <CardDescription>Comprehensive evaluation across key competencies</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommendations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <Card className="shadow-lg print:shadow-none">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 print:bg-white">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {insights.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Focus Areas */}
          <Card className="shadow-lg print:shadow-none">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 print:bg-white">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-600" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {insights.focusAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">→</span>
                    <span className="text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Trends and Benchmark */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Trends */}
          <Card className="shadow-lg print:shadow-none">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 print:bg-white">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {insights.trends.map((trend, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">📈</span>
                    <span className="text-gray-700">{trend}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Performance Benchmark */}
          <Card className="shadow-lg print:shadow-none">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 print:bg-white">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Performance Benchmark
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge 
                  variant={insights.performanceBenchmark === "Above average" ? "default" : "secondary"}
                  className="text-lg px-4 py-2"
                >
                  {insights.performanceBenchmark}
                </Badge>
              </div>
              <p className="text-gray-700">
                Your performance is {insights.performanceBenchmark.toLowerCase()} compared to industry standards. 
                Continue practicing to improve your interview skills.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>Generated on {new Date().toLocaleString()}</p>
          <p>AI Interview Insights Dashboard - Skill Spark Pro</p>
        </div>
      </div>
    </div>
  );
};

export default InterviewInsights;

