import { useState, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SkillTagsProps {
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
  maxSkills?: number;
}

const SkillTags = ({ skills, onSkillsChange, maxSkills = 20 }: SkillTagsProps) => {
  const [inputValue, setInputValue] = useState("");

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (
      trimmed &&
      !skills.includes(trimmed) &&
      skills.length < maxSkills
    ) {
      onSkillsChange([...skills, trimmed]);
      setInputValue("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "Backspace" && !inputValue && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Handle comma-separated input
    if (value.includes(",")) {
      const parts = value.split(",");
      parts.forEach((part) => {
        if (part.trim()) {
          addSkill(part);
        }
      });
      setInputValue("");
    } else {
      setInputValue(value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border border-input rounded-md bg-background">
        {skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-sm"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  removeSkill(skill);
                }
              }}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={`Remove ${skill}`}
              tabIndex={0}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? "Add skills (press Enter or comma)" : ""}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto min-w-[150px] flex-1"
          disabled={skills.length >= maxSkills}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {skills.length}/{maxSkills} skills. Press Enter or comma to add.
      </p>
    </div>
  );
};

export default SkillTags;

