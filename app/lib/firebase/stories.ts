import { firebaseDb, firebaseStorage } from './client';
import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

export interface Story {
  id: string;
  userId: string;
  title: string;
  script: string;
  createdAt: number;
  updatedAt: number;
  scenes: Scene[];
}

export interface Scene {
  id: string;
  title: string;
  location: string;
  description: string;
  lighting: string;
  weather: string;
  style: string;
  shots: Shot[];
  generatedVideo?: string;
}

export interface Shot {
  id: string;
  type: string;
  description: string;
  hasNarration: boolean;
  hasDialogue: boolean;
  hasSoundEffects: boolean;
  prompt?: string;
  narration?: string;
  dialogue?: string;
  soundEffects?: string;
  generatedImage?: string;
  generatedVideo?: string;
  location?: string;
  lighting?: string;
  weather?: string;
}

// Create a new story
export async function createStory(userId: string, title: string, script: string, scenes: (Scene & { shots: Shot[] })[]): Promise<string> {
  try {
    console.log("Starting story creation...", {
      userId,
      title,
      scenesCount: scenes.length
    });

    // Validate required fields
    if (!userId) throw new Error('User ID is required');
    if (!title) throw new Error('Title is required');
    if (!script) throw new Error('Script is required');
    if (!scenes || scenes.length === 0) throw new Error('At least one scene is required');

    const storiesRef = collection(firebaseDb, 'stories');
    const newStoryRef = doc(storiesRef);
    
    // Create the main story document
    const story: Story = {
      id: newStoryRef.id,
      userId,
      title,
      script,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      scenes: []
    };

    console.log("Creating main story document...");
    await setDoc(newStoryRef, story);
    console.log('Story document created successfully:', newStoryRef.id);

    // Create scenes as subcollection
    const scenesRef = collection(newStoryRef, 'scenes');
    console.log("Creating scenes subcollection...");
    for (const scene of scenes) {
      // Validate required scene fields
      if (!scene.title) throw new Error('Scene title is required');
      if (!scene.location) throw new Error('Scene location is required');
      if (!scene.description) throw new Error('Scene description is required');
      if (!scene.lighting) throw new Error('Scene lighting is required');
      if (!scene.weather) throw new Error('Scene weather is required');
      if (!scene.style) throw new Error('Scene style is required');
      if (!scene.shots || scene.shots.length === 0) throw new Error('Scene must have at least one shot');

      const sceneRef = doc(scenesRef);
      await setDoc(sceneRef, {
        id: sceneRef.id,
        title: scene.title,
        location: scene.location,
        description: scene.description,
        lighting: scene.lighting,
        weather: scene.weather,
        style: scene.style
      });
      console.log("Scene created:", sceneRef.id);

      // Create shots as subcollection of each scene
      const shotsRef = collection(sceneRef, 'shots');
      console.log("Creating shots for scene:", sceneRef.id);
      for (const shot of scene.shots) {
        // Validate required shot fields
        if (!shot.type) throw new Error('Shot type is required');
        if (!shot.description) throw new Error('Shot description is required');

        const shotRef = doc(shotsRef);
        await setDoc(shotRef, {
          ...shot,
          id: shotRef.id,
          hasNarration: !!shot.narration,
          hasDialogue: !!shot.dialogue,
          hasSoundEffects: !!shot.soundEffects
        });
        console.log("Shot created:", shotRef.id);
      }
    }

    console.log("Story creation completed successfully");
    return newStoryRef.id;
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
}

// Get a story by ID
export async function getStory(storyId: string): Promise<(Story & { scenes: (Scene & { shots: Shot[] })[] }) | null> {
  try {
    const storyRef = doc(firebaseDb, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (storyDoc.exists()) {
      const story = storyDoc.data() as Story;
      
      // If the story already has scenes array, return it directly
      if (story.scenes && story.scenes.length > 0) {
        return story as Story & { scenes: (Scene & { shots: Shot[] })[] };
      }
      
      // Otherwise, get scenes from subcollection
      const scenesRef = collection(storyRef, 'scenes');
      const scenesSnapshot = await getDocs(scenesRef);
      const scenes: (Scene & { shots: Shot[] })[] = [];

      // Get shots for each scene
      for (const sceneDoc of scenesSnapshot.docs) {
        const scene = sceneDoc.data() as Scene;
        const shotsRef = collection(sceneDoc.ref, 'shots');
        const shotsSnapshot = await getDocs(shotsRef);
        const shots = shotsSnapshot.docs.map(doc => doc.data() as Shot);
        scenes.push({ ...scene, shots });
      }

      // Update the story document with the scenes array
      await updateDoc(storyRef, {
        scenes,
        updatedAt: Date.now()
      });

      return { ...story, scenes };
    }
    return null;
  } catch (error) {
    console.error('Error getting story:', error);
    throw error;
  }
}

// Get all stories for a user
export async function getUserStories(userId: string): Promise<Story[]> {
  try {
    const storiesRef = collection(firebaseDb, 'stories');
    const q = query(storiesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const stories: Story[] = [];
    for (const doc of querySnapshot.docs) {
      const story = await getStory(doc.id);
      if (story) {
        stories.push(story);
      }
    }
    
    return stories;
  } catch (error) {
    console.error('Error getting user stories:', error);
    throw error;
  }
}

// Update a story
export async function updateStory(storyId: string, updates: Partial<Story>): Promise<void> {
  try {
    console.log("Starting story update...", {
      storyId,
      updates: {
        hasTitle: !!updates.title,
        hasScript: !!updates.script,
        hasScenes: !!updates.scenes
      }
    });

    const storyRef = doc(firebaseDb, 'stories', storyId);
    await updateDoc(storyRef, {
      ...updates,
      updatedAt: Date.now()
    });
    console.log('Story updated successfully:', storyId);
  } catch (error) {
    console.error('Error updating story:', error);
    throw error;
  }
}

// Update a scene
export async function updateScene(storyId: string, sceneId: string, updates: Partial<Scene>) {
  try {
    console.log("Updating scene with ID:", sceneId, "Updates:", updates);
    
    const storyRef = doc(firebaseDb, "stories", storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      throw new Error("Story not found");
    }

    const story = storyDoc.data() as Story;
    const scenes = story.scenes.map(scene => {
      if (scene.id === sceneId) {
        // If we're updating shots, we need to merge them carefully
        if (updates.shots) {
          // Create a map of existing shots by ID for quick lookup
          const existingShotsMap = new Map(
            scene.shots?.map(shot => [shot.id, shot]) || []
          );

          // Merge the updates with existing shots
          const mergedShots = updates.shots.map(updatedShot => {
            const existingShot = existingShotsMap.get(updatedShot.id);
            
            // If the shot exists, merge it with updates
            if (existingShot) {
              return {
                ...existingShot,
                ...updatedShot,
                // Explicitly preserve these fields if they exist
                generatedImage: updatedShot.generatedImage || existingShot.generatedImage,
                generatedVideo: updatedShot.generatedVideo || existingShot.generatedVideo,
                description: updatedShot.description || existingShot.description,
                type: updatedShot.type || existingShot.type,
                dialogue: updatedShot.dialogue || existingShot.dialogue,
                soundEffects: updatedShot.soundEffects || existingShot.soundEffects,
                narration: updatedShot.narration || existingShot.narration,
                location: updatedShot.location || existingShot.location,
                lighting: updatedShot.lighting || existingShot.lighting,
                weather: updatedShot.weather || existingShot.weather,
                hasNarration: updatedShot.hasNarration ?? existingShot.hasNarration,
                hasDialogue: updatedShot.hasDialogue ?? existingShot.hasDialogue,
                hasSoundEffects: updatedShot.hasSoundEffects ?? existingShot.hasSoundEffects,
              };
            }
            
            // If it's a new shot, ensure all required fields
            return {
              id: updatedShot.id,
              type: updatedShot.type || "MEDIUM SHOT",
              description: updatedShot.description || "",
              hasNarration: updatedShot.hasNarration || false,
              hasDialogue: updatedShot.hasDialogue || false,
              hasSoundEffects: updatedShot.hasSoundEffects || false,
              prompt: updatedShot.prompt || "",
              narration: updatedShot.narration || "",
              dialogue: updatedShot.dialogue || "",
              soundEffects: updatedShot.soundEffects || "",
              generatedImage: updatedShot.generatedImage || null,
              generatedVideo: updatedShot.generatedVideo || null,
              location: updatedShot.location || "",
              lighting: updatedShot.lighting || "",
              weather: updatedShot.weather || ""
            };
          });

          return {
            ...scene,
            ...updates,
            shots: mergedShots
          };
        }

        // If no shots update, just merge other updates
        return {
          ...scene,
          ...updates
        };
      }
      return scene;
    });

    // Update the story document
    await updateDoc(storyRef, {
      scenes,
      updatedAt: Date.now()
    });

    console.log("Successfully updated scene in Firestore");
    return scenes.find(scene => scene.id === sceneId);
  } catch (error) {
    console.error("Error updating scene:", error);
    throw error;
  }
}

// Update a shot
export async function updateShot(storyId: string, sceneId: string, shotId: string, updates: Partial<Shot>): Promise<void> {
  try {
    const shotRef = doc(firebaseDb, 'stories', storyId, 'scenes', sceneId, 'shots', shotId);
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
    const storyRef = doc(firebaseDb, 'stories', storyId);
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
    const sceneRef = doc(firebaseDb, 'stories', storyId, 'scenes', sceneId);
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
    const shotRef = doc(firebaseDb, 'stories', storyId, 'scenes', sceneId, 'shots', shotId);
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
    
    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
    });
    
    reader.readAsDataURL(blob);
    const base64String = await base64Promise;
    
    // Create a reference to the image in Firebase Storage
    const imageRef = ref(firebaseStorage, `stories/${storyId}/scenes/${sceneId}/shots/${shotId}/image.jpg`);
    
    // Upload the image
    console.log("Uploading image to Firebase Storage...");
    await uploadString(imageRef, base64String, 'data_url');
    
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
    const imageRef = ref(firebaseStorage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting shot image:', error);
    throw error;
  }
} 