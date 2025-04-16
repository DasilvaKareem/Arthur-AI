"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import TopNavBar from "../../components/TopNavBar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft, Download, Copy, Share, ChevronDown, Plus, Edit, Trash, Pencil, Camera, Film, Music, Volume2, Loader2, Save, RefreshCw, Play, MessageSquare, X, Video } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createStory, updateStory, getStoryWithSubcollections, updateSceneSubcollection, updateShotSubcollection, deleteSceneSubcollection, deleteShotSubcollection, uploadShotImage, validateSceneData, validateShotData, cleanupShotDescriptions, ensureStoryHasScene, createSceneSubcollection, createShotSubcollection, removeNestedScenes } from '../lib/firebase/stories';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase/client';
import type { Shot, Scene, Story } from '../../types/shared';
import SceneSidebar from "../../components/project/SceneSidebar"; // Import the new component
import SceneTimeline from "../../components/project/SceneTimeline"; // Import the new timeline component
import ProjectHeader from "../../components/project/ProjectHeader"; // Import the new header component
import { debounce } from 'lodash';
import { SoundEffectsEditor } from "../../components/SoundEffectsEditor";
import ShotVideoPlayer from "../../components/project/ShotVideoPlayer";
import StoryboardView from "../../components/StoryboardView";
import EnhancedShotCard from "../../components/project/EnhancedShotCard";
import { ShotProvider } from '../../components/project/ShotContext';
import { AudioService } from '../../lib/services/audioService';

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
  const [showingDialogue, setShowingDialogue] = useState<Record<string, boolean>>({});
  const [userThemeColor, setUserThemeColor] = useState<string>("neutral");
  // Add view mode state
  const [viewMode, setViewMode] = useState<'editor' | 'storyboard'>('editor');
  // Add state for temporary dialogue values
  const [tempDialogueValues, setTempDialogueValues] = useState<Record<string, string>>({});
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

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

  // Detect if this page is embedded in an iframe and adjust accordingly
  useEffect(() => {
    // Check if this page is loaded inside an iframe
    const isInsideIframe = window !== window.parent;
    if (isInsideIframe) {
      console.log("Project page is embedded in iframe, switching to storyboard view");
      setViewMode('storyboard');
    }
  }, []);

  const loadStory = useCallback(async (id: string) => {
    try {
      console.log("Loading story with ID:", id);
      setIsLoading(true);
      
      // First, ensure the story has at least one scene
      console.log("Ensuring story has at least one scene...");
      await ensureStoryHasScene(id);
      
      // Clean up any nested scenes array
      console.log("Cleaning up nested scenes...");
      await removeNestedScenes(id);
      
      // Use the new subcollection-based function
      console.log("Fetching story with subcollections...");
      const story = await getStoryWithSubcollections(id);
      console.log("Story loaded using subcollections:", story);
      
      if (!story) {
        console.error("Story not found for ID:", id);
        toast.error("Story not found");
        return;
      }
      
      // Set basic story properties
      console.log("Setting story properties...");
      setTitle(story.title || "Untitled Story");
      setScript(story.description || "");
      
      // Ensure scenes array exists and create default scene if needed
      if (!story.scenes || !Array.isArray(story.scenes) || story.scenes.length === 0) {
        console.log("No scenes found, creating default scene...");
        
        // Create a default scene if none exists
        const defaultSceneId = await createSceneSubcollection(id, {
          title: "Scene 1",
          location: "Default Location",
          description: "Default scene description",
          lighting: "NATURAL",
          weather: "CLEAR",
          style: "CINEMATIC"
        });
        
        // Create a default shot for the scene
        await createShotSubcollection(id, defaultSceneId, {
          type: "WIDE",
          description: "Default shot",
          prompt: "Default shot",
          hasDialogue: false,
          hasNarration: false,
          hasSoundEffects: false
        });
        
        // Reload the story to get the new scene
        console.log("Reloading story to get new scene...");
        const updatedStory = await getStoryWithSubcollections(id);
        
        if (!updatedStory || !updatedStory.scenes || updatedStory.scenes.length === 0) {
          console.error("Failed to create default scene");
          toast.error("Failed to create default scene");
          return;
        }
        
        console.log(`Created default scene. Now have ${updatedStory.scenes.length} scenes`);
        setScenes(updatedStory.scenes);
        setCurrentScene(updatedStory.scenes[0]);
      } else {
        console.log(`Setting ${story.scenes.length} scenes:`, story.scenes);
        setScenes(story.scenes);
        
        // Set current scene to the first scene
        const firstScene = story.scenes[0];
        console.log("Setting current scene:", firstScene);
        setCurrentScene(firstScene);
        
        // Initialize shot descriptions for loaded shots
        const newShotDescriptions: Record<string, string> = {};
        story.scenes.forEach(scene => {
          scene.shots.forEach(shot => {
            newShotDescriptions[shot.id] = shot.description;
          });
        });
        setShotDescriptions(newShotDescriptions);
      }
      
      // Force a render of the timeline by updating state
      setTimeout(() => {
        console.log("Forcing timeline update...");
        setForceShowTimeline(true);
        // And then reset it to not interfere with user preferences
        setTimeout(() => setForceShowTimeline(false), 100);
      }, 500);
      
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

  // Update sound effects handler
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
  
  // Update dialogue handler
  const handleDialogueChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!currentScene?.id || !storyId || !currentScene.shots[index]?.id) return;
    const updates = { dialogue: e.target.value, hasDialogue: !!e.target.value };
    updateShotDetails(currentScene.id, currentScene.shots[index].id, updates);
  }, [currentScene, storyId, updateShotDetails]);
  
  // Add voice selection handler
  const handleVoiceSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    if (!currentScene?.id || !storyId || !currentScene.shots[index]?.id) return;
    const updates = { voiceId: e.target.value };
    updateShotDetails(currentScene.id, currentScene.shots[index].id, updates);
  }, [currentScene, storyId, updateShotDetails]);
  
  // Add dialogue save handler
  const handleDialogueSave = useCallback(async (shotId: string, voiceId: string) => {
    if (!currentScene?.id || !storyId) return;
    
    try {
      toast.loading("Saving dialogue...", { id: `dialogue-${shotId}` });
      
      // Get the dialogue text from our temporary state or fallback to shot.dialogue
      const dialogueText = tempDialogueValues[shotId] ?? 
        (currentScene.shots.find(s => s.id === shotId)?.dialogue || "");
      
      // Update Firebase
      await updateShotDetails(currentScene.id, shotId, { 
        dialogue: dialogueText, 
        hasDialogue: dialogueText.trim().length > 0,
        voiceId: voiceId
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
                dialogue: dialogueText,
                hasDialogue: dialogueText.trim().length > 0,
                voiceId: voiceId
              };
            })
          };
        })
      );
      
      // Also update currentScene
      setCurrentScene({
        ...currentScene,
        shots: currentScene.shots.map(shot => 
          shot.id !== shotId ? shot : { 
            ...shot, 
            dialogue: dialogueText,
            hasDialogue: dialogueText.trim().length > 0,
            voiceId: voiceId 
          }
        )
      });
      
      toast.success("Dialogue saved", { id: `dialogue-${shotId}` });
      
      // Close the popup
      toggleDialoguePopup(shotId);
    } catch (error) {
      console.error("Error saving dialogue:", error);
      toast.error("Failed to save dialogue", { id: `dialogue-${shotId}` });
    }
  }, [currentScene, storyId, updateShotDetails, tempDialogueValues]);

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
      
      // Use AudioService to upload with proper path structure
      const audioUrl = await AudioService.generateDialogue(
        shot.dialogue,
        shot.voiceId || "21m00Tcm4TlvDq8ikWAM",
        storyId,
        currentScene.id,
        shot.id
      );

      // Start lip sync generation using Sync Labs
      const lipsyncResponse = await fetch("/api/lipsync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: shot.generatedVideo,
          audioUrl: audioUrl.audioUrl,
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
                  lipSyncAudio: audioUrl.audioUrl,
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
    if (!currentScene) {
      toast.error("No current scene selected");
      return;
    }
    
    setIsImageLoading(true);
    try {
      // Validate the prompt first
      const cleanedPrompt = description?.trim();
      if (!cleanedPrompt || cleanedPrompt.length < 3) {
        toast.error("Description must be at least 3 characters");
        return;
      }
      
      const shotId = currentScene.shots[index]?.id;
      if (!shotId) {
        toast.error("Invalid shot index");
        return;
      }
      
      setImageLoadingStates(prev => ({ ...prev, [shotId]: true }));
      
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
      await updateShotDetails(currentScene.id, shotId, { 
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
      if (currentScene?.shots[index]?.id) {
        setImageLoadingStates(prev => ({ ...prev, [currentScene.shots[index].id]: false }));
      }
      setIsImageLoading(false);
    }
  };

  const generateShotVideo = async (index: number) => {
    if (!currentScene?.shots[index]) {
      toast.error("Invalid shot index");
      return;
    }
    
    const shotId = currentScene.shots[index].id;
    setIsVideoLoading(true);
    try {
      // Set loading state for this specific shot to true
      setVideoLoadingStates((prev) => ({ ...prev, [shotId]: true }));
      setVideoStatusMessages((prev) => ({ ...prev, [shotId]: "Initializing video generation..." }));
      
      // Show starting toast
      toast.loading("Starting video generation...", { id: `video-${shotId}` });
      
      // Validate shot has an image before sending
      if (!currentScene.shots[index].generatedImage) {
        const errorMessage = "Shot has no generated image. Please generate an image first.";
        console.error(errorMessage);
        setVideoLoadingStates((prev) => ({ ...prev, [shotId]: false }));
        setVideoStatusMessages((prev) => ({ ...prev, [shotId]: `Error: ${errorMessage}` }));
        toast.error(errorMessage, { id: `video-${shotId}` });
        return;
      }

      if (!currentScene.shots[index].description && !currentScene.shots[index].prompt) {
        const errorMessage = "Shot has no description or prompt. Please add a description.";
        console.error(errorMessage);
        setVideoLoadingStates((prev) => ({ ...prev, [shotId]: false }));
        setVideoStatusMessages((prev) => ({ ...prev, [shotId]: `Error: ${errorMessage}` }));
        toast.error(errorMessage, { id: `video-${shotId}` });
        return;
      }

      // Log what we're sending to the API for debugging
      const requestBody = {
        shotId: shotId,
        storyId,
        shots: [{
          imageUrl: currentScene.shots[index].generatedImage,
          prompt: currentScene.shots[index].description || currentScene.shots[index].prompt,
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
            
            try {
              // Store the video URL for the shot
              if (currentScene) {
                // Log before update
                console.log(`Updating shot ${shotId} in scene ${currentScene.id} with video URL:`, videoUrl);
                
                // Update in Firebase
                await updateShotDetails(currentScene.id, shotId, {
                  generatedVideo: videoUrl
                });
                
                // Force an immediate update to local state as well
                setScenes(prevScenes => 
                  prevScenes.map(scene => {
                    if (scene.id !== currentScene.id) return scene;
                    
                    return {
                      ...scene,
                      shots: scene.shots.map(shot => 
                        shot.id !== shotId ? shot : { ...shot, generatedVideo: videoUrl }
                      )
                    };
                  })
                );
                
                // Also update currentScene
                setCurrentScene(prevScene => {
                  if (!prevScene) return prevScene;
                  
                  return {
                    ...prevScene,
                    shots: prevScene.shots.map(shot => 
                      shot.id !== shotId ? shot : { ...shot, generatedVideo: videoUrl }
                    )
                  };
                });
                
                console.log("Updated local state with video URL");
              }
              
              isComplete = true;
              break;
            } catch (updateError) {
              console.error("Error updating shot with video URL:", updateError);
              toast.error("Failed to save video URL", { id: `video-${shotId}` });
              throw updateError;
            }
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
      handleVideoGenerationError(error, shotId);
    } finally {
      setIsVideoLoading(false);
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
        await generateShotVideo(i);
      }
      toast.success("Scene video generation complete");
    } catch (error) {
      console.error("Error generating scene video:", error);
      toast.error("Failed to generate scene video");
    }
  };

  // Toggle sound effects popup for a specific shot
  const toggleSoundEffectsPopup = (shotId: string) => {
    setShowingSoundEffects(prev => {
      const newState = { ...prev };
      newState[shotId] = !prev[shotId];
      // Close dialogue popup if opening sound effects
      if (newState[shotId] && showingDialogue[shotId]) {
        setShowingDialogue(prevDialog => ({
          ...prevDialog,
          [shotId]: false
        }));
      }
      return newState;
    });
  };

  // Toggle dialogue popup visibility
  const toggleDialoguePopup = (shotId: string) => {
    setShowingDialogue(prev => {
      const newState = { ...prev };
      newState[shotId] = !prev[shotId];
      // Close sound effects popup if opening dialogue
      if (newState[shotId] && showingSoundEffects[shotId]) {
        setShowingSoundEffects(prevSound => ({
          ...prevSound,
          [shotId]: false
        }));
      }
      return newState;
    });
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
      toast.loading("Fixing story structure...", { id: "fix-story" });
      
      // Call the fix-structure API endpoint
      const response = await fetch(`/api/story/fix-structure?storyId=${storyId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fix story structure");
      }
      
      const data = await response.json();
      console.log("Story structure fix result:", data);
      
      // Reload the story to get the updated structure
      await loadStory(storyId);
      
      toast.success("Story structure fixed successfully", { id: "fix-story" });
    } catch (error) {
      console.error("Error fixing story structure:", error);
      toast.error(`Failed to fix story: ${error instanceof Error ? error.message : "Unknown error"}`, 
                 { id: "fix-story" });
    }
  };

  // Function to generate sound effects audio from the description
  const generateSoundEffectsAudio = async (shotId: string) => {
    if (!currentScene || !storyId) return;
    
    const currentShot = currentScene.shots.find(s => s.id === shotId);
    if (!currentShot) {
      console.error(`Shot with id ${shotId} not found`);
      toast.error("Shot not found");
      return;
    }
    
    if (!currentShot.soundEffects) {
      toast.error("No sound effects description found. Please add sound effects first.");
      return;
    }
    
    try {
      toast.loading("Generating sound effects audio...", { id: `sfx-audio-${shotId}` });
      
      // Use AudioService to generate and upload with proper path structure
      const result = await AudioService.generateSoundEffects(
        currentShot.soundEffects,
        storyId,
        currentScene.id,
        shotId
      );
      
      if (!result.success) {
        throw new Error("Failed to generate sound effects audio");
      }
      
      // Update the shot with the sound effects audio URL (as a string)
      await updateShotDetails(currentScene.id, shotId, {
        soundEffectsAudio: result.audioUrl, // Save just the URL string
        hasSoundEffects: true
      });
      
      // Update local state immediately
      setScenes(prevScenes => 
        prevScenes.map(scene => {
          if (scene.id !== currentScene.id) return scene;
          
          return {
            ...scene,
            shots: scene.shots.map(shot => 
              shot.id !== shotId ? shot : { 
                ...shot, 
                soundEffectsAudio: result.audioUrl, // Save just the URL string
                hasSoundEffects: true
              }
            )
          };
        })
      );
      
      // Also update currentScene
      setCurrentScene(prevScene => {
        if (!prevScene) return prevScene;
        
        return {
          ...prevScene,
          shots: prevScene.shots.map(shot => 
            shot.id !== shotId ? shot : { 
              ...shot, 
              soundEffectsAudio: result.audioUrl, // Save just the URL string
              hasSoundEffects: true
            }
          )
        };
      });
      
      toast.success("Sound effects audio generated!", { id: `sfx-audio-${shotId}` });
      return result.audioUrl;
    } catch (error) {
      console.error("Error generating sound effects audio:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate sound effects audio", 
        { id: `sfx-audio-${shotId}` });
      return null;
    }
  };

  // Add function to generate sound effects for an entire scene
  const generateSceneSoundEffects = async (sceneId: string) => {
    if (!storyId) return;
    
    // Find the scene
    const targetScene = scenes.find(scene => scene.id === sceneId);
    if (!targetScene) {
      toast.error("Scene not found");
      return;
    }
    
    try {
      toast.loading(`Generating sound effects for scene "${targetScene.title}"...`);
      
      // Find all shots with sound effects descriptions but no audio yet
      const shotsNeedingAudio = targetScene.shots.filter(
        shot => shot.hasSoundEffects && shot.soundEffects && !shot.soundEffectsAudio
      );
      
      if (shotsNeedingAudio.length === 0) {
        toast.success("No sound effects to generate");
        return;
      }
      
      // Generate audio for each shot sequentially
      for (const shot of shotsNeedingAudio) {
        await generateSoundEffectsAudio(shot.id);
      }
      
      toast.success(`Generated sound effects for ${shotsNeedingAudio.length} shots`);
    } catch (error) {
      console.error("Error generating scene sound effects:", error);
      toast.error("Failed to generate scene sound effects");
    }
  };

  // Add function to generate dialogue audio
  const generateDialogueAudio = async (shot: Shot) => {
    if (!currentScene || !storyId) {
      toast.error('Missing required data');
      return;
    }

    try {
      toast.loading('Generating audio...');
      
      // Generate speech from dialogue
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: shot.dialogue,
          voiceId: shot.voiceId || '21m00Tcm4TlvDq8ikWAM',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      if (!data.audio) {
        throw new Error('No audio data received');
      }

      // Convert base64 to blob
      const audioBlob = await fetch(`data:audio/mp3;base64,${data.audio}`).then(r => r.blob());

      // Upload to Firebase Storage
      const storageRef = ref(storage, `stories/${storyId}/scenes/${currentScene.id}/shots/${shot.id}/dialogue.mp3`);
      await uploadBytes(storageRef, audioBlob);
      const audioUrl = await getDownloadURL(storageRef);

      // Update shot in Firebase - ensure hasDialogue is set to true since we have dialogue audio
      await updateShotSubcollection(storyId, currentScene.id, shot.id, {
        dialogueAudio: audioUrl,
        hasDialogue: true, // Explicitly set to true since we have dialogue audio
        dialogue: shot.dialogue // Ensure dialogue text is preserved
      });

      // Update local state
      const updatedShots = currentScene.shots.map(s => 
        s.id === shot.id ? { 
          ...s, 
          dialogueAudio: audioUrl,
          hasDialogue: true // Also update local state
        } : s
      );
      setCurrentScene({ ...currentScene, shots: updatedShots });

      toast.success('Audio generated successfully');
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio');
    }
  };

  const updateSceneShots = async (sceneId: string, updatedShots: Shot[]) => {
    if (!storyId) return;
    try {
      // Create a new scene object with the updated shots
      const sceneUpdate: Partial<Omit<Scene, "shots" | "id">> = {
        title: currentScene?.title,
        location: currentScene?.location,
        description: currentScene?.description,
        lighting: currentScene?.lighting,
        weather: currentScene?.weather,
        style: currentScene?.style
      };
      
      await updateSceneSubcollection(storyId, sceneId, sceneUpdate);
    } catch (error) {
      console.error("Error updating scene shots:", error);
      toast.error("Failed to update shot");
    }
  };

  const handleShotUpdate = async (index: number, updates: Partial<Shot>) => {
    if (!currentScene) return;
    const updatedShots = [...currentScene.shots];
    updatedShots[index] = {
      ...updatedShots[index],
      ...updates
    };
    await updateSceneShots(currentScene.id, updatedShots);
  };

  const handleVideoGenerationError = (error: unknown, shotId: string) => {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    setVideoStatusMessages(prev => ({ ...prev, [shotId]: `Error: ${errorMessage}` }));
    setVideoLoadingStates(prev => ({ ...prev, [shotId]: false }));
    toast.error(`Video generation failed: ${errorMessage}`, { id: `video-${shotId}` });
  };

  const handleSaveDialogue = async (shot: Shot) => {
    if (!currentScene || !storyId) {
      toast.error('Missing required data');
      return;
    }

    try {
      console.log('🎤 Kareem - Starting dialogue save for shot:', {
        shotId: shot.id,
        dialogue: shot.dialogue,
        voiceId: shot.voiceId
      });

      // First save the dialogue text and voice selection
      await updateShotSubcollection(storyId, currentScene.id, shot.id, {
        dialogue: shot.dialogue,
        voiceId: shot.voiceId,
        hasDialogue: true
      });

      console.log('🎤 Kareem - Generating audio with params:', {
        text: shot.dialogue,
        voiceId: shot.voiceId,
        storyId,
        sceneId: currentScene.id,
        shotId: shot.id
      });

      // Then generate the audio with all required IDs
      const result = await AudioService.generateDialogue(
        shot.dialogue || '',
        shot.voiceId || '21m00Tcm4TlvDq8ikWAM',
        storyId,
        currentScene.id,
        shot.id
      );

      console.log('🎤 Kareem - Audio generation result:', result);

      if (!result.success) {
        throw new Error('Failed to generate dialogue audio');
      }

      // Update the shot with the new audio URL
      await updateShotSubcollection(storyId, currentScene.id, shot.id, {
        dialogueAudio: result.audioUrl,
        hasDialogue: true
      });

      console.log('🎤 Kareem - Successfully updated shot:', {
        shotId: shot.id,
        dialogueAudio: result.audioUrl
      });

      // Update local state
      const updatedShots = currentScene.shots.map(s => 
        s.id === shot.id ? { 
          ...s, 
          dialogue: shot.dialogue, 
          voiceId: shot.voiceId,
          dialogueAudio: result.audioUrl,
          hasDialogue: true
        } : s
      );
      setCurrentScene({ ...currentScene, shots: updatedShots });

      toast.success('Dialogue saved successfully');
    } catch (error) {
      console.error('🎤 Kareem - Error saving dialogue:', error);
      toast.error('Failed to save dialogue');
    }
  };

  const shotContextValue = {
    storyId,
    sceneId: currentScene?.id || null,
    updateShot: async (shotId: string, updates: Partial<Shot>) => {
      if (!currentScene?.id || !storyId) return;
      await updateShotDetails(currentScene.id, shotId, updates);
    },
    isImageLoading,
    isVideoLoading,
    generateImage: generateShotFromPrompt,
    generateVideo: generateShotVideo,
    generateLipSync: async (index: number) => {
      if (!currentScene?.shots[index]) {
        toast.error("Invalid shot index");
        return;
      }
      await generateDialogueAudio(currentScene.shots[index]);
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
          <ShotProvider value={shotContextValue}>
            <div className="flex overflow-x-auto p-4 gap-4 pb-6 snap-x">
              {currentScene?.shots.map((shot, index) => (
                <div key={shot.id} className="flex-none w-[825px] min-w-[825px] snap-center flex flex-col">
                  <EnhancedShotCard
                    shot={shot}
                    index={index}
                  />
                </div>
              ))}
              
              {/* Add shot button */}
              <div className="flex-none w-[825px] min-w-[825px] snap-center flex items-center justify-center">
                <Button 
                  onClick={addNewShot} 
                  className={`${themeColors[userThemeColor as keyof typeof themeColors]} text-white h-40 w-full flex flex-col items-center justify-center shadow-md`}
                >
                  <Plus className="h-12 w-12 mb-2" />
                  <span>Add Shot</span>
                </Button>
              </div>
            </div>
          </ShotProvider>
        </div>

        {/* Timeline at the bottom - more reliable display logic */}
        <div className="border-t border-border bg-background">
          {/* Add debug info to help troubleshoot timeline issues */}
          <div className="p-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 flex justify-between items-center">
            <p>Debug: scenes: {scenes?.length || 0}, currentScene: {currentScene?.id || 'null'}, isLoading: {isLoading.toString()}</p>
            <div className="space-x-2">
              {storyId && (
                <button 
                  onClick={async () => {
                    console.log("Manually reloading scenes");
                    if (storyId) {
                      try {
                        toast.loading("Reloading scenes...");
                        await loadStory(storyId);
                        toast.success("Scenes reloaded");
                      } catch (error) {
                        console.error("Error reloading scenes:", error);
                        toast.error("Failed to reload scenes");
                      }
                    }
                  }}
                  className="px-2 py-1 bg-gray-500 text-white rounded-md text-xs"
                >
                  Refresh Scenes
                </button>
              )}
              {storyId && (scenes?.length === 0 || !currentScene) && (
                <button 
                  onClick={async () => {
                    console.log("Manually creating a default scene");
                    if (storyId) {
                      try {
                        toast.loading("Creating default scene...");
                        
                        // Create a default scene
                        const defaultSceneId = await createSceneSubcollection(storyId, {
                          title: "Scene 1",
                          location: "Default Location",
                          description: "Default scene description",
                          lighting: "NATURAL",
                          weather: "CLEAR",
                          style: "CINEMATIC"
                        });
                        
                        // Create a default shot for the scene
                        await createShotSubcollection(storyId, defaultSceneId, {
                          type: "WIDE",
                          description: "Default shot",
                          prompt: "Default shot",
                          hasDialogue: false,
                          hasNarration: false,
                          hasSoundEffects: false
                        });
                        
                        toast.success("Created default scene. Reloading...");
                        
                        // Reload the story
                        await loadStory(storyId);
                      } catch (error) {
                        console.error("Error creating default scene:", error);
                        toast.error("Failed to create default scene");
                      }
                    }
                  }}
                  className="px-2 py-1 bg-blue-500 text-white rounded-md text-xs"
                >
                  Create Default Scene
                </button>
              )}
            </div>
          </div>
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
            onGenerateSceneSoundEffects={generateSceneSoundEffects}
            onGenerateSceneTTS={currentScene ? () => {} : undefined}  // Placeholder for future TTS generation
          />
        </div>
      </div>

      {/* Full script section */}
      <div className="p-4 border-t bg-muted">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Full Script</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setExpandedScript(!expandedScript)}
          >
            {expandedScript ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        {expandedScript && (
          <div className="whitespace-pre-wrap border p-4 rounded-md bg-card text-sm">
            {currentStory?.description || currentStory?.script || 'No script available.'}
          </div>
        )}
      </div>

      {/* View Mode Selector */}
      {!isEmbedded && (
        <div className="border-b border-border px-4 py-2 flex items-center">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'editor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('editor')}
            >
              Editor View
            </Button>
            <Button
              variant={viewMode === 'storyboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('storyboard')}
            >
              Storyboard View
            </Button>
          </div>
        </div>
      )}
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