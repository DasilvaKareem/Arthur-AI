"use client";

import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Download, Save, RefreshCw, Loader2, Edit, Check } from "lucide-react";

interface ProjectHeaderProps {
  isSaving: boolean;
  isLoadingAuth: boolean;
  storyTitle: string;
  onSaveStory: () => void;
  onSyncScenes: () => void;
  onExportScene: () => void;
  onCopyToClipboard: () => void;
  onDownloadScript: () => void;
  onRenameStory: (newTitle: string) => void;
  onDebugStory?: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  isSaving,
  isLoadingAuth,
  storyTitle,
  onSaveStory,
  onSyncScenes,
  onExportScene,
  onCopyToClipboard,
  onDownloadScript,
  onRenameStory,
  onDebugStory
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
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSaveStory} 
          disabled={isSaving || isLoadingAuth}
          className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isLoadingAuth ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSyncScenes}
          className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync
        </Button>
        <Button variant="outline" size="sm" onClick={onExportScene} className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
          <Download className="mr-2 h-4 w-4" />
          Export Scene
        </Button>
        <Button variant="outline" size="sm" onClick={onDownloadScript}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        {onDebugStory && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDebugStory}
            className="text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            <span className="mr-2">🛠️</span>
            Fix Scenes
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader; 