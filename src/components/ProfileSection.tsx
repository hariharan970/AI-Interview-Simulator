import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Settings, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  bio: string;
  avatarUrl: string;
  skills: string[];
  stats: {
    successRate: number;
    interviewsCompleted: number;
    averageRating: number;
  };
}

const ProfileSection = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Load from localStorage first
      const saved = localStorage.getItem("profile:v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setLoading(false);
        return;
      }

      // Load from database if available
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (data) {
        const profileData: ProfileData = {
          firstName: data.full_name?.split(" ")[0] || user.email?.split("@")[0] || "User",
          lastName: data.full_name?.split(" ").slice(1).join(" ") || "",
          email: user.email || "",
          title: "Professional",
          bio: "",
          avatarUrl: data.avatar_url || "",
          skills: [],
          stats: {
            successRate: 0,
            interviewsCompleted: 0,
            averageRating: 0,
          },
        };
        setProfile(profileData);
        localStorage.setItem("profile:v1", JSON.stringify(profileData));
      } else {
        // Create default profile
        const defaultProfile: ProfileData = {
          firstName: user.email?.split("@")[0] || "User",
          lastName: "",
          email: user.email || "",
          title: "Professional",
          bio: "",
          avatarUrl: "",
          skills: [],
          stats: {
            successRate: 0,
            interviewsCompleted: 0,
            averageRating: 0,
          },
        };
        setProfile(defaultProfile);
        localStorage.setItem("profile:v1", JSON.stringify(defaultProfile));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // Create default profile
      const defaultProfile: ProfileData = {
        firstName: user?.email?.split("@")[0] || "User",
        lastName: "",
        email: user?.email || "",
        title: "Professional",
        bio: "",
        avatarUrl: "",
        skills: [],
        stats: {
          successRate: 0,
          interviewsCompleted: 0,
          averageRating: 0,
        },
      };
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user || loading) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0) || ""}`.toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.email
    : user.email?.split("@")[0] || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto p-2 hover:bg-muted/50"
        >
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarImage src={profile?.avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium text-foreground">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{profile?.email || user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile?tab=edit")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/interview-insights")}>
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Insights</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileSection;

