"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import TopNavBar from "../../components/TopNavBar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft, Download, Copy, Share, ChevronDown, Plus, Edit, Trash, Pencil, Camera, Film, Music, Volume2, Loader2, Save, RefreshCw, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createStory, updateStory, getStory, updateScene, updateShot, deleteScene, deleteShot, uploadShotImage, validateSceneData, validateShotData, cleanupShotDescriptions } from '../lib/firebase/stories';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase/client';
import type { Shot, Scene, Story } from '../../types/shared';
import ShotCard from "../../components/project/ShotCard";
import SceneSidebar from "../../components/project/SceneSidebar"; // Import the new component
import SceneTimeline from "../../components/project/SceneTimeline"; // Import the new timeline component
import ProjectHeader from "../../components/project/ProjectHeader"; // Import the new header component
import { debounce } from 'lodash';

interface VideoGenerationShot {
  imageUrl: string | null;
  prompt?: string;
  duration: number;
}

interface VideoGenerationRequest {
  shots: VideoGenerationShot[];
  style: string;
  prompt: string;
  duration: number;
}

function ProjectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [script, setScript] = useState<string>("");
  const [title, setTitle] = useState<string>("My Script Project");
  const [expandedScript, setExpandedScript] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  // Add state for image and video loading states
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [videoLoadingStates, setVideoLoadingStates] = useState<Record<string, boolean>>({});
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [shotDescriptions, setShotDescriptions] = useState<Record<string, string>>({});

  useEffect(() => {
    const scriptParam = searchParams.get("script");
    const titleParam = searchParams.get("title");
    const idParam = searchParams.get("id");
    
    if (idParam) {
      setStoryId(idParam);
      loadStory(idParam);
    } else if (scriptParam && user) {
      // If we have a script and user is authenticated, create a new story immediately
      const createNewStory = async () => {
        try {
          const story: Story = {
            id: crypto.randomUUID(),
            title: "New Story",
            description: "",
            script: "", // Add the required script property
            userId: user?.uid || "",
            scenes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const storyId = await createStory(story.title, story.description, story.userId, story.scenes);
          setCurrentStory(story);
          setCurrentStoryId(storyId);
        } catch (error) {
          console.error("Error creating new story:", error);
          toast.error("Failed to create new story");
        }
      };
      
      createNewStory();
    } else if (scriptParam) {
      try {
        const decodedScript = decodeURIComponent(scriptParam);
        setScript(decodedScript);
        
        // Parse script into scenes and shots
        parseScriptIntoScenes(decodedScript);
      } catch (error) {
        console.error("Error decoding script:", error);
        setScript("Error loading script");
      }
    }

    if (titleParam) {
      setTitle(decodeURIComponent(titleParam));
    } else {
      // Default title includes date/time
      setTitle(`Script Project - ${new Date().toLocaleString()}`);
    }

    // Log that the project page was loaded
    console.log("📜 Script Project Page Loaded!");
  }, [searchParams, user]);

  useEffect(() => {
    // Check if this page is inside an iframe
    const isInsideIframe = window !== window.parent;
    setIsEmbedded(isInsideIframe);
    console.log("Project page is embedded in iframe:", isInsideIframe);
  }, []);

  const loadStory = useCallback(async (id: string) => {
    try {
      const story = await getStory(id);
      if (story) {
        // Clean up any "Describe your shot..." values
        await cleanupShotDescriptions(id);
        
        // Reload the story after cleanup
        const cleanedStory = await getStory(id);
        if (cleanedStory) {
          setTitle(cleanedStory.title || "Untitled Story");
          setScript(cleanedStory.description || "");
          setScenes(cleanedStory.scenes || []);
          setCurrentScene(cleanedStory.scenes[0] || null);
        }
      }
    } catch (error) {
      console.error("Error loading story:", error);
    }
  }, []);

  const saveStory = useCallback(async () => {
    try {
      if (!user) {
        console.error('No user found, redirecting to sign in...');
        toast.error('Please sign in to save your story');
        router.push('/auth/signin');
        return;
      }

      // Log authentication state
      toast.success(`Authenticated as: ${user.uid}`);
      console.log('Auth state:', {
        uid: user.uid,
        email: user.email,
        isAuthenticated: !!user
      });

      console.log('Starting story save...', {
        hasStoryId: !!storyId,
        title,
        scenesCount: scenes.length,
        userId: user.uid
      });

      if (!title) {
        toast.error('Please enter a title for your story');
        return;
      }

      if (!scenes || scenes.length === 0) {
        toast.error('Your story must have at least one scene');
        return;
      }

      // Validate all scenes have required fields
      for (const scene of scenes) {
        console.log('Validating scene:', {
          id: scene.id,
          title: scene.title,
          location: scene.location,
          description: scene.description,
          lighting: scene.lighting,
          weather: scene.weather,
          style: scene.style,
          shotsCount: scene.shots?.length
        });

        if (!scene.title || !scene.location || !scene.description || !scene.lighting || !scene.weather || !scene.style) {
          const missingFields = [];
          if (!scene.title) missingFields.push('title');
          if (!scene.location) missingFields.push('location');
          if (!scene.description) missingFields.push('description');
          if (!scene.lighting) missingFields.push('lighting');
          if (!scene.weather) missingFields.push('weather');
          if (!scene.style) missingFields.push('style');
          
          toast.error(`Scene "${scene.title || 'Untitled'}" is missing fields: ${missingFields.join(', ')}`);
          return;
        }
        if (!scene.shots || scene.shots.length === 0) {
          toast.error(`Scene "${scene.title}" must have at least one shot`);
          return;
        }
        // Validate all shots have required fields
        for (const shot of scene.shots) {
          if (!shot.type || !shot.description) {
            const missingFields = [];
            if (!shot.type) missingFields.push('type');
            if (!shot.description) missingFields.push('description');
            toast.error(`Shot in scene "${scene.title}" is missing fields: ${missingFields.join(', ')}`);
            return;
          }
        }
      }

      if (storyId) {
        console.log('Updating existing story:', storyId);
        await updateStory(storyId, {
          title,
          description: script || "", // Ensure script is not undefined
          script: script || "", // Explicitly provide script with a fallback value
          scenes,
          updatedAt: new Date()
        });
        toast.success('Story updated successfully');
      } else {
        console.log('Creating new story...');
        const newStoryId = await createStory(user.uid, title, script || "", scenes);
        setStoryId(newStoryId);
        toast.success('Story created successfully');
      }
    } catch (error: any) {
      console.error('Error saving story:', error);
      const errorMessage = error.message || 'Failed to save story. Please try again.';
      toast.error(errorMessage);
    }
  }, [user, storyId, title, script, scenes, router]);

  // Parse the script into scenes and shots
  const parseScriptIntoScenes = useCallback((scriptText: string) => {
    try {
      console.log("Parsing script:", scriptText);
      
      // Split the script into scenes
      const sceneSections = scriptText.split(/(?=SCENE \d+:)/);
      const scenes: Scene[] = [];
      
      sceneSections.forEach((section, sceneIndex) => {
        if (!section.trim()) return;
        
        console.log(`Processing scene ${sceneIndex + 1}:`, section);
        
        // Generate unique IDs
        const sceneId = `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Extract scene heading and location
        const headingMatch = section.match(/^SCENE\s+(\d+):\s+(.+)$/m);
        const locationMatch = section.match(/(?:INT\.|EXT\.)\s+([^\n-]+)/);
        
        // Create scene object with default values
        const scene: Scene = {
          id: sceneId,
          title: headingMatch ? headingMatch[2].trim() : `SCENE ${sceneIndex + 1}`,
          location: locationMatch ? locationMatch[1].trim() : "Default Location",
          description: "",
          lighting: "",
          weather: "",
          style: "hyperrealistic",
          shots: []
        };

        // Extract scene details
        const descriptionMatch = section.match(/Description:\n(.*?)(?=\n\n|$)/s);
        if (descriptionMatch) {
          scene.description = descriptionMatch[1].trim();
        }

        const lightingMatch = section.match(/Lighting:\n(.*?)(?=\n\n|$)/s);
        if (lightingMatch) {
          scene.lighting = lightingMatch[1].trim();
        }

        const weatherMatch = section.match(/Weather:\n(.*?)(?=\n\n|$)/s);
        if (weatherMatch) {
          scene.weather = weatherMatch[1].trim();
        }

        // Parse shots
        const shotSections = section.split(/(?=SHOT:|CLOSE-UP:|MEDIUM SHOT:)/);
        
        shotSections.forEach((shotSection, shotIndex) => {
          if (!shotSection.trim()) return;

          console.log(`Processing shot ${shotIndex + 1}:`, shotSection);

          const shotId = `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const shot: Shot = {
            id: shotId,
            type: "ESTABLISHING SHOT",
            description: "",
            hasNarration: false,
            hasDialogue: false,
            hasSoundEffects: false,
            prompt: "",
            narration: undefined,
            dialogue: undefined,
            soundEffects: undefined,
            location: undefined,
            lighting: undefined,
            weather: undefined,
            generatedImage: undefined,
            generatedVideo: undefined
          };

          // Extract shot type
          const typeMatch = shotSection.match(/^(SHOT|CLOSE-UP|MEDIUM SHOT):/);
          if (typeMatch) {
            shot.type = typeMatch[1];
          }

          // Extract shot description
          const descriptionMatch = shotSection.match(/Description:\n(.*?)(?=\n\n|$)/s);
          if (descriptionMatch) {
            shot.description = descriptionMatch[1].trim();
            shot.prompt = shot.description;
          }

          // Extract dialogue
          const dialogueMatch = shotSection.match(/Dialogue:\n(.*?)(?=\n\n|$)/s);
          if (dialogueMatch) {
            shot.hasDialogue = true;
            shot.dialogue = dialogueMatch[1].trim();
          }

          // Extract narration
          const narrationMatch = shotSection.match(/Narration:\n(.*?)(?=\n\n|$)/s);
          if (narrationMatch) {
            shot.hasNarration = true;
            shot.narration = narrationMatch[1].trim();
          }

          // Extract sound effects
          const soundMatch = shotSection.match(/Sound Effects:\n(.*?)(?=\n\n|$)/s);
          if (soundMatch) {
            shot.hasSoundEffects = true;
            shot.soundEffects = soundMatch[1].trim();
          }

          scene.shots.push(shot);
        });

        scenes.push(scene);
      });

      console.log("Parsed scenes:", scenes);
      setScenes(scenes);
      setCurrentScene(scenes[0]);
    } catch (error) {
      console.error("Error parsing script into scenes:", error);
      toast.error("Failed to parse script. Please check the format and try again.");
    }
  }, [setScenes, setCurrentScene]);

  // Update scene details
  const updateSceneDetails = useCallback(async (sceneId: string, updates: Partial<Omit<Scene, 'shots'>>) => {
    if (!storyId) return;
    
    try {
      // Get the full story first
      const story = await getStory(storyId);
      if (!story) {
        throw new Error("Story not found");
      }
      
      // Update the specific scene in the story
      const updatedScenes = story.scenes.map(scene => 
        scene.id === sceneId ? { ...scene, ...updates } : scene
      );
      
      // Update the entire story
      await updateStory(storyId, {
        ...story,
        scenes: updatedScenes,
        title: story.title || "Untitled Story",
        description: story.description || "No description",
        script: story.script || "", // Explicitly include script with fallback
        userId: story.userId || user?.uid || "",
        updatedAt: new Date()
      });
      
      // Update local state
      setScenes(updatedScenes);
      if (currentScene?.id === sceneId) {
        setCurrentScene({ ...currentScene, ...updates });
      }
    } catch (error) {
      console.error("Error updating scene:", error);
      alert("Failed to update scene. Please try again.");
    }
  }, [storyId, user, currentScene, setScenes, setCurrentScene]);

  // Update shot details
  const updateShotDetails = useCallback(async (sceneId: string, shotId: string, updates: Partial<Shot>) => {
    if (!storyId) return;
    
    try {
      const story = await getStory(storyId);
      if (!story) {
        throw new Error("Story not found");
      }

      const updatedScenes = story.scenes.map(scene => {
        if (scene.id !== sceneId) return scene;
        return {
          ...scene,
          shots: scene.shots.map(shot => {
            if (shot.id !== shotId) return shot;
            return {
              ...shot,
              ...updates
            };
          })
        };
      });

      await updateStory(storyId, {
        ...story,
        scenes: updatedScenes,
        updatedAt: new Date()
      });

      setScenes(updatedScenes);
      const foundScene = updatedScenes.find(scene => scene.id === sceneId);
      setCurrentScene(foundScene || null);
    } catch (error) {
      console.error("Error updating shot details:", error);
      toast.error("Failed to update shot details");
    }
  }, [storyId, setScenes, setCurrentScene]);

  // Update shot description handler
  const handleShotDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!currentScene?.id || !storyId || !currentScene.shots[index]?.id) return;
    
    const shotId = currentScene.shots[index].id;
    
    // Update local state immediately
    setShotDescriptions(prev => ({
      ...prev,
      [shotId]: e.target.value
    }));
    
    // Update scenes state for immediate UI feedback
    setScenes(prevScenes => 
      prevScenes.map(scene => {
        if (scene.id !== currentScene.id) return scene;
        return {
          ...scene,
          shots: scene.shots.map((shot, i) => {
            if (i !== index) return shot;
            return {
              ...shot,
              description: e.target.value,
              prompt: e.target.value
            };
          })
        };
      })
    );
  }, [currentScene, storyId, setScenes]);

  // Handle blur - update Firebase
  const handleShotDescriptionBlur = useCallback(async (index: number) => {
    if (!currentScene?.id || !storyId || !currentScene.shots[index]?.id) return;
    
    const shotId = currentScene.shots[index].id;
    const description = shotDescriptions[shotId];
    
    try {
      await updateShotDetails(currentScene.id, shotId, { 
        description, 
        prompt: description 
      });
      toast.success("Shot description saved");
    } catch (error) {
      console.error("Error saving shot description:", error);
      toast.error("Failed to save shot description");
    }
  }, [currentScene, storyId, shotDescriptions, updateShotDetails]);

  // Update shot type handler
  const handleShotTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    if (!currentScene?.id || !storyId || !currentScene.shots[index]?.id) return;
    const updates = { type: e.target.value };
    updateShotDetails(currentScene.id, currentScene.shots[index].id, updates);
  }, [currentScene, storyId, updateShotDetails]);

  // Update dialogue handler
  const handleDialogueChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!currentScene?.id || !storyId || !currentScene.shots[index]?.id) return;
    const updates = { dialogue: e.target.value, hasDialogue: !!e.target.value };
    updateShotDetails(currentScene.id, currentScene.shots[index].id, updates);
  }, [currentScene, storyId, updateShotDetails]);

  // Update sound effects handler
  const handleSoundEffectsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!currentScene?.id || !storyId || !currentScene.shots[index]?.id) return;
    const updates = { soundEffects: e.target.value, hasSoundEffects: !!e.target.value };
    updateShotDetails(currentScene.id, currentScene.shots[index].id, updates);
  }, [currentScene, storyId, updateShotDetails]);

  // Add voice selection handler
  const handleVoiceSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    if (!currentScene?.id || !storyId || !currentScene.shots[index]?.id) return;
    const updates = { voiceId: e.target.value };
    updateShotDetails(currentScene.id, currentScene.shots[index].id, updates);
  }, [currentScene, storyId, updateShotDetails]);

  // Update scene description handler
  const handleSceneDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentScene?.id || !storyId) return;
    const updates = { 
      description: e.target.value,
      // Keep the existing lighting, weather, and style values or use defaults
      lighting: currentScene.lighting || "Natural daylight",
      weather: currentScene.weather || "Clear",
      style: currentScene.style || "hyperrealistic"
    };
    updateSceneDetails(currentScene.id, updates);
  }, [currentScene, storyId, updateSceneDetails]);

  // Update scene lighting handler
  const handleSceneLightingChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentScene?.id || !storyId) return;
    const updates = { lighting: e.target.value };
    updateSceneDetails(currentScene.id, updates);
  }, [currentScene, storyId, updateSceneDetails]);

  // Update scene weather handler
  const handleSceneWeatherChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentScene?.id || !storyId) return;
    const updates = { weather: e.target.value };
    updateSceneDetails(currentScene.id, updates);
  }, [currentScene, storyId, updateSceneDetails]);

  // Add handler for scene style change
  const handleSceneStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!currentScene?.id || !storyId) return;
    const updates = { style: e.target.value };
    updateSceneDetails(currentScene.id, updates);
  }, [currentScene, storyId, updateSceneDetails]);

  const handleSyncScenes = useCallback(async () => {
      if (!storyId) {
          toast.error("No story ID found");
      return;
    }
      try {
          const story = await getStory(storyId);
          if (story) {
              setScenes(story.scenes || []);
              setCurrentScene(story.scenes[0] || null);
              toast.success("Scenes synced successfully");
          }
    } catch (error) {
          console.error("Error syncing scenes:", error);
          toast.error("Failed to sync scenes. Please try again.");
    }
  }, [storyId, setScenes, setCurrentScene]);

  // Generate lip sync for a shot with dialogue
  const generateLipSync = useCallback(async (shotIndex: number) => {
    if (!currentScene?.shots[shotIndex] || !storyId) {
        toast.error("Cannot generate lip sync: Missing scene, shot, or story ID");
        return;
    }
    const shot = currentScene.shots[shotIndex];
    if (!shot.dialogue) {
      toast.error("No dialogue found for this shot");
      return;
    }

    if (!shot.generatedVideo) {
      toast.error("Please generate a video for this shot first");
      return;
    }

    try {
      // Show loading toast
      toast.loading("Generating lip sync...", {
        id: "lipsync-generation",
      });

      // First, generate speech from dialogue using ElevenLabs
      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: shot.dialogue,
          voiceId: shot.voiceId || "21m00Tcm4TlvDq8ikWAM", // Default voice ID
          modelId: "eleven_multilingual_v2"
        }),
      });

      if (!ttsResponse.ok) {
        const errorData = await ttsResponse.json();
        throw new Error(errorData.error || "Failed to generate speech");
      }

      const ttsData = await ttsResponse.json();
      
      // Upload the audio to a temporary URL
      const audioUrl = await uploadTemporaryFile(ttsData.audio, "audio/wav");

      // Start lip sync generation using Sync Labs
      const lipsyncResponse = await fetch("/api/lipsync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: shot.generatedVideo,
          audioUrl: audioUrl,
          outputFormat: "mp4"
        }),
      });

      if (!lipsyncResponse.ok) {
        const errorData = await lipsyncResponse.json();
        throw new Error(errorData.error || "Failed to start lip sync generation");
      }

      const lipsyncData = await lipsyncResponse.json();
      console.log("Lip sync generation started with ID:", lipsyncData.id);

      // Poll for lip sync generation status
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/lipsync?id=${lipsyncData.id}`);
          if (!statusResponse.ok) {
            throw new Error("Failed to check lip sync generation status");
          }
          
          const statusData = await statusResponse.json();
          console.log("Lip sync generation status:", statusData.state);

          if (statusData.state === "completed") {
            try {
              // Update the shot with the lip synced video URL
              const updatedShots = [...currentScene.shots];
              if (updatedShots[shotIndex]) {
                updatedShots[shotIndex] = {
                  ...updatedShots[shotIndex],
                  lipSyncAudio: ttsData.audio,
                  lipSyncVideo: statusData.assets.video,
                } as Shot;
                
                const updatedScene = { ...currentScene, shots: updatedShots };
                setCurrentScene(updatedScene);
                setScenes(scenes.map(scene => 
                  scene.id === currentScene.id ? updatedScene : scene
                ));
                console.log("Successfully updated shot with lip sync");
                toast.success("Lip sync generated successfully!", {
                  id: "lipsync-generation",
                });
              }
            } catch (error) {
              console.error("Error updating shot with lip sync:", error);
              toast.error("Failed to save lip sync. Please try again.", {
                id: "lipsync-generation",
              });
            }
          } else if (statusData.state === "failed") {
            throw new Error(statusData.failure_reason || "Lip sync generation failed");
          } else {
            // Continue polling
            setTimeout(pollStatus, 3000);
          }
        } catch (error) {
          console.error("Error during lip sync status polling:", error);
          toast.error(error instanceof Error ? error.message : "Failed to check lip sync generation status. Please try again.", {
            id: "lipsync-generation",
          });
        }
      };

      pollStatus();
    } catch (error) {
      console.error("Error generating lip sync:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate lip sync. Please try again.");
    }
  }, [currentScene, storyId, setScenes, setCurrentScene]);

  // Helper function to upload temporary files
  const uploadTemporaryFile = async (base64Data: string, contentType: string): Promise<string> => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: contentType });
      
      // Create FormData and append blob
      const formData = new FormData();
      formData.append('file', blob, `temp-${Date.now()}.${contentType.split('/')[1]}`);
      
      // Upload to your storage service (e.g., Firebase Storage)
      const storageRef = ref(storage, `temp/${Date.now()}.${contentType.split('/')[1]}`);
      await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error("Error uploading temporary file:", error);
      throw error;
    }
  };

  const handleDownload = () => {
    // ... existing download code ...
  };

  const handleExportScene = async () => {
    if (!currentScene) {
      toast.error("No scene selected to export");
      return;
    }
    
    try {
      const sceneData = {
        title: currentScene.title,
        location: currentScene.location,
        description: currentScene.description,
        shots: currentScene.shots.map(shot => ({
          type: shot.type,
          description: shot.description,
          generatedImage: shot.generatedImage,
          generatedVideo: shot.generatedVideo
        }))
      };
      
      // Create a JSON blob and download it
      const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scene-${currentScene.title.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Scene exported successfully");
    } catch (error) {
      console.error("Error exporting scene:", error);
      toast.error("Failed to export scene");
    }
  };

  const uploadTempFile = async (blob: Blob) => {
    // ... existing code ...
  };

  const handleCopyToClipboard = async () => {
    if (!currentScene) {
      toast.error("No scene selected to copy");
      return;
    }

    try {
      const sceneText = `Scene: ${currentScene.title}\nLocation: ${currentScene.location}\nDescription: ${currentScene.description}\n\nShots:\n${currentScene.shots.map((shot, index) => `${index + 1}. ${shot.type}: ${shot.description}`).join('\n')}`;
      
      await navigator.clipboard.writeText(sceneText);
      toast.success("Scene details copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy scene details");
    }
  };

  const generateShotFromPrompt = async (index: number, description: string) => {
    if (!currentScene) return;
    
    try {
      setImageLoadingStates(prev => ({ ...prev, [currentScene.shots[index].id]: true }));
      
      // Call the image generation API
      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: description,
          aspectRatio: "16:9",
          model: "photon-1"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start image generation");
      }

      const data = await response.json();
      
      // Poll for the generated image using the ID returned from the API
      let imageUrl = null;
      let retries = 30; // 30 retries with 2 second delay = 1 minute timeout
      
      while (retries > 0 && !imageUrl) {
        // Wait for 2 seconds between polling attempts
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const statusResponse = await fetch(`/api/image/status?id=${data.id}`);
          
          if (!statusResponse.ok) {
            console.error("Status check failed:", await statusResponse.text());
            retries--;
            continue;
          }
          
          const statusData = await statusResponse.json();
          console.log("Status check:", statusData);
          
          if (statusData.status === "completed" && statusData.imageUrl) {
            imageUrl = statusData.imageUrl;
            break;
          }
          
          if (statusData.status === "failed") {
            throw new Error(statusData.error || "Image generation failed");
          }
        } catch (pollError) {
          console.error("Error polling for image status:", pollError);
        }
        
        retries--;
      }
      
      if (!imageUrl) {
        throw new Error("Image generation timed out or failed");
      }
      
      // Update the shot with the generated image URL
      const updatedShots = [...currentScene.shots];
      updatedShots[index] = {
        ...updatedShots[index],
        generatedImage: imageUrl
      };
      
      // Update Firebase with the new image URL
      await updateShotDetails(currentScene.id, currentScene.shots[index].id, { 
        generatedImage: imageUrl 
      });
      
      // Update the UI
      setScenes(prev => prev.map(scene => 
        scene.id === currentScene.id 
          ? { ...scene, shots: updatedShots }
          : scene
      ));
      
      toast.success("Shot image generated successfully");
    } catch (error) {
      console.error("Error generating shot:", error);
      toast.error("Failed to generate shot image");
    } finally {
      setImageLoadingStates(prev => ({ ...prev, [currentScene.shots[index].id]: false }));
    }
  };

  const generateShotVideo = async (index: number) => {
    if (!currentScene) return;
    
    try {
      setVideoLoadingStates(prev => ({ ...prev, [currentScene.shots[index].id]: true }));
      
      // Ensure we have an image to use for video generation
      if (!currentScene.shots[index].generatedImage) {
        throw new Error("Shot needs an image before generating video");
      }
      
      // Call the video generation API
      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shots: [{
            imageUrl: currentScene.shots[index].generatedImage,
            prompt: currentScene.shots[index].description || "Create a cinematic video"
          }],
          prompt: "Create a cinematic video",
          duration: "5s"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start video generation");
      }

      const data = await response.json();
      
      // Poll for the generated video using the ID returned from the API
      let videoUrl = null;
      let retries = 60; // 60 retries with 3 second delay = 3 minute timeout
      
      while (retries > 0 && !videoUrl) {
        // Wait for 3 seconds between polling attempts
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          const statusResponse = await fetch(`/api/video/status?id=${data.id}`);
          
          if (!statusResponse.ok) {
            console.error("Status check failed:", await statusResponse.text());
            retries--;
            continue;
          }
          
          const statusData = await statusResponse.json();
          console.log("Video status check:", statusData);
          
          if (statusData.status === "completed" && statusData.videoUrl) {
            videoUrl = statusData.videoUrl;
            break;
          }
          
          if (statusData.status === "failed") {
            throw new Error(statusData.error || "Video generation failed");
          }
        } catch (pollError) {
          console.error("Error polling for video status:", pollError);
        }
        
        retries--;
      }
      
      if (!videoUrl) {
        throw new Error("Video generation timed out or failed");
      }
      
      // Update the shot with the generated video URL
      const updatedShots = [...currentScene.shots];
      updatedShots[index] = {
        ...updatedShots[index],
        generatedVideo: videoUrl
      };
      
      // Update Firebase with the new video URL
      await updateShotDetails(currentScene.id, currentScene.shots[index].id, { 
        generatedVideo: videoUrl 
      });
      
      // Update the UI
      setScenes(prev => prev.map(scene => 
        scene.id === currentScene.id 
          ? { ...scene, shots: updatedShots }
          : scene
      ));
      
      toast.success("Shot video generated successfully");
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error("Failed to generate shot video");
    } finally {
      setVideoLoadingStates(prev => ({ ...prev, [currentScene.shots[index].id]: false }));
    }
  };

  const addNewShot = () => {
    if (!currentScene) return;
    
    const newShot: Shot = {
      id: crypto.randomUUID(),
      type: "WIDE",
      description: "",
      generatedImage: null,
      generatedVideo: null,
      hasNarration: false,
      hasDialogue: false,
      hasSoundEffects: false,
      prompt: "",
      narration: "",
      dialogue: "",
      soundEffects: ""
    };
    
    setScenes(prev => prev.map(scene => 
      scene.id === currentScene.id 
        ? { ...scene, shots: [...scene.shots, newShot] }
        : scene
    ));
  };

  const handleSceneSelect = (scene: Scene) => {
    setCurrentScene(scene);
  };

  const handleSceneRename = (sceneId: string, newTitle: string) => {
    setScenes(prev => prev.map(scene => 
      scene.id === sceneId 
        ? { ...scene, title: newTitle }
        : scene
    ));
  };

  const handleSceneDelete = async (sceneId: string) => {
    if (!confirm("Are you sure you want to delete this scene?")) return;
    
    try {
      if (storyId) {
        await deleteScene(storyId, sceneId);
      }
      setScenes(prev => prev.filter(scene => scene.id !== sceneId));
      if (currentScene?.id === sceneId) {
        setCurrentScene(null);
      }
      toast.success("Scene deleted successfully");
    } catch (error) {
      console.error("Error deleting scene:", error);
      toast.error("Failed to delete scene");
    }
  };

  const addNewScene = () => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      title: `Scene ${scenes.length + 1}`,
      location: "",
      description: "",
      lighting: "NATURAL",
      weather: "CLEAR",
      style: "CINEMATIC",
      shots: []
    };
    
    setScenes(prev => [...prev, newScene]);
    setCurrentScene(newScene);
  };

  const generateAllShotImages = async () => {
    if (!currentScene) return;
    
    try {
      for (let i = 0; i < currentScene.shots.length; i++) {
        await generateShotFromPrompt(i, currentScene.shots[i].description);
      }
    } catch (error) {
      console.error("Error generating all shot images:", error);
      toast.error("Failed to generate all shot images");
    }
  };

  const generateSceneVideo = async () => {
    if (!currentScene) return;
    
    try {
      for (let i = 0; i < currentScene.shots.length; i++) {
        await generateShotVideo(i);
      }
      toast.success("Scene video generation complete");
    } catch (error) {
      console.error("Error generating scene video:", error);
      toast.error("Failed to generate scene video");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Use the ProjectHeader component */}
      <ProjectHeader
        isSaving={isSaving}
        isLoadingAuth={loading} // Pass the auth loading state
        onSaveStory={saveStory}
        onSyncScenes={handleSyncScenes}
        onExportScene={handleExportScene}
        onCopyToClipboard={handleCopyToClipboard}
        onDownloadScript={handleDownload}
      />
      
      <div className="flex flex-col flex-1">
        {/* Main content area */}
        <div className="flex-1 overflow-auto bg-background">
          {/* Storyboard-style shot layout */}
          <div className="flex overflow-x-auto p-4 gap-4 pb-6 snap-x">
            {currentScene?.shots.map((shot, index) => (
              <div key={shot.id} className="flex-none w-[350px] min-w-[350px] snap-center flex flex-col">
                {/* Shot frame */}
                <div className="aspect-video bg-black/10 border border-border rounded-lg overflow-hidden relative">
                  {shot.generatedImage ? (
                    <div className="w-full h-full relative">
                      <Image 
                        src={shot.generatedImage} 
                        alt={`Shot ${index + 1}`} 
                        layout="fill" 
                        objectFit="cover"
                      />
                      {shot.generatedVideo && (
                        <div className="absolute inset-0 flex justify-center items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-black/50 text-white hover:bg-black/70 h-14 w-14 rounded-full"
                            onClick={() => {
                              if (shot.generatedVideo) {
                                window.open(shot.generatedVideo, '_blank');
                              }
                            }}
                          >
                            <Play className="h-8 w-8" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center text-muted-foreground">
                      {imageLoadingStates[shot.id] ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm">Generating image...</p>
                        </div>
                      ) : (
                        <Button 
                          className="bg-primary/90 hover:bg-primary text-primary-foreground dark:bg-primary/80 dark:hover:bg-primary/90 shadow-sm"
                          onClick={() => generateShotFromPrompt(index, shot.description)}
                        >
                          <Camera className="mr-2 h-4 w-4" /> Generate
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {index + 1} - {shot.type}
                  </div>
                </div>
                
                {/* Shot description input */}
                <textarea
                  className="w-full mt-2 bg-background border border-input rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                  placeholder={`Shot ${index + 1} description`}
                  value={shotDescriptions[shot.id] ?? shot.description}
                  onChange={(e) => handleShotDescriptionChange(e, index)}
                  onBlur={() => handleShotDescriptionBlur(index)}
                  id={`shot-${index}-prompt`}
                />
                
                {/* Action buttons */}
                <div className="flex gap-2 mt-2">
                  {shot.generatedImage && !videoLoadingStates[shot.id] && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateShotVideo(index)}
                      className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm h-8 rounded-md px-3 text-xs flex-1 text-foreground hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
                      disabled={videoLoadingStates[shot.id]}
                    >
                      {videoLoadingStates[shot.id] ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-opacity-30 border-t-primary rounded-full mr-2 dark:border-slate-200 dark:border-t-slate-200 dark:border-opacity-80"></div>
                      ) : (
                        <Film className="h-3 w-3 mr-1" />
                      )}
                      Generate Video
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add shot button */}
            <div className="flex-none w-[350px] min-w-[350px] snap-center flex items-center justify-center">
              <Button 
                onClick={addNewShot} 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-700 dark:to-purple-900 dark:hover:from-purple-600 dark:hover:to-purple-800 text-white h-40 w-full flex flex-col items-center justify-center shadow-md"
              >
                <Plus className="h-12 w-12 mb-2" />
                <span>Add Shot</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline at the bottom - only show if not embedded in workspace */}
        {!isEmbedded && (
          <SceneTimeline
            scenes={scenes}
            currentScene={currentScene}
            script={script}
            onSceneSelect={handleSceneSelect}
            onSceneRename={handleSceneRename}
            onSceneDelete={handleSceneDelete}
            onAddNewScene={addNewScene}
            onGenerateAllImages={generateAllShotImages}
            onGenerateSceneVideo={generateSceneVideo}
          />
        )}
      </div>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectContent />
    </Suspense>
  );
} 