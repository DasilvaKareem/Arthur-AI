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
    <div className="bg-white border-b p-3 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-100">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Storyboard</h1>
      </div>
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSaveStory} 
          disabled={isSaving || isLoadingAuth}
          className="text-green-600 border-green-300 hover:bg-green-50"
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
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync
        </Button>
        <Button variant="outline" size="sm" onClick={onExportScene} className="text-amber-600 border-amber-300 hover:bg-amber-50">
          <Download className="mr-2 h-4 w-4" />
          Export Scene
        </Button>
        <Button variant="outline" size="sm" onClick={onCopyToClipboard} className="text-gray-600 border-gray-300">
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={onDownloadScript} className="text-gray-600 border-gray-300">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default ProjectHeader; 