import { Navigate, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, CheckCircle2, Clock, Award, TrendingUp, LogOut, Code, Users, Video, FileText, Compass, Activity, User, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProfileEditor from "@/components/ProfileEditor";

interface Activity {
  id: string;
  feature_name: string;
  completed_at: string;
  score: number | null;
  status: string;
  activity_type: string;
}

const Profile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
    // Check if we should show edit tab (from query param or state)
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "edit") {
      setActiveTab("edit");
    }
  }, [user, location]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(5);

      if (error) {
        // If table doesn't exist or RLS blocks it, just set empty array
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('permission')) {
          console.warn("Activities table not accessible:", error.message);
          setActivities([]);
        } else {
          throw error;
        }
      } else {
        setActivities(data || []);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      // Set empty array on error to prevent UI issues
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from activities
  const completedCount = activities.filter(a => a.status === "completed").length;
  const avgScore = activities.length > 0 
    ? Math.round(activities.reduce((acc, a) => acc + (a.score || 0), 0) / activities.length) 
    : 0;

  // Load profile stats
  const [profileStats, setProfileStats] = useState({
    successRate: 85,
    interviewsCompleted: completedCount,
    averageRating: 4.8,
  });

  useEffect(() => {
    const saved = localStorage.getItem("profile:v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.stats) {
          setProfileStats(parsed.stats);
        }
      } catch (e) {
        console.error("Error loading profile stats:", e);
      }
    }
  }, []);

  useEffect(() => {
    setProfileStats((prev) => ({
      ...prev,
      interviewsCompleted: completedCount,
    }));
  }, [completedCount]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const stats = [
    { label: "Interview Success Rate", value: `${profileStats.successRate}%`, icon: CheckCircle2, color: "primary" },
    { label: "Interviews Completed", value: profileStats.interviewsCompleted, icon: Clock, color: "secondary" },
    { label: "Average Rating", value: profileStats.averageRating.toFixed(1), icon: Award, color: "accent" },
    { label: "Tests Completed", value: completedCount, icon: TrendingUp, color: "primary" }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="official-badge mb-4">
            <Award className="w-4 h-4" />
            Authorized User Dashboard
          </div>
          <h1 className="text-4xl font-bold mb-2">Profile & Dashboard</h1>
          <p className="text-xl text-muted-foreground">Manage your profile and track your progress</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Edit Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="animate-fade-in hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Recent Activities */}
              <div className="lg:col-span-2">
                <Card className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="section-heading border-0 pl-0">Recent Activities</CardTitle>
                    <CardDescription>Your latest practice sessions and tests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <p className="text-center text-muted-foreground py-8">Loading activities...</p>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No activities yet. Start your journey!</p>
                        <Link to="/features">
                          <Button>Explore Features</Button>
                        </Link>
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                {activity.activity_type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(activity.completed_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-semibold mb-2">{activity.feature_name}</h3>
                            {activity.score !== null && (
                              <div className="flex items-center gap-2">
                                <Progress value={activity.score} className="h-2 flex-1 max-w-[200px]" />
                                <span className="text-sm font-medium">{activity.score}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Panel */}
              <div className="space-y-6">
                <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Performance Overview
                    </CardTitle>
                    <CardDescription>Your skills assessment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Technical Skills</span>
                        <span className="text-sm font-medium">{Math.max(avgScore - 5, 0)}%</span>
                      </div>
                      <Progress value={Math.max(avgScore - 5, 0)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Communication</span>
                        <span className="text-sm font-medium">{Math.min(avgScore + 5, 100)}%</span>
                      </div>
                      <Progress value={Math.min(avgScore + 5, 100)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Problem Solving</span>
                        <span className="text-sm font-medium">{avgScore}%</span>
                      </div>
                      <Progress value={avgScore} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <ProfileEditor
              userEmail={user?.email || ""}
              onSave={(profile) => {
                // Update stats if needed
                setProfileStats((prev) => ({
                  ...prev,
                  interviewsCompleted: completedCount,
                }));
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
