"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { getStory } from '../app/lib/firebase/stories';
import dynamic from "next/dynamic";

// Import the original ProjectContent but control how it's used
const ProjectContent = dynamic(() => import("../app/project/page").then(mod => {
  return { default: mod.default };
}), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
});

interface ProjectContentNoHeaderProps {
  projectId: string | null;
}

const ProjectContentNoHeader: React.FC<ProjectContentNoHeaderProps> = ({ projectId }) => {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  
  // Use effect to modify the DOM after render to hide the header
  useEffect(() => {
    if (!projectId) return;
    
    // Use router to navigate to the project page with the ID
    router.push(`/project?id=${projectId}`);
    
    // Set up a mutation observer to hide the header when it appears
    const observer = new MutationObserver((mutations) => {
      // Look for the header element and hide it
      const projectHeader = document.querySelector('[class*="ProjectHeader"]');
      if (projectHeader) {
        (projectHeader as HTMLElement).style.display = 'none';
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Cleanup function to disconnect the observer
    return () => {
      observer.disconnect();
    };
  }, [projectId, router]);
  
  return (
    <div className="w-full h-full relative">
      {/* We'll let router.push handle the rendering */}
      <div style={{ height: '100%' }}>
        {projectId ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <h3 className="text-xl font-medium mb-2">No Project Selected</h3>
            <p>Select a project from the sidebar to view the storyboard</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectContentNoHeader; 