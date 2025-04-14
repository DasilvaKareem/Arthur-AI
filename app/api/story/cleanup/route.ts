import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/client';
import { removeNestedScenes, ensureStoryHasScene } from '../../../lib/firebase/stories';

interface CleanupResult {
  storyId: string;
  title: string;
  nestedArrayRemoved: boolean;
  defaultSceneAdded: boolean;
}

export async function GET(request: Request) {
  try {
    // Get the user ID from the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const storyId = searchParams.get('storyId'); // Optional specific story ID

    // If a specific story ID is provided, only process that one
    if (storyId) {
      const result = await cleanupSingleStory(storyId);
      return NextResponse.json({
        message: `Processed story ${storyId}`,
        result
      });
    }

    // Otherwise, process all stories for the user
    if (!userId) {
      return NextResponse.json({ error: 'User ID or story ID is required' }, { status: 400 });
    }

    // Get all stories for this user
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: 'No stories found for this user' });
    }

    const results: CleanupResult[] = [];
    
    // Process each story
    for (const storyDoc of querySnapshot.docs) {
      const storyId = storyDoc.id;
      results.push(await cleanupSingleStory(storyId));
    }

    return NextResponse.json({
      message: `Processed ${results.length} stories`,
      results
    });
  } catch (error) {
    console.error('Error cleaning up stories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

async function cleanupSingleStory(storyId: string): Promise<CleanupResult> {
  try {
    // Get the story document
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      throw new Error(`Story with ID ${storyId} not found`);
    }
    
    const storyData = storyDoc.data();
    const title = storyData.title || 'Untitled Story';
    
    // Clean up nested array (if any)
    const arrayRemoved = await removeNestedScenes(storyId);
    
    // Ensure the story has at least one scene
    const sceneId = await ensureStoryHasScene(storyId);
    
    return {
      storyId,
      title,
      nestedArrayRemoved: arrayRemoved,
      defaultSceneAdded: !!sceneId
    };
  } catch (error) {
    console.error(`Error processing story ${storyId}:`, error);
    return {
      storyId,
      title: 'Error processing story',
      nestedArrayRemoved: false,
      defaultSceneAdded: false
    };
  }
} 