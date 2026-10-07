import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SalaryResult {
  min: number;
  avg: number;
  max: number;
}

interface FormData {
  jobTitle: string;
  location: string;
  experience: string;
  keySkills: string;
  education: string;
  industry: string;
}

const experienceOptions = ["0-2", "3-5", "6-8", "9+"];

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Consulting",
  "Other",
];

const educationOptions = [
  "High School",
  "Bachelor's",
  "Master's",
  "PhD",
];

const SalaryEstimator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    jobTitle: "",
    location: "",
    experience: "",
    keySkills: "",
    education: "",
    industry: "",
  });
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Load from localStorage
    const saved = localStorage.getItem("salaryEstimator:lastQuery");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (e) {
        console.error("Error loading saved form:", e);
      }
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.industry) newErrors.industry = "Industry is required";
    if (!formData.education) newErrors.education = "Education is required";
    if (!formData.experience) newErrors.experience = "Experience is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateSalary = (data: FormData): SalaryResult => {
    // Base salary by industry
    const baseSalaries: { [key: string]: number } = {
      Technology: 85000,
      Finance: 90000,
      Healthcare: 75000,
      Retail: 65000,
      Manufacturing: 70000,
      Education: 60000,
      Consulting: 95000,
      Other: 70000,
    };

    const base = baseSalaries[data.industry] || 70000;

    // Location multiplier
    const locationLower = data.location.toLowerCase();
    const locationMultipliers: { [key: string]: number } = {
      "new york": 1.4,
      "san francisco": 1.5,
      "chicago": 1.2,
      "austin": 1.1,
      "los angeles": 1.3,
      "seattle": 1.25,
      "boston": 1.3,
    };

    let locationMultiplier = 1;
    for (const [city, multiplier] of Object.entries(locationMultipliers)) {
      if (locationLower.includes(city)) {
        locationMultiplier = multiplier;
        break;
      }
    }

    // Experience multiplier
    const experienceMultipliers: { [key: string]: number } = {
      "0-2": 1,
      "3-5": 1.3,
      "6-8": 1.6,
      "9+": 2,
    };
    const experienceMultiplier = experienceMultipliers[data.experience] || 1;

    // Education multiplier
    const educationMultipliers: { [key: string]: number } = {
      "High School": 1,
      "Bachelor's": 1.2,
      "Master's": 1.4,
      "PhD": 1.6,
    };
    const educationMultiplier = educationMultipliers[data.education] || 1;

    // Calculate average
    const avg = Math.round(base * locationMultiplier * experienceMultiplier * educationMultiplier);
    const min = Math.round(avg * 0.8);
    const max = Math.round(avg * 1.2);

    return { min, avg, max };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setShowResult(false);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Try to get AI-enhanced salary estimate
      const { data: aiData, error } = await supabase.functions.invoke("salary-estimator", {
        body: {
          jobTitle: formData.jobTitle,
          location: formData.location,
          experience: formData.experience,
          keySkills: formData.keySkills,
          education: formData.education,
          industry: formData.industry,
        },
      });

      let salaryResult: SalaryResult;

      if (aiData && !error && aiData.salary) {
        salaryResult = aiData.salary;
      } else {
        // Fallback to local calculation
        salaryResult = calculateSalary(formData);
      }

      setResult(salaryResult);
      setShowResult(true);

      // Save to localStorage
      localStorage.setItem("salaryEstimator:lastQuery", JSON.stringify(formData));

      toast({
        title: "Salary Estimate Calculated",
        description: "Your salary estimate is ready!",
      });
    } catch (error) {
      console.error("Error calculating salary:", error);
      // Fallback to local calculation
      const salaryResult = calculateSalary(formData);
      setResult(salaryResult);
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = result
    ? [
        { name: "Minimum", value: result.min },
        { name: "Average", value: result.avg },
        { name: "Maximum", value: result.max },
      ]
    : [];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00C6FF] to-[#0072FF] bg-clip-text text-transparent">
            Salary Estimator
          </h1>
          <p className="text-gray-400 text-lg">
            Get an accurate salary estimate based on your profile
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calculator className="w-5 h-5" />
                Salary Calculator
              </CardTitle>
              <CardDescription className="text-gray-400">
                Fill in your details to get an estimate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-white">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., Software Engineer"
                  />
                  {errors.jobTitle && (
                    <p className="text-sm text-red-500">{errors.jobTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., New York, NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Years of Experience <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {experienceOptions.map((exp) => (
                      <Badge
                        key={exp}
                        variant={formData.experience === exp ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 ${
                          formData.experience === exp
                            ? "bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white border-0"
                            : "bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600"
                        }`}
                        onClick={() => setFormData({ ...formData, experience: exp })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setFormData({ ...formData, experience: exp });
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={formData.experience === exp}
                      >
                        {exp} years
                      </Badge>
                    ))}
                  </div>
                  {errors.experience && (
                    <p className="text-sm text-red-500">{errors.experience}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keySkills" className="text-white">
                    Key Skills
                  </Label>
                  <Input
                    id="keySkills"
                    value={formData.keySkills}
                    onChange={(e) =>
                      setFormData({ ...formData, keySkills: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., React, Node.js, Python"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education" className="text-white">
                    Education <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.education}
                    onValueChange={(value) =>
                      setFormData({ ...formData, education: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {educationOptions.map((edu) => (
                        <SelectItem
                          key={edu}
                          value={edu}
                          className="text-white hover:bg-slate-700"
                        >
                          {edu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.education && (
                    <p className="text-sm text-red-500">{errors.education}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-white">
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) =>
                      setFormData({ ...formData, industry: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {industries.map((ind) => (
                        <SelectItem
                          key={ind}
                          value={ind}
                          className="text-white hover:bg-slate-700"
                        >
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-red-500">{errors.industry}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] hover:from-[#0099CC] hover:to-[#0055AA] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Calculate Salary Estimate
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {showResult && result && (
              <Card
                className="bg-slate-800/50 border-slate-700 backdrop-blur-sm animate-slide-up"
              >
                <CardHeader>
                  <CardTitle className="text-white">Salary Estimate</CardTitle>
                  <CardDescription className="text-gray-400">
                    Based on your profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Minimum</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(result.min)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-[#00C6FF] to-[#0072FF] rounded-lg">
                      <p className="text-white/90 text-sm mb-2">Average</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(result.avg)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Maximum</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(result.max)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-4">Salary Range Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            color: "#fff",
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar
                          dataKey="value"
                          fill="url(#colorGradient)"
                          radius={[8, 8, 0, 0]}
                        />
                        <defs>
                          <linearGradient
                            id="colorGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#00C6FF" />
                            <stop offset="100%" stopColor="#0072FF" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {!showResult && (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Fill in the form and calculate your salary estimate</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryEstimator;

