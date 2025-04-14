import { NextRequest, NextResponse } from 'next/server';
import { createShotSubcollection } from '../../../../../../lib/firebase/stories';
import { firebaseAuth } from '../../../../../../lib/firebase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string; sceneId: string } }
) {
  try {
    // Get the current user's session to ensure they have access
    const currentUser = firebaseAuth?.currentUser;
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storyId, sceneId } = params;
    if (!storyId || !sceneId) {
      return NextResponse.json({ error: 'Story ID and Scene ID are required' }, { status: 400 });
    }

    // Get the shot data from the request body
    const shotData = await request.json();
    
    // Validate the request body
    if (!shotData) {
      return NextResponse.json({ error: 'Shot data is required' }, { status: 400 });
    }

    // Create the new shot
    const shotId = await createShotSubcollection(storyId, sceneId, shotData);

    // Return the created shot ID
    return NextResponse.json({ 
      id: shotId,
      message: 'Shot created successfully'
    });
  } catch (error) {
    console.error('Error creating shot:', error);
    return NextResponse.json(
      { error: 'Failed to create shot' },
      { status: 500 }
    );
  }
} 