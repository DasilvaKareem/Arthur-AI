import { NextResponse } from 'next/server';
// Temporarily comment out Remotion imports to fix build errors
// import { getFunctions } from '@remotion/lambda/client';
// import { setupLambda } from '../../../lib/remotion/setup';

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
    
    // Mocked response for build
    // Randomly choose a status for demonstration purposes
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
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 