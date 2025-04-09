"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Film, Plus, FileText, FolderPlus } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { getUserStories } from "@/app/lib/firebase/stories";
import type { Story } from "@/types/shared";
import Link from "next/link";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectsSidebarProps {
  onProjectSelect?: (projectId: string) => void;
}

const ProjectsSidebar: React.FC<ProjectsSidebarProps> = ({ onProjectSelect }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const loadStories = async () => {
      console.log("🔍 Loading stories... User:", user?.uid);
      if (!user) {
        console.log("❌ No user found, skipping story load");
        return;
      }
      try {
        console.log("📚 Fetching stories for user:", user.uid);
        const userStories = await getUserStories(user.uid);
        console.log("✅ Stories fetched:", userStories);
        setStories(userStories);
      } catch (error) {
        console.error("❌ Error loading stories:", error);
      }
    };

    loadStories();
  }, [user]);

  const handleCreateNewProject = () => {
    if (!user) {
      toast.error("Please sign in to create a new project");
      return;
    }
    router.push("/project");
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  return (
    <aside className={cn(
      "transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[40px]" : "w-[300px]",
      "overflow-hidden"
    )}>
      <Card className="h-full overflow-hidden relative dark:bg-background border-r border-t-0 border-b-0 border-l-0 rounded-none">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute right-2 top-2 p-1 rounded-full",
            "hover:bg-accent transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          title={isCollapsed ? "Show Projects" : "Hide Projects"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {!isCollapsed && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-md font-bold">
                Projects
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={handleCreateNewProject}
                title="Create New Project"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(100%-70px)] space-y-2 px-2">
              {stories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-sm text-muted-foreground p-4 text-center bg-muted/50 rounded-lg">
                  <FileText className="h-12 w-12 mb-4 text-muted-foreground/50" />
                  {user ? (
                    <>
                      <p className="font-medium">No projects yet</p>
                      <p className="text-xs mt-1">Create your first project to get started</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={handleCreateNewProject}
                      >
                        <Plus className="h-3 w-3 mr-1" /> New Project
                      </Button>
                    </>
                  ) : (
                    <p>Sign in to view your projects</p>
                  )}
                </div>
              ) : (
                stories.map((story) => (
                  <Card 
                    key={story.id}
                    className={cn(
                      "transition-colors",
                      "hover:bg-accent/50",
                      "dark:hover:bg-accent/25",
                      "cursor-pointer",
                      "group",
                      selectedProjectId === story.id && "bg-accent/70 dark:bg-accent/50"
                    )}
                    onClick={() => handleProjectClick(story.id)}
                  >
                    <CardContent className="p-3 flex items-center space-x-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        "bg-primary/10",
                        "group-hover:bg-primary/20",
                        "transition-colors"
                      )}>
                        <Film className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">
                          {story.title || "Untitled Story"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {story.scenes?.length || 0} scene{story.scenes && story.scenes.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </>
        )}
      </Card>
    </aside>
  );
};

export default ProjectsSidebar; 