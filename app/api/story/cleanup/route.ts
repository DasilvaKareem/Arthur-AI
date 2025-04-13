import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase/client';
import { analyzeStoryStructure, migrateStoryToSubcollections, removeNestedScenes, ensureStoryHasScene } from '../../../lib/firebase/stories';

interface CleanupResult {
  storyId: string;
  title: string;
  hadNestedScenes: boolean;
  hadSubcollectionScenes: boolean;
  migrationStatus: 'success' | 'failed' | 'not_needed';
  nestedArrayRemoved: boolean;
  defaultSceneAdded: boolean;
}

export async function GET(request: Request) {
  try {
    // Get the user ID from the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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
      const storyData = storyDoc.data();
      const title = storyData.title || 'Untitled Story';
      
      try {
        // Analyze the story structure
        const analysis = await analyzeStoryStructure(storyId);
        
        const result: CleanupResult = {
          storyId,
          title,
          hadNestedScenes: analysis.structure.hasNestedScenes,
          hadSubcollectionScenes: analysis.structure.hasSubcollectionScenes,
          migrationStatus: 'not_needed',
          nestedArrayRemoved: false,
          defaultSceneAdded: false
        };
        
        // If needed, migrate nested scenes to subcollections
        if (analysis.structure.hasNestedScenes) {
          const success = await migrateStoryToSubcollections(storyId);
          result.migrationStatus = success ? 'success' : 'failed';
        }
        
        // Always clean up nested array
        const arrayRemoved = await removeNestedScenes(storyId);
        result.nestedArrayRemoved = arrayRemoved;
        
        // Ensure the story has at least one scene
        if (!analysis.structure.hasSubcollectionScenes) {
          const sceneId = await ensureStoryHasScene(storyId);
          result.defaultSceneAdded = !!sceneId;
        }
        
        results.push(result);
      } catch (error) {
        console.error(`Error processing story ${storyId}:`, error);
        results.push({
          storyId,
          title,
          hadNestedScenes: false,
          hadSubcollectionScenes: false,
          migrationStatus: 'failed',
          nestedArrayRemoved: false,
          defaultSceneAdded: false
        });
      }
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