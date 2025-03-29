"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopNavBar from "../../components/TopNavBar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft, Download, Copy, Share, ChevronDown, Plus, Edit, Trash, Pencil, Camera, Film, Music, Volume2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Define the shot type
type Shot = {
  id: string;
  type: string;
  description: string;
  dialogue: string;
  soundEffects: string;
};

// Define the scene type
type Scene = {
  id: string;
  title: string;
  shots: Shot[];
};

function ProjectContent() {
  const searchParams = useSearchParams();
  const [script, setScript] = useState<string>("");
  const [title, setTitle] = useState<string>("My Script Project");
  const [expandedScript, setExpandedScript] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);

  useEffect(() => {
    const scriptParam = searchParams.get("script");
    const titleParam = searchParams.get("title");
    
    if (scriptParam) {
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
  }, [searchParams]);

  // Parse the script into scenes and shots
  const parseScriptIntoScenes = (scriptText: string) => {
    // Create at least one default scene
    const defaultScene: Scene = {
      id: "scene-1",
      title: "SCENE 1",
      shots: [
        {
          id: "shot-1",
          type: "ESTABLISHING SHOT",
          description: "Describe your shot...",
          dialogue: "",
          soundEffects: ""
        },
        {
          id: "shot-2",
          type: "MEDIUM SHOT",
          description: "Describe your shot...",
          dialogue: "",
          soundEffects: ""
        }
      ]
    };
    
    setScenes([defaultScene]);
    setCurrentScene(defaultScene);
    
    // Try to extract scene info from the script
    try {
      // Extract location from INT./EXT. if present
      const locationMatch = scriptText.match(/INT\.|EXT\.\s+(.*?)\s+-/);
      if (locationMatch && locationMatch[1]) {
        defaultScene.title += ` - ${locationMatch[1]}`;
      }
      
      // Basic extraction of possible shots from the script
      const lines = scriptText.split('\n');
      let shotDescription = "";
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for camera directions or character names
        if (line.includes("SHOT:") || line.includes("CLOSE-UP:") || line.includes("TRACKING SHOT:") || line.includes("WIDE SHOT:")) {
          if (shotDescription) {
            // Add previous shot if exists
            defaultScene.shots.push({
              id: `shot-${defaultScene.shots.length + 1}`,
              type: "CUSTOM SHOT",
              description: shotDescription,
              dialogue: "",
              soundEffects: ""
            });
          }
          shotDescription = line;
        } else if (line.match(/^[A-Z]{2,}(\s\([^)]+\))?$/)) {
          // Character name found
          let dialogueText = "";
          let j = i + 1;
          while (j < lines.length && !lines[j].match(/^[A-Z]{2,}/) && !lines[j].includes("SHOT:")) {
            dialogueText += lines[j] + "\n";
            j++;
          }
          
          defaultScene.shots.push({
            id: `shot-${defaultScene.shots.length + 1}`,
            type: "DIALOGUE SHOT",
            description: shotDescription || "Character speaking",
            dialogue: `${line}\n${dialogueText.trim()}`,
            soundEffects: ""
          });
          
          shotDescription = "";
          i = j - 1;
        } else if (line.startsWith("SFX:")) {
          // Sound effect
          defaultScene.shots[defaultScene.shots.length - 1].soundEffects += line + "\n";
        } else if (line.length > 0 && shotDescription.length < 100) {
          // Add to current shot description
          shotDescription += shotDescription ? "\n" + line : line;
        }
      }
      
      // Add final shot if any
      if (shotDescription && defaultScene.shots.length < 5) {
        defaultScene.shots.push({
          id: `shot-${defaultScene.shots.length + 1}`,
          type: "CUSTOM SHOT",
          description: shotDescription,
          dialogue: "",
          soundEffects: ""
        });
      }
      
      setScenes([defaultScene]);
      setCurrentScene(defaultScene);
    } catch (error) {
      console.error("Error parsing script into scenes:", error);
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

  const addNewShot = () => {
    if (!currentScene) return;
    
    const newShot: Shot = {
      id: `shot-${currentScene.shots.length + 1}`,
      type: "MEDIUM SHOT",
      description: "Describe your shot...",
      dialogue: "",
      soundEffects: ""
    };
    
    const updatedShots = [...currentScene.shots, newShot];
    const updatedScene = { ...currentScene, shots: updatedShots };
    
    setCurrentScene(updatedScene);
    setScenes(scenes.map(scene => 
      scene.id === currentScene.id ? updatedScene : scene
    ));
  };
  
  const generateShotFromPrompt = (shotIndex: number, prompt: string) => {
    if (!currentScene || !prompt.trim()) return;
    
    // Show generating indicator
    const shotElement = document.getElementById(`shot-${shotIndex}-prompt`);
    if (shotElement) {
      shotElement.classList.add('opacity-50');
    }
    
    // In a real implementation, this would call an API to generate content
    // For now, we'll just simulate a response
    setTimeout(() => {
      if (shotElement) {
        shotElement.classList.remove('opacity-50');
      }
      
      // Update the shot with "generated" content based on the prompt
      const updatedShots = [...currentScene.shots];
      if (updatedShots[shotIndex]) {
        const originalPrompt = updatedShots[shotIndex].description;
        updatedShots[shotIndex] = {
          ...updatedShots[shotIndex],
          description: prompt,
          dialogue: originalPrompt.includes("dialogue") 
            ? "CHARACTER\n(emotional)\nGenerated dialogue based on your prompt." 
            : updatedShots[shotIndex].dialogue,
          soundEffects: originalPrompt.includes("sound") 
            ? "SFX: Generated sound effect based on your prompt [3s]." 
            : updatedShots[shotIndex].soundEffects
        };
        
        const updatedScene = { ...currentScene, shots: updatedShots };
        setCurrentScene(updatedScene);
        setScenes(scenes.map(scene => 
          scene.id === currentScene.id ? updatedScene : scene
        ));
      }
    }, 1500);
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
          <div className="mb-4">
            <h2 className="text-xl font-bold text-amber-600">{currentScene?.title || "SCENE 1"}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {script.includes("INT.") || script.includes("EXT.") 
                ? script.split('\n')[0].trim() 
                : "Sarah Thompson returns to Eldridge, evoking nostalgia as she revisits her childhood town."}
            </p>
          </div>
          
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
            <div className="flex items-center space-x-2">
              <Camera className="text-gray-500 h-5 w-5" />
              <p className="text-sm text-gray-700">Video Style</p>
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
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Shot Type</h3>
                    <select className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700">
                      <option value="">Select shot type</option>
                      <option value="establishing">Establishing Shot</option>
                      <option value="closeup">Close-Up</option>
                      <option value="medium">Medium Shot</option>
                      <option value="wide">Wide Shot</option>
                      <option value="pov">POV</option>
                      <option value="tracking">Tracking Shot</option>
                    </select>
                  </div>
                  
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Prompt</h3>
                    <div className="relative">
                      <textarea
                        id={`shot-${index}-prompt`}
                        className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                        rows={3}
                        placeholder="Describe your shot..."
                        defaultValue={shot.description}
                      ></textarea>
                      <button 
                        className="absolute bottom-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs"
                        onClick={() => {
                          const promptElement = document.getElementById(`shot-${index}-prompt`) as HTMLTextAreaElement;
                          if (promptElement) {
                            generateShotFromPrompt(index, promptElement.value);
                          }
                        }}
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Character Dialogue</h3>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      rows={2}
                      placeholder="Add character dialogue..."
                      defaultValue={shot.dialogue}
                    ></textarea>
                  </div>
                  
                  <div>
                    <h3 className="uppercase text-xs tracking-wide text-gray-500 mb-1">Sound Effects</h3>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-700"
                      rows={2}
                      placeholder="Add sound effects..."
                      defaultValue={shot.soundEffects}
                    ></textarea>
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