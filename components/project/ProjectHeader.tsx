"use client";

import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Edit, Check } from "lucide-react";

interface ProjectHeaderProps {
  isSaving?: boolean;
  isLoadingAuth?: boolean;
  storyTitle: string;
  onRenameStory: (newTitle: string) => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  storyTitle,
  onRenameStory,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(storyTitle);

  const handleTitleSave = () => {
    if (titleInput.trim()) {
      onRenameStory(titleInput);
    } else {
      // Reset to original if empty
      setTitleInput(storyTitle);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleInput(storyTitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="bg-background border-b border-border p-3 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        {isEditingTitle ? (
          <div className="flex items-center">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleTitleSave}
              autoFocus
              className="text-xl font-bold text-foreground bg-background border border-input rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTitleSave}
              className="ml-2"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-foreground">{storyTitle || "Untitled Story"}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingTitle(true)}
              className="ml-2 text-muted-foreground hover:text-foreground"
              title="Rename story"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader; 