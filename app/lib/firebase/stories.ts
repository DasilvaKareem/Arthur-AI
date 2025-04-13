import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, addDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
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
      userId
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
      script: description, // Store the description as the script too for backward compatibility
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Don't initialize scenes array as we're using subcollections
    };

    console.log("Creating story with data:", storyData);
    const storyRef = await addDoc(storiesRef, storyData);
    const storyId = storyRef.id;
    
    console.log("Story created successfully with ID:", storyId);
    
    // If scenes were provided in the arguments, create them as subcollections
    if (scenes && scenes.length > 0) {
      console.log(`Creating ${scenes.length} scenes as subcollections`);
      
      for (const scene of scenes) {
        const sceneData = {
          title: scene.title || "Untitled Scene",
          location: scene.location || "Default Location",
          description: scene.description || "",
          lighting: scene.lighting || "Natural lighting",
          weather: scene.weather || "Clear",
          style: scene.style || "hyperrealistic"
        };
        
        // Create the scene in the subcollection
        const sceneId = await createSceneSubcollection(storyId, sceneData);
        
        // If the scene has shots, add them to the scene's shots subcollection
        if (scene.shots && Array.isArray(scene.shots) && scene.shots.length > 0) {
          for (const shot of scene.shots) {
            await createShotSubcollection(storyId, sceneId, {
              type: shot.type || "MEDIUM SHOT",
              description: shot.description || "",
              hasDialogue: shot.hasDialogue || false,
              hasNarration: shot.hasNarration || false,
              hasSoundEffects: shot.hasSoundEffects || false,
              prompt: shot.prompt || shot.description || "",
              narration: shot.narration || "",
              dialogue: shot.dialogue || "",
              soundEffects: shot.soundEffects || ""
            });
          }
        }
      }
    } else {
      // Create at least one default scene
      console.log("Creating default scene for new story");
      await createDefaultScene(storyId, title);
    }
    
    return storyId;
  } catch (error) {
    console.error("Error creating story:", error);
    throw error;
  }
}

// Initialize scenes from script
async function initializeScenesFromScript(storyId: string, script: string): Promise<Scene[]> {
  try {
    console.log("Initializing scenes from script for story:", storyId);
    
    if (!script || typeof script !== 'string') {
      console.log("No valid script provided, returning empty scenes array");
      return [];
    }

    // Split the script into scenes based on "SCENE" markers
    const sceneTexts = script.split(/SCENE \d+:/).filter(text => text && typeof text === 'string' && text.trim());
    console.log(`Found ${sceneTexts.length} scenes in script`);

    const scenes: Scene[] = sceneTexts.map((sceneText, index) => {
      if (!sceneText || typeof sceneText !== 'string') {
        console.log(`Invalid scene text at index ${index}, skipping`);
        return {
          id: `scene-${index + 1}`,
          title: `Scene ${index + 1}`,
          location: "Default Location",
          description: "",
          lighting: "Natural lighting",
          weather: "Clear",
          style: "hyperrealistic",
          shots: []
        };
      }

      // Extract scene details using regex with null checks
      const locationMatch = sceneText.match(/INT\.|EXT\.\s+(.*?)\s+-/);
      const descriptionMatch = sceneText.match(/Description:\s*(.*?)(?=\n|$)/);
      const lightingMatch = sceneText.match(/Lighting:\s*(.*?)(?=\n|$)/);
      const weatherMatch = sceneText.match(/Weather:\s*(.*?)(?=\n|$)/);
      
      // Extract shots from the scene with null checks
      const shotTexts = sceneText.split(/(?=SHOT:|CLOSE-UP:|MEDIUM SHOT:)/)
        .filter(text => text && typeof text === 'string' && text.trim());
      
      const shots: Shot[] = shotTexts.map((shotText, shotIndex) => {
        if (!shotText || typeof shotText !== 'string') {
          console.log(`Invalid shot text at index ${shotIndex}, skipping`);
          return {
            id: `shot-${index}-${shotIndex}`,
            type: "MEDIUM SHOT",
            description: "",
            hasDialogue: false,
            hasNarration: false,
            hasSoundEffects: false,
            prompt: "",
            narration: "",
            dialogue: "",
            soundEffects: ""
          };
        }

        const typeMatch = shotText.match(/^(SHOT|CLOSE-UP|MEDIUM SHOT):/);
        const descriptionMatch = shotText.match(/Description:\s*(.*?)(?=\n|$)/);
        const dialogueMatch = shotText.match(/Dialogue:\s*(.*?)(?=\n|$)/);
        const narrationMatch = shotText.match(/Narration:\s*(.*?)(?=\n|$)/);
        const soundMatch = shotText.match(/Sound Effects:\s*(.*?)(?=\n|$)/);

        return {
          id: `shot-${index}-${shotIndex}`,
          type: typeMatch && typeMatch[1] ? typeMatch[1] : "MEDIUM SHOT",
          description: descriptionMatch && descriptionMatch[1] ? descriptionMatch[1].trim() : "",
          hasDialogue: !!dialogueMatch,
          hasNarration: !!narrationMatch,
          hasSoundEffects: !!soundMatch,
          prompt: descriptionMatch && descriptionMatch[1] ? descriptionMatch[1].trim() : "",
          narration: narrationMatch && narrationMatch[1] ? narrationMatch[1].trim() : "",
          dialogue: dialogueMatch && dialogueMatch[1] ? dialogueMatch[1].trim() : "",
          soundEffects: soundMatch && soundMatch[1] ? soundMatch[1].trim() : ""
        };
      });

      return {
        id: `scene-${index + 1}`,
        title: `Scene ${index + 1}`,
        location: locationMatch && locationMatch[1] ? locationMatch[1].trim() : "Default Location",
        description: descriptionMatch && descriptionMatch[1] ? descriptionMatch[1].trim() : "",
        lighting: lightingMatch && lightingMatch[1] ? lightingMatch[1].trim() : "Natural lighting",
        weather: weatherMatch && weatherMatch[1] ? weatherMatch[1].trim() : "Clear",
        style: "hyperrealistic",
        shots: shots
      };
    });

    // Update the story with the initialized scenes
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      scenes: scenes,
      updatedAt: new Date()
    });

    console.log(`Successfully initialized ${scenes.length} scenes for story:`, storyId);
    return scenes;
  } catch (error) {
    console.error("Error initializing scenes from script:", error);
    // Return empty scenes array instead of throwing to prevent UI from breaking
    return [];
  }
}

// Get a story by ID
export async function getStory(storyId: string): Promise<(Story & { scenes: (Scene & { shots: Shot[] })[] }) | null> {
  try {
    console.log("Fetching story:", storyId);
    
    // Try to get the story with subcollections first
    const storyWithSubcollections = await getStoryWithSubcollections(storyId);
    if (storyWithSubcollections) {
      console.log("Successfully retrieved story using subcollections:", storyId);
      return storyWithSubcollections as Story & { scenes: (Scene & { shots: Shot[] })[] };
    }
    
    console.log("Fallback to document-based story structure:", storyId);
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.log("Story not found:", storyId);
      return null;
    }

    const story = storyDoc.data() as Story;
    
    // If we have a script but no scenes, initialize scenes from the script
    if (story.script && (!story.scenes || story.scenes.length === 0)) {
      console.log("Initializing scenes from script for story:", storyId);
      const scenes = await initializeScenesFromScript(storyId, story.script);
      return {
        ...story,
        scenes: scenes
      };
    }
    
    // Initialize empty scenes array if needed
    story.scenes = story.scenes || [];
    
    // Consider migrating this story to subcollections for future access
    console.log("Consider migrating this story to subcollections:", storyId);
    
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
    
    // Use Promise.all to fetch all stories with their subcollections in parallel
    await Promise.all(querySnapshot.docs.map(async (storyDoc) => {
      try {
        const storyId = storyDoc.id;
        console.log(`🎬 Processing story with ID: ${storyId}`);
        
        // Get the story with subcollections
        const story = await getStoryWithSubcollections(storyId);
        
        if (story) {
          stories.push(story);
          console.log(`✅ Successfully processed story: ${story.title}`);
        }
      } catch (storyError) {
        console.error(`❌ Error processing story ${storyDoc.id}:`, storyError);
        // Continue with other stories even if one fails
      }
    }));
    
    console.log(`📚 Returning ${stories.length} stories`);
    return stories;
  } catch (error) {
    console.error('❌ Error in getUserStories:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}

// Update a story with retries and batch operations
export async function updateStory(storyId: string, updates: Partial<Story>): Promise<void> {
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000; // 1 second
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempting story update (attempt ${retryCount + 1}/${MAX_RETRIES}):`, storyId);
      const storyRef = doc(db, 'stories', storyId);

      // Validate the story exists
      const storyDoc = await getDoc(storyRef);
      if (!storyDoc.exists()) {
        throw new Error(`Story with ID ${storyId} not found`);
      }

      // Clean and validate the updates
      const cleanUpdates = {
        ...updates,
        updatedAt: new Date(),
        scenes: updates.scenes?.map(scene => {
          // Validate scene data
          if (!scene.id || !scene.title) {
            throw new Error('Invalid scene data: missing required fields');
          }

          return {
            id: scene.id,
            title: scene.title,
            location: scene.location || "",
            description: scene.description || "",
            lighting: scene.lighting || "",
            weather: scene.weather || "",
            style: scene.style || "hyperrealistic",
            shots: scene.shots?.map(shot => {
              // Validate shot data
              if (!shot.id || !shot.type || !shot.description) {
                throw new Error('Invalid shot data: missing required fields');
              }

              return {
                id: shot.id,
                type: shot.type,
                description: shot.description,
                hasNarration: shot.hasNarration || false,
                hasDialogue: shot.hasDialogue || false,
                hasSoundEffects: shot.hasSoundEffects || false,
                prompt: shot.prompt || "",
                narration: shot.narration || "",
                dialogue: shot.dialogue || "",
                soundEffects: shot.soundEffects || "",
                generatedImage: shot.generatedImage || null,
                generatedVideo: shot.generatedVideo || null
              };
            }) || []
          };
        }) || []
      };

      // Create a batch operation
      const batch = writeBatch(db);
      batch.update(storyRef, cleanUpdates);

      // Commit the batch
      await batch.commit();
      console.log("Story updated successfully:", storyId);
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error updating story (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
      
      // If it's not a retryable error, throw immediately
      if (error instanceof Error && 
          (error.message.includes('permission-denied') || 
           error.message.includes('not-found'))) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }

  // If we've exhausted all retries, throw the last error
  throw new Error(`Failed to update story after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
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

// Update a scene with retries
export async function updateScene(storyId: string, sceneId: string, updates: Partial<Scene>) {
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000; // 1 second
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempting scene update (attempt ${retryCount + 1}/${MAX_RETRIES}):`, sceneId);
      
      // First check if we're dealing with a subcollection scene
      const sceneRef = doc(db, 'stories', storyId, 'scenes', sceneId);
      const sceneDoc = await getDoc(sceneRef);
      
      if (sceneDoc.exists()) {
        // If the scene exists as a subcollection, use the subcollection update method
        console.log(`Scene ${sceneId} exists as subcollection, using updateSceneSubcollection`);
        
        // Extract only the scene data (without shots) to update
        const { shots, id, ...sceneUpdates } = updates;
        await updateSceneSubcollection(storyId, sceneId, sceneUpdates);
        
        // If there are shots to update, handle them separately
        if (shots && shots.length > 0) {
          console.log(`Updating ${shots.length} shots in scene ${sceneId}`);
          
          // Update each shot individually
          for (const shot of shots) {
            if (!shot.id) {
              console.error("Shot is missing ID, cannot update");
              continue;
            }
            
            await updateShotSubcollection(storyId, sceneId, shot.id, shot);
          }
        }
        
        // Get the updated scene to return
        const updatedSceneDoc = await getDoc(sceneRef);
        if (updatedSceneDoc.exists()) {
          const sceneData = updatedSceneDoc.data();
          
          // Get all shots for this scene
          const shotsRef = collection(db, 'stories', storyId, 'scenes', sceneId, 'shots');
          const shotsSnapshot = await getDocs(shotsRef);
          
          // Process shots
          const shots: Shot[] = shotsSnapshot.docs.map(shotDoc => {
            const shotData = shotDoc.data();
            return {
              id: shotDoc.id,
              type: shotData.type || "MEDIUM SHOT",
              description: shotData.description || "",
              hasDialogue: shotData.hasDialogue || false,
              hasNarration: shotData.hasNarration || false,
              hasSoundEffects: shotData.hasSoundEffects || false,
              prompt: shotData.prompt || shotData.description || "",
              narration: shotData.narration || "",
              dialogue: shotData.dialogue || "",
              soundEffects: shotData.soundEffects || "",
              generatedImage: shotData.generatedImage || null,
              generatedVideo: shotData.generatedVideo || null
            } as Shot;
          });
          
          // Return the scene with its shots
          return {
            id: sceneId,
            title: sceneData.title || "",
            location: sceneData.location || "",
            description: sceneData.description || "",
            lighting: sceneData.lighting || "",
            weather: sceneData.weather || "",
            style: sceneData.style || "hyperrealistic",
            shots: shots
          } as Scene;
        }
        
        return null;
      }
      
      // Legacy fallback: If the scene doesn't exist as a subcollection, use the old array-based method
      console.log("Scene doesn't exist as subcollection, using legacy update method");
      
      const storyRef = doc(db, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
        throw new Error(`Story with ID ${storyId} not found`);
      }

      const story = storyDoc.data();
      const existingScene = story.scenes.find((scene: Scene) => scene.id === sceneId);
      
      if (!existingScene) {
        throw new Error(`Scene with ID ${sceneId} not found in story ${storyId}`);
      }

      // Process and update scenes in the legacy array format
      // Consider migrating this to subcollections after the update
      console.warn("Using deprecated array-based scene update. Consider migrating to subcollections.");
      
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
      
      // After updating, consider migrating this story to subcollections
      console.log("Consider migrating this story to subcollections:", storyId);

      console.log("Scene updated successfully:", sceneId);
      return scenes.find((scene: Scene) => scene.id === sceneId);
    } catch (error) {
      lastError = error as Error;
      console.error(`Error updating scene (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
      
      // If it's not a retryable error, throw immediately
      if (error instanceof Error && 
          (error.message.includes('permission-denied') || 
           error.message.includes('not-found'))) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }

  // If we've exhausted all retries, throw the last error
  throw new Error(`Failed to update scene after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
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

// Upload a shot image to Firebase Storage with retries
export async function uploadShotImage(storyId: string, sceneId: string, shotId: string, imageUrl: string): Promise<string> {
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000; // 1 second
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempting image upload (attempt ${retryCount + 1}/${MAX_RETRIES}):`, { storyId, sceneId, shotId });
      
      // First, fetch the image data
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      // Get the image data as a blob
      const blob = await response.blob();
      
      // Validate blob size (max 10MB)
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error('Image size exceeds 10MB limit');
      }
      
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
      lastError = error as Error;
      console.error(`Error uploading shot image (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
      
      // If it's not a retryable error, throw immediately
      if (error instanceof Error && 
          (error.message.includes('permission-denied') || 
           error.message.includes('not-found') ||
           error.message.includes('size exceeds'))) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }

  // If we've exhausted all retries, throw the last error
  throw new Error(`Failed to upload image after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
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
    console.log("Cleaning up shot descriptions for story:", storyId);
    
    // First check if the story exists
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.log("Story not found:", storyId);
      return;
    }
    
    // Get all scenes from the scenes subcollection
    const scenesRef = collection(db, 'stories', storyId, 'scenes');
    const scenesSnapshot = await getDocs(scenesRef);
    
    if (scenesSnapshot.empty) {
      console.log("No scenes found in subcollections for story:", storyId);
      
      // Fall back to array-based structure if needed
      const story = storyDoc.data() as Story;
      if (!story.scenes || !Array.isArray(story.scenes) || story.scenes.length === 0) {
        console.log("No scenes found in story document either:", storyId);
        return;
      }
      
      // Legacy cleanup for array-based structure
      console.log("Using legacy cleanup for array-based scenes");
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
      
      console.log("Shot descriptions cleaned up for story using legacy method:", storyId);
      return;
    }
    
    // Process each scene in the subcollection
    const batch = writeBatch(db);
    let shotCount = 0;
    
    await Promise.all(scenesSnapshot.docs.map(async (sceneDoc) => {
      // Get all shots from this scene
      const shotsRef = collection(db, 'stories', storyId, 'scenes', sceneDoc.id, 'shots');
      const shotsSnapshot = await getDocs(shotsRef);
      
      // Process each shot
      shotsSnapshot.docs.forEach(shotDoc => {
        const shotData = shotDoc.data();
        const description = shotData.description;
        const prompt = shotData.prompt;
        
        // Only update if descriptions need cleaning
        if (description === "Describe your shot..." || prompt === "Describe your shot...") {
          const shotRef = doc(db, 'stories', storyId, 'scenes', sceneDoc.id, 'shots', shotDoc.id);
          batch.update(shotRef, {
            description: description === "Describe your shot..." ? "" : description,
            prompt: prompt === "Describe your shot..." ? "" : prompt
          });
          shotCount++;
        }
      });
    }));
    
    // If we have updates to make, commit the batch
    if (shotCount > 0) {
      await batch.commit();
      
      // Update the story's updatedAt field
      await updateDoc(storyRef, {
        updatedAt: new Date()
      });
      
      console.log(`Cleaned up descriptions for ${shotCount} shots in story:`, storyId);
    } else {
      console.log("No shots needed cleanup in story:", storyId);
    }
  } catch (error) {
    console.error("Error cleaning up shot descriptions:", error);
    throw error;
  }
}

/**
 * Get a story with all its scenes and shots using subcollections
 * This follows the structure: /stories/{storyId}/scenes/{sceneId}/shots/{shotId}
 */
export async function getStoryWithSubcollections(storyId: string): Promise<Story | null> {
  try {
    console.log("Fetching story with subcollections:", storyId);
    
    // 1. Get the base story document
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.log("Story not found:", storyId);
      return null;
    }

    // 2. Get all scenes from the scenes subcollection
    const scenesRef = collection(db, 'stories', storyId, 'scenes');
    const scenesSnapshot = await getDocs(scenesRef);
    
    if (scenesSnapshot.empty) {
      console.log("No scenes found for story:", storyId);
      // Return story with empty scenes array
      const storyData = storyDoc.data();
      return {
        id: storyDoc.id,
        title: storyData.title || "Untitled Story",
        description: storyData.description || "",
        script: storyData.script || "",
        userId: storyData.userId || "",
        createdAt: storyData.createdAt?.toDate() || new Date(),
        updatedAt: storyData.updatedAt?.toDate() || new Date(),
        scenes: []
      } as Story;
    }

    // 3. Process scenes and fetch shots for each scene
    const scenes: Scene[] = [];
    
    // Use Promise.all to fetch shots for all scenes in parallel
    await Promise.all(scenesSnapshot.docs.map(async (sceneDoc) => {
      const sceneData = sceneDoc.data();
      
      // Get all shots for this scene from the shots subcollection
      const shotsRef = collection(db, 'stories', storyId, 'scenes', sceneDoc.id, 'shots');
      const shotsSnapshot = await getDocs(shotsRef);
      
      // Process shots
      const shots: Shot[] = shotsSnapshot.docs.map(shotDoc => {
        const shotData = shotDoc.data();
        return {
          id: shotDoc.id,
          type: shotData.type || "MEDIUM SHOT",
          description: shotData.description || "",
          hasDialogue: shotData.hasDialogue || false,
          hasNarration: shotData.hasNarration || false,
          hasSoundEffects: shotData.hasSoundEffects || false,
          prompt: shotData.prompt || shotData.description || "",
          narration: shotData.narration || "",
          dialogue: shotData.dialogue || "",
          soundEffects: shotData.soundEffects || "",
          generatedImage: shotData.generatedImage || null,
          generatedVideo: shotData.generatedVideo || null,
          lipSyncVideo: shotData.lipSyncVideo || null,
          lipSyncAudio: shotData.lipSyncAudio || null,
          voiceId: shotData.voiceId || null,
          location: shotData.location || null,
          lighting: shotData.lighting || null,
          weather: shotData.weather || null
        } as Shot;
      });
      
      // Create the scene object with its shots
      const scene: Scene = {
        id: sceneDoc.id,
        title: sceneData.title || `Scene ${scenes.length + 1}`,
        location: sceneData.location || "Default Location",
        description: sceneData.description || "",
        lighting: sceneData.lighting || "Natural lighting",
        weather: sceneData.weather || "Clear",
        style: sceneData.style || "hyperrealistic",
        shots: shots
      };
      
      scenes.push(scene);
    }));

    // Sort scenes by title or another field if needed
    scenes.sort((a, b) => a.title.localeCompare(b.title));
    
    // 4. Construct the full story object
    const storyData = storyDoc.data();
    const story: Story = {
      id: storyDoc.id,
      title: storyData.title || "Untitled Story",
      description: storyData.description || "",
      script: storyData.script || "",
      userId: storyData.userId,
      createdAt: storyData.createdAt?.toDate() || new Date(),
      updatedAt: storyData.updatedAt?.toDate() || new Date(),
      scenes: scenes
    };
    
    console.log(`Successfully fetched story with ${scenes.length} scenes`);
    return story;
    
  } catch (error) {
    console.error("Error fetching story with subcollections:", error);
    return null;
  }
}

// Create a new scene in a story using subcollections
export async function createSceneSubcollection(
  storyId: string, 
  sceneData: Omit<Scene, 'id' | 'shots'> & { shots?: Omit<Shot, 'id'>[] }
): Promise<string> {
  try {
    console.log("Creating new scene in subcollection for story:", storyId);
    
    // Create the scene in the scenes subcollection
    const scenesRef = collection(db, 'stories', storyId, 'scenes');
    const newSceneRef = await addDoc(scenesRef, {
      title: sceneData.title || `Scene ${new Date().getTime()}`,
      location: sceneData.location || "Default Location",
      description: sceneData.description || "",
      lighting: sceneData.lighting || "Natural lighting",
      weather: sceneData.weather || "Clear",
      style: sceneData.style || "hyperrealistic",
      createdAt: serverTimestamp()
    });
    
    console.log("Created new scene with ID:", newSceneRef.id);
    
    // If shots are provided, create them as well
    if (sceneData.shots && sceneData.shots.length > 0) {
      const shotsRef = collection(db, 'stories', storyId, 'scenes', newSceneRef.id, 'shots');
      
      // Add shots one by one
      for (const shot of sceneData.shots) {
        await addDoc(shotsRef, {
          type: shot.type || "MEDIUM SHOT",
          description: shot.description || "",
          hasDialogue: shot.hasDialogue || false,
          hasNarration: shot.hasNarration || false,
          hasSoundEffects: shot.hasSoundEffects || false,
          prompt: shot.prompt || shot.description || "",
          narration: shot.narration || "",
          dialogue: shot.dialogue || "",
          soundEffects: shot.soundEffects || "",
          createdAt: serverTimestamp()
        });
      }
      
      console.log(`Added ${sceneData.shots.length} shots to scene ${newSceneRef.id}`);
    }
    
    // Update the story's updatedAt field
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      updatedAt: serverTimestamp()
    });
    
    return newSceneRef.id;
  } catch (error) {
    console.error("Error creating scene in subcollection:", error);
    throw error;
  }
}

// Create a new shot in a scene using subcollections
export async function createShotSubcollection(
  storyId: string,
  sceneId: string,
  shotData: Omit<Shot, 'id'>
): Promise<string> {
  try {
    console.log(`Creating new shot in scene ${sceneId} for story ${storyId}`);
    
    const shotsRef = collection(db, 'stories', storyId, 'scenes', sceneId, 'shots');
    const newShotRef = await addDoc(shotsRef, {
      type: shotData.type || "MEDIUM SHOT",
      description: shotData.description || "",
      hasDialogue: shotData.hasDialogue || false,
      hasNarration: shotData.hasNarration || false,
      hasSoundEffects: shotData.hasSoundEffects || false,
      prompt: shotData.prompt || shotData.description || "",
      narration: shotData.narration || "",
      dialogue: shotData.dialogue || "",
      soundEffects: shotData.soundEffects || "",
      createdAt: serverTimestamp()
    });
    
    // Update the story and scene's updatedAt field
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      updatedAt: serverTimestamp()
    });
    
    console.log("Created new shot with ID:", newShotRef.id);
    return newShotRef.id;
  } catch (error) {
    console.error("Error creating shot in subcollection:", error);
    throw error;
  }
}

// Update a scene in a subcollection
export async function updateSceneSubcollection(
  storyId: string,
  sceneId: string,
  updates: Partial<Omit<Scene, 'id' | 'shots'>>
): Promise<void> {
  try {
    console.log(`Updating scene ${sceneId} in story ${storyId}`);
    
    const sceneRef = doc(db, 'stories', storyId, 'scenes', sceneId);
    await updateDoc(sceneRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    // Also update the story's updatedAt field
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      updatedAt: serverTimestamp()
    });
    
    console.log(`Successfully updated scene ${sceneId}`);
  } catch (error) {
    console.error(`Error updating scene ${sceneId}:`, error);
    throw error;
  }
}

// Update a shot in a subcollection
export async function updateShotSubcollection(
  storyId: string,
  sceneId: string,
  shotId: string,
  updates: Partial<Omit<Shot, 'id'>>
): Promise<void> {
  try {
    // Add some extra validation
    if (!storyId || !sceneId || !shotId) {
      console.error("Missing required IDs:", { storyId, sceneId, shotId });
      throw new Error("Missing required IDs for updating shot");
    }
    
    console.log(`Updating shot ${shotId} in scene ${sceneId} with data:`, 
      // If we have a generatedVideo field, log it specially
      updates.generatedVideo 
        ? { ...updates, generatedVideo: `${updates.generatedVideo.substring(0, 30)}...` }
        : updates
    );
    
    const shotRef = doc(db, 'stories', storyId, 'scenes', sceneId, 'shots', shotId);
    
    // Verify the shot exists first
    const shotDoc = await getDoc(shotRef);
    if (!shotDoc.exists()) {
      console.error(`Shot ${shotId} not found in scene ${sceneId}`);
      throw new Error(`Shot not found: ${shotId}`);
    }
    
    // Update the doc
    await updateDoc(shotRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    // Update the story's updatedAt field
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      updatedAt: serverTimestamp()
    });
    
    console.log(`Successfully updated shot ${shotId}`);
  } catch (error) {
    console.error(`Error updating shot ${shotId}:`, error);
    throw error;
  }
}

// Delete a scene from a subcollection
export async function deleteSceneSubcollection(
  storyId: string,
  sceneId: string
): Promise<void> {
  try {
    console.log(`Deleting scene ${sceneId} from story ${storyId}`);
    
    // First, get and delete all shots in this scene
    const shotsRef = collection(db, 'stories', storyId, 'scenes', sceneId, 'shots');
    const shotsSnapshot = await getDocs(shotsRef);
    
    // Use a batch to delete all shots
    const batch = writeBatch(db);
    
    shotsSnapshot.docs.forEach(shotDoc => {
      const shotRef = doc(db, 'stories', storyId, 'scenes', sceneId, 'shots', shotDoc.id);
      batch.delete(shotRef);
    });
    
    // Delete the scene document itself
    const sceneRef = doc(db, 'stories', storyId, 'scenes', sceneId);
    batch.delete(sceneRef);
    
    // Commit the batch
    await batch.commit();
    
    // Update the story's updatedAt field
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      updatedAt: serverTimestamp()
    });
    
    console.log(`Successfully deleted scene ${sceneId} and its shots`);
  } catch (error) {
    console.error(`Error deleting scene ${sceneId}:`, error);
    throw error;
  }
}

// Delete a shot from a subcollection
export async function deleteShotSubcollection(
  storyId: string,
  sceneId: string,
  shotId: string
): Promise<void> {
  try {
    console.log(`Deleting shot ${shotId} from scene ${sceneId}`);
    
    const shotRef = doc(db, 'stories', storyId, 'scenes', sceneId, 'shots', shotId);
    await deleteDoc(shotRef);
    
    // Update the story's updatedAt field
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      updatedAt: serverTimestamp()
    });
    
    console.log(`Successfully deleted shot ${shotId}`);
  } catch (error) {
    console.error(`Error deleting shot ${shotId}:`, error);
    throw error;
  }
}

// Create a default scene for a story when none exists
export async function createDefaultScene(storyId: string, storyTitle: string = "Untitled Story"): Promise<string> {
  try {
    console.log(`Creating default scene for story ${storyId}`);
    
    // Create a basic scene structure
    const defaultScene = {
      title: "Scene 1",
      location: "Default Location",
      description: "This is the first scene of your story. Edit to add details.",
      lighting: "Natural lighting",
      weather: "Clear",
      style: "hyperrealistic"
    };
    
    // Create the scene in the subcollection
    const sceneId = await createSceneSubcollection(storyId, defaultScene);
    
    // Add a default shot to the scene
    await createShotSubcollection(storyId, sceneId, {
      type: "ESTABLISHING SHOT",
      description: "Describe your shot...",
      hasDialogue: false,
      hasNarration: false,
      hasSoundEffects: false,
      prompt: "Describe your shot..."
    });
    
    console.log(`Successfully created default scene ${sceneId} for story ${storyId}`);
    return sceneId;
  } catch (error) {
    console.error(`Error creating default scene for story ${storyId}:`, error);
    throw error;
  }
}

// Ensure a story has at least one scene, creating one if needed
export async function ensureStoryHasScene(storyId: string): Promise<string | null> {
  try {
    console.log(`Ensuring story ${storyId} has at least one scene`);
    
    // Check if the story exists and get its title
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.error(`Story ${storyId} not found`);
      return null;
    }
    
    const storyData = storyDoc.data();
    const storyTitle = storyData.title || "Untitled Story";
    
    // Check if the story already has scenes in the subcollection
    const scenesRef = collection(db, 'stories', storyId, 'scenes');
    const scenesSnapshot = await getDocs(scenesRef);
    
    if (!scenesSnapshot.empty) {
      // Return the ID of the first scene
      console.log(`Story ${storyId} already has scenes`);
      return scenesSnapshot.docs[0].id;
    }
    
    // Create a default scene
    console.log(`No scenes found for story ${storyId}, creating a default scene`);
    const sceneId = await createDefaultScene(storyId, storyTitle);
    return sceneId;
  } catch (error) {
    console.error(`Error ensuring story ${storyId} has scene:`, error);
    return null;
  }
}

// Debug function to analyze and fix story data structure
export async function analyzeStoryStructure(storyId: string): Promise<any> {
  try {
    console.log("Analyzing story structure for:", storyId);
    
    // 1. Get the base story document
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.log("Story not found:", storyId);
      return { error: "Story not found" };
    }
    
    const storyData = storyDoc.data();
    
    // 2. Check for scenes array in the story document
    const hasNestedScenes = storyData.scenes && Array.isArray(storyData.scenes);
    
    // 3. Check for scenes in subcollection
    const scenesRef = collection(db, 'stories', storyId, 'scenes');
    const scenesSnapshot = await getDocs(scenesRef);
    const hasSubcollectionScenes = !scenesSnapshot.empty;
    
    // 4. Count shots in both structures
    let nestedShotCount = 0;
    let subcollectionShotCount = 0;
    
    if (hasNestedScenes) {
      // Count shots in nested structure
      storyData.scenes.forEach((scene: any) => {
        if (scene.shots && Array.isArray(scene.shots)) {
          nestedShotCount += scene.shots.length;
        }
      });
    }
    
    if (hasSubcollectionScenes) {
      // Count shots in subcollections
      for (const sceneDoc of scenesSnapshot.docs) {
        const shotsRef = collection(db, 'stories', storyId, 'scenes', sceneDoc.id, 'shots');
        const shotsSnapshot = await getDocs(shotsRef);
        subcollectionShotCount += shotsSnapshot.size;
      }
    }
    
    // 5. Prepare report
    const report = {
      storyId,
      storyTitle: storyData.title || "Untitled Story",
      createdAt: storyData.createdAt ? (storyData.createdAt.toDate ? storyData.createdAt.toDate() : storyData.createdAt) : "Unknown",
      updatedAt: storyData.updatedAt ? (storyData.updatedAt.toDate ? storyData.updatedAt.toDate() : storyData.updatedAt) : "Unknown",
      hasScript: !!storyData.script,
      scriptLength: storyData.script ? storyData.script.length : 0,
      
      // Structure analysis
      structure: {
        hasNestedScenes,
        hasSubcollectionScenes,
        nestedSceneCount: hasNestedScenes ? storyData.scenes.length : 0,
        subcollectionSceneCount: hasSubcollectionScenes ? scenesSnapshot.size : 0,
        nestedShotCount,
        subcollectionShotCount
      }
    };
    
    console.log("Story structure analysis:", report);
    
    // 6. Offer to fix issues if needed
    return report;
  } catch (error) {
    console.error("Error analyzing story structure:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Fix issues with story structure by migrating data to subcollections
export async function migrateStoryToSubcollections(storyId: string): Promise<boolean> {
  try {
    console.log("Migrating story to subcollections:", storyId);
    
    // Get the current story data
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.error("Story not found:", storyId);
      return false;
    }
    
    const storyData = storyDoc.data();
    
    // Check if there are nested scenes to migrate
    if (!storyData.scenes || !Array.isArray(storyData.scenes) || storyData.scenes.length === 0) {
      console.log("No nested scenes to migrate");
      return true;
    }
    
    console.log(`Found ${storyData.scenes.length} nested scenes to migrate`);
    
    // Create subcollection scenes from the nested scenes
    for (const scene of storyData.scenes) {
      // Create scene in subcollection
      const sceneRef = doc(collection(db, 'stories', storyId, 'scenes'));
      await setDoc(sceneRef, {
        title: scene.title || "Untitled Scene",
        location: scene.location || "Default Location",
        description: scene.description || "",
        lighting: scene.lighting || "Natural lighting",
        weather: scene.weather || "Clear",
        style: scene.style || "hyperrealistic",
        createdAt: serverTimestamp()
      });
      
      console.log(`Migrated scene ${scene.title} with ID ${sceneRef.id}`);
      
      // Create shots as subcollection
      if (scene.shots && Array.isArray(scene.shots)) {
        for (const shot of scene.shots) {
          const shotRef = doc(collection(db, 'stories', storyId, 'scenes', sceneRef.id, 'shots'));
          await setDoc(shotRef, {
            type: shot.type || "MEDIUM SHOT",
            description: shot.description || "",
            hasDialogue: shot.hasDialogue || false,
            hasNarration: shot.hasNarration || false,
            hasSoundEffects: shot.hasSoundEffects || false,
            prompt: shot.prompt || shot.description || "",
            narration: shot.narration || "",
            dialogue: shot.dialogue || "",
            soundEffects: shot.soundEffects || "",
            generatedImage: shot.generatedImage || null,
            generatedVideo: shot.generatedVideo || null,
            lipSyncVideo: shot.lipSyncVideo || null,
            lipSyncAudio: shot.lipSyncAudio || null,
            voiceId: shot.voiceId || null,
            location: shot.location || null,
            lighting: shot.lighting || null,
            weather: shot.weather || null,
            createdAt: serverTimestamp()
          });
        }
        console.log(`Migrated ${scene.shots.length} shots for scene ${scene.title}`);
      }
    }
    
    // Clear the nested scenes array
    await updateDoc(storyRef, {
      scenes: [],
      updatedAt: serverTimestamp()
    });
    
    console.log("Successfully migrated story to subcollections");
    return true;
  } catch (error) {
    console.error("Error migrating story to subcollections:", error);
    return false;
  }
}

// Remove the legacy scenes array from a story document
export async function removeNestedScenes(storyId: string): Promise<boolean> {
  try {
    console.log(`Removing nested scenes array from story ${storyId}`);
    
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.error("Story not found:", storyId);
      return false;
    }
    
    // Update the story to remove the scenes array
    await updateDoc(storyRef, {
      scenes: [],  // Empty array clears the field
      updatedAt: serverTimestamp()
    });
    
    console.log("Successfully removed nested scenes array from story");
    return true;
  } catch (error) {
    console.error("Error removing nested scenes array:", error);
    return false;
  }
} 