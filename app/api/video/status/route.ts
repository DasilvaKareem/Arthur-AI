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

    // Log that we're checking status
    console.log(`Checking video generation status for ID: ${id}`);

    // Get the generation status from Luma
    try {
      const generation = await luma.generations.get(id);
      
      if (!generation) {
        console.error(`Generation not found for ID: ${id}`);
        return NextResponse.json(
          { error: "Generation not found" },
          { status: 404 }
        );
      }

      console.log(`Video generation state: ${generation.state}, ID: ${id}`);

      // Check the generation status
      if (generation.state === "completed" && generation.assets?.video) {
        console.log(`Video generation completed, URL: ${generation.assets.video}`);
        return NextResponse.json({
          status: "completed",
          videoUrl: generation.assets.video
        });
      } else if (generation.state === "failed") {
        console.error(`Video generation failed, reason: ${generation.failure_reason || "Unknown"}`);
        return NextResponse.json({
          status: "failed",
          error: generation.failure_reason || "Video generation failed"
        });
      } else {
        // Still processing
        return NextResponse.json({
          status: "processing",
          message: `Video generation in progress (state: ${generation.state})`
        });
      }
    } catch (lumaError) {
      console.error("Error fetching generation status from Luma:", lumaError);
      return NextResponse.json(
        { 
          error: "Failed to check generation status from Luma API",
          details: (lumaError as Error).message 
        },
        { status: 500 }
      );
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