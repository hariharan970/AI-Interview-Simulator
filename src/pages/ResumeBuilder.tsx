import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Download, Save, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Experience {
  id: string;
  company: string;
  position: string;
  startMonth: string;
  endMonth: string;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  startMonth: string;
  endMonth: string;
  gpa: string;
}

interface ResumeData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  experiences: Experience[];
  education: Education[];
  skills: string[];
}

const ResumeBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState<ResumeData>({
    personal: {
      name: "",
      email: "",
      phone: "",
      location: "",
      summary: "",
    },
    experiences: [],
    education: [],
    skills: [],
  });
  const [skillInput, setSkillInput] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Load from localStorage
    const saved = localStorage.getItem("resumeData");
    if (saved) {
      try {
        setResumeData(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading resume data:", error);
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // Autosave every 5 seconds
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      localStorage.setItem("resumeData", JSON.stringify(resumeData));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 5000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [resumeData]);

  const handlePersonalChange = (field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value,
      },
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: Date.now().toString(),
          company: "",
          position: "",
          startMonth: "",
          endMonth: "",
          description: "",
        },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: Date.now().toString(),
          institution: "",
          degree: "",
          startMonth: "",
          endMonth: "",
          gpa: "",
        },
      ],
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setResumeData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!resumeData.personal.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!resumeData.personal.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resumeData.personal.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeneratePDF = async () => {
    if (!validate()) {
      return;
    }

    if (!previewRef.current) {
      return;
    }

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${resumeData.personal.name || "resume"}-resume.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all data?")) {
      setResumeData({
        personal: {
          name: "",
          email: "",
          phone: "",
          location: "",
          summary: "",
        },
        experiences: [],
        education: [],
        skills: [],
      });
      localStorage.removeItem("resumeData");
      setErrors({});
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Resume Builder</h1>
            <p className="text-muted-foreground">
              Create a professional resume with live preview
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Save className="w-3 h-3" />
                Saved
              </Badge>
            )}
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={!resumeData.personal.name || !resumeData.personal.email}
              className="bg-gradient-to-r from-[#00c6ff] to-[#0072ff]"
            >
              <Download className="mr-2 w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={resumeData.personal.name}
                    onChange={(e) => handlePersonalChange("name", e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={resumeData.personal.email}
                    onChange={(e) => handlePersonalChange("email", e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={resumeData.personal.phone}
                    onChange={(e) => handlePersonalChange("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={resumeData.personal.location}
                    onChange={(e) => handlePersonalChange("location", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    rows={4}
                    value={resumeData.personal.summary}
                    onChange={(e) => handlePersonalChange("summary", e.target.value)}
                    placeholder="Brief summary of your professional background..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Experience</CardTitle>
                  <Button onClick={addExperience} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeData.experiences.map((exp) => (
                  <Card key={exp.id} className="relative">
                    <CardContent className="pt-6 space-y-3">
                      <Button
                        onClick={() => removeExperience(exp.id)}
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(exp.id, "company", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Position</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) =>
                            updateExperience(exp.id, "position", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="month"
                            value={exp.startMonth}
                            onChange={(e) =>
                              updateExperience(exp.id, "startMonth", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="month"
                            value={exp.endMonth}
                            onChange={(e) =>
                              updateExperience(exp.id, "endMonth", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) =>
                            updateExperience(exp.id, "description", e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {resumeData.experiences.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No experience added yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Education</CardTitle>
                  <Button onClick={addEducation} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeData.education.map((edu) => (
                  <Card key={edu.id} className="relative">
                    <CardContent className="pt-6 space-y-3">
                      <Button
                        onClick={() => removeEducation(edu.id)}
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div>
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(edu.id, "institution", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(edu.id, "degree", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="month"
                            value={edu.startMonth}
                            onChange={(e) =>
                              updateEducation(edu.id, "startMonth", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="month"
                            value={edu.endMonth}
                            onChange={(e) =>
                              updateEducation(edu.id, "endMonth", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>GPA (Optional)</Label>
                        <Input
                          value={edu.gpa}
                          onChange={(e) =>
                            updateEducation(edu.id, "gpa", e.target.value)
                          }
                          placeholder="3.8/4.0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {resumeData.education.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No education added yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Add a skill"
                  />
                  <Button onClick={addSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewRef}
                  className="bg-white text-black p-8 rounded-lg space-y-6 min-h-[800px]"
                >
                  {/* Header */}
                  <div className="border-b-2 border-gray-300 pb-4">
                    <h1 className="text-3xl font-bold mb-2">
                      {resumeData.personal.name || "Your Name"}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {resumeData.personal.email && (
                        <span>{resumeData.personal.email}</span>
                      )}
                      {resumeData.personal.phone && (
                        <span>{resumeData.personal.phone}</span>
                      )}
                      {resumeData.personal.location && (
                        <span>{resumeData.personal.location}</span>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {resumeData.personal.summary && (
                    <div>
                      <h2 className="text-xl font-bold mb-2 border-b border-gray-300 pb-1">
                        Professional Summary
                      </h2>
                      <p className="text-sm">{resumeData.personal.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {resumeData.experiences.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-1">
                        Experience
                      </h2>
                      <div className="space-y-4">
                        {resumeData.experiences.map((exp) => (
                          <div key={exp.id}>
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h3 className="font-bold">{exp.position}</h3>
                                <p className="text-sm font-semibold">{exp.company}</p>
                              </div>
                              {(exp.startMonth || exp.endMonth) && (
                                <span className="text-sm">
                                  {exp.startMonth} - {exp.endMonth || "Present"}
                                </span>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-sm mt-1">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {resumeData.education.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-1">
                        Education
                      </h2>
                      <div className="space-y-3">
                        {resumeData.education.map((edu) => (
                          <div key={edu.id}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold">{edu.degree}</h3>
                                <p className="text-sm font-semibold">{edu.institution}</p>
                              </div>
                              {(edu.startMonth || edu.endMonth) && (
                                <span className="text-sm">
                                  {edu.startMonth} - {edu.endMonth || "Present"}
                                </span>
                              )}
                            </div>
                            {edu.gpa && (
                              <p className="text-sm mt-1">GPA: {edu.gpa}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {resumeData.skills.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-1">
                        Skills
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-gray-200 px-3 py-1 rounded text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;

