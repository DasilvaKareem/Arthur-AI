"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Film, Plus } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { getUserStories } from "@/app/lib/firebase/stories";
import type { Story } from "@/types/shared";
import Link from "next/link";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const LeftSidebar: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

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

  // Debug render
  console.log("🎬 Current stories state:", stories);
  console.log("👤 Current user state:", user);

  return (
    <aside className={cn(
      "transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[40px]" : "w-[380px]",
      "pl-4 overflow-hidden pb-4"
    )}>
      <Card className="h-full overflow-hidden relative dark:bg-background">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute right-2 top-2 p-1 rounded-full",
            "hover:bg-accent transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          title={isCollapsed ? "Show Stories" : "Hide Stories"}
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
              <CardTitle className="text-sm font-medium">
                Your Stories
              </CardTitle>
              <Link href="/project">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  title="Create New Story"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(100%-45px)] space-y-2 px-2">
              {stories.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center bg-muted/50 rounded-lg">
                  {user ? "Create your first story to get started" : "Sign in to view your stories"}
                </div>
              ) : (
                stories.map((story) => (
                  <Link 
                    key={story.id} 
                    href={`/project?id=${story.id}`}
                    className="block"
                  >
                    <Card className={cn(
                      "transition-colors",
                      "hover:bg-accent/50",
                      "dark:hover:bg-accent/25",
                      "cursor-pointer",
                      "group"
                    )}>
                      <CardContent className="p-4 flex items-center space-x-3">
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
                            {story.scenes.length} scene{story.scenes.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </CardContent>
          </>
        )}
      </Card>
    </aside>
  );
};

export default LeftSidebar;
