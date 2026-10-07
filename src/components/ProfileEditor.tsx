import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AvatarUploader from "./AvatarUploader";
import SkillTags from "./SkillTags";
import { Save, Loader2 } from "lucide-react";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  bio: string;
  avatarUrl: string;
  skills: string[];
}

interface ProfileEditorProps {
  userEmail: string;
  onSave?: (profile: ProfileData) => void;
}

const ProfileEditor = ({ userEmail, onSave }: ProfileEditorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: userEmail,
    title: "",
    bio: "",
    avatarUrl: "",
    skills: [],
  });

  useEffect(() => {
    // Load profile from localStorage
    const saved = localStorage.getItem("profile:v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || userEmail,
          title: parsed.title || "",
          bio: parsed.bio || "",
          avatarUrl: parsed.avatarUrl || "",
          skills: parsed.skills || [],
        });
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    }
  }, [userEmail]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {};
    
    if (!profile.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!profile.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!profile.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Save to localStorage
      const profileData = {
        ...profile,
        stats: {
          successRate: 0,
          interviewsCompleted: 0,
          averageRating: 0,
        },
      };
      localStorage.setItem("profile:v1", JSON.stringify(profileData));

      // Call onSave callback if provided
      if (onSave) {
        onSave(profile);
      }

      toast({
        title: "Profile updated successfully!",
        description: "Your profile has been saved.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your profile information and skills</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex justify-center md:justify-start">
          <AvatarUploader
            avatarUrl={profile.avatarUrl}
            onAvatarChange={(url) => updateField("avatarUrl", url)}
            fallbackText={`${profile.firstName.charAt(0) || ""}${profile.lastName.charAt(0) || ""}`.toUpperCase() || "U"}
          />
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={profile.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="john.doe@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Professional Title</Label>
          <Input
            id="title"
            value={profile.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Senior Software Developer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">
            Bio <span className="text-muted-foreground text-sm">({profile.bio.length}/500)</span>
          </Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 500) {
                updateField("bio", value);
              }
            }}
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label>Skills</Label>
          <SkillTags
            skills={profile.skills}
            onSkillsChange={(skills) => updateField("skills", skills)}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;

