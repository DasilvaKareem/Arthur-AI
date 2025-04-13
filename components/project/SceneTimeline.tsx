"use client";

import React from 'react';
import { Button } from "../ui/button";
import { Plus, Film, Pencil, Trash, Camera } from "lucide-react";
import type { Scene } from '../../types/shared';

interface SceneTimelineProps {
  scenes: Scene[];
  currentScene: Scene | null;
  script: string;
  onSceneSelect: (scene: Scene) => void;
  onSceneRename: (sceneId: string, newTitle: string) => void;
  onSceneDelete: (sceneId: string) => void;
  onAddNewScene: () => void;
  onGenerateAllImages?: () => void;
  onGenerateSceneVideo?: (sceneId: string) => void;
  loadError?: string | null;
}

const SceneTimeline: React.FC<SceneTimelineProps> = ({
  scenes,
  currentScene,
  script,
  onSceneSelect,
  onSceneRename,
  onSceneDelete,
  onAddNewScene,
  onGenerateAllImages,
  onGenerateSceneVideo,
  loadError
}) => {
  // Add console log for debugging
  console.log("SceneTimeline rendering:", { 
    sceneCount: scenes?.length || 0, 
    currentScene: currentScene?.id || 'none',
    loadError: loadError || 'none' 
  });

  // If there's an error, display it
  if (loadError) {
    return (
      <div className="w-full bg-muted/30 border-t border-border p-4 text-center">
        <div className="text-sm text-destructive">
          {loadError}
        </div>
        <button 
          onClick={onAddNewScene}
          className="mt-2 text-xs text-primary hover:text-primary/80 underline"
        >
          Try adding a new scene
        </button>
      </div>
    );
  }

  // If there are no scenes, show a helpful message
  if (!scenes || scenes.length === 0) {
    return (
      <div className="w-full bg-muted/30 border-t border-border p-4 text-center">
        <div className="text-sm text-muted-foreground">
          No scenes found. Create your first scene to see it in the timeline.
        </div>
        <button 
          onClick={onAddNewScene}
          className="mt-2 inline-flex items-center px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Scene
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-muted/30 border-t border-border p-2">
      {/* Scene Timeline */}
      <div className="flex items-center mb-1 px-2">
        <h3 className="text-sm font-semibold text-foreground">Scenes</h3>
        <div className="flex-1"></div>
        {/* Show generate buttons if the handlers are provided */}
        {onGenerateAllImages && currentScene && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onGenerateAllImages}
            className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700"
            title="Generate all images for the current scene"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
        {onGenerateSceneVideo && currentScene && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGenerateSceneVideo(currentScene.id)}
            className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700"
            title="Generate video for the current scene"
          >
            <Film className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddNewScene}
          className="h-8 px-2"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="relative">
        {/* Timeline track */}
        <div className="absolute h-1 bg-muted-foreground/20 left-0 right-0 top-7"></div>
        
        {/* Scene items */}
        <div className="flex overflow-x-auto pb-3 space-x-4 px-2 relative">
          {scenes.map((scene, index) => (
            <div
              key={scene.id}
              className={`flex-none min-w-[100px] flex flex-col items-center cursor-pointer ${
                currentScene?.id === scene.id
                  ? "scale-110 z-10"
                  : "hover:scale-105"
              } transition-all`}
              onClick={() => onSceneSelect(scene)}
            >
              <div className={`w-full rounded-md p-2 mb-2 transition-colors ${
                currentScene?.id === scene.id
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-background hover:bg-muted border border-muted"
              }`}>
                <div className="flex items-center justify-between">
                  <Film className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">{index + 1}</span>
                </div>
                <div className="text-sm text-foreground text-center mt-1 truncate">
                  {scene.title || "Untitled Scene"}
                </div>
              </div>
              
              {/* Timeline node */}
              <div className={`w-4 h-4 rounded-full border-2 ${
                currentScene?.id === scene.id
                  ? "bg-primary border-primary-foreground"
                  : "bg-background border-muted-foreground"
              }`}></div>
              
              {/* Actions */}
              <div className="flex mt-2 space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTitle = prompt("Enter new scene title:", scene.title);
                    if (newTitle !== null) {
                      onSceneRename(scene.id, newTitle || scene.title);
                    }
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSceneDelete(scene.id);
                  }}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Add scene button */}
          <div className="flex-none min-w-[100px] flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddNewScene}
              className="h-16 w-full border border-dashed border-muted-foreground/40 rounded-md mb-2 hover:bg-muted/50"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 bg-background"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneTimeline; 