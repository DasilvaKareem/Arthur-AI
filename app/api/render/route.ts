import { NextResponse } from 'next/server';
// Temporarily disable Remotion imports to fix build
// import { renderMediaOnLambda } from '@remotion/lambda/client';
// import { getFunctions } from '@remotion/lambda/client';
// import { setupLambda } from '../../lib/remotion/setup';
// import { updateShotSubcollection } from '../../lib/firebase/stories';

// Mocked version for build
export async function POST(request: Request) {
  try {
    const {
      storyId,
      sceneId,
      composition,
      title,
      shots,
    } = await request.json();
    
    // Return mock response
    return NextResponse.json({
      id: `mock-render-id-${Date.now()}`,
      bucketName: 'mock-bucket',
      region: 'us-east-1',
    });
  } catch (error) {
    console.error('Error initiating rendering:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle status check requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const renderId = searchParams.get('id');
    
    if (!renderId) {
      return NextResponse.json(
        { error: 'Missing render ID' },
        { status: 400 }
      );
    }
    
    // Return mock response
    // Randomly pick a status for demo purposes
    const statuses = ['in-progress', 'done'];
    const mockStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    if (mockStatus === 'done') {
      return NextResponse.json({
        status: 'done',
        url: 'https://example.com/mock-video.mp4',
        renderId,
      });
    } else {
      return NextResponse.json({
        status: 'in-progress',
        progress: Math.floor(Math.random() * 100),
        renderId,
      });
    }
  } catch (error) {
    console.error('Error checking render status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 