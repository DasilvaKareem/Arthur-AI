"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import TopNavBar from "../../components/TopNavBar";
import ChatArea from "../../components/ChatArea";
import ProjectContent from "../project/page";
import DocEditor from "../../components/DocEditor";
import { Button } from "../../components/ui/button";
import { FileText, Layers, PanelLeft, Save, Video, Minimize2, Maximize2 } from "lucide-react";
import ProtectedRoute from "../components/auth/protected-route";
import { cn } from "../../lib/utils";
import ProjectsSidebar from "../../components/ProjectsSidebar";
import { toast } from "sonner";
import { getStory, updateStory, getStoryWithSubcollections, removeNestedScenes, ensureStoryHasScene } from "../lib/firebase/stories";
import { useAuth } from "../hooks/useAuth";
import SceneTimeline from "../../components/project/SceneTimeline";
import { useRouter } from "next/navigation";
import { Slider } from "../../components/ui/slider";
import ProjectHeader from "../../components/project/ProjectHeader";

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
  
  /* Hide the "suspense fallback" if shown */
  .workspace-view .dynamic-project-content > div:has(> div:contains("Loading...")) {
    display: none;
  }
  
  /* Remove outer padding to maximize space */
  .workspace-view .dynamic-project-content > div > div > div {
    padding: 0 !important;
  }
  
  /* Ensure shot cards display properly */
  .workspace-view .dynamic-project-content [class*="grid-cols-2"] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    width: 100%;
  }
  
  /* Add some spacing between shot cards and timeline */
  .workspace-view .dynamic-project-content {
    margin-bottom: 1rem;
  }
  
  /* Ensure chat area has proper space */
  .chat-panel-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .chat-panel-container > div {
    flex: 1;
    margin: 0 !important;
  }
  
  .chat-panel-container .card {
    margin: 0 !important;
    height: 100%;
  }
`;

function ChatPanel({ projectId, onShotCreated }: { projectId: string | null, onShotCreated?: () => void }) {
  return (
    <div className="h-full flex flex-col overflow-hidden chat-panel-container">
      <ChatArea 
        initialMessage={projectId ? "How can I help with your project?" : undefined} 
        projectId={projectId} 
        onShotCreated={onShotCreated}
      />
    </div>
  );
}

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

export default function WorkspacePage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("storyboard");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("<p>Start writing your document here...</p>");
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [currentProjectScene, setCurrentProjectScene] = useState<any>(null);
  const { user } = useAuth();
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");

  // Load story from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('story');
    
    if (storyId) {
      setCurrentProjectId(storyId);
      // Remove the story parameter from URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Add effect to hide the project header using CSS after render
  useEffect(() => {
    // Create style element if it doesn't exist yet
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.innerHTML = hideProjectHeaderStyle;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    // Set up a mutation observer to find and remove the Full Script section
    const observer = new MutationObserver((mutations) => {
      // Look for elements with text "Full Script"
      const fullScriptElems = document.querySelectorAll('h2, div');
      fullScriptElems.forEach(elem => {
        if (elem.textContent?.includes('Full Script')) {
          // Found the Full Script heading, now get its parent container
          const scriptSection = elem.closest('div[class*="p-4"], div[class*="border-t"]');
          if (scriptSection) {
            (scriptSection as HTMLElement).style.display = 'none';
            console.log('Removed Full Script section');
          }
        }
      });
      
      // Also look for Expand button
      const expandButtons = document.querySelectorAll('button');
      expandButtons.forEach(button => {
        if (button.textContent?.includes('Expand')) {
          const container = button.closest('div[class*="border-t"], div[class*="p-4"]');
          if (container) {
            (container as HTMLElement).style.display = 'none';
            console.log('Removed Expand button container');
          }
        }
      });
      
      // Look for scene timelines in the iframe to hide
      const iframe = document.querySelector('.workspace-view iframe');
      if (iframe) {
        try {
          const iframeDocument = (iframe as HTMLIFrameElement).contentDocument || 
                               (iframe as HTMLIFrameElement).contentWindow?.document;
          if (iframeDocument) {
            const sceneTimelines = iframeDocument.querySelectorAll('[class*="SceneTimeline"], div[class*="border-t"][class*="bg-muted"]');
            sceneTimelines.forEach(timeline => {
              (timeline as HTMLElement).style.display = 'none';
              console.log('Hid embedded SceneTimeline');
            });
          }
        } catch (e) {
          console.error('Error accessing iframe content:', e);
        }
      }
    });
    
    // Start observing the document
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
    
    return () => {
      // Clean up the style tag when the component unmounts
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
      // Disconnect the observer
      observer.disconnect();
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
          // Set document title from story
          setDocumentTitle(story.title || "Untitled Document");
          
          // Set editor content from story script or description
          const contentToUse = story.script || story.description || "";
          setEditorContent(
            contentToUse.startsWith("<") 
              ? contentToUse // If it's already HTML, use as is
              : `<p>${contentToUse}</p>` // Otherwise wrap in paragraph tags
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

  // Function to handle project selection from sidebar
  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    // Don't navigate away, just update the state
  };

  // Function to save the document content to Firebase
  const saveDocument = async () => {
    if (!currentProjectId || !user) {
      toast.error("Please select a project and ensure you're logged in");
      return;
    }
    
    setIsSaving(true);
    try {
      // Get the current story first
      const story = await getStory(currentProjectId);
      if (!story) {
        throw new Error("Story not found");
      }
      
      // Update the story with new content
      await updateStory(currentProjectId, {
        ...story,
        title: documentTitle,
        script: editorContent, // Store the editor content in the script field
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

  // Function to refresh the storyboard content
  const refreshStoryboard = useCallback(() => {
    console.log('Refreshing storyboard content');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-full">
        <TopNavBar />
        <div className="flex flex-1 overflow-hidden">
          {/* Projects Sidebar */}
          {showSidebar && (
            <ProjectsSidebar onProjectSelect={handleProjectSelect} />
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs for switching between views */}
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

            {/* Content for each tab */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left panel: Editor/Storyboard */}
              <div className={cn(
                "transition-all duration-300 ease-in-out overflow-auto",
                showChat ? "w-[65%]" : "w-full" // Wider when chat is collapsed
              )}>
                {activeTab === "storyboard" && (
                  <div className="h-full overflow-auto workspace-view relative">
                    {currentProjectId ? (
                      // Project selected - show the project content directly
                      <StoryboardWrapper projectId={currentProjectId} refreshTrigger={refreshTrigger} />
                    ) : (
                      // No project selected - show a message to select a project
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

              {/* Chat toggle button that appears when chat is collapsed */}
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

              {/* Right panel: Chat AI - collapsible */}
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
                      <ChatPanel 
                        projectId={currentProjectId} 
                        onShotCreated={refreshStoryboard}
                      />
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

function StoryboardWrapper({ projectId, refreshTrigger }: { projectId: string | null, refreshTrigger?: number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [widthScale, setWidthScale] = useState(1);
  const projectRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (!projectId) return;
    
    // Give the iframe some time to load, then hide the loading indicator
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    // Set up iframe load handlers
    if (projectRef.current) {
      projectRef.current.onload = () => {
        console.log('Iframe loaded, setting up dialogue fix');
        
        // Wait a bit for React to render content in the iframe
        setTimeout(injectDialogueFix, 2000);
        
        // Set up periodic check to ensure the fix is applied
        const checkInterval = setInterval(injectDialogueFix, 5000);
        
        // Clean up interval on unmount
        return () => clearInterval(checkInterval);
      };
    }
    
    return () => clearTimeout(timer);
  }, [projectId, refreshTrigger]);
  
  // Function to inject our dialogue fix into the iframe
  const injectDialogueFix = () => {
    try {
      if (!projectRef.current) return;
      
      const iframeDocument = projectRef.current.contentDocument || 
                           projectRef.current.contentWindow?.document;
      
      if (!iframeDocument) return;
      
      // Check if our script has already been injected
      if (iframeDocument.getElementById('dialogue-fix-script')) return;
      
      console.log('Injecting dialogue fix into iframe');
      
      // Create and inject our script
      const script = iframeDocument.createElement('script');
      script.id = 'dialogue-fix-script';
      script.textContent = `
        // Store temporary dialogue values
        const tempDialogueValues = {};
        
        // Function to handle dialogue textarea changes
        function handleDialogueTextareaChanges() {
          const textareas = document.querySelectorAll('.absolute textarea[placeholder="Add character dialogue..."]');
          console.log('Found', textareas.length, 'dialogue textareas');
          
          textareas.forEach(textarea => {
            // Skip if already handled
            if (textarea.dataset.handled) return;
            
            // Mark as handled
            textarea.dataset.handled = 'true';
            console.log('Patching dialogue textarea to prevent auto-save');
            
            // Create a unique ID for this textarea if it doesn't have one
            const textareaId = textarea.id || 'textarea-' + Math.random().toString(36).substring(2, 9);
            if (!textarea.id) textarea.id = textareaId;
            
            // Store the initial value
            tempDialogueValues[textareaId] = textarea.value;
            
            // Replace the textarea with a cloned version to remove all event listeners
            const clone = textarea.cloneNode(true);
            textarea.parentNode.replaceChild(clone, textarea);
            
            // Add our own input handler that will only update the visual UI
            clone.addEventListener('input', function(e) {
              // Store the value in our temp object
              tempDialogueValues[textareaId] = e.target.value;
            });
            
            // Find the save button in the same container
            const container = clone.closest('.absolute');
            if (container) {
              const saveButton = container.querySelector('button:last-child');
              if (saveButton && saveButton.textContent.trim() === 'Save') {
                console.log('Found Save button, attaching custom handler');
                
                // Clone the save button to remove existing handlers
                const newSaveButton = saveButton.cloneNode(true);
                saveButton.parentNode.replaceChild(newSaveButton, saveButton);
                
                // Add our own click handler
                newSaveButton.addEventListener('click', function(e) {
                  // Find the voice select dropdown
                  const voiceSelect = container.querySelector('select');
                  const voiceValue = voiceSelect ? voiceSelect.value : '';
                  
                  // Get the temp value
                  const dialogueValue = tempDialogueValues[textareaId];
                  
                  console.log('Saving dialogue with value:', dialogueValue);
                  
                  // Now we need to find the original button in the DOM and trigger a click on it
                  // This is because our clone doesn't have the React event handlers
                  // But we'll first update the textarea's value to match our temp value
                  clone.value = dialogueValue;
                  
                  // Dispatch an input event so React knows the value changed
                  const inputEvent = new Event('input', { bubbles: true });
                  clone.dispatchEvent(inputEvent);
                  
                  // Also dispatch a change event for good measure
                  const changeEvent = new Event('change', { bubbles: true });
                  clone.dispatchEvent(changeEvent);
                  
                  // Small delay to let React update its state
                  setTimeout(() => {
                    // Find all buttons in the container and click the Save one
                    const buttons = container.querySelectorAll('button');
                    const saveBtn = Array.from(buttons).find(b => b.textContent.trim() === 'Save');
                    if (saveBtn) {
                      console.log('Clicking real save button');
                      saveBtn.click();
                    }
                  }, 100);
                });
              }
            }
          });
        }
        
        // Initial run
        setTimeout(handleDialogueTextareaChanges, 1000);
        
        // Set up observer to catch new textareas
        const textareaObserver = new MutationObserver((mutations) => {
          // Check if any new textareas were added
          for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              setTimeout(handleDialogueTextareaChanges, 200);
              break;
            }
          }
        });
        
        textareaObserver.observe(document.body, { 
          childList: true, 
          subtree: true
        });
        
        console.log('Dialogue fix script loaded');
      `;
      
      // Append the script
      iframeDocument.head.appendChild(script);
    } catch (e) {
      console.error('Error injecting dialogue fix:', e);
    }
  };

  if (!projectId) return null;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Width Scale Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
        <Minimize2 className="h-3 w-3" />
        <Slider
          value={[widthScale]}
          min={0.5}
          max={2}
          step={0.1}
          className="w-24"
          onValueChange={(value) => setWidthScale(value[0])}
        />
        <Maximize2 className="h-3 w-3" />
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading project...</p>
            </div>
          </div>
        )}
        
        {/* Use an iframe to load the actual project page */}
        <iframe 
          ref={projectRef}
          src={`/project?id=${projectId}`} 
          className="w-full h-full border-none"
          title="Project Content"
          style={{
            transform: `scale(${widthScale})`,
            transformOrigin: 'top left',
            width: `${100 / widthScale}%`,
            height: `${100 / widthScale}%`
          }}
        />
      </div>
      
      {/* Scene timeline at the bottom */}
      <SceneTimelineWrapper projectId={projectId} />
    </div>
  );
}

function SceneTimelineWrapper({ projectId }: { projectId: string | null }) {
  const [scenes, setScenes] = useState<any[]>([]);
  const [currentScene, setCurrentScene] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Use a ref to track mounted state
  const isMounted = useRef(false);
  
  // Effect to directly load scene data when projectId changes
  useEffect(() => {
    if (!projectId || !isMounted.current) return;
    
    const loadSceneData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Try to load the story data using subcollections
        const story = await getStoryWithSubcollections(projectId);
        console.log("Timeline loading story data:", story);
        
        if (story && story.scenes && Array.isArray(story.scenes) && story.scenes.length > 0) {
          // Use the actual scenes from the story data
          setScenes(story.scenes);
          setCurrentScene(story.scenes[0]);
          console.log('Loaded scenes from subcollections:', story.scenes.length);
        } else {
          console.log('No scenes found in subcollections, trying to fix data structure...');
          
          // Call the fix-structure API endpoint
          try {
            const response = await fetch(`/api/story/fix-structure?storyId=${projectId}`);
            if (response.ok) {
              const result = await response.json();
              console.log('Fix structure result:', result);
            }
          } catch (fixError) {
            console.error('Error calling fix-structure API:', fixError);
          }
          
          // Try again with subcollections
          const updatedStory = await getStoryWithSubcollections(projectId);
          
          if (updatedStory && updatedStory.scenes && updatedStory.scenes.length > 0) {
            setScenes(updatedStory.scenes);
            setCurrentScene(updatedStory.scenes[0]);
            console.log('Loaded scenes after migration:', updatedStory.scenes.length);
          } else {
            // As a last resort, create a default scene
            await ensureStoryHasScene(projectId);
            const finalStory = await getStoryWithSubcollections(projectId);
            
            if (finalStory && finalStory.scenes && finalStory.scenes.length > 0) {
              setScenes(finalStory.scenes);
              setCurrentScene(finalStory.scenes[0]);
              console.log('Created and loaded default scene');
            } else {
              setLoadError("Could not load or create scenes for this story");
              console.error("Failed to load or create scenes for story:", projectId);
            }
          }
        }
      } catch (error) {
        console.error('Error loading scene data:', error);
        setLoadError("Error loading timeline data");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSceneData();
  }, [projectId]);
  
  const handleSceneSelect = (scene: any) => {
    setCurrentScene(scene);
    
    // Find the actual scene element and click it
    // Use a more specific selector to find the scene elements
    const sceneElements = document.querySelectorAll('.workspace-view [class*="p-2"][class*="rounded-lg"], .workspace-view [class*="cursor-pointer"]');
    const index = scenes.findIndex(s => s.id === scene.id);
    
    console.log('Scene select - Index:', index, 'Elements:', sceneElements.length);
    
    if (index >= 0 && index < sceneElements.length) {
      try {
        (sceneElements[index] as HTMLElement).click();
        console.log('Clicked scene element:', scene.title);
      } catch (e) {
        console.error('Error clicking scene element:', e);
      }
    }
  };
  
  // Don't show the timeline if there's no project selected
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
        onSceneRename={() => {}} // Not implemented in workspace
        onSceneDelete={() => {}} // Not implemented in workspace
        onAddNewScene={() => {}} // Not implemented in workspace
        loadError={loadError}
      />
    </div>
  );
} 