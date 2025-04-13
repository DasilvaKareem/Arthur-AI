import { NextResponse } from 'next/server';
import { analyzeStoryStructure, migrateStoryToSubcollections } from '../../../lib/firebase/stories';

export async function GET(request: Request) {
  try {
    // Get the story ID from the query parameters
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('id');

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Analyze the story structure
    const analysis = await analyzeStoryStructure(storyId);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing story:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, migrate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    if (migrate) {
      // Perform migration
      const success = await migrateStoryToSubcollections(id);
      
      if (success) {
        // Re-analyze after migration
        const analysis = await analyzeStoryStructure(id);
        return NextResponse.json({ 
          message: 'Story successfully migrated to subcollections',
          analysis
        });
      } else {
        return NextResponse.json({ error: 'Failed to migrate story' }, { status: 500 });
      }
    } else {
      // Just analyze
      const analysis = await analyzeStoryStructure(id);
      return NextResponse.json(analysis);
    }
  } catch (error) {
    console.error('Error processing story debug request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 