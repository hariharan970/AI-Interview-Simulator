import { useState, useRef, ChangeEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AvatarUploaderProps {
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
  fallbackText: string;
}

const AvatarUploader = ({
  avatarUrl,
  onAvatarChange,
  fallbackText,
}: AvatarUploaderProps) => {
  const [preview, setPreview] = useState<string>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onAvatarChange(result);
    };
    reader.readAsDataURL(file);

    // Optional: Upload to server
    try {
      setUploading(true);
      await uploadAvatar(file);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      // Continue with local preview even if upload fails
    } finally {
      setUploading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      // Try to upload to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        // If storage is not configured, return data URL
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      // Fallback: Return data URL for client-side preview
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemove = () => {
    setPreview("");
    onAvatarChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
          <AvatarImage src={preview} alt="Profile avatar" />
          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl font-semibold">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload avatar"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {preview ? "Change" : "Upload"}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Click to upload a new avatar. Max size: 5MB
      </p>
    </div>
  );
};

export default AvatarUploader;

