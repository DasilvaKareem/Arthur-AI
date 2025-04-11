import { NextResponse } from 'next/server';
import { luma } from '../../../lib/luma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    // Get the generation status from Luma
    const generation = await luma.generations.get(id);
    
    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // Check the generation status
    if (generation.state === "completed" && generation.assets?.video) {
      return NextResponse.json({
        status: "completed",
        videoUrl: generation.assets.video
      });
    } else if (generation.state === "failed") {
      return NextResponse.json({
        status: "failed",
        error: generation.failure_reason || "Video generation failed"
      });
    } else {
      return NextResponse.json({
        status: "processing",
        message: "Video generation in progress"
      });
    }
  } catch (error) {
    console.error("Error checking video generation status:", error);
    return NextResponse.json(
      { 
        error: "Failed to check generation status",
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 