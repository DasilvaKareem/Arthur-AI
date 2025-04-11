"use client";

import { useState } from "react";
import ChatArea from "@/components/ChatArea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createStory } from "@/app/lib/firebase/stories";
import ProtectedRoute from "@/app/components/auth/protected-route";
import { useAuth } from "@/app/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";

export default function CreateStoryPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const handleStoryCreation = async (storyContent: string) => {
    if (!user) return;
    
    try {
      setIsCreating(true);
      toast.loading("Creating your story...");

      // Create a new story in Firebase
      const storyId = await createStory(
        "New Story", // Default title
        storyContent, // User's input as description
        user.uid,
        [] // Empty scenes array to start with
      );

      if (!storyId) {
        throw new Error("Failed to create story");
      }

      // Navigate to the project page with the new story ID
      router.push(`/project?id=${storyId}`);
      toast.success("Story created successfully!");
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error("Failed to create story. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <TopNavBar />
        <main className="flex-1 flex flex-col">
          <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col bg-card rounded-lg shadow-sm border">
              <div className="flex-1 overflow-y-auto p-4">
                <ChatArea 
                  initialMessage="Create a story with Arthur"
                  onMessageSubmit={handleStoryCreation}
                  isCreating={isCreating}
                />
              </div>
              <div className="p-4 border-t bg-background/50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Ready to organize your story?
                  </p>
                  <Link href="/workspace">
                    <Button variant="outline" size="lg">
                      Go to Workspace
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 