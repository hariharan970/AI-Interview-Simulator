import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, Target, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CareerPath {
  id: string;
  title: string;
  progress: number;
  description?: string;
}

interface Resource {
  icon: React.ReactNode;
  label: string;
  link?: string;
}

const CareerRoadmap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([
    { id: "software", title: "Software Development", progress: 65 },
    { id: "data", title: "Data Science", progress: 45 },
    { id: "cloud", title: "Cloud Computing", progress: 25 },
  ]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingResources, setGeneratingResources] = useState(false);
  const progressRefs = useRef<{ [key: string]: number }>({});
  const [, setProgressUpdate] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchProgressData();
    generateResources();
  }, [user, navigate]);

  useEffect(() => {
    // Animate progress bars on load
    careerPaths.forEach((path) => {
      progressRefs.current[path.id] = 0;
      animateProgress(path.id, path.progress);
    });
  }, [careerPaths.length]); // Only re-animate if number of paths changes

  const animateProgress = (id: string, targetProgress: number) => {
    const duration = 1500;
    const startTime = Date.now();
    const startProgress = progressRefs.current[id] || 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentProgress = startProgress + (targetProgress - startProgress) * progress;
      progressRefs.current[id] = currentProgress;
      setProgressUpdate((prev) => prev + 1); // Trigger re-render

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        progressRefs.current[id] = targetProgress;
        setProgressUpdate((prev) => prev + 1);
      }
    };

    animate();
  };

  const fetchProgressData = async () => {
    try {
      // Fetch user activities to calculate progress
      const { data: activities, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "completed");

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching activities:", error);
      }

      // Calculate progress based on activities
      if (activities && activities.length > 0) {
        const softwareActivities = activities.filter(
          (a) =>
            a.feature_name?.toLowerCase().includes("coding") ||
            a.feature_name?.toLowerCase().includes("software") ||
            a.activity_type === "coding"
        ).length;
        const dataActivities = activities.filter(
          (a) =>
            a.feature_name?.toLowerCase().includes("data") ||
            a.activity_type === "aptitude"
        ).length;
        const cloudActivities = activities.filter(
          (a) =>
            a.feature_name?.toLowerCase().includes("cloud") ||
            a.feature_name?.toLowerCase().includes("interview")
        ).length;

        const totalPossible = 10; // Base total for calculation
        setCareerPaths([
          {
            id: "software",
            title: "Software Development",
            progress: Math.min(100, Math.round((softwareActivities / totalPossible) * 100)),
          },
          {
            id: "data",
            title: "Data Science",
            progress: Math.min(100, Math.round((dataActivities / totalPossible) * 100)),
          },
          {
            id: "cloud",
            title: "Cloud Computing",
            progress: Math.min(100, Math.round((cloudActivities / totalPossible) * 100)),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateResources = async () => {
    setGeneratingResources(true);
    try {
      // Call Gemini API for personalized resources
      const { data, error } = await supabase.functions.invoke("career-roadmap", {
        body: {
          careerPaths: careerPaths.map((p) => ({
            title: p.title,
            progress: p.progress,
          })),
          userId: user?.id,
        },
      });

      if (data && !error && data.resources) {
        setResources(data.resources);
      } else {
        // Fallback resources
        setResources([
          {
            icon: <BookOpen className="w-5 h-5" />,
            label: "Online Courses Platform Access",
            link: "#",
          },
          {
            icon: <Users className="w-5 h-5" />,
            label: "Mentorship Program",
            link: "#",
          },
          {
            icon: <Target className="w-5 h-5" />,
            label: "Practice Projects",
            link: "#",
          },
          {
            icon: <FileText className="w-5 h-5" />,
            label: "Certification Guides",
            link: "#",
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating resources:", error);
      // Fallback resources
      setResources([
        {
          icon: <BookOpen className="w-5 h-5" />,
          label: "Online Courses Platform Access",
          link: "#",
        },
        {
          icon: <Users className="w-5 h-5" />,
          label: "Mentorship Program",
          link: "#",
        },
        {
          icon: <Target className="w-5 h-5" />,
          label: "Practice Projects",
          link: "#",
        },
        {
          icon: <FileText className="w-5 h-5" />,
          label: "Certification Guides",
          link: "#",
        },
      ]);
    } finally {
      setGeneratingResources(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#00C6FF] to-[#0072FF] bg-clip-text text-transparent">
            Career Development Roadmap
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Choose your path and track your progress towards your career goals
          </p>
        </div>

        {/* Career Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {careerPaths.map((path, index) => (
            <Card
              key={path.id}
              className="bg-gradient-to-br from-[#09203f] to-[#537895] border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <CardTitle className="text-white text-xl text-center">{path.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-300 text-sm mb-2">Progress: {Math.round(progressRefs.current[path.id] || 0)}%</p>
                  <div className="w-full bg-black/30 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] transition-all duration-300 ease-out rounded-full"
                      style={{
                        width: `${progressRefs.current[path.id] || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommended Resources */}
        <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-2xl font-bold text-white mb-6">Recommended Resources</h2>
          <div className="space-y-3">
            {generatingResources ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#00C6FF]" />
                <span className="ml-2 text-gray-400">Loading resources...</span>
              </div>
            ) : (
              resources.map((resource, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    if (resource.link && resource.link !== "#") {
                      window.open(resource.link, "_blank");
                    } else {
                      toast({
                        title: "Resource Coming Soon",
                        description: `${resource.label} will be available soon.`,
                      });
                    }
                  }}
                >
                  <div className="text-[#00C6FF]">{resource.icon}</div>
                  <span className="text-white flex-1">{resource.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerRoadmap;

