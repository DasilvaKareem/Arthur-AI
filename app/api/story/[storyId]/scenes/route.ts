import { NextRequest, NextResponse } from 'next/server';
import { getStoryWithSubcollections } from '../../../../lib/firebase/stories';
import { firebaseAuth } from '../../../../lib/firebase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    // Get the current user's session to ensure they have access
    const currentUser = firebaseAuth?.currentUser;
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = params;
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Fetch the story with all scenes
    const story = await getStoryWithSubcollections(storyId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Return only the scenes array
    return NextResponse.json({ 
      scenes: story.scenes || [] 
    });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 }
    );
  }
} 