"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import TopNavBar from "../../components/TopNavBar";
import ChatArea from "../../components/ChatArea";
import ProjectContent from "../project/page";
import DocEditor from "../../components/DocEditor";
import { Button } from "../../components/ui/button";
import { FileText, Layers, PanelLeft, Save, Video } from "lucide-react";
import ProtectedRoute from "../components/auth/protected-route";
import { cn } from "../../lib/utils";
import ProjectsSidebar from "../../components/ProjectsSidebar";
import { toast } from "sonner";
import { getStory, updateStory, getStoryWithSubcollections, migrateStoryToSubcollections, removeNestedScenes, ensureStoryHasScene } from "../lib/firebase/stories";
import { useAuth } from "../hooks/useAuth";
import SceneTimeline from "../../components/project/SceneTimeline";
import type { Shot, Scene } from "../../types/shared";

// Create a style element with the CSS to hide the header
const hideProjectHeaderStyle = `
  /* Hide the project header in the workspace view */
  .workspace-view [class*="components_project_ProjectHeader"], 
  .workspace-view [class*="ProjectHeader"], 
  .workspace-view div[class*="border-b"][class*="flex"][class*="justify-between"] {
    display: none !important;
  }
  
  /* Hide the Full Script section and Expand button - more specific selectors */
  .workspace-view div[class*="p-4"][class*="bg-muted"],
  .workspace-view div[class*="p-4"][class*="border-t"],
  .workspace-view div[class*="dark:bg-muted"],
  .workspace-view div:has(h2:contains("Full Script")),
  .workspace-view div:has(button:contains("Expand")),
  .workspace-view h2:contains("Full Script"),
  .workspace-view button:contains("Expand"),
  .workspace-view div[class*="border-t"][class*="bg-muted"],
  /* Target by location in DOM structure */
  .workspace-view > div > div:last-child[class*="border-t"] {
    display: none !important;
  }
  
  /* Hide the SceneSidebar in the workspace view */
  .workspace-view [class*="SceneSidebar"],
  .workspace-view > div > div[class*="md:flex-row"] > div[class*="md:w-64"],
  .workspace-view > div > div[class*="md:flex-row"] > div:first-child,
  .workspace-view [class*="w-full md:w-64"] {
    display: none !important;
  }
  
  /* Hide the SceneTimeline in the iframe */
  .workspace-view iframe [class*="SceneTimeline"],
  .workspace-view iframe div[class*="border-t"][class*="bg-muted"] {
    display: none !important;
  }
  
  /* Adjust the main content area to take full width */
  .workspace-view > div > div[class*="md:flex-row"] > div.flex-1,
  .workspace-view .dynamic-project-content > div > div > div > div.flex-1 {
    width: 100% !important;
    margin-left: 0 !important;
    flex-grow: 1 !important;
  }
  
  /* Fix layout within project content */
  .workspace-view .dynamic-project-content {
    height: 100%;
  }
  
  .workspace-view .dynamic-project-content > div {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`;

// Dynamically import the DirectorEditor to avoid SSR issues with Remotion
const DirectorEditor = dynamic(() => import('../../components/director/DirectorEditor').then(mod => mod.DirectorEditor), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading director...</p>
      </div>
    </div>
  )
});

function ChatPanel() {
  return (
    <div className="h-full flex flex-col overflow-hidden chat-panel-container">
      <ChatArea />
    </div>
  );
}

export default function DashboardAppPage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("writer");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("<p>Start writing your document here...</p>");
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [currentProjectScene, setCurrentProjectScene] = useState<any>(null);
  const { user } = useAuth();
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Add effect to hide the project header using CSS after render
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.innerHTML = hideProjectHeaderStyle;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  // Load project content when a project is selected
  useEffect(() => {
    if (!currentProjectId) return;
    
    const loadProjectContent = async () => {
      setIsLoading(true);
      try {
        const story = await getStory(currentProjectId);
        if (story) {
          setDocumentTitle(story.title || "Untitled Document");
          const contentToUse = story.script || story.description || "";
          setEditorContent(
            contentToUse.startsWith("<") 
              ? contentToUse
              : `<p>${contentToUse}</p>`
          );
          
          // Try to load the first scene for the director tab
          const storyWithScenes = await getStoryWithSubcollections(currentProjectId);
          if (storyWithScenes && storyWithScenes.scenes && storyWithScenes.scenes.length > 0) {
            setCurrentProjectScene(storyWithScenes.scenes[0]);
          } else {
            // Create a default scene if none exists
            await ensureStoryHasScene(currentProjectId);
            const updatedStory = await getStoryWithSubcollections(currentProjectId);
            if (updatedStory && updatedStory.scenes && updatedStory.scenes.length > 0) {
              setCurrentProjectScene(updatedStory.scenes[0]);
            }
          }
          
          toast.success("Project loaded successfully");
        }
      } catch (error) {
        console.error("Error loading project:", error);
        toast.error("Failed to load project content");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjectContent();
  }, [currentProjectId]);

  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
  };

  const saveDocument = async () => {
    if (!currentProjectId || !user) {
      toast.error("Please select a project and ensure you're logged in");
      return;
    }
    
    setIsSaving(true);
    try {
      const story = await getStory(currentProjectId);
      if (!story) {
        throw new Error("Story not found");
      }
      
      await updateStory(currentProjectId, {
        ...story,
        title: documentTitle,
        script: editorContent,
        updatedAt: new Date()
      });
      
      toast.success("Document saved successfully!");
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-full">
        <TopNavBar />
        <div className="flex flex-1 overflow-hidden">
          {showSidebar && (
            <ProjectsSidebar onProjectSelect={handleProjectSelect} />
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b flex items-center p-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSidebar(!showSidebar)}
                className="mr-2"
              >
                <PanelLeft className={cn("h-4 w-4", !showSidebar && "rotate-180")} />
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === "storyboard" ? "default" : "ghost"}
                  className="flex items-center gap-2"
                  onClick={() => setActiveTab("storyboard")}
                >
                  <Layers className="h-4 w-4" />
                  Storyboard
                </Button>
                <Button
                  variant={activeTab === "writer" ? "default" : "ghost"}
                  className="flex items-center gap-2"
                  onClick={() => setActiveTab("writer")}
                >
                  <FileText className="h-4 w-4" />
                  Writer
                </Button>
                <Button
                  variant={activeTab === "director" ? "default" : "ghost"}
                  className="flex items-center gap-2"
                  onClick={() => setActiveTab("director")}
                >
                  <Video className="h-4 w-4" />
                  Director
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className={cn(
                "transition-all duration-300 ease-in-out overflow-auto",
                showChat ? "w-[65%]" : "w-full"
              )}>
                {activeTab === "storyboard" && (
                  <div className="h-full overflow-auto workspace-view relative">
                    {currentProjectId ? (
                      <StoryboardWrapper projectId={currentProjectId} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-center max-w-md">
                          <h2 className="text-2xl font-bold mb-4">No Project Selected</h2>
                          <p className="text-muted-foreground">
                            Please select a project from the sidebar to view it in the storyboard.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === "writer" && (
                  <div className="h-full overflow-auto p-4">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                          <p className="text-muted-foreground">Loading document...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <input
                            type="text"
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                            placeholder="Document Title"
                          />
                          <Button 
                            onClick={saveDocument} 
                            className="gap-2"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="prose-lg max-w-none">
                          <DocEditor
                            initialContent={editorContent}
                            onChange={(content) => {
                              try {
                                setEditorContent(content);
                              } catch (error) {
                                console.error("Error updating editor content:", error);
                              }
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {activeTab === "director" && (
                  <div className="h-full overflow-hidden">
                    {!currentProjectId ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-center max-w-md">
                          <h2 className="text-2xl font-bold mb-4">No Project Selected</h2>
                          <p className="text-muted-foreground">
                            Please select a project from the sidebar to use the director.
                          </p>
                        </div>
                      </div>
                    ) : isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                          <p className="text-muted-foreground">Loading project...</p>
                        </div>
                      </div>
                    ) : (
                      <DirectorEditor 
                        scene={currentProjectScene} 
                        storyId={currentProjectId} 
                      />
                    )}
                  </div>
                )}
              </div>

              {!showChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChat(true)}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-primary/10 hover:bg-primary/20 rounded-l-full rounded-r-none h-12"
                >
                  <PanelLeft className="h-4 w-4 rotate-180" />
                </Button>
              )}

              <div className={cn(
                "border-l overflow-hidden transition-all duration-300 ease-in-out flex flex-col",
                showChat ? "w-[35%]" : "w-0"
              )}>
                {showChat && (
                  <>
                    <div className="p-2 border-b flex justify-between items-center bg-muted/10">
                      <span className="text-sm font-medium">AI Chat</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowChat(false)}
                        className="h-6 w-6"
                      >
                        <PanelLeft className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ChatPanel />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StoryboardWrapper({ projectId }: { projectId: string | null }) {
  const [isLoading, setIsLoading] = useState(true);
  const projectRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (!projectId) return;
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [projectId]);
  
  if (!projectId) return null;
  
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading project...</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={projectRef}
          src={`/project?id=${projectId}`}
          className="w-full h-full border-none"
          title="Project Content"
        />
      </div>
      
      <SceneTimelineWrapper projectId={projectId} />
    </div>
  );
}

function SceneTimelineWrapper({ projectId }: { projectId: string | null }) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMounted = useRef(false);
  
  // Effect to load scenes when projectId changes
  useEffect(() => {
    if (!projectId) return;
    
    const loadSceneData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Use getStoryWithSubcollections to ensure we get data from subcollections
        const story = await getStoryWithSubcollections(projectId);
        console.log("Dashboard Timeline: Story data loaded:", story);
        
        if (story && story.scenes && Array.isArray(story.scenes) && story.scenes.length > 0) {
          setScenes(story.scenes);
          setCurrentScene(story.scenes[0]);
          console.log('Dashboard Timeline: Loaded scenes from subcollections:', story.scenes.length);
        } else {
          console.log('Dashboard Timeline: No scenes found in subcollections, trying to migrate data structure...');
          
          // Try to migrate if needed
          await migrateStoryToSubcollections(projectId);
          await removeNestedScenes(projectId);
          
          // Try again with subcollections
          const updatedStory = await getStoryWithSubcollections(projectId);
          
          if (updatedStory && updatedStory.scenes && updatedStory.scenes.length > 0) {
            setScenes(updatedStory.scenes);
            setCurrentScene(updatedStory.scenes[0]);
            console.log('Dashboard Timeline: Loaded scenes after migration:', updatedStory.scenes.length);
          } else {
            // As a last resort, create a default scene
            await ensureStoryHasScene(projectId);
            const finalStory = await getStoryWithSubcollections(projectId);
            
            if (finalStory && finalStory.scenes && finalStory.scenes.length > 0) {
              setScenes(finalStory.scenes);
              setCurrentScene(finalStory.scenes[0]);
              console.log('Dashboard Timeline: Created and loaded default scene');
            } else {
              setLoadError("Could not load or create scenes for this story");
              console.error("Dashboard Timeline: Failed to load or create scenes for story:", projectId);
            }
          }
        }
      } catch (error) {
        console.error('Dashboard Timeline: Error loading scene data:', error);
        setLoadError("Error loading timeline data");
        // Don't try to extract from DOM - focus on fixing the data instead
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSceneData();
  }, [projectId]);

  // Function to extract scenes from DOM
  const extractScenesFromDOM = () => {
    try {
      const sceneElements = document.querySelectorAll('.workspace-view [class*="p-2"][class*="rounded-lg"], .workspace-view [class*="cursor-pointer"]');
      
      if (sceneElements.length > 0) {
        console.log('Found scene elements in DOM:', sceneElements.length);
        const extractedScenes = Array.from(sceneElements).map((el) => {
          const titleEl = el.querySelector('span');
          const title = titleEl?.textContent?.trim() || 'Untitled Scene';
          const id = el.getAttribute('data-scene-id') || el.id || Math.random().toString(36).substr(2, 9);
          return { 
            id, 
            title, 
            shots: [],
            location: '',
            description: '',
            lighting: '',
            weather: '',
            style: '',
          };
        });
        
        if (extractedScenes.length > 0) {
          console.log('Extracted scenes from DOM:', extractedScenes.length);
          setScenes(extractedScenes);
          if (!currentScene) {
            setCurrentScene(extractedScenes[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting scene data from DOM:', error);
    }
  };
  
  // Effect to observe DOM changes and extract scenes if needed
  useEffect(() => {
    isMounted.current = true;
    
    // Only set up observer if we don't have scenes yet
    if (scenes.length === 0) {
      const observer = new MutationObserver(() => {
        if (!isMounted.current || scenes.length > 0) return;
        extractScenesFromDOM();
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      return () => {
        isMounted.current = false;
        observer.disconnect();
      };
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [scenes.length]);
  
  const handleSceneSelect = (scene: any) => {
    if (!scene) return;
    
    setCurrentScene(scene);
    const sceneElements = document.querySelectorAll('.workspace-view [class*="p-2"][class*="rounded-lg"], .workspace-view [class*="cursor-pointer"]');
    const index = scenes.findIndex(s => s.id === scene.id);
    
    if (index >= 0 && index < sceneElements.length) {
      try {
        (sceneElements[index] as HTMLElement).click();
        console.log('Clicked scene element:', scene.title);
      } catch (e) {
        console.error('Error clicking scene element:', e);
      }
    }
  };
  
  if (!projectId) return null;
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 bottom-0 bg-background border-t border-border h-16 flex items-center justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-opacity-20 border-t-primary rounded-full mr-2"></div>
        <span className="text-sm text-muted-foreground">Loading scenes...</span>
      </div>
    );
  }
  
  // Don't show the timeline if there are no scenes and no error
  if (scenes.length === 0 && !loadError) return null;
  
  return (
    <div className="absolute left-0 right-0 bottom-0 bg-background border-t border-border">
      <SceneTimeline 
        scenes={scenes}
        currentScene={currentScene}
        script=""
        onSceneSelect={handleSceneSelect}
        onSceneRename={() => {}} // Not implemented in dashboard
        onSceneDelete={() => {}} // Not implemented in dashboard
        onAddNewScene={() => {}} // Not implemented in dashboard
        loadError={loadError}
      />
    </div>
  );
} 