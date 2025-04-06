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
    <div className="w-full md:w-64 bg-gray-50 p-4 flex flex-col border-r">
      {/* Scene List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Scenes</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNewScene}
            className="h-8 px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                currentScene?.id === scene.id
                  ? "bg-purple-100 border border-purple-200"
                  : "hover:bg-gray-100 border border-transparent"
              }`}
              onClick={() => onSceneSelect(scene)}
            >
              <div className="flex items-center space-x-2">
                <Film className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 truncate">
                  {scene.title || "Untitled Scene"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
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
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
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
        <h2 className="text-xl font-bold text-amber-600">{currentScene?.title || "SCENE 1"}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {script.includes("INT.") || script.includes("EXT.") 
            ? script.split('\n')[0].trim() 
            : "Sarah Thompson returns to Eldridge, evoking nostalgia as she revisits her childhood town."}
        </p>

        {/* Scene Video Preview */}
        {currentScene?.generatedVideo && (
          <div className="mt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Scene Video</h3>
            <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
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
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md"
            onClick={onGenerateAllImages}
          >
            <Camera className="mr-2 h-5 w-5" />
            Generate All Images
          </Button>
          {currentScene && (
            <button
              onClick={() => onGenerateSceneVideo(currentScene.id)}
              disabled={!currentScene.shots.some(shot => shot.generatedImage)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg
                className="w-5 h-5"
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
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Generates images and video for all shots in this scene
        </p>
      </div>
      
      <div className="mb-4">
        <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-2">Description</h3>
        <textarea
          className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
          placeholder="Describe the location"
          value={currentScene?.description || ''}
          onChange={onSceneDescriptionChange}
        />
      </div>
      
      <div className="mb-4">
        <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-2">Lighting</h3>
        <textarea
          className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={2}
          placeholder="Describe the lighting"
          value={currentScene?.lighting || ''}
          onChange={onSceneLightingChange}
        />
      </div>
      
      <div className="mb-4">
        <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-2">Weather</h3>
        <textarea
          className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={2}
          placeholder="Describe the weather"
          value={currentScene?.weather || ''}
          onChange={onSceneWeatherChange}
        />
      </div>
      
      <div className="mt-4">
        <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-2">Style</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Camera className="text-gray-500 h-5 w-5" />
            <p className="text-sm text-gray-700">Video Style</p>
          </div>
          <select 
            className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={currentScene?.style || "hyperrealistic"} // Ensure controlled component
            onChange={onSceneStyleChange} // Use passed handler
          >
            <option value="hyperrealistic">Hyperrealistic</option>
            <option value="anime">Anime</option>
            <option value="90s-cartoon">90s Cartoon</option>
            <option value="cyberpunk">Cyberpunk</option>
            <option value="steampunk">Steampunk</option>
            <option value="pixar">Pixar Style</option>
            <option value="studio-ghibli">Studio Ghibli</option>
            <option value="comic-book">Comic Book</option>
            <option value="watercolor">Watercolor</option>
            <option value="oil-painting">Oil Painting</option>
            <option value="pixel-art">Pixel Art</option>
            <option value="low-poly">Low Poly</option>
            <option value="retro-wave">Retro Wave</option>
            <option value="vaporwave">Vaporwave</option>
            <option value="synthwave">Synthwave</option>
            <option value="neon">Neon</option>
            <option value="noir">Film Noir</option>
            <option value="western">Western</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="fantasy">Fantasy</option>
            <option value="horror">Horror</option>
            <option value="documentary">Documentary</option>
            <option value="vintage">Vintage</option>
            <option value="minimalist">Minimalist</option>
            <option value="abstract">Abstract</option>
            <option value="surreal">Surreal</option>
            <option value="pop-art">Pop Art</option>
            <option value="impressionist">Impressionist</option>
            <option value="expressionist">Expressionist</option>
            <option value="cubist">Cubist</option>
            <option value="art-deco">Art Deco</option>
            <option value="brutalism">Brutalism</option>
            <option value="retro-futuristic">Retro Futuristic</option>
            <option value="biopunk">Biopunk</option>
            <option value="dieselpunk">Dieselpunk</option>
            <option value="solarpunk">Solarpunk</option>
            <option value="atompunk">Atompunk</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SceneSidebar; 