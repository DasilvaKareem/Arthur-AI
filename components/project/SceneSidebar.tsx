"use client";

import React from 'react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Plus, Film, Pencil, Trash, Camera } from "lucide-react";
import type { Scene } from '../../types/shared';

interface SceneSidebarProps {
  scenes: Scene[];
  currentScene: Scene | null;
  script: string; // Assuming the brief description comes from the main script
  onSceneSelect: (scene: Scene) => void;
  onSceneRename: (sceneId: string, newTitle: string) => void;
  onSceneDelete: (sceneId: string) => void;
  onAddNewScene: () => void;
  onGenerateAllImages: () => void;
  onGenerateSceneVideo: (sceneId: string) => void;
  onSceneDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSceneLightingChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSceneWeatherChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSceneStyleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; // Added for style
}

const SceneSidebar: React.FC<SceneSidebarProps> = ({
  scenes,
  currentScene,
  script,
  onSceneSelect,
  onSceneRename,
  onSceneDelete,
  onAddNewScene,
  onGenerateAllImages,
  onGenerateSceneVideo,
  onSceneDescriptionChange,
  onSceneLightingChange,
  onSceneWeatherChange,
  onSceneStyleChange
}) => {
  return (
    <div className="w-full md:w-64 bg-muted/30 p-4 flex flex-col border-r border-border">
      {/* Scene List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Scenes</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNewScene}
            className="h-8 px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex overflow-x-auto pb-3 space-x-2 snap-x">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className={`flex-none min-w-[140px] flex flex-col justify-between p-2 rounded-lg cursor-pointer transition-colors snap-start ${
                currentScene?.id === scene.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted border border-transparent"
              }`}
              onClick={() => onSceneSelect(scene)}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Film className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground truncate">
                  {scene.title || "Untitled Scene"}
                </span>
              </div>
              <div className="flex items-center space-x-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTitle = prompt("Enter new scene title:", scene.title);
                    if (newTitle !== null) { // Check if prompt was cancelled
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
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-amber-600 dark:text-amber-400">{currentScene?.title || "SCENE 1"}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {script.includes("INT.") || script.includes("EXT.") 
            ? script.split('\n')[0].trim() 
            : "Sarah Thompson returns to Eldridge, evoking nostalgia as she revisits her childhood town."}
        </p>

        {/* Scene Video Preview */}
        {currentScene?.generatedVideo && (
          <div className="mt-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Scene Video</h3>
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
              <video
                src={currentScene.generatedVideo}
                controls
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                Generated Scene Video
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2 mt-3">
          <Button 
            className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm rounded-md px-4 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white w-full"
            onClick={onGenerateAllImages}
            disabled={currentScene?.isGeneratingImages}
          >
            {currentScene?.isGeneratingImages ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-primary border-opacity-30 border-t-primary rounded-full mr-2 dark:border-slate-200 dark:border-t-slate-200 dark:border-opacity-80" />
                Processing...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Generate All Images
              </>
            )}
          </Button>
          {currentScene && (
            <button
              onClick={() => onGenerateSceneVideo(currentScene.id)}
              disabled={!currentScene.shots.some(shot => shot.generatedImage) || currentScene.isGeneratingVideo}
              className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm rounded-md px-4 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white w-full"
            >
              {currentScene.isGeneratingVideo ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-opacity-30 border-t-primary rounded-full mr-2 dark:border-slate-200 dark:border-t-slate-200 dark:border-opacity-80" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Generate Scene Video</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Generates images and video for all shots in this scene
        </p>
      </div>
      
      <div className="mb-4">
        <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-2">Description</h3>
        <textarea
          className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={6}
          placeholder="Describe the scene in detail (location, lighting, weather, style and background elements)"
          value={currentScene?.description || ''}
          onChange={onSceneDescriptionChange}
        />
      </div>
    </div>
  );
};

export default SceneSidebar;
