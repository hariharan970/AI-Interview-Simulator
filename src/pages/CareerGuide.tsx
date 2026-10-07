import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { careers, Career, AssessmentData, calculateMatch } from "@/data/careerData";
import { Compass, TrendingUp, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CareerGuide = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentData>({
    interests: "",
    workStyle: "",
    techSkills: 5,
    commSkills: 5,
  });
  const [recommendations, setRecommendations] = useState<Array<Career & { match: number }>>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Load from localStorage
    const saved = localStorage.getItem("careerAssessment");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAssessment(data.assessment);
        if (data.recommendations) {
          setRecommendations(data.recommendations);
          setIsSubmitted(true);
        }
      } catch (error) {
        console.error("Error loading assessment:", error);
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // Autosave
    if (assessment.interests && assessment.workStyle) {
      const timer = setTimeout(() => {
        localStorage.setItem("careerAssessment", JSON.stringify({
          assessment,
          recommendations,
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [assessment, recommendations]);

  const handleSubmit = () => {
    if (!assessment.interests || !assessment.workStyle) {
      return;
    }

    // Calculate matches for all careers
    const matches = careers.map((career) => ({
      ...career,
      match: calculateMatch(career, assessment),
    }));

    // Sort by match percentage
    matches.sort((a, b) => b.match - a.match);

    setRecommendations(matches);
    setIsSubmitted(true);

    // Save to localStorage
    localStorage.setItem("careerAssessment", JSON.stringify({
      assessment,
      recommendations: matches,
    }));

    // Save to activities
    if (user) {
      supabase.from("activities").insert({
        user_id: user.id,
        feature_id: "career-guide",
        feature_name: "Career Guidance Assessment",
        activity_type: "assessment",
        status: "completed",
        score: matches[0]?.match || 0,
      }).catch(console.warn);
    }
  };

  const handleReset = () => {
    setAssessment({
      interests: "",
      workStyle: "",
      techSkills: 5,
      commSkills: 5,
    });
    setRecommendations([]);
    setIsSubmitted(false);
    localStorage.removeItem("careerAssessment");
  };

  // Update recommendations when assessment changes (if already submitted)
  useEffect(() => {
    if (isSubmitted && assessment.interests && assessment.workStyle) {
      const matches = careers.map((career) => ({
        ...career,
        match: calculateMatch(career, assessment),
      }));
      matches.sort((a, b) => b.match - a.match);
      setRecommendations(matches);
    }
  }, [assessment, isSubmitted]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Compass className="w-10 h-10" />
            AI Career Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover your ideal career path based on your skills, interests, and work preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assessment Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Career Assessment</CardTitle>
                  {saved && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Save className="w-3 h-3" />
                      Saved
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Answer a few questions to get personalized career recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="interests">Primary Interest Area *</Label>
                  <Select
                    value={assessment.interests}
                    onValueChange={(value) =>
                      setAssessment((prev) => ({ ...prev, interests: value }))
                    }
                  >
                    <SelectTrigger id="interests">
                      <SelectValue placeholder="Select your interest area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="health">Healthcare</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workStyle">Preferred Work Style *</Label>
                  <Select
                    value={assessment.workStyle}
                    onValueChange={(value) =>
                      setAssessment((prev) => ({ ...prev, workStyle: value }))
                    }
                  >
                    <SelectTrigger id="workStyle">
                      <SelectValue placeholder="Select work style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office-based</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="mixed">Mixed (Hybrid)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="techSkills">
                    Technical Skills: {assessment.techSkills}/10
                  </Label>
                  <Slider
                    id="techSkills"
                    min={1}
                    max={10}
                    step={1}
                    value={[assessment.techSkills]}
                    onValueChange={(value) =>
                      setAssessment((prev) => ({ ...prev, techSkills: value[0] }))
                    }
                    className="mt-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={(assessment.techSkills / 10) * 100} className="h-2" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="commSkills">
                    Communication Skills: {assessment.commSkills}/10
                  </Label>
                  <Slider
                    id="commSkills"
                    min={1}
                    max={10}
                    step={1}
                    value={[assessment.commSkills]}
                    onValueChange={(value) =>
                      setAssessment((prev) => ({ ...prev, commSkills: value[0] }))
                    }
                    className="mt-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={(assessment.commSkills / 10) * 100} className="h-2" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={!assessment.interests || !assessment.workStyle}
                    className="flex-1 bg-gradient-to-r from-[#00c6ff] to-[#0072ff]"
                  >
                    Get Recommendations
                  </Button>
                  {isSubmitted && (
                    <Button onClick={handleReset} variant="outline">
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <div className="space-y-6">
            {!isSubmitted ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Compass className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Complete the assessment to see career recommendations
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Recommended Careers
                    </CardTitle>
                    <CardDescription>
                      Top career matches based on your assessment
                    </CardDescription>
                  </CardHeader>
                </Card>

                <div className="space-y-4">
                  {recommendations.slice(0, 6).map((career) => (
                    <Card
                      key={career.id}
                      className="hover-lift animate-fade-in cursor-pointer"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">{career.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {career.description}
                            </CardDescription>
                          </div>
                          <Badge
                            className={`ml-4 ${
                              career.match >= 80
                                ? "bg-green-500"
                                : career.match >= 60
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                          >
                            {career.match}% match
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Match Score</span>
                              <span className="font-semibold">{career.match}%</span>
                            </div>
                            <Progress value={career.match} className="h-2" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">
                              {career.category}
                            </Badge>
                            {career.workStyle.map((style) => (
                              <Badge key={style} variant="outline" className="capitalize">
                                {style}
                              </Badge>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Tech Skills Required: </span>
                              <span className="font-semibold">{career.requiredTechSkills}/10</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Comm Skills Required: </span>
                              <span className="font-semibold">{career.requiredCommSkills}/10</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerGuide;

