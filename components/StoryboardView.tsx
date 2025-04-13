"use client";

import React, { useState, useEffect } from "react";
import { getStory } from "@/app/lib/firebase/stories";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Play, ChevronRight, ChevronLeft, X } from "lucide-react";
import type { Story, Scene, Shot } from "@/types/shared";
import { cn } from "@/lib/utils";
import ShotVideoPlayer from "./project/ShotVideoPlayer";

interface StoryboardViewProps {
  projectId: string | null;
}

const StoryboardView: React.FC<StoryboardViewProps> = ({ projectId }) => {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playingShotId, setPlayingShotId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchStory = async () => {
      setLoading(true);
      try {
        const fetchedStory = await getStory(projectId);
        setStory(fetchedStory);
        setError(null);
      } catch (err) {
        console.error("Error loading story:", err);
        setError("Failed to load project. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [projectId]);

  const navigateScene = (direction: 'next' | 'prev') => {
    if (!story || !story.scenes || story.scenes.length === 0) return;
    
    // Reset playing video when changing scenes
    setPlayingShotId(null);
    
    if (direction === 'next') {
      setCurrentSceneIndex(prev => 
        prev < story.scenes.length - 1 ? prev + 1 : prev
      );
    } else {
      setCurrentSceneIndex(prev => prev > 0 ? prev - 1 : prev);
    }
  };

  const handlePlayVideo = (shotId: string) => {
    console.log("Playing video for shot:", shotId);
    
    // Find the shot and log its video URL
    if (story && story.scenes) {
      const currentScene = story.scenes[currentSceneIndex];
      if (currentScene && currentScene.shots) {
        const shot = currentScene.shots.find(s => s.id === shotId);
        if (shot) {
          console.log("Shot video URL:", shot.generatedVideo);
        }
      }
    }
    
    setPlayingShotId(shotId);
  };

  const handleCloseVideo = () => {
    console.log("Closing video");
    setPlayingShotId(null);
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <h3 className="text-xl font-medium mb-2">No Project Selected</h3>
          <p className="text-muted-foreground">Select a project from the sidebar to view its storyboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <h3 className="text-xl font-medium mb-2 text-red-500">Error</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!story || !story.scenes || story.scenes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <h3 className="text-xl font-medium mb-2">No Scenes Found</h3>
          <p className="text-muted-foreground">This project doesn't have any scenes or shots yet</p>
        </div>
      </div>
    );
  }

  const currentScene = story.scenes[currentSceneIndex];

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{story.title || "Untitled Story"}</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateScene('prev')}
            disabled={currentSceneIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Scene {currentSceneIndex + 1} of {story.scenes.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateScene('next')}
            disabled={currentSceneIndex === story.scenes.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{currentScene.title}</h2>
        <p className="text-muted-foreground text-sm">{currentScene.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs bg-secondary px-2 py-1 rounded-full">
            {currentScene.location}
          </span>
          <span className="text-xs bg-secondary px-2 py-1 rounded-full">
            {currentScene.lighting}
          </span>
          <span className="text-xs bg-secondary px-2 py-1 rounded-full">
            {currentScene.weather}
          </span>
          <span className="text-xs bg-secondary px-2 py-1 rounded-full">
            {currentScene.style}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentScene.shots && currentScene.shots.map((shot, index) => (
          <Card key={shot.id} className="overflow-hidden border border-border hover:border-primary/50 transition-colors">
            <div className="relative aspect-video bg-muted">
              {playingShotId === shot.id && shot.generatedVideo ? (
                // Show ShotVideoPlayer when this shot is playing
                <div className="absolute inset-0">
                  <ShotVideoPlayer
                    videoUrl={shot.generatedVideo}
                    className="w-full h-full"
                    controls={true}
                    autoPlay={true}
                    loop={true}
                    overlayInfo={{
                      title: `Shot ${index + 1}: ${shot.type}`,
                      description: shot.description.substring(0, 100) + (shot.description.length > 100 ? '...' : '')
                    }}
                  />
                  <div className="absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded bg-black/60">
                    <a 
                      href={shot.generatedVideo} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="underline text-blue-300 hover:text-blue-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Direct link
                    </a>
                  </div>
                  <Button 
                    size="icon" 
                    variant="secondary"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseVideo();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // Show the image or placeholder when not playing
                <>
                  {shot.generatedImage ? (
                    <Image
                      src={shot.generatedImage}
                      alt={`Shot ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">No image generated</p>
                    </div>
                  )}
                  {shot.generatedVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="flex flex-col items-center gap-2">
                        <Button 
                          size="icon" 
                          className="w-10 h-10 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayVideo(shot.id);
                            console.log("Playing video:", shot.generatedVideo);
                          }}
                        >
                          <Play className="h-5 w-5" />
                        </Button>
                        <div className="flex gap-1">
                          <Button 
                            size="sm"
                            variant="outline"
                            className="h-6 py-0 px-2 bg-black/60 hover:bg-black/80 text-white text-[10px] border-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (shot.generatedVideo) {
                                window.open(shot.generatedVideo, '_blank');
                              }
                            }}
                          >
                            Direct link
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {shot.generatedVideo === undefined ? "No video data" : (shot.generatedVideo === null ? "Video is null" : `Video URL: ${shot.generatedVideo.substring(0, 20)}...`)}
                    </div>
                  )}
                </>
              )}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {shot.type}
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-sm line-clamp-2">{shot.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {shot.hasDialogue && (
                  <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">Dialogue</span>
                )}
                {shot.hasNarration && (
                  <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">Narration</span>
                )}
                {shot.hasSoundEffects && (
                  <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">SFX</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StoryboardView; 