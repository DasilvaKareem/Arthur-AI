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
import { createStory, updateStory, getStory, Story, Scene, Shot, updateScene, updateShot, deleteScene, deleteShot, uploadShotImage } from '../lib/firebase/stories';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Add this interface to define the Gemini shot structure
interface GeminiShot {
  scene_number: number;
  shot_number: number;
  camera_view: string;
  camera_motion: string;
  characters: string[];
  dialogue: string | null;
  action: string;
  setting: string;
  starting_image_description: string;
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
  const [selectedStyle, setSelectedStyle] = useState<string>("hyperrealistic");

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
          setIsSaving(true);
          const decodedScript = decodeURIComponent(scriptParam);
          setScript(decodedScript);
          
          // Show loading toast
          toast.loading("Generating scenes from your story description...", {
            id: "creating-story",
          });
          
          // Parse script into scenes using Gemini
          const generatedScenes = await parseScriptIntoScenes(decodedScript);
          
          // Create new story in Firebase
          const newStoryId = await createStory(
            user.uid,
            titleParam ? decodeURIComponent(titleParam) : `Storyboard Project - ${new Date().toLocaleString()}`,
            decodedScript,
            generatedScenes
          );
          
          setStoryId(newStoryId);
          
          // Update URL with new story ID
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('id', newStoryId);
          router.push(newUrl.toString());
          
          // Success message
          toast.success("Story created with Gemini-generated scenes!", {
            id: "creating-story",
          });
        } catch (error) {
          console.error("Error creating story:", error);
          toast.error("Failed to create story. Please try again.", {
            id: "creating-story",
          });
        } finally {
          setIsSaving(false);
        }
      };
      
      createNewStory();
    } else if (scriptParam) {
      try {
        const decodedScript = decodeURIComponent(scriptParam);
        setScript(decodedScript);
        
        // Non-authenticated users still get script parsing
        parseScriptIntoScenes(decodedScript);
      } catch (error) {
        console.error("Error decoding script:", error);
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
        setScript(story.script);
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
          script,
          scenes,
          updatedAt: Date.now()
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
  const parseScriptIntoScenes = async (scriptText: string) => {
    try {
      console.log("Parsing script:", scriptText);
      
      // Show loading toast
      toast.loading("Generating scenes and shots using Gemini AI. This may take a minute...", {
        id: "gemini-generation",
      });

      try {
        console.log(`Generating ${selectedStyle}-style scenes from script using Gemini AI`);
        
        // Call the API to generate scenes and shots
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            script: scriptText,
            style: selectedStyle,
            duration: 1.0 // Default to 1 minute video
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || "Failed to generate scenes");
        }

        const data = await response.json();
        console.log("Generated scenes and shots:", data);

        // Check if we have valid shots data
        if (!data.shots || !Array.isArray(data.shots) || data.shots.length === 0) {
          throw new Error("No valid scenes or shots generated");
        }
        
        // Log details about the response for debugging
        console.log(`Received ${data.shots.length} shots from Gemini`);
        const sceneNumbers = [...new Set(data.shots.map((shot: GeminiShot) => shot.scene_number))];
        console.log(`Detected scene numbers: ${sceneNumbers.join(', ')}`);

        // Convert Gemini shot format to our scene/shot format
        const convertedScenes = convertGeminiShotsToScenes(data.shots);
        
        // Sort scenes by scene number if available
        convertedScenes.sort((a, b) => {
          return (a.sceneNumber || 0) - (b.sceneNumber || 0);
        });
        
        // Update the scenes state with the new scenes
        setScenes(convertedScenes);
        
        // Set the current scene to the first scene
        if (convertedScenes.length > 0) {
          setCurrentScene(convertedScenes[0]);
        }

        toast.success(`Generated ${convertedScenes.length} scenes with a total of ${data.shots.length} shots!`, {
          id: "gemini-generation",
        });

        return convertedScenes;
      } catch (error) {
        console.error("Error generating scenes:", error);
        toast.error(error instanceof Error ? error.message : "Failed to generate scenes. Please try again.", {
          id: "gemini-generation",
        });
        
        // Create a default scene if Gemini parsing fails
        const defaultScene: Scene = {
          id: "scene-1",
          title: "SCENE 1",
          location: "Default Location",
          description: scriptText.split('\n')[0].trim() || "Default scene description",
          lighting: "Natural lighting",
          weather: "Clear",
          style: "hyperrealistic",
          shots: [
            {
              id: "shot-1",
              type: "ESTABLISHING SHOT",
              description: scriptText.split('\n')[0].trim() || "Default shot description",
              hasNarration: false,
              hasDialogue: false,
              hasSoundEffects: false,
              prompt: scriptText.split('\n')[0].trim() || "Default shot description",
              narration: null,
              dialogue: null,
              soundEffects: null,
              location: null,
              lighting: null,
              weather: null,
              generatedImage: null,
              generatedVideo: null
            }
          ]
        };
        setScenes([defaultScene]);
        setCurrentScene(defaultScene);
        return [defaultScene];
      }
    } catch (error) {
      console.error("Error parsing script into scenes:", error);
      // Create a default scene if parsing fails
      const defaultScene: Scene = {
        id: "scene-1",
        title: "SCENE 1",
        location: "Default Location",
        description: scriptText.split('\n')[0].trim() || "Default scene description",
        lighting: "Natural lighting",
        weather: "Clear",
        style: "hyperrealistic",
        shots: [
          {
            id: "shot-1",
            type: "ESTABLISHING SHOT",
            description: scriptText.split('\n')[0].trim() || "Default shot description",
            hasNarration: false,
            hasDialogue: false,
            hasSoundEffects: false,
            prompt: scriptText.split('\n')[0].trim() || "Default shot description",
            narration: null,
            dialogue: null,
            soundEffects: null,
            location: null,
            lighting: null,
            weather: null,
            generatedImage: null,
            generatedVideo: null
          }
        ]
      };
      setScenes([defaultScene]);
      setCurrentScene(defaultScene);
      return [defaultScene];
    }
  };

  // Function to convert Gemini shots to our scene/shot format
  const convertGeminiShotsToScenes = (geminiShots: GeminiShot[]): Scene[] => {
    console.log(`Processing ${geminiShots.length} shots from Gemini`);
    
    // Group shots by scene number
    const shotsByScene: Record<number, GeminiShot[]> = {};
    
    geminiShots.forEach(shot => {
      const sceneNumber = shot.scene_number || 1;
      if (!shotsByScene[sceneNumber]) {
        shotsByScene[sceneNumber] = [];
      }
      shotsByScene[sceneNumber].push(shot);
    });
    
    console.log(`Found ${Object.keys(shotsByScene).length} distinct scenes`);
    
    // Convert each group to a scene
    const scenes = Object.entries(shotsByScene).map(([sceneNumber, shots]) => {
      // Find a good scene title based on the setting of the first shot
      const firstShot = shots[0];
      const setting = firstShot.setting || "";
      const sceneTitle = `SCENE ${sceneNumber}: ${setting.split('.')[0]}`;
      
      console.log(`Creating scene ${sceneNumber} with ${shots.length} shots`);
      
      // Convert each Gemini shot to our shot format
      const convertedShots = shots.map((shot, index) => {
        return {
          id: `shot-${index + 1}`,
          type: shot.camera_view || "MEDIUM SHOT",
          description: shot.starting_image_description || "",
          hasNarration: false,
          hasDialogue: !!shot.dialogue,
          hasSoundEffects: false,
          prompt: shot.starting_image_description || "",
          narration: null,
          dialogue: shot.dialogue || null,
          soundEffects: null,
          location: shot.setting || null,
          lighting: null,
          weather: null,
          generatedImage: null,
          generatedVideo: null,
          // Additional Gemini-specific fields
          cameraMotion: shot.camera_motion || "Static",
          action: shot.action || "",
          characters: shot.characters || [],
          shotNumber: shot.shot_number || index + 1
        } as Shot;
      });
      
      return {
        id: `scene-${sceneNumber}`,
        title: sceneTitle,
        location: firstShot.setting || "",
        description: firstShot.action || "",
        lighting: "Natural lighting",
        weather: "Clear",
        style: "hyperrealistic",
        shots: convertedShots,
        sceneNumber: parseInt(sceneNumber)
      } as Scene;
    });
    
    console.log(`Successfully created ${scenes.length} scenes`);
    return scenes;
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

  // Add new shot
  const addNewShot = async () => {
    if (!currentScene || !storyId) return;
    
    const newShot: Shot = {
      id: `shot-${currentScene.shots.length + 1}`,
      type: "MEDIUM SHOT",
      description: "Describe your shot...",
      hasNarration: false,
      hasDialogue: false,
      hasSoundEffects: false,
      prompt: null,
      narration: null,
      dialogue: null,
      soundEffects: null,
      location: null,
      lighting: null,
      weather: null,
      generatedImage: null,
      generatedVideo: null
    };
    
    try {
      // First update the scene with the new shot
      const updatedShots = [...currentScene.shots, newShot];
      const updatedScene = { ...currentScene, shots: updatedShots };
      
      // Update the scene in Firestore
      await updateScene(storyId, currentScene.id, {
        shots: updatedShots
      });
      
      // Update local state with proper type casting
      setCurrentScene(updatedScene as Scene);
      setScenes(prevScenes => 
        prevScenes.map(scene => 
          scene.id === currentScene.id ? updatedScene as Scene : scene
        )
      );

      toast.success("Shot added successfully");
    } catch (error) {
      console.error("Error adding shot:", error);
      toast.error("Failed to add shot. Please try again.");
    }
  };

  // Add new scene
  const addNewScene = async () => {
    if (!storyId) return;
    
    const newScene: Scene = {
      id: `scene-${scenes.length + 1}`,
      title: `SCENE ${scenes.length + 1}`,
      location: "",
      description: "",
      lighting: "",
      weather: "",
      style: "hyperrealistic",
      shots: [
        {
          id: "shot-1",
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
          generatedVideo: null
        }
      ]
    };
    
    try {
      await updateScene(storyId, newScene.id, newScene);
      setScenes([...scenes, newScene]);
      setCurrentScene(newScene);
    } catch (error) {
      console.error("Error adding scene:", error);
      alert("Failed to add scene. Please try again.");
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
          style: selectedStyle,
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
              // Upload the generated image to Firebase Storage
              console.log(`Uploading generated image for shot ${shotIndex + 1} to Firebase`);
              const downloadUrl = await uploadShotImage(
                storyId,
                currentScene.id,
                currentScene.shots[shotIndex].id,
                statusData.assets.image
              );

              // Create updated shot with new image
              const updatedShot = {
                ...currentScene.shots[shotIndex],
                description: prompt,
                generatedImage: downloadUrl,
                dialogue: prompt.includes("dialogue") 
                  ? "CHARACTER\n(emotional)\nGenerated dialogue based on your prompt." 
                  : currentScene.shots[shotIndex].dialogue,
                soundEffects: prompt.includes("sound") 
                  ? "SFX: Generated sound effect based on your prompt [3s]." 
                  : currentScene.shots[shotIndex].soundEffects
              };

              // Create updated shots array
              const updatedShots = [...currentScene.shots];
              updatedShots[shotIndex] = updatedShot;

              // Update the scene with new shots array
              const updatedScene = await updateScene(storyId, currentScene.id, {
                shots: updatedShots
              });

              if (updatedScene) {
                // Update both currentScene and scenes state
                setCurrentScene(updatedScene);
                setScenes(prevScenes => 
                  prevScenes.map(scene => 
                    scene.id === currentScene.id ? updatedScene : scene
                  )
                );
                console.log(`Successfully updated shot ${shotIndex + 1} with generated image`);
                toast.success(`Image generated for shot ${shotIndex + 1}!`);
              }
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

  // Regenerate scenes using Gemini
  const regenerateScenesWithGemini = async () => {
    if (!script || !storyId) {
      toast.error("No script available or story is not saved yet");
      return;
    }

    try {
      // Show loading toast
      toast.loading("Regenerating scenes with Gemini AI...", {
        id: "regenerate-scenes",
      });

      // Parse script into scenes using Gemini
      const regeneratedScenes = await parseScriptIntoScenes(script);
      
      // Update the existing story with new scenes
      await updateStory(storyId, {
        scenes: regeneratedScenes,
        updatedAt: Date.now()
      });
      
      toast.success("Scenes regenerated and saved successfully!", {
        id: "regenerate-scenes",
      });
    } catch (error) {
      console.error("Error regenerating scenes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to regenerate scenes. Please try again.", {
        id: "regenerate-scenes",
      });
    }
  };

  // Update the generateAllShotImages function
  const generateAllShotImages = async () => {
    if (!currentScene || !currentScene.shots) {
      toast.error('Please select a scene first');
      return;
    }

    try {
      toast.loading(`Generating images for all ${currentScene.shots.length} shots in scene ${currentScene.title}...`, {
        id: "bulk-image-generation",
      });

      let updatedShots = [...currentScene.shots];
      let successCount = 0;
      let failCount = 0;

      // Generate images for each shot sequentially
      for (let i = 0; i < updatedShots.length; i++) {
        try {
          const shot = updatedShots[i];
          
          // Skip shots that already have images
          if (shot.generatedImage) {
            successCount++;
            continue;
          }
          
          // Update toast with current progress
          toast.loading(`Generating image ${i+1}/${currentScene.shots.length} for scene ${currentScene.title}...`, {
            id: "bulk-image-generation",
          });
          
          const response = await fetch('/api/image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: shot.prompt || shot.description,
              style: selectedStyle,
              aspectRatio: "16:9",
              model: "photon-1",
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to generate image for shot ${i+1}`);
          }
          
          const data = await response.json();
          
          // Update the shot with the generated image URL
          updatedShots[i] = {
            ...updatedShots[i],
            generatedImage: data.url,
          };
          
          successCount++;
        } catch (error) {
          console.error(`Error generating image for shot ${i+1}:`, error);
          failCount++;
        }
      }
      
      // Update the current scene with the updated shots
      const updatedScene = {
        ...currentScene,
        shots: updatedShots,
      };
      
      // Update state
      setCurrentScene(updatedScene);
      setScenes(scenes.map(scene => 
        scene.id === currentScene.id ? updatedScene : scene
      ));
      
      // Save to Firebase if story ID exists
      if (storyId) {
        try {
          await updateScene(storyId, currentScene.id, {
            shots: updatedShots
          });
        } catch (error) {
          console.error("Error saving shots to Firebase:", error);
          toast.error("Generated images successfully but failed to save to database.");
          return;
        }
      }
      
      // Show success toast
      if (failCount === 0) {
        toast.success(`Successfully generated ${successCount} images for scene ${currentScene.title}!`, {
          id: "bulk-image-generation",
        });
      } else {
        toast.error(`Generated ${successCount} images, but failed to generate ${failCount} images.`, {
          id: "bulk-image-generation",
        });
      }
    } catch (error) {
      console.error("Error in bulk image generation:", error);
      toast.error("Failed to generate images for all shots. Please try again.", {
        id: "bulk-image-generation",
      });
    }
  };

  // Generate video for a single shot
  const generateShotVideo = async (shotIndex: number) => {
    if (!currentScene) {
      toast.error('Please select a scene first');
      return;
    }

    const shot = currentScene.shots[shotIndex];
    if (!shot.generatedImage) {
      toast.error("Please generate an image for this shot first");
      return;
    }

    try {
      // Start video generation
      toast.loading("Generating video...", {
        id: "video-generation",
      });
      
      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: shot.generatedImage,
          prompt: shot.description,
          duration: 5,
          style: selectedStyle, // Use the selected style
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start video generation");
      }

      const data = await response.json();
      console.log("Video generation started with ID:", data.id);

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
                
                // Save to Firebase if story ID exists
                if (storyId) {
                  try {
                    await updateShot(storyId, currentScene.id, shot.id, {
                      generatedVideo: statusData.assets.video
                    });
                  } catch (error) {
                    console.error("Error saving video to Firebase:", error);
                    toast.error("Generated video successfully but failed to save to database.");
                    return;
                  }
                }
   
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

  // Update the generateSceneVideo function to save to Firebase
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
      toast.loading(`Generating video for scene ${currentScene.title}...`, {
        id: "scene-video-generation",
      });

      // Format shots data for the API
      const shots = currentScene.shots.map(shot => ({
        imageUrl: shot.generatedImage,
        prompt: shot.description,
        duration: 2, // Each shot is 2 seconds
        style: selectedStyle,
      }));

      // Call the API to start scene video generation
      const response = await fetch("/api/scene-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shots,
          title: currentScene.title,
          style: selectedStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start scene video generation");
      }

      const data = await response.json();
      console.log("Scene video generation started with ID:", data.id);

      // Poll for video generation status
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/scene-video?id=${data.id}`);
          if (!statusResponse.ok) {
            throw new Error("Failed to check scene video generation status");
          }
          
          const statusData = await statusResponse.json();
          console.log("Scene video generation status:", statusData.state);

          if (statusData.state === "completed") {
            try {
              // Check if we have a valid video URL
              if (!statusData.videoUrl) {
                throw new Error("No video URL in response");
              }

              // Update the scene with the generated video URL
              const updatedScene = {
                ...currentScene,
                generatedVideo: statusData.videoUrl,
              };
              
              setCurrentScene(updatedScene);
              setScenes(scenes.map(scene => 
                scene.id === currentScene.id ? updatedScene : scene
              ));
              
              // Save to Firebase if story ID exists
              if (storyId) {
                try {
                  await updateScene(storyId, sceneId, {
                    generatedVideo: statusData.videoUrl
                  });
                } catch (error) {
                  console.error("Error saving scene video to Firebase:", error);
                  toast.error("Generated scene video successfully but failed to save to database.");
                  return;
                }
              }
   
              toast.success("Scene video generated successfully!", {
                id: "scene-video-generation",
              });
            } catch (error) {
              console.error("Error updating scene with video:", error);
              toast.error("Failed to save generated scene video. Please try again.", {
                id: "scene-video-generation",
              });
            }
          } else if (statusData.state === "failed") {
            throw new Error(statusData.failure_reason || "Scene video generation failed");
          } else {
            // Continue polling
            setTimeout(pollStatus, 3000);
          }
        } catch (error) {
          console.error("Error during scene video status polling:", error);
          toast.error(error instanceof Error ? error.message : "Failed to check scene video generation status. Please try again.", {
            id: "scene-video-generation",
          });
        }
      };

      pollStatus();
    } catch (error) {
      console.error("Error generating scene video:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate scene video. Please try again.", {
        id: "scene-video-generation",
      });
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
          {/* Add scene selector at the top */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Scenes</h3>
            <div className="max-h-40 overflow-y-auto">
              {scenes.map((scene) => (
                <div 
                  key={scene.id} 
                  className={`flex justify-between items-center p-2 rounded-md mb-1 cursor-pointer ${
                    currentScene?.id === scene.id ? "bg-purple-100 border border-purple-300" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleSceneSelect(scene)}
                >
                  <span className="text-sm font-medium truncate">
                    {scene.title}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 bg-gray-200 px-1 rounded">
                      {scene.shots.length} shots
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={addNewScene}
              className="w-full mt-2 bg-gray-800 hover:bg-gray-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Scene
            </Button>
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

            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-xl font-bold">Scene Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    onClick={regenerateScenesWithGemini}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-2"
                    disabled={isSaving || !script}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Scenes
                  </Button>
                  
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md flex items-center gap-2"
                    onClick={generateAllShotImages}
                    disabled={!currentScene || currentScene.shots.length === 0}
                  >
                    <Camera className="h-4 w-4" />
                    Generate All Images
                  </Button>
                  
                  {currentScene && currentScene.shots && currentScene.shots.length > 0 && 
                    currentScene.shots.every(shot => shot.generatedImage) && (
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md flex items-center gap-2"
                      onClick={() => generateSceneVideo(currentScene.id)}
                    >
                      <Film className="h-4 w-4" />
                      Generate Video
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mb-4">
              <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-2">Description</h3>
              <textarea
                className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                rows={3}
                placeholder="Describe the location"
                defaultValue="Describe the location"
              ></textarea>
            </div>
            
            <div className="mb-4">
              <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-2">Lighting</h3>
              <textarea
                className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                rows={2}
                placeholder="Describe the lighting"
                defaultValue="Describe the lighting"
              ></textarea>
            </div>
            
            <div className="mb-4">
              <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-2">Weather</h3>
              <textarea
                className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                rows={2}
                placeholder="Describe the weather"
                defaultValue="Describe the weather"
              ></textarea>
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
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
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
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          {/* Scene shots area */}
          <div className="grid grid-cols-2 gap-4 p-4">
            {currentScene?.shots.map((shot, index) => (
              <div key={shot.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">#{shot.shotNumber || index + 1}</span>
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
                
                {/* Shot Camera Motion Information */}
                {shot.cameraMotion && (
                  <div className="mb-2 text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                    <span className="px-2 py-1 bg-gray-100 rounded-md">{shot.type}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-md">{shot.cameraMotion}</span>
                  </div>
                )}

                {/* Characters */}
                {shot.characters && shot.characters.length > 0 && (
                  <div className="mb-2">
                    <h3 className="text-xs text-gray-500 uppercase">Characters</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {shot.characters.map((character, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs">
                          {character}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
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
                  />
                  
                  {/* Shot Type Selection */}
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Shot Type</h3>
                    <select 
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      defaultValue={shot.type}
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
                  
                  {/* Action Description */}
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Action</h3>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      rows={2}
                      placeholder="Action description..."
                      defaultValue={shot.action || ""}
                      onChange={(e) => updateShotDetails(currentScene.id, shot.id, { action: e.target.value })}
                    />
                  </div>
                  
                  {/* Character Dialogue */}
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Character Dialogue</h3>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      rows={2}
                      placeholder="Add character dialogue..."
                      defaultValue={shot.dialogue || ""}
                    />
                  </div>
                  
                  {/* Sound Effects */}
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Sound Effects</h3>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      rows={2}
                      placeholder="Add sound effects..."
                      defaultValue={shot.soundEffects || ""}
                    />
                  </div>
                </div>
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