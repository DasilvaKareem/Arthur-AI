"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopNavBar from "../../components/TopNavBar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft, Download, Copy, Share, ChevronDown, Plus, Edit, Trash, Pencil, Camera, Film, Music, Volume2, Loader2, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createStory, updateStory, getStory, updateScene, updateShot, deleteScene, deleteShot, uploadShotImage, validateSceneData, validateShotData } from '../lib/firebase/stories';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import SceneChat from "../../components/SceneChat";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase/client';
import type { Shot, Scene, Story } from '../../types/shared';

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

  const loadStory = async (id: string) => {
    try {
      const story = await getStory(id);
      if (story) {
        setTitle(story.title);
        setScript(story.description);
        setScenes(story.scenes);
        setCurrentScene(story.scenes[0] || null);
      }
    } catch (error) {
      console.error("Error loading story:", error);
    }
  };

  const saveStory = async () => {
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
          description: script,
          scenes,
          updatedAt: new Date()
        });
        toast.success('Story updated successfully');
      } else {
        console.log('Creating new story...');
        const newStoryId = await createStory(user.uid, title, script, scenes);
        setStoryId(newStoryId);
        toast.success('Story created successfully');
      }
    } catch (error: any) {
      console.error('Error saving story:', error);
      const errorMessage = error.message || 'Failed to save story. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Parse the script into scenes and shots
  const parseScriptIntoScenes = (scriptText: string) => {
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
  };

  // Update scene details
  const updateSceneDetails = async (sceneId: string, updates: Partial<Omit<Scene, 'shots'>>) => {
    if (!storyId) return;
    
    try {
      await updateScene(storyId, sceneId, updates);
      setScenes(scenes.map(scene => 
        scene.id === sceneId ? { ...scene, ...updates } : scene
      ));
      if (currentScene?.id === sceneId) {
        setCurrentScene({ ...currentScene, ...updates });
      }
    } catch (error) {
      console.error("Error updating scene:", error);
      alert("Failed to update scene. Please try again.");
    }
  };

  // Update shot details
  const updateShotDetails = async (sceneId: string, shotId: string, updates: Partial<Shot>) => {
    if (!storyId) return;
    
    try {
      await updateShot(storyId, sceneId, shotId, updates);
      setScenes(scenes.map(scene => {
        if (scene.id === sceneId) {
          return {
            ...scene,
            shots: scene.shots.map(shot =>
              shot.id === shotId ? { ...shot, ...updates } : shot
            )
          };
        }
        return scene;
      }));
      
      if (currentScene?.id === sceneId) {
        setCurrentScene({
          ...currentScene,
          shots: currentScene.shots.map(shot =>
            shot.id === shotId ? { ...shot, ...updates } : shot
          )
        });
      }
    } catch (error) {
      console.error("Error updating shot:", error);
      alert("Failed to update shot. Please try again.");
    }
  };

  // Add new scene
  const addNewScene = async () => {
    if (!storyId) {
      toast.error("Please save your story first");
      return;
    }
    
    try {
      // Get the current story first
      const story = await getStory(storyId);
      if (!story) {
        throw new Error("Story not found");
      }

      // Create a new scene with a unique ID
      const newScene: Scene = {
        id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `Scene ${scenes.length + 1}`,
        location: "INT. LOCATION - DAY",
        description: "Describe your scene...",
        lighting: "Natural daylight",
        weather: "Clear",
        style: "hyperrealistic",
        shots: [
          {
            id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: "ESTABLISHING SHOT",
            description: "Describe your shot...",
            hasNarration: false,
            hasDialogue: false,
            hasSoundEffects: false,
            prompt: "Describe your shot...",
            narration: null,
            dialogue: null,
            soundEffects: null,
            location: null,
            lighting: null,
            weather: null,
            generatedImage: null,
            generatedVideo: null,
            lipSyncVideo: null,
            lipSyncAudio: null,
            voiceId: null
          }
        ]
      };

      // Update the story with the new scene
      const updatedScenes = [...story.scenes, newScene];
      await updateStory(storyId, {
        ...story,
        scenes: updatedScenes
      });
      
      // Update local state
      setScenes(updatedScenes);
      setCurrentScene(newScene);
      toast.success("Scene added successfully");
    } catch (error) {
      console.error("Error adding scene:", error);
      toast.error("Failed to add scene. Please try again.");
    }
  };

  // Add new shot
  const addNewShot = async () => {
    if (!currentScene || !storyId) {
      toast.error("Please select a scene first");
      return;
    }
    
    try {
      // Create a new shot with a unique ID
      const newShot: Shot = {
        id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "MEDIUM SHOT",
        description: "Describe your shot...",
        hasNarration: false,
        hasDialogue: false,
        hasSoundEffects: false,
        prompt: "Describe your shot...",
        narration: null,
        dialogue: null,
        soundEffects: null,
        location: null,
        lighting: null,
        weather: null,
        generatedImage: null,
        generatedVideo: null
      };
      
      // Update the scene with the new shot
      const updatedShots = [...currentScene.shots, newShot];
      const updatedScene = { ...currentScene, shots: updatedShots };
      
      // Update the story with the new scene data
      const story = await getStory(storyId);
      if (!story) {
        throw new Error("Story not found");
      }

      const updatedScenes = story.scenes.map(scene => 
        scene.id === currentScene.id ? updatedScene : scene
      );

      await updateStory(storyId, {
        ...story,
        scenes: updatedScenes
      });
      
      // Update local state
      setCurrentScene(updatedScene);
      setScenes(prevScenes => 
        prevScenes.map(scene => 
          scene.id === currentScene.id ? updatedScene : scene
        )
      );

      toast.success("Shot added successfully");
    } catch (error) {
      console.error("Error adding shot:", error);
      toast.error("Failed to add shot. Please try again.");
    }
  };

  // Delete scene
  const handleSceneDelete = async (sceneId: string) => {
    if (!storyId || scenes.length <= 1) {
      alert("Cannot delete the last scene");
      return;
    }
    
    try {
      await deleteScene(storyId, sceneId);
      const updatedScenes = scenes.filter(s => s.id !== sceneId);
      setScenes(updatedScenes);
      
      if (currentScene?.id === sceneId) {
        setCurrentScene(updatedScenes[0]);
      }
    } catch (error) {
      console.error("Error deleting scene:", error);
      alert("Failed to delete scene. Please try again.");
    }
  };

  // Delete shot
  const handleShotDelete = async (sceneId: string, shotId: string) => {
    if (!storyId || !currentScene || currentScene.shots.length <= 1) {
      alert("Cannot delete the last shot");
      return;
    }
    
    try {
      await deleteShot(storyId, sceneId, shotId);
      const updatedShots = currentScene.shots.filter(s => s.id !== shotId);
      const updatedScene = { ...currentScene, shots: updatedShots };
      
      setCurrentScene(updatedScene);
      setScenes(scenes.map(scene => 
        scene.id === sceneId ? updatedScene : scene
      ));
    } catch (error) {
      console.error("Error deleting shot:", error);
      alert("Failed to delete shot. Please try again.");
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([script], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportScene = () => {
    if (!currentScene) return;
    
    // Create a formatted scene export with all shots
    let sceneText = `${currentScene.title}\n\n`;
    
    currentScene.shots.forEach((shot, index) => {
      sceneText += `SHOT #${index + 1}: ${shot.type}\n`;
      sceneText += `${shot.description}\n\n`;
      
      if (shot.dialogue) {
        sceneText += `DIALOGUE:\n${shot.dialogue}\n\n`;
      }
      
      if (shot.soundEffects) {
        sceneText += `SOUND EFFECTS:\n${shot.soundEffects}\n\n`;
      }
      
      sceneText += "---\n\n";
    });
    
    // Create and download the file
    const element = document.createElement("a");
    const file = new Blob([sceneText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${currentScene.title.replace(/\s+/g, "_")}_shots.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(script)
      .then(() => alert("Script copied to clipboard!"))
      .catch(err => console.error("Failed to copy script:", err));
  };

  const generateShotFromPrompt = async (shotIndex: number, prompt: string) => {
    if (!currentScene) {
      toast.error('Please select a scene first');
      return;
    }

    if (!storyId) {
      toast.error('Please save your story first');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt for the shot');
      return;
    }
    
    // Show generating indicator
    const shotElement = document.getElementById(`shot-${shotIndex}-prompt`);
    if (shotElement) {
      shotElement.classList.add('opacity-50');
    }
    
    try {
      console.log(`Starting image generation for shot ${shotIndex + 1}/${currentScene.shots.length}:`, prompt);
      
      // Start image generation
      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          aspectRatio: "16:9",
          model: "photon-1",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Failed to start image generation");
      }

      const data = await response.json();
      console.log(`Image generation started for shot ${shotIndex + 1} with ID:`, data.id);

      // Poll for image generation status
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/image?id=${data.id}`);
          if (!statusResponse.ok) {
            const errorData = await statusResponse.json();
            throw new Error(errorData.error || errorData.details || "Failed to check generation status");
          }
          
          const statusData = await statusResponse.json();
          console.log(`Shot ${shotIndex + 1} generation status:`, statusData.state);

          if (statusData.state === "completed") {
            try {
              // Get the current story first
              const story = await getStory(storyId);
              if (!story) {
                throw new Error("Story not found");
              }

              // Find the current scene in the story
              const sceneIndex = story.scenes.findIndex(s => s.id === currentScene.id);
              if (sceneIndex === -1) {
                throw new Error("Scene not found in story");
              }

              // Get the current shot to preserve its data
              const currentShot = currentScene.shots[shotIndex];
              if (!currentShot) {
                throw new Error("Shot not found");
              }

              // Upload the generated image to Firebase Storage
              console.log(`Uploading generated image for shot ${shotIndex + 1} to Firebase`);
              const downloadUrl = await uploadShotImage(
                storyId,
                currentScene.id,
                currentShot.id,
                statusData.assets.image
              );

              if (!downloadUrl) {
                throw new Error("Failed to get download URL for the image");
              }

              // Create updated shot with new image while preserving ALL existing data
              const updatedShot: Shot = {
                ...currentShot, // Keep ALL existing properties
                description: prompt,
                prompt: prompt, // Update prompt to match description
                generatedImage: downloadUrl,
                // Explicitly preserve all media and properties
                generatedVideo: currentShot.generatedVideo || null,
                lipSyncVideo: currentShot.lipSyncVideo || null,
                lipSyncAudio: currentShot.lipSyncAudio || null,
                dialogue: currentShot.dialogue || null,
                soundEffects: currentShot.soundEffects || null,
                hasDialogue: currentShot.hasDialogue || false,
                hasSoundEffects: currentShot.hasSoundEffects || false,
                hasNarration: currentShot.hasNarration || false,
                narration: currentShot.narration || null,
                location: currentShot.location || null,
                lighting: currentShot.lighting || null,
                weather: currentShot.weather || null,
                voiceId: currentShot.voiceId || null,
                type: currentShot.type || "MEDIUM SHOT"
              };

              // Create updated shots array
              const updatedShots = [...currentScene.shots];
              updatedShots[shotIndex] = updatedShot;

              // Create updated scene with ALL existing properties
              const updatedScene = {
                ...currentScene,
                shots: updatedShots,
                title: currentScene.title || `Scene ${sceneIndex + 1}`,
                location: currentScene.location || "INT. LOCATION - DAY",
                description: currentScene.description || "Describe your scene...",
                lighting: currentScene.lighting || "Natural daylight",
                weather: currentScene.weather || "Clear",
                style: currentScene.style || "hyperrealistic",
                generatedVideo: currentScene.generatedVideo || undefined
              };

              // Create updated scenes array for the story
              const updatedScenes = [...story.scenes];
              updatedScenes[sceneIndex] = updatedScene;

              // Create clean story update with ALL required fields
              const storyUpdate = {
                scenes: updatedScenes,
                title: story.title || "Untitled Story",
                description: story.description || "No description",
                userId: story.userId || "",
                createdAt: story.createdAt || new Date(),
                updatedAt: new Date()
              };

              // Remove any undefined values from the update
              const cleanUpdate = Object.fromEntries(
                Object.entries(storyUpdate).filter(([_, value]) => value !== undefined)
              );

              // Update the entire story
              await updateStory(storyId, cleanUpdate);

              // Update local state
              setCurrentScene(updatedScene);
              setScenes(updatedScenes);
              
              console.log(`Successfully updated shot ${shotIndex + 1} with generated image`);
              toast.success(`Image generated for shot ${shotIndex + 1}!`);
            } catch (uploadError) {
              console.error(`Error uploading image for shot ${shotIndex + 1} to Firebase:`, uploadError);
              toast.error(`Failed to save generated image for shot ${shotIndex + 1}. Please try again.`);
            }
          } else if (statusData.state === "failed") {
            throw new Error(statusData.failure_reason || "Image generation failed");
          } else {
            // Continue polling
            setTimeout(pollStatus, 3000);
          }
        } catch (error) {
          console.error(`Error during status polling for shot ${shotIndex + 1}:`, error);
          toast.error(error instanceof Error ? error.message : `Failed to check generation status for shot ${shotIndex + 1}. Please try again.`);
        }
      };

      pollStatus();
    } catch (error) {
      console.error(`Error generating image for shot ${shotIndex + 1}:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to generate image for shot ${shotIndex + 1}. Please try again.`);
    } finally {
      if (shotElement) {
        shotElement.classList.remove('opacity-50');
      }
    }
  };

  // Add a new function to generate images for all shots
  const generateAllShotImages = async () => {
    if (!currentScene || !currentScene.shots) {
      toast.error('No shots to generate images for');
      return;
    }

    console.log(`Starting image generation for ${currentScene.shots.length} shots`);
    
    // Process shots sequentially
    for (let i = 0; i < currentScene.shots.length; i++) {
      const shot = currentScene.shots[i];
      const promptElement = document.getElementById(`shot-${i}-prompt`) as HTMLTextAreaElement;
      
      if (promptElement && promptElement.value.trim()) {
        console.log(`Generating image for shot ${i + 1}/${currentScene.shots.length}`);
        await generateShotFromPrompt(i, promptElement.value);
        // Wait a bit between shots to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  // Generate video for a single shot
  const generateShotVideo = async (shotIndex: number) => {
    if (!currentScene?.shots[shotIndex]) return;
    
    const shot = currentScene.shots[shotIndex];
    if (!shot.generatedImage) {
      toast.error("Please generate an image for this shot first");
      return;
    }

    try {
      // Start video generation
      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: shot.generatedImage,
          prompt: shot.description,
          duration: 5,
          style: "cinematic",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start video generation");
      }

      const data = await response.json();
      console.log("Video generation started with ID:", data.id);

      // Show loading toast
      toast.loading("Generating video...", {
        id: "video-generation",
      });

      // Poll for video generation status
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/video?id=${data.id}`);
          if (!statusResponse.ok) {
            throw new Error("Failed to check video generation status");
          }
          
          const statusData = await statusResponse.json();
          console.log("Video generation status:", statusData.state);

          if (statusData.state === "completed") {
            try {
              // Check if we have a valid video URL
              if (!statusData.assets?.video) {
                throw new Error("No video URL in response");
              }

              // Update the shot with the generated video URL
              const updatedShots = [...currentScene.shots];
              if (updatedShots[shotIndex]) {
                updatedShots[shotIndex] = {
                  ...updatedShots[shotIndex],
                  generatedVideo: statusData.assets.video,
                } as Shot;
                
                const updatedScene = { ...currentScene, shots: updatedShots };
                setCurrentScene(updatedScene);
                setScenes(scenes.map(scene => 
                  scene.id === currentScene.id ? updatedScene : scene
                ));
                console.log("Successfully updated shot with generated video");
                toast.success("Video generated successfully!", {
                  id: "video-generation",
                });
              }
            } catch (error) {
              console.error("Error updating shot with video:", error);
              toast.error("Failed to save generated video. Please try again.", {
                id: "video-generation",
              });
            }
          } else if (statusData.state === "failed") {
            throw new Error(statusData.failure_reason || "Video generation failed");
          } else {
            // Continue polling
            setTimeout(pollStatus, 3000);
          }
        } catch (error) {
          console.error("Error during video status polling:", error);
          toast.error(error instanceof Error ? error.message : "Failed to check video generation status. Please try again.", {
            id: "video-generation",
          });
        }
      };

      pollStatus();
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate video. Please try again.");
    }
  };

  // Generate video for all shots in a scene
  const generateSceneVideo = async (sceneId: string) => {
    if (!currentScene) {
      toast.error("No scene selected");
      return;
    }

    // Check if all shots have generated images
    const missingImages = currentScene.shots.filter(shot => !shot.generatedImage);
    if (missingImages.length > 0) {
      toast.error(`Please generate images for all shots first (${missingImages.length} missing)`);
      return;
    }

    try {
      // Format shots data for the API
      const shots = currentScene.shots.map(shot => ({
        imageUrl: shot.generatedImage,
        prompt: shot.description,
        duration: 5
      }));
      
      console.log("Starting sequential video generation for shots:", shots);

      // Process shots sequentially
      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i];
        console.log(`Processing shot ${i + 1}/${shots.length}`);

        // Start video generation for current shot
        const response = await fetch("/api/video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shots: [shot], // Send only one shot at a time
            style: currentScene.style || "cinematic",
            prompt: shot.prompt || "Create a cinematic video",
            duration: 5
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.details || "Failed to start video generation");
        }

        console.log(`Video generation started for shot ${i + 1} with ID:`, data.id);

        // Show loading toast for current shot
        toast.loading(`Generating video for shot ${i + 1}/${shots.length}...`, {
          id: "video-generation",
        });

        // Poll for video generation status
        await new Promise<void>((resolve, reject) => {
          const pollStatus = async () => {
            try {
              const statusResponse = await fetch(`/api/video?id=${data.id}`);
              if (!statusResponse.ok) {
                throw new Error("Failed to check video generation status");
              }
              
              const statusData = await statusResponse.json();
              console.log(`Shot ${i + 1} video generation status:`, statusData.state);

              if (statusData.state === "completed") {
                try {
                  if (!statusData.assets?.video) {
                    throw new Error("No video URL in completed generation");
                  }

                  // Update the shot with the generated video URL
                  const updatedShots = [...currentScene.shots];
                  if (updatedShots[i]) {
                    const updatedShot: Shot = {
                      ...updatedShots[i],
                      generatedVideo: statusData.assets.video || undefined,
                    };
                    updatedShots[i] = updatedShot;
                    
                    const updatedScene = {
                      ...currentScene,
                      shots: updatedShots,
                    } as Scene;
                    
                    // Update state with proper type casting
                    setCurrentScene(updatedScene as Scene);
                    setScenes(prevScenes => 
                      prevScenes.map(s => s.id === sceneId ? updatedScene as Scene : s)
                    );
                    console.log(`Successfully updated shot ${i + 1} with generated video`);
                    resolve();
                  }
                } catch (error) {
                  console.error(`Error updating shot ${i + 1} with video:`, error);
                  reject(error);
                }
              } else if (statusData.state === "failed") {
                reject(new Error(statusData.failure_reason || "Video generation failed"));
              } else {
                // Continue polling
                setTimeout(pollStatus, 3000);
              }
            } catch (error) {
              reject(error);
            }
          };

          pollStatus();
        });

        // Wait a bit before processing the next shot
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast.success("All shot videos generated successfully!", {
        id: "video-generation",
      });
    } catch (error) {
      console.error("Error generating scene videos:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate scene videos. Please try again.");
    }
  };

  const handleSceneSelect = (scene: Scene) => {
    setCurrentScene(scene);
  };

  const handleSceneRename = (sceneId: string, newTitle: string) => {
    const updatedScenes = scenes.map(scene => 
      scene.id === sceneId ? { ...scene, title: newTitle } : scene
    );
    setScenes(updatedScenes);
    
    if (currentScene?.id === sceneId) {
      setCurrentScene({ ...currentScene, title: newTitle });
    }
  };

  // Add these handlers for the SceneChat component
  const handleAddScene = async (newScene: Scene) => {
    if (!storyId) {
      toast.error("Please save your story first");
      return;
    }
    
    try {
      console.log("Current scenes before update:", scenes);
      console.log("New scene to add:", newScene);

      // Get the current story first
      const currentStory = await getStory(storyId);
      if (!currentStory) {
        throw new Error("Story not found");
      }

      // Generate a unique ID for the new scene using timestamp and random string
      const uniqueId = `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a properly formatted scene object with unique IDs for all shots
      const formattedScene: Scene = {
        ...newScene,
        id: uniqueId,
        title: newScene.title.split('\n')[0], // Take only the first line as title
        location: newScene.location || "N/A",
        description: newScene.description || "N/A",
        lighting: newScene.lighting || "N/A",
        weather: newScene.weather || "N/A",
        style: newScene.style || "hyperrealistic",
        shots: newScene.shots.map(shot => ({
          ...shot,
          id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: shot.type || "MEDIUM SHOT",
          description: shot.description || "N/A",
          hasNarration: !!shot.narration,
          hasDialogue: !!shot.dialogue,
          hasSoundEffects: !!shot.soundEffects,
          prompt: shot.prompt || shot.description || "N/A",
          narration: shot.narration || null,
          dialogue: shot.dialogue || null,
          soundEffects: shot.soundEffects || null,
          location: shot.location || null,
          lighting: shot.lighting || null,
          weather: shot.weather || null,
          generatedImage: shot.generatedImage || null,
          generatedVideo: shot.generatedVideo || null
        }))
      };

      // Validate the formatted scene
      validateSceneData(formattedScene);

      // Create updated scenes array
      const updatedScenes = [...currentStory.scenes, formattedScene];
      console.log("Updated scenes array:", updatedScenes);

      // Update the story with new scenes
      await updateStory(storyId, {
        ...currentStory,
        scenes: updatedScenes
      });

      // Update local state
      setScenes(updatedScenes);
      setCurrentScene(formattedScene);
      
      console.log("Final scenes state:", updatedScenes);
      toast.success("Scene added successfully");
    } catch (error) {
      console.error("Error adding scene:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add scene. Please try again.");
    }
  };

  const handleAddShot = async (sceneId: string, newShot: Shot) => {
    if (!storyId) {
      toast.error("Please save your story first");
      return;
    }
    
    try {
      console.log("Adding new shot:", newShot);
      console.log("To scene:", sceneId);

      // Get the current story first
      const currentStory = await getStory(storyId);
      if (!currentStory) {
        throw new Error("Story not found");
      }

      // Find the scene to update
      const sceneIndex = currentStory.scenes.findIndex((s: Scene) => s.id === sceneId);
      if (sceneIndex === -1) {
        throw new Error("Scene not found");
      }

      // Create a properly formatted shot with unique ID
      const formattedShot: Shot = {
        ...newShot,
        id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: newShot.type || "MEDIUM SHOT",
        description: newShot.description || "N/A",
        hasNarration: !!newShot.narration,
        hasDialogue: !!newShot.dialogue,
        hasSoundEffects: !!newShot.soundEffects,
        prompt: newShot.prompt || newShot.description || "N/A",
        narration: newShot.narration || null,
        dialogue: newShot.dialogue || null,
        soundEffects: newShot.soundEffects || null,
        location: newShot.location || null,
        lighting: newShot.lighting || null,
        weather: newShot.weather || null,
        generatedImage: newShot.generatedImage || null,
        generatedVideo: newShot.generatedVideo || null
      };

      // Validate the formatted shot
      validateShotData(formattedShot);

      // Update the scene with the new shot
      const updatedScene = {
        ...currentStory.scenes[sceneIndex],
        shots: [...currentStory.scenes[sceneIndex].shots, formattedShot]
      };

      // Validate the updated scene
      validateSceneData(updatedScene);

      // Update the scene in Firestore
      await updateScene(storyId, sceneId, updatedScene);

      // Update local state
      setScenes(prevScenes => 
        prevScenes.map(scene => 
          scene.id === sceneId ? updatedScene : scene
        )
      );

      if (currentScene?.id === sceneId) {
        setCurrentScene(updatedScene);
      }

      toast.success("Shot added successfully");
    } catch (error) {
      console.error("Error adding shot:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add shot. Please try again.");
    }
  };

  // Generate lip sync for a shot with dialogue
  const generateLipSync = async (shotIndex: number) => {
    if (!currentScene?.shots[shotIndex]) return;
    
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
      
      // Upload the audio to a temporary URL (you'll need to implement this)
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
  };

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

  // Update shot description handler
  const handleShotDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!currentScene) return;
    
    const updatedShots = [...currentScene.shots];
    const existingShot = updatedShots[index];
    
    updatedShots[index] = {
      ...existingShot, // Keep all existing properties
      description: e.target.value,
      prompt: e.target.value,
      // Preserve existing media
      generatedImage: existingShot.generatedImage || null,
      generatedVideo: existingShot.generatedVideo || null,
      lipSyncVideo: existingShot.lipSyncVideo || null,
      lipSyncAudio: existingShot.lipSyncAudio || null
    };
    
    const updatedScene = { ...currentScene, shots: updatedShots };
    setCurrentScene(updatedScene);
    setScenes(scenes.map(scene => 
      scene.id === currentScene.id ? updatedScene : scene
    ));

    // Save to Firebase
    if (storyId && currentScene.id) {
      updateScene(storyId, currentScene.id, updatedScene).catch(error => {
        console.error("Error saving shot description:", error);
        toast.error("Failed to save shot description");
      });
    }
  };

  // Update shot type handler
  const handleShotTypeChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    if (!currentScene) return;
    
    const updatedShots = [...currentScene.shots];
    const existingShot = updatedShots[index];
    
    updatedShots[index] = {
      ...existingShot, // Keep all existing properties
      type: e.target.value,
      // Preserve existing media
      generatedImage: existingShot.generatedImage || null,
      generatedVideo: existingShot.generatedVideo || null,
      lipSyncVideo: existingShot.lipSyncVideo || null,
      lipSyncAudio: existingShot.lipSyncAudio || null
    };
    
    const updatedScene = { ...currentScene, shots: updatedShots };
    setCurrentScene(updatedScene);
    setScenes(scenes.map(scene => 
      scene.id === currentScene.id ? updatedScene : scene
    ));

    // Save to Firebase
    if (storyId && currentScene.id) {
      updateScene(storyId, currentScene.id, updatedScene).catch(error => {
        console.error("Error saving shot type:", error);
        toast.error("Failed to save shot type");
      });
    }
  };

  // Update dialogue handler
  const handleDialogueChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!currentScene) return;
    
    const updatedShots = [...currentScene.shots];
    const existingShot = updatedShots[index];
    
    updatedShots[index] = {
      ...existingShot, // Keep all existing properties
      dialogue: e.target.value,
      hasDialogue: !!e.target.value,
      // Preserve existing media
      generatedImage: existingShot.generatedImage || null,
      generatedVideo: existingShot.generatedVideo || null,
      lipSyncVideo: existingShot.lipSyncVideo || null,
      lipSyncAudio: existingShot.lipSyncAudio || null
    };
    
    const updatedScene = { ...currentScene, shots: updatedShots };
    setCurrentScene(updatedScene);
    setScenes(scenes.map(scene => 
      scene.id === currentScene.id ? updatedScene : scene
    ));

    // Save to Firebase
    if (storyId && currentScene.id) {
      updateScene(storyId, currentScene.id, updatedScene).catch(error => {
        console.error("Error saving dialogue:", error);
        toast.error("Failed to save dialogue");
      });
    }
  };

  // Update sound effects handler
  const handleSoundEffectsChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!currentScene) return;
    
    const updatedShots = [...currentScene.shots];
    const existingShot = updatedShots[index];
    
    updatedShots[index] = {
      ...existingShot, // Keep all existing properties
      soundEffects: e.target.value,
      hasSoundEffects: !!e.target.value,
      // Preserve existing media
      generatedImage: existingShot.generatedImage || null,
      generatedVideo: existingShot.generatedVideo || null,
      lipSyncVideo: existingShot.lipSyncVideo || null,
      lipSyncAudio: existingShot.lipSyncAudio || null
    };
    
    const updatedScene = { ...currentScene, shots: updatedShots };
    setCurrentScene(updatedScene);
    setScenes(scenes.map(scene => 
      scene.id === currentScene.id ? updatedScene : scene
    ));

    // Save to Firebase
    if (storyId && currentScene.id) {
      updateScene(storyId, currentScene.id, updatedScene).catch(error => {
        console.error("Error saving sound effects:", error);
        toast.error("Failed to save sound effects");
      });
    }
  };

  // Add voice selection handler
  const handleVoiceSelect = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    if (!currentScene) return;
    
    const updatedShots = [...currentScene.shots];
    const existingShot = updatedShots[index];
    
    updatedShots[index] = {
      ...existingShot, // Keep all existing properties
      voiceId: e.target.value,
      // Preserve existing media
      generatedImage: existingShot.generatedImage || null,
      generatedVideo: existingShot.generatedVideo || null,
      lipSyncVideo: existingShot.lipSyncVideo || null,
      lipSyncAudio: existingShot.lipSyncAudio || null
    };
    
    const updatedScene = { ...currentScene, shots: updatedShots };
    setCurrentScene(updatedScene);
    setScenes(scenes.map(scene => 
      scene.id === currentScene.id ? updatedScene : scene
    ));

    // Save to Firebase
    if (storyId && currentScene.id) {
      updateScene(storyId, currentScene.id, updatedScene).catch(error => {
        console.error("Error saving voice selection:", error);
        toast.error("Failed to save voice selection");
      });
    }
  };

  // Add the missing handler functions
  const handleSceneDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentScene || !storyId) return;
    const updatedScene = { ...currentScene, description: e.target.value };
    updateScene(storyId, currentScene.id, updatedScene);
  };

  const handleSceneLightingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentScene || !storyId) return;
    const updatedScene = { ...currentScene, lighting: e.target.value };
    updateScene(storyId, currentScene.id, updatedScene);
  };

  const handleSceneWeatherChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentScene || !storyId) return;
    const updatedScene = { ...currentScene, weather: e.target.value };
    updateScene(storyId, currentScene.id, updatedScene);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
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
            onClick={saveStory} 
            disabled={isSaving || loading}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : loading ? (
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
            onClick={async () => {
              if (!storyId) {
                toast.error("No story ID found");
                return;
              }
              try {
                const story = await getStory(storyId);
                if (story) {
                  setScenes(story.scenes);
                  setCurrentScene(story.scenes[0] || null);
                  toast.success("Scenes synced successfully");
                }
              } catch (error) {
                console.error("Error syncing scenes:", error);
                toast.error("Failed to sync scenes. Please try again.");
              }
            }}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportScene} className="text-amber-600 border-amber-300 hover:bg-amber-50">
            <Download className="mr-2 h-4 w-4" />
            Export Scene
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="text-gray-600 border-gray-300">
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="text-gray-600 border-gray-300">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Left sidebar with scene info */}
        <div className="w-full md:w-64 bg-gray-50 p-4 flex flex-col border-r">
          {/* Scene List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Scenes</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={addNewScene}
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
                  onClick={() => handleSceneSelect(scene)}
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
                        handleSceneRename(scene.id, prompt("Enter new scene title:", scene.title) || scene.title);
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
                        handleSceneDelete(scene.id);
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
                onClick={generateAllShotImages}
              >
                <Camera className="mr-2 h-5 w-5" />
                Generate All Images
              </Button>
              {currentScene && (
                <button
                  onClick={() => generateSceneVideo(currentScene.id)}
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
              onChange={(e) => handleSceneDescriptionChange(e)}
            />
          </div>
          
          <div className="mb-4">
            <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-2">Lighting</h3>
            <textarea
              className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder="Describe the lighting"
              value={currentScene?.lighting || ''}
              onChange={(e) => handleSceneLightingChange(e)}
            />
          </div>
          
          <div className="mb-4">
            <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-2">Weather</h3>
            <textarea
              className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder="Describe the weather"
              value={currentScene?.weather || ''}
              onChange={(e) => handleSceneWeatherChange(e)}
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
                defaultValue="hyperrealistic"
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
        
        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          {/* Scene shots area */}
          <div className="grid grid-cols-2 gap-4 p-4">
            {currentScene?.shots.map((shot, index) => (
              <div key={shot.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    {shot.generatedImage && (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                          const promptElement = document.getElementById(`shot-${index}-prompt`) as HTMLTextAreaElement;
                          if (promptElement && promptElement.value.trim()) {
                            generateShotFromPrompt(index, promptElement.value);
                          }
                        }}>
                          <RefreshCw className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => generateShotVideo(index)}
                        >
                          <Film className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Image Preview */}
                {shot.generatedImage && (
                  <div className="relative aspect-video mb-3">
                    <img
                      src={shot.generatedImage}
                      alt={`Shot ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Video Preview */}
                {shot.generatedVideo && (
                  <div className="relative aspect-video mb-3">
                    <video
                      src={shot.generatedVideo}
                      controls
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Generated Shot Video
                    </div>
                  </div>
                )}
                
                {/* Shot Details */}
                <div className="space-y-2">
                  <textarea
                    id={`shot-${index}-prompt`}
                    className="w-full text-sm border rounded p-2"
                    rows={3}
                    placeholder="Describe this shot..."
                    defaultValue={shot.description}
                    onChange={(e) => handleShotDescriptionChange(e, index)}
                  />
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Shot Type</h3>
                    <select 
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      value={shot.type}
                      onChange={(e) => handleShotTypeChange(e, index)}
                    >
                      <option value="">Select shot type</option>
                      <option value="ESTABLISHING SHOT">Establishing Shot</option>
                      <option value="CLOSE-UP">Close-Up</option>
                      <option value="MEDIUM SHOT">Medium Shot</option>
                      <option value="WIDE SHOT">Wide Shot</option>
                      <option value="POV">POV</option>
                      <option value="TRACKING SHOT">Tracking Shot</option>
                    </select>
                  </div>
                  
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Character Dialogue</h3>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      rows={2}
                      placeholder="Add character dialogue..."
                      defaultValue={shot.dialogue || ""}
                      onChange={(e) => handleDialogueChange(e, index)}
                    />
                  </div>
                  
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Sound Effects</h3>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      rows={2}
                      placeholder="Add sound effects..."
                      defaultValue={shot.soundEffects || ""}
                      onChange={(e) => handleSoundEffectsChange(e, index)}
                    />
                  </div>
                </div>

                {/* Add voice selection dropdown */}
                {shot.hasDialogue && (
                  <div className="mt-2">
                    <select
                      value={shot.voiceId || ""}
                      onChange={(e) => handleVoiceSelect(e, index)}
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                    >
                      <option value="">Select voice</option>
                      <option value="21m00Tcm4TlvDq8ikWAM">Rachel</option>
                      <option value="AZnzlk1XvdvUeBnXmlld">Domi</option>
                      <option value="EXAVITQu4vr4xnSDxMaL">Bella</option>
                      <option value="ErXwobaYiN019PkySvjV">Antoni</option>
                      <option value="MF3mGyEYCl7XYWbV9V6O">Elli</option>
                      <option value="TxGEqnHWrfWFTfGW9XjX">Josh</option>
                      <option value="VR6AewLTigWG4xSOukaG">Arnold</option>
                      <option value="pNInz6obpgDQGcFmaJgB">Adam</option>
                      <option value="yoZ06aMxZJJ28xfdgOL">Sam</option>
                    </select>
                  </div>
                )}

                {/* Add lip sync button */}
                {shot.hasDialogue && shot.voiceId && (
                  <Button
                    onClick={() => generateLipSync(index)}
                    className="mt-2"
                    disabled={!shot.generatedVideo}
                  >
                    Generate Lip Sync
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {/* Add shot button */}
          <div className="p-4 flex justify-center">
            <Button 
              onClick={addNewShot} 
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Shot
            </Button>
          </div>
        </div>
      </div>
      
      {/* Full script view */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-800">Full Script</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpandedScript(!expandedScript)}
            className="text-gray-600"
          >
            {expandedScript ? "Collapse" : "Expand"} <ChevronDown className={`ml-1 h-4 w-4 ${expandedScript ? "transform rotate-180" : ""}`} />
          </Button>
        </div>
        
        {expandedScript ? (
          <div className="bg-white p-4 rounded-md whitespace-pre-wrap font-mono text-sm text-gray-700 border border-gray-200 shadow-sm max-h-[600px] overflow-y-auto">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {script}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-md whitespace-pre-wrap font-mono text-sm text-gray-700 border border-gray-200 shadow-sm max-h-[150px] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white pointer-events-none" style={{ opacity: 0.7 }}></div>
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {script.substring(0, 300) + (script.length > 300 ? "..." : "")}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Add the SceneChat component at the end of the return statement */}
      <SceneChat 
        onAddScene={handleAddScene}
        onAddShot={handleAddShot}
        currentSceneId={currentScene?.id || null}
      />
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