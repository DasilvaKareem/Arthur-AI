import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, addDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { Shot, Scene, Story } from '../../../types/shared';
import { db, storage } from './client';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Create a new story
export async function createStory(
  title: string,
  description: string,
  userId: string,
  scenes: Scene[] = [] // Use Scene type from shared types
): Promise<string> {
  try {
    console.log("Starting story creation...", {
      title,
      description,
      userId,
      scenesCount: scenes.length
    });

    // Validate required fields
    if (!title || !description || !userId) {
      throw new Error("Title, description, and userId are required");
    }

    const storiesRef = collection(db, 'stories');
    const storyData = {
      userId,
      title,
      description,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      scenes: scenes || [] // Ensure scenes is an array
    };

    console.log("Creating story with data:", storyData);
    const storyRef = await addDoc(storiesRef, storyData);
    console.log("Story created successfully with ID:", storyRef.id);
    return storyRef.id;
  } catch (error) {
    console.error("Error creating story:", error);
    throw error;
  }
}

// Get a story by ID
export async function getStory(storyId: string): Promise<(Story & { scenes: (Scene & { shots: Shot[] })[] }) | null> {
  try {
    console.log("Fetching story:", storyId);
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.log("Story not found:", storyId);
      return null;
    }

    const story = storyDoc.data() as Story;
    
    // If the story has scenes array with shots, return it directly
    if (story.scenes?.length > 0 && story.scenes[0]?.shots?.length >= 0) {
      console.log("Story already has scenes and shots:", storyId);
      return story as Story & { scenes: (Scene & { shots: Shot[] })[] };
    }
    
    // Initialize scenes array if it doesn't exist
    story.scenes = story.scenes || [];
    
    // Update the story with empty scenes array if needed
    if (!story.scenes.length) {
      console.log("Updating story with empty scenes array:", storyId);
      await updateDoc(storyRef, {
        scenes: [],
        updatedAt: new Date()
      });
    }

    return {
      ...story,
      scenes: story.scenes.map(scene => ({
        ...scene,
        shots: scene.shots || []
      }))
    };
  } catch (error) {
    console.error('Error getting story:', error);
    throw error;
  }
}

// Get all stories for a user
export async function getUserStories(userId: string): Promise<Story[]> {
  try {
    console.log("📚 Starting getUserStories for userId:", userId);
    
    if (!userId) {
      console.error("❌ No userId provided to getUserStories");
      return [];
    }

    const storiesRef = collection(db, 'stories');
    console.log("🔍 Created stories collection reference");
    
    const q = query(storiesRef, where('userId', '==', userId));
    console.log("🔍 Created query for user's stories");
    
    const querySnapshot = await getDocs(q);
    console.log(`📝 Found ${querySnapshot.size} stories in initial query`);
    
    if (querySnapshot.empty) {
      console.log("ℹ️ No stories found for user");
      return [];
    }

    const stories: Story[] = [];
    for (const doc of querySnapshot.docs) {
      try {
        console.log(`🎬 Processing story with ID: ${doc.id}`);
        const storyData = doc.data();
        
        // Parse scenes from the script if they exist
        let scenes: Scene[] = [];
        if (storyData.script) {
          try {
            // Split the script into scenes based on "SCENE" markers
            const sceneTexts: string[] = storyData.script.split(/SCENE \d+:/);
            scenes = sceneTexts
              .filter((text: string) => text && typeof text === 'string' && text.trim ? text.trim() : false) // Add null check for text and trim method
              .map((sceneText: string, index: number) => {
                // Extract scene details using regex
                const locationMatch = sceneText.match(/INT\.|EXT\.\s+(.*?)\s+-/);
                const descriptionMatch = sceneText.match(/Description:\s*(.*?)(?=\n|$)/);
                const lightingMatch = sceneText.match(/Lighting:\s*(.*?)(?=\n|$)/);
                const weatherMatch = sceneText.match(/Weather:\s*(.*?)(?=\n|$)/);
                
                return {
                  id: `scene-${index + 1}`,
                  title: `Scene ${index + 1}`,
                  location: locationMatch && locationMatch[1] ? locationMatch[1].trim() : "",
                  description: descriptionMatch && descriptionMatch[1] ? descriptionMatch[1].trim() : "",
                  lighting: lightingMatch && lightingMatch[1] ? lightingMatch[1].trim() : "",
                  weather: weatherMatch && weatherMatch[1] ? weatherMatch[1].trim() : "",
                  style: "hyperrealistic",
                  shots: [] // We'll handle shots in a separate function if needed
                };
              });
          } catch (parseError) {
            console.error(`Error parsing script for story ${doc.id}:`, parseError);
            // Return empty scenes if parsing fails
            scenes = [];
          }
        }
        
        // Handle different date formats and ensure all required fields
        let createdAt = new Date();
        let updatedAt = new Date();
        
        // Safely handle Firestore timestamps
        if (storyData.createdAt) {
          if (typeof storyData.createdAt.toDate === 'function') {
            // It's a Firestore timestamp
            createdAt = storyData.createdAt.toDate();
          } else if (storyData.createdAt instanceof Date) {
            // It's already a Date object
            createdAt = storyData.createdAt;
          } else if (storyData.createdAt._seconds) {
            // It's a serialized timestamp
            createdAt = new Date(storyData.createdAt._seconds * 1000);
          }
        }
        
        if (storyData.updatedAt) {
          if (typeof storyData.updatedAt.toDate === 'function') {
            // It's a Firestore timestamp
            updatedAt = storyData.updatedAt.toDate();
          } else if (storyData.updatedAt instanceof Date) {
            // It's already a Date object
            updatedAt = storyData.updatedAt;
          } else if (storyData.updatedAt._seconds) {
            // It's a serialized timestamp
            updatedAt = new Date(storyData.updatedAt._seconds * 1000);
          }
        }
        
        // Convert Firestore Timestamps to Dates and ensure all required fields
        const story: Story = {
          id: doc.id,
          title: storyData.title || "Untitled Story",
          description: storyData.script && typeof storyData.script === 'string' && storyData.script.split ? storyData.script.split('\n')[0] || "" : "", // Add null check for script
          script: storyData.script || "", // Add the script property
          userId: storyData.userId,
          scenes: scenes,
          createdAt: createdAt,
          updatedAt: updatedAt
        };
        
        stories.push(story);
        console.log(`✅ Successfully processed story: ${story.title}`);
      } catch (storyError) {
        console.error(`❌ Error processing story ${doc.id}:`, storyError);
        // Continue with other stories even if one fails
        continue;
      }
    }
    
    console.log(`📚 Returning ${stories.length} stories`);
    return stories;
  } catch (error) {
    console.error('❌ Error in getUserStories:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}

// Update a story
export async function updateStory(storyId: string, updates: Partial<Story>): Promise<void> {
  try {
    console.log("Starting story update:", storyId);
    const storyRef = doc(db, 'stories', storyId);

    // Clean and validate the updates
    const cleanUpdates = {
      ...updates,
      updatedAt: new Date(),
      scenes: updates.scenes?.map(scene => ({
        id: scene.id || `scene-${Date.now()}`,
        title: scene.title || "Untitled Scene",
        location: scene.location || "",
        description: scene.description || "",
        lighting: scene.lighting || "",
        weather: scene.weather || "",
        style: scene.style || "hyperrealistic",
        shots: scene.shots?.map(shot => ({
          id: shot.id || `shot-${Date.now()}`,
          type: shot.type || "WIDE",
          description: shot.description || "",
          hasNarration: shot.hasNarration || false,
          hasDialogue: shot.hasDialogue || false,
          hasSoundEffects: shot.hasSoundEffects || false,
          prompt: shot.prompt || "",
          narration: shot.narration || "",
          dialogue: shot.dialogue || "",
          soundEffects: shot.soundEffects || "",
          generatedImage: shot.generatedImage || null,
          generatedVideo: shot.generatedVideo || null
        })) || []
      })) || []
    };

    // Update in a single operation
    await updateDoc(storyRef, cleanUpdates);
    console.log("Story updated successfully:", storyId);
  } catch (error) {
    console.error("Error updating story:", error);
    throw error;
  }
}

// Validate scene data
export function validateSceneData(scene: Scene): void {
  const requiredFields: (keyof Scene)[] = ['id', 'title', 'location', 'description', 'lighting', 'weather', 'style'];
  const missingFields = requiredFields.filter(field => !scene[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Scene is missing required fields: ${missingFields.join(', ')}`);
  }

  if (!Array.isArray(scene.shots)) {
    throw new Error('Scene shots must be an array');
  }
}

// Validate shot data
export function validateShotData(shot: Shot): void {
  const requiredFields: (keyof Shot)[] = ['id', 'type', 'description', 'prompt'];
  const missingFields = requiredFields.filter(field => !shot[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Shot is missing required fields: ${missingFields.length > 1 ? missingFields.join(', ') : missingFields[0]}`);
  }
}

// Update a scene
export async function updateScene(storyId: string, sceneId: string, updates: Partial<Scene>) {
  try {
    console.log("Updating scene with ID:", sceneId, "Updates:", updates);
    
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      throw new Error("Story not found");
    }

    const story = storyDoc.data();
    const existingScene = story.scenes.find((scene: Scene) => scene.id === sceneId);
    
    if (!existingScene) {
      throw new Error("Scene not found");
    }

    // Create a map of existing shots for efficient lookup
    const existingShotsMap = new Map(
      existingScene.shots.map((shot: Shot) => [shot.id, shot])
    );

    // Process the updates
    const scenes = story.scenes.map((scene: Scene) => {
      if (scene.id === sceneId) {
        // If updating shots
        if (updates.shots) {
          // Validate each shot before merging
          updates.shots.forEach(validateShotData);

          // Merge existing shots with updated shots
          const mergedShots = updates.shots.map((updatedShot: Shot) => {
            const existingShot = existingShotsMap.get(updatedShot.id);

            // If it's an existing shot, merge with updates
            if (existingShot) {
              const mergedShot = {
                ...existingShot,
                ...updatedShot,
                narration: updatedShot.narration || null,
                dialogue: updatedShot.dialogue || null,
                soundEffects: updatedShot.soundEffects || null,
                location: updatedShot.location || null,
                lighting: updatedShot.lighting || null,
                weather: updatedShot.weather || null,
                generatedImage: updatedShot.generatedImage || null,
                generatedVideo: updatedShot.generatedVideo || null
              };
              validateShotData(mergedShot);
              return mergedShot;
            }

            // If it's a new shot, ensure all required fields
            const newShot = {
              id: updatedShot.id,
              type: updatedShot.type || "MEDIUM SHOT",
              description: updatedShot.description || "",
              hasNarration: !!updatedShot.narration,
              hasDialogue: !!updatedShot.dialogue,
              hasSoundEffects: !!updatedShot.soundEffects,
              prompt: updatedShot.prompt || "",
              narration: updatedShot.narration || null,
              dialogue: updatedShot.dialogue || null,
              soundEffects: updatedShot.soundEffects || null,
              location: updatedShot.location || null,
              lighting: updatedShot.lighting || null,
              weather: updatedShot.weather || null,
              generatedImage: updatedShot.generatedImage || null,
              generatedVideo: updatedShot.generatedVideo || null
            };
            validateShotData(newShot);
            return newShot;
          });

          const updatedScene = {
            ...scene,
            ...updates,
            shots: mergedShots
          };
          validateSceneData(updatedScene);
          return updatedScene;
        }

        // If no shots update, just merge other updates
        const updatedScene = {
          ...scene,
          ...updates
        };
        validateSceneData(updatedScene);
        return updatedScene;
      }
      return scene;
    });

    // Update the story document
    await updateDoc(storyRef, {
      scenes,
      updatedAt: new Date()
    });

    console.log("Successfully updated scene in Firestore");
    return scenes.find((scene: Scene) => scene.id === sceneId);
  } catch (error) {
    console.error("Error updating scene:", error);
    throw error;
  }
}

// Update a shot
export async function updateShot(storyId: string, sceneId: string, shotId: string, updates: Partial<Shot>): Promise<void> {
  try {
    const shotRef = doc(db, 'stories', storyId, 'scenes', sceneId, 'shots', shotId);
    await updateDoc(shotRef, {
      ...updates,
      hasNarration: !!updates.narration,
      hasDialogue: !!updates.dialogue,
      hasSoundEffects: !!updates.soundEffects
    });
    console.log('Shot updated successfully:', shotId);
  } catch (error) {
    console.error('Error updating shot:', error);
    throw error;
  }
}

// Delete a story
export async function deleteStory(storyId: string): Promise<void> {
  try {
    const storyRef = doc(db, 'stories', storyId);
    await deleteDoc(storyRef);
    console.log('Story deleted successfully:', storyId);
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
}

// Delete a scene
export async function deleteScene(storyId: string, sceneId: string): Promise<void> {
  try {
    const sceneRef = doc(db, 'stories', storyId, 'scenes', sceneId);
    await deleteDoc(sceneRef);
    console.log('Scene deleted successfully:', sceneId);
  } catch (error) {
    console.error('Error deleting scene:', error);
    throw error;
  }
}

// Delete a shot
export async function deleteShot(storyId: string, sceneId: string, shotId: string): Promise<void> {
  try {
    const shotRef = doc(db, 'stories', storyId, 'scenes', sceneId, 'shots', shotId);
    await deleteDoc(shotRef);
    console.log('Shot deleted successfully:', shotId);
  } catch (error) {
    console.error('Error deleting shot:', error);
    throw error;
  }
}

// Upload a shot image to Firebase Storage
export async function uploadShotImage(storyId: string, sceneId: string, shotId: string, imageUrl: string): Promise<string> {
  try {
    console.log("Starting image upload to Firebase Storage...");
    
    // First, fetch the image data
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Get the image data as a blob
    const blob = await response.blob();
    
    // Create a reference to the image in Firebase Storage
    const imageRef = ref(storage, `stories/${storyId}/scenes/${sceneId}/shots/${shotId}/image.jpg`);
    
    // Upload the image directly as a blob
    console.log("Uploading image to Firebase Storage...");
    await uploadBytes(imageRef, blob);
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(imageRef);
    console.log("Image uploaded successfully:", downloadUrl);
    
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading shot image:", error);
    throw error;
  }
}

// Delete image from Firebase Storage
export async function deleteShotImage(storyId: string, sceneId: string, shotId: string): Promise<void> {
  try {
    const imagePath = `stories/${storyId}/scenes/${sceneId}/shots/${shotId}/image.jpg`;
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting shot image:', error);
    throw error;
  }
}

// Clean up shot descriptions
export async function cleanupShotDescriptions(storyId: string): Promise<void> {
  try {
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) return;
    
    const story = storyDoc.data() as Story;
    if (!story.scenes) return;
    
    const cleanedScenes = story.scenes.map(scene => ({
      ...scene,
      shots: scene.shots.map(shot => ({
        ...shot,
        description: shot.description === "Describe your shot..." ? "" : shot.description,
        prompt: shot.prompt === "Describe your shot..." ? "" : shot.prompt
      }))
    }));
    
    await updateDoc(storyRef, {
      scenes: cleanedScenes,
      updatedAt: new Date()
    });
    
    console.log("Shot descriptions cleaned up for story:", storyId);
  } catch (error) {
    console.error("Error cleaning up shot descriptions:", error);
    throw error;
  }
} 