"use client";

import React from 'react';
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowLeft, Download, Copy, Save, RefreshCw, Loader2 } from "lucide-react";

interface ProjectHeaderProps {
  isSaving: boolean;
  isLoadingAuth: boolean; // Renamed from loading to be clearer
  onSaveStory: () => void;
  onSyncScenes: () => void;
  onExportScene: () => void;
  onCopyToClipboard: () => void;
  onDownloadScript: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  isSaving,
  isLoadingAuth,
  onSaveStory,
  onSyncScenes,
  onExportScene,
  onCopyToClipboard,
  onDownloadScript,
}) => {
  return (
    <div className="bg-background border-b border-border p-3 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Storyboard</h1>
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
        <Button variant="outline" size="sm" onClick={onCopyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={onDownloadScript}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default ProjectHeader; 