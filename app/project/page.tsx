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
import { createStory, updateStory, getStoryWithSubcollections, updateSceneSubcollection, updateShotSubcollection, deleteSceneSubcollection, deleteShotSubcollection, uploadShotImage, validateSceneData, validateShotData, cleanupShotDescriptions, ensureStoryHasScene, createSceneSubcollection, createShotSubcollection, analyzeStoryStructure, migrateStoryToSubcollections, removeNestedScenes } from '../lib/firebase/stories';
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
import { SoundEffectsEditor } from "../../components/SoundEffectsEditor";

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

// Add themeColors mapping for button styling
const themeColors = {
  neutral: "bg-primary hover:bg-primary/90",
  red: "bg-red-500 hover:bg-red-600",
  violet: "bg-violet-500 hover:bg-violet-600",
  blue: "bg-blue-500 hover:bg-blue-600",
  tangerine: "bg-orange-500 hover:bg-orange-600",
  emerald: "bg-emerald-500 hover:bg-emerald-600",
  amber: "bg-amber-500 hover:bg-amber-600"
};

function ProjectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading, refreshAuth } = useAuth();
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
  const [videoStatusMessages, setVideoStatusMessages] = useState<Record<string, string>>({});
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [forceShowTimeline, setForceShowTimeline] = useState(false);
  const [shotDescriptions, setShotDescriptions] = useState<Record<string, string>>({});
  const [showingSoundEffects, setShowingSoundEffects] = useState<Record<string, boolean>>({});
  const [userThemeColor, setUserThemeColor] = useState<string>("neutral");

  // Add effect to get user's theme color from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedColorTheme = localStorage.getItem("color-theme") || "neutral";
      setUserThemeColor(savedColorTheme);
    }
  }, []);

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
    const checkEmbedding = () => {
      try {
        const isInsideIframe = window !== window.parent;
        console.log("Project page is embedded in iframe:", isInsideIframe);
        setIsEmbedded(isInsideIframe);
      } catch (e) {
        // If we can't access window.parent due to cross-origin issues,
        // assume we're in an iframe
        console.log("Error checking iframe status, assuming embedded:", e);
        setIsEmbedded(true);
      }
    };
    
    checkEmbedding();
    
    // Use a timeout to ensure the check happens after the page is fully loaded
    const timeoutId = setTimeout(checkEmbedding, 1000);
    
    // Add a keyboard shortcut (Alt+T) to toggle timeline visibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 't') {
        setForceShowTimeline(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Log that the project page was loaded
    console.log("📜 Script Project Page Loaded!");
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadStory = useCallback(async (id: string) => {
    try {
      console.log("Loading story with ID:", id);
      setIsLoading(true);
      
      // First, ensure the story has at least one scene
      await ensureStoryHasScene(id);
      
      // Clean up any nested scenes array
      await removeNestedScenes(id);
      
      // Use the new subcollection-based function
      const story = await getStoryWithSubcollections(id);
      console.log("Story loaded using subcollections:", story);
      
      if (!story) {
        toast.error("Story not found");
        return;
      }
      
      // Set basic story properties
      setTitle(story.title || "Untitled Story");
      setScript(story.description || "");
      
      // Check if scenes array exists and has items
      if (story.scenes && Array.isArray(story.scenes) && story.scenes.length > 0) {
        console.log(`Setting ${story.scenes.length} scenes`);
        setScenes(story.scenes);
        
        // Set current scene to the first scene
        const firstScene = story.scenes[0];
        console.log("Setting current scene:", firstScene);
        setCurrentScene(firstScene);
      } else {
        console.log("No scenes found in story, setting empty array");
        setScenes([]);
        setCurrentScene(null);
        toast.warning("This story has no scenes. Create your first scene below.");
      }
    } catch (error) {
      console.error("Error loading story:", error);
      toast.error(`Failed to load story: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
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

  // Add a function to rename the story
  const handleRenameStory = useCallback(async (newTitle: string) => {
    if (!storyId) {
      toast.error("No story ID found");
      return;
    }

    try {
      setIsSaving(true);
      
      // Update state immediately for responsive UI
      setTitle(newTitle);
      
      // Update in Firebase
      await updateStory(storyId, {
        title: newTitle,
        updatedAt: new Date()
      });
      
      toast.success("Story renamed successfully");
    } catch (error) {
      console.error("Error renaming story:", error);
      toast.error("Failed to rename story");
    } finally {
      setIsSaving(false);
    }
  }, [storyId]);

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
      // Use the new function for updating scenes
      await updateSceneSubcollection(storyId, sceneId, updates);
      
      // Update local state
      setScenes(prevScenes => 
        prevScenes.map(scene => 
          scene.id === sceneId ? { ...scene, ...updates } : scene
        )
      );
      
      if (currentScene?.id === sceneId) {
        setCurrentScene({ ...currentScene, ...updates });
      }
      
      toast.success("Scene updated successfully");
    } catch (error) {
      console.error("Error updating scene:", error);
      toast.error("Failed to update scene. Please try again.");
    }
  }, [storyId, currentScene, setScenes, setCurrentScene]);

  // Update shot details
  const updateShotDetails = useCallback(async (sceneId: string, shotId: string, updates: Partial<Shot>) => {
    if (!storyId) return;
    
    try {
      // Use the new function for updating shots
      await updateShotSubcollection(storyId, sceneId, shotId, updates);
      
      // Update local state
      setScenes(prevScenes => 
        prevScenes.map(scene => {
          if (scene.id !== sceneId) return scene;
          
          return {
            ...scene,
            shots: scene.shots.map(shot => 
              shot.id !== shotId ? shot : { ...shot, ...updates }
            )
          };
        })
      );
      
      // Also update currentScene if needed
      if (currentScene?.id === sceneId) {
        setCurrentScene({
          ...currentScene,
          shots: currentScene.shots.map(shot => 
            shot.id !== shotId ? shot : { ...shot, ...updates }
          )
        });
      }
    } catch (error) {
      console.error("Error updating shot details:", error);
      toast.error("Failed to update shot details");
    }
  }, [storyId, setScenes, setCurrentScene, currentScene]);

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

  // Replace the existing sound effects handlers with a single manual save handler
  const handleSoundEffectsSave = useCallback(async (shotId: string, hasSoundEffects: boolean, soundEffects: string) => {
    if (!currentScene?.id || !storyId) return;
    
    try {
      toast.loading("Saving sound effects...", { id: `sound-effects-${shotId}` });
      
      // Update Firebase
      await updateShotDetails(currentScene.id, shotId, { 
        soundEffects, 
        hasSoundEffects 
      });
      
      // Update UI
      setScenes(prevScenes => 
        prevScenes.map(scene => {
          if (scene.id !== currentScene.id) return scene;
          return {
            ...scene,
            shots: scene.shots.map(shot => {
              if (shot.id !== shotId) return shot;
              return {
                ...shot,
                soundEffects,
                hasSoundEffects
              };
            })
          };
        })
      );
      
      // Also update currentScene if needed
      setCurrentScene({
        ...currentScene,
        shots: currentScene.shots.map(shot => 
          shot.id !== shotId ? shot : { ...shot, soundEffects, hasSoundEffects }
        )
      });
      
      toast.success("Sound effects saved", { id: `sound-effects-${shotId}` });
    } catch (error) {
      console.error("Error saving sound effects:", error);
      toast.error("Failed to save sound effects", { id: `sound-effects-${shotId}` });
    }
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
          const story = await getStoryWithSubcollections(storyId);
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
      // Validate the prompt first
      const cleanedPrompt = description?.trim();
      if (!cleanedPrompt || cleanedPrompt.length < 3) {
        toast.error("Description must be at least 3 characters");
        return;
      }
      
      setImageLoadingStates(prev => ({ ...prev, [currentScene.shots[index].id]: true }));
      
      // Call the image generation API
      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: cleanedPrompt,
          aspectRatio: "16:9",
          model: "photon-1"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start image generation");
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
      toast.error("Failed to generate shot image: " + (error as Error).message);
    } finally {
      setImageLoadingStates(prev => ({ ...prev, [currentScene.shots[index].id]: false }));
    }
  };

  const generateShotVideo = async (shotId: string) => {
    try {
      // Set loading state for this specific shot to true
      setVideoLoadingStates((prev) => ({ ...prev, [shotId]: true }));
      setVideoStatusMessages((prev) => ({ ...prev, [shotId]: "Initializing video generation..." }));
      
      // Show starting toast
      toast.loading("Starting video generation...", { id: `video-${shotId}` });
      
      const currentShot = currentScene?.shots.find((s) => s.id === shotId);

      if (!currentShot) {
        console.error(`Shot with id ${shotId} not found`);
        setVideoLoadingStates((prev) => ({ ...prev, [shotId]: false }));
        toast.error("Shot not found", { id: `video-${shotId}` });
        return;
      }

      console.log("Generating video for shot:", currentShot);

      // Validate shot has an image before sending
      if (!currentShot.generatedImage) {
        const errorMessage = "Shot has no generated image. Please generate an image first.";
        console.error(errorMessage);
        setVideoLoadingStates((prev) => ({ ...prev, [shotId]: false }));
        setVideoStatusMessages((prev) => ({ ...prev, [shotId]: `Error: ${errorMessage}` }));
        toast.error(errorMessage, { id: `video-${shotId}` });
        return;
      }

      if (!currentShot.description && !currentShot.prompt) {
        const errorMessage = "Shot has no description or prompt. Please add a description.";
        console.error(errorMessage);
        setVideoLoadingStates((prev) => ({ ...prev, [shotId]: false }));
        setVideoStatusMessages((prev) => ({ ...prev, [shotId]: `Error: ${errorMessage}` }));
        toast.error(errorMessage, { id: `video-${shotId}` });
        return;
      }

      // Log what we're sending to the API for debugging
      const requestBody = {
        shotId,
        storyId,
        shots: [{
          imageUrl: currentShot.generatedImage,
          prompt: currentShot.description || currentShot.prompt,
          duration: 5 // Default duration in seconds
        }],
        style: currentScene?.style || "hyperrealistic"
      };
      console.log("Sending video generation request:", requestBody);

      // Start the video generation process
      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Log entire response for debugging
      console.log("API Response status:", response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = "Unknown error";
        try {
          const errorData = await response.json();
          console.error("Video API error response:", errorData);
          errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Video generation started - full response:", data);
      
      // Log all available properties in the response to identify the correct ID field
      console.log("Response keys:", Object.keys(data));
      if (data.id) console.log("Found id:", data.id);
      if (data.generationId) console.log("Found generationId:", data.generationId);
      if (data.generation_id) console.log("Found generation_id:", data.generation_id);
      if (data.videoId) console.log("Found videoId:", data.videoId);
      
      // Extract the generation ID from the response
      // Try multiple possible field names
      const generationId = data.id || data.generationId || data.generation_id || data.videoId;
      console.log("Using generation ID for status checks:", generationId);
      
      if (!generationId) {
        throw new Error("No generation ID returned from API");
      }
      
      toast.loading("Video generation in progress...", { id: `video-${shotId}` });
      setVideoStatusMessages((prev) => ({ ...prev, [shotId]: "Video generation started..." }));

      // Poll for video generation status
      let isComplete = false;
      let retries = 0;
      const maxRetries = 60; // 5 minutes with 5-second intervals
      
      while (!isComplete && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
        retries++;

        try {
          // Try with different parameter formats in case the API expects a different name
          // Include both generationId and the original shotId/storyId parameters
          const statusUrl = `/api/video/status?id=${generationId}&shotId=${shotId}&storyId=${storyId}`;
          console.log(`Checking status with URL: ${statusUrl}`);
          
          const statusResponse = await fetch(statusUrl);

          if (!statusResponse.ok) {
            const errorText = await statusResponse.text();
            console.error(`Status check failed (attempt ${retries}):`, errorText);
            
            // Only update toast after several failures to avoid flickering
            if (retries % 3 === 0) {
              toast.loading(`Status check failed, retrying (${retries})...`, { id: `video-${shotId}` });
            }
            
            continue;
          }

          const statusData = await statusResponse.json();
          console.log("Video generation status (attempt " + retries + "):", statusData);
          console.log("Status data keys:", Object.keys(statusData));

          // Update status message based on the current status
          if (statusData.status) {
            const statusMessage = `${statusData.status}${statusData.progress ? ` (${statusData.progress}%)` : ''}`;
            setVideoStatusMessages((prev) => ({ ...prev, [shotId]: statusMessage }));
            
            // Update toast with current status
            toast.loading(`Video: ${statusMessage}`, { id: `video-${shotId}` });
          }

          // Check for completion - try various possible field names
          const videoUrl = statusData.video || statusData.videoUrl || statusData.url || 
            (statusData.assets && statusData.assets.video);
            
          if (statusData.status === "completed" && videoUrl) {
            console.log("Video generation completed with URL:", videoUrl);
            
            // Store the video URL for the shot
            if (currentScene) {
              await updateShotDetails(currentScene.id, shotId, {
                generatedVideo: videoUrl
              });
            }
            
            isComplete = true;
            break;
          } else if (statusData.status === "failed" || statusData.error) {
            throw new Error(statusData.error || "Video generation failed");
          }
        } catch (pollError) {
          console.error("Error during status polling:", pollError);
          // Continue polling despite errors
        }
      }

      if (!isComplete) {
        throw new Error("Video generation timed out after 5 minutes");
      }

      console.log("Video generation complete for shot:", shotId);
      setVideoStatusMessages((prev) => ({ ...prev, [shotId]: "Complete!" }));
      toast.success("Video generation complete!", { id: `video-${shotId}` });
      
      // Reload the story to get the updated video URL
      if (storyId) {
        await loadStory(storyId);
      }
      
      // Set loading state for this specific shot back to false
      setVideoLoadingStates((prev) => ({ ...prev, [shotId]: false }));
    } catch (error) {
      console.error("Error generating video:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      setVideoStatusMessages((prev) => ({ ...prev, [shotId]: `Error: ${errorMessage}` }));
      setVideoLoadingStates((prev) => ({ ...prev, [shotId]: false }));
      
      toast.error(`Video generation failed: ${errorMessage}`, { id: `video-${shotId}` });
    }
  };

  const addNewShot = async () => {
    if (!currentScene) return;
    
    try {
      // Create a new shot with subcollection approach
      const newShot = {
        type: "WIDE",
        description: "",
        prompt: "",
        hasDialogue: false,
        hasNarration: false,
        hasSoundEffects: false
      };
      
      await createShotSubcollection(storyId as string, currentScene.id, newShot);
      
      // Reload the story to get the updated scene structure
      await loadStory(storyId as string);
      
      toast.success("New shot added successfully");
    } catch (error) {
      console.error("Error adding new shot:", error);
      toast.error("Failed to add new shot");
    }
  };

  const handleSceneSelect = (scene: Scene) => {
    setCurrentScene(scene);
  };

  const handleSceneRename = async (sceneId: string, newTitle: string) => {
    // Update local state
    setScenes(prev => prev.map(scene => 
      scene.id === sceneId 
        ? { ...scene, title: newTitle }
        : scene
    ));
    
    // Persist changes to the database
    try {
      if (storyId) {
        // Find the updated scene
        const updatedScene = scenes.find(scene => scene.id === sceneId);
        if (updatedScene) {
          // Create a new scene object with the updated title
          const sceneWithNewTitle = { ...updatedScene, title: newTitle };
          // Update the scene in the database
          await updateSceneSubcollection(storyId, sceneId, sceneWithNewTitle);
          console.log("Scene title updated successfully:", newTitle);
        }
      }
    } catch (error) {
      console.error("Error updating scene title:", error);
      toast.error("Failed to save scene title change");
    }
  };

  const handleSceneDelete = async (sceneId: string) => {
    if (!confirm("Are you sure you want to delete this scene?")) return;
    
    try {
      if (storyId) {
        // Use subcollection delete function
        await deleteSceneSubcollection(storyId, sceneId);
        
        setScenes(prev => prev.filter(scene => scene.id !== sceneId));
        if (currentScene?.id === sceneId) {
          // Set current scene to the first remaining scene or null
          const remainingScenes = scenes.filter(scene => scene.id !== sceneId);
          setCurrentScene(remainingScenes.length > 0 ? remainingScenes[0] : null);
        }
        
        toast.success("Scene deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting scene:", error);
      toast.error("Failed to delete scene");
    }
  };

  const addNewScene = async () => {
    if (!storyId) return;
    
    try {
      // Create a new scene with subcollection approach
      const newScene = {
        title: `Scene ${scenes.length + 1}`,
        location: "New Location",
        description: "New scene description",
        lighting: "NATURAL",
        weather: "CLEAR",
        style: "CINEMATIC"
      };
      
      const sceneId = await createSceneSubcollection(storyId, newScene);
      
      // Create a default shot for the scene
      await createShotSubcollection(storyId, sceneId, {
        type: "WIDE",
        description: "",
        prompt: "",
        hasDialogue: false,
        hasNarration: false,
        hasSoundEffects: false
      });
      
      // Reload the story to get the updated scene structure
      await loadStory(storyId);
      
      toast.success("New scene added successfully");
    } catch (error) {
      console.error("Error adding new scene:", error);
      toast.error("Failed to add new scene");
    }
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
        await generateShotVideo(currentScene.shots[i].id);
      }
      toast.success("Scene video generation complete");
    } catch (error) {
      console.error("Error generating scene video:", error);
      toast.error("Failed to generate scene video");
    }
  };

  // Toggle sound effects popup for a specific shot
  const toggleSoundEffectsPopup = (shotId: string) => {
    setShowingSoundEffects(prev => ({
      ...prev,
      [shotId]: !prev[shotId]
    }));
  };

  // Add authentication recovery logic
  useEffect(() => {
    // Check if refreshAuth function exists in auth context
    if (!refreshAuth) {
      console.warn("Auth refresh function not available");
      return;
    }
    
    // Set up auth recovery listener to handle token loss
    const handleAuthError = () => {
      console.log("🔄 Detecting potential auth error, attempting recovery...");
      refreshAuth().catch((err: Error) => {
        console.error("Failed to refresh authentication:", err);
      });
    };
    
    // Listen for auth errors which might be indicated by Firebase errors in console
    window.addEventListener('error', (event) => {
      if (event.error?.message?.includes('auth') || 
          event.error?.message?.includes('token') ||
          event.error?.message?.includes('permission')) {
        handleAuthError();
      }
    });
    
    // Set up periodic auth check
    const authCheckInterval = setInterval(() => {
      if (storyId && !user) {
        handleAuthError();
      }
    }, 60 * 1000); // Check once per minute
    
    return () => {
      clearInterval(authCheckInterval);
    };
  }, [refreshAuth, user, storyId]);

  // Update debug story function
  const debugStoryStructure = async () => {
    if (!storyId) {
      toast.error("No story ID found");
      return;
    }
    
    try {
      toast.loading("Analyzing story structure...", { id: "analyze-story" });
      
      // Analyze the story structure
      const analysis = await analyzeStoryStructure(storyId);
      console.log("Story analysis:", analysis);
      
      if (analysis.structure.hasNestedScenes) {
        // Ask user if they want to migrate
        const confirmMigration = window.confirm(
          `Found ${analysis.structure.nestedSceneCount} scenes in array format and ${analysis.structure.subcollectionSceneCount} scenes in subcollections.\n\n` +
          `Would you like to migrate all scenes to subcollections?`
        );
        
        if (confirmMigration) {
          toast.loading("Migrating scenes to subcollections...", { id: "migrate-story" });
          
          // Perform the migration
          const success = await migrateStoryToSubcollections(storyId);
          
          if (success) {
            toast.success("Successfully migrated story to subcollections", { id: "migrate-story" });
            
            // Always clean up the nested scenes array
            await removeNestedScenes(storyId);
            
            // Reload the story to get the updated structure
            await loadStory(storyId);
          } else {
            toast.error("Failed to migrate story", { id: "migrate-story" });
          }
        } else {
          // If user doesn't want to migrate, still clear the nested array
          const confirmCleanup = window.confirm(
            "Would you like to clear the nested scenes array to prevent confusion?"
          );
          
          if (confirmCleanup) {
            await removeNestedScenes(storyId);
            toast.success("Cleared nested scenes array", { id: "analyze-story" });
          }
        }
      } else if (!analysis.structure.hasSubcollectionScenes) {
        // No scenes found anywhere
        const confirmCreateScene = window.confirm(
          "No scenes found in this story. Would you like to create a default scene?"
        );
        
        if (confirmCreateScene) {
          await ensureStoryHasScene(storyId);
          // Also clean up any potential empty scenes array
          await removeNestedScenes(storyId);
          await loadStory(storyId);
          toast.success("Created default scene for story");
        }
      } else {
        // Story has subcollection scenes, still clean up any potential nested array
        await removeNestedScenes(storyId);
        toast.success(`Story has ${analysis.structure.subcollectionSceneCount} scenes in subcollections`, { id: "analyze-story" });
        
        // Reload the story to get the updated structure
        await loadStory(storyId);
      }
    } catch (error) {
      console.error("Error debugging story:", error);
      toast.error(`Failed to debug story: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Use the ProjectHeader component */}
      <ProjectHeader
        isSaving={isSaving}
        isLoadingAuth={loading}
        storyTitle={title}
        onSaveStory={saveStory}
        onSyncScenes={handleSyncScenes}
        onExportScene={handleExportScene}
        onCopyToClipboard={handleCopyToClipboard}
        onDownloadScript={handleDownload}
        onRenameStory={handleRenameStory}
        onDebugStory={debugStoryStructure}
      />
      
      <div className="flex flex-col flex-1">
        {/* Main content area */}
        <div className="flex-1 overflow-auto bg-background">
          {/* Storyboard-style shot layout */}
          <div className="flex overflow-x-auto p-4 gap-4 pb-6 snap-x">
            {currentScene?.shots.map((shot, index) => (
              <div key={shot.id} className="flex-none w-[350px] min-w-[350px] snap-center flex flex-col">
                {/* Shot frame */}
                <div className="aspect-video bg-muted/10 dark:bg-muted/20 border border-border rounded-lg overflow-hidden relative">
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
                      {videoLoadingStates[shot.id] && (
                        <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/75 text-white">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm font-medium max-w-xs text-center px-4">{videoStatusMessages[shot.id] || "Generating video..."}</p>
                          {videoStatusMessages[shot.id]?.includes("Error") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-2 bg-red-500 text-white hover:bg-red-600 border-0"
                              onClick={() => generateShotVideo(shot.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Retry
                            </Button>
                          )}
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
                  
                  {/* Add sound effects icon */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    onClick={() => toggleSoundEffectsPopup(shot.id)}
                    title={shot.hasSoundEffects ? "Edit sound effects" : "Add sound effects"}
                  >
                    <Music className={`h-4 w-4 ${shot.hasSoundEffects ? "text-green-500" : ""}`} />
                  </Button>
                  
                  {/* Sound Effects Popup */}
                  {showingSoundEffects[shot.id] && (
                    <div className="absolute top-10 right-2 z-20 bg-background border border-border rounded-lg shadow-lg p-2 w-52 max-w-[95%]">
                      <h3 className="text-xs font-medium mb-1 flex justify-between items-center">
                        Sound Effects
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 p-0" 
                          onClick={() => toggleSoundEffectsPopup(shot.id)}
                        >
                          ✕
                        </Button>
                      </h3>
                      <SoundEffectsEditor
                        shotId={shot.id}
                        initialHasSoundEffects={shot.hasSoundEffects || false}
                        initialSoundEffects={shot.soundEffects || ""}
                        onSave={handleSoundEffectsSave}
                        onClose={() => toggleSoundEffectsPopup(shot.id)}
                      />
                      <div className="text-xs text-blue-500 mt-1">
                        Click "Save" to update.
                      </div>
                    </div>
                  )}
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
                <div className="shot-actions flex gap-2 mt-2">
                  {shot.generatedImage && (
                    <button
                      className={`flex items-center px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded ${
                        videoLoadingStates[shot.id] ? 'opacity-90 cursor-not-allowed' : ''
                      }`}
                      onClick={() => generateShotVideo(shot.id)}
                      disabled={videoLoadingStates[shot.id]}
                    >
                      {videoLoadingStates[shot.id] ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                          <span>{videoStatusMessages[shot.id] || "Generating..."}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Generate Video
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add shot button */}
            <div className="flex-none w-[350px] min-w-[350px] snap-center flex items-center justify-center">
              <Button 
                onClick={addNewShot} 
                className={`${themeColors[userThemeColor as keyof typeof themeColors]} text-white h-40 w-full flex flex-col items-center justify-center shadow-md`}
              >
                <Plus className="h-12 w-12 mb-2" />
                <span>Add Shot</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline at the bottom - more reliable display logic */}
        {(!isEmbedded || forceShowTimeline) && (
          <div className="border-t border-border bg-background">
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
            
            {/* Show toggle button when in embedded mode */}
            {isEmbedded && (
              <Button 
                variant="outline" 
                size="sm"
                className="absolute right-2 top-2 bg-background text-xs"
                onClick={() => setForceShowTimeline(prev => !prev)}
              >
                {forceShowTimeline ? "Hide Timeline" : "Show Timeline"}
              </Button>
            )}
          </div>
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