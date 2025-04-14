import { NextResponse } from 'next/server';
import { removeNestedScenes, ensureStoryHasScene } from '../../../lib/firebase/stories';

export async function GET(request: Request) {
  try {
    // Get the story ID from the query parameters
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    console.log(`Fixing structure for story: ${storyId}`);

    // First, remove any nested scenes array (if it exists)
    const nestedRemoved = await removeNestedScenes(storyId);
    console.log(`Nested scenes removed: ${nestedRemoved}`);

    // Then ensure the story has at least one scene
    const sceneId = await ensureStoryHasScene(storyId);
    console.log(`Ensured story has scene, sceneId: ${sceneId || 'none created (scenes already exist)'}`);

    return NextResponse.json({
      message: 'Story structure fixed successfully',
      storyId,
      changes: {
        nestedRemoved,
        ensuredScene: !!sceneId
      }
    });
  } catch (error) {
    console.error('Error fixing story structure:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 