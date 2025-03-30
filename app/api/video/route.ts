import { NextResponse } from "next/server";
import { LumaAI } from "lumaai";
import crypto from "crypto";

// Initialize the Luma client
const luma = new LumaAI({
  authToken: process.env.LUMAAI_API_KEY,
});

// Validate LumaAI configuration
if (!process.env.LUMAAI_API_KEY) {
  console.error("LUMAAI_API_KEY is not set in environment variables");
  throw new Error("LUMAAI_API_KEY is not configured");
}

// Helper function to check generation status
async function checkGenerationStatus(generationId: string) {
  try {
    console.log("Checking video generation status for ID:", generationId);
    const generation = await luma.generations.get(generationId);
    console.log("Video generation status:", generation.state);
    return generation;
  } catch (error) {
    console.error("Error checking video generation status:", error);
    throw error;
  }
}

// Helper function to validate image URL
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error("Error validating image URL:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received video generation request:", {
      hasShots: !!body.shots,
      shotsCount: body.shots?.length,
      style: body.style,
      prompt: body.prompt,
      duration: body.duration
    });
    
    const { shots, prompt, style, duration } = body;
    
    // Validate required fields
    if (!shots || !Array.isArray(shots) || shots.length === 0) {
      throw new Error("No shots provided");
    }

    // Validate each shot
    for (const shot of shots) {
      if (!shot.imageUrl) {
        throw new Error("Missing image URL in shot");
      }
      if (!shot.prompt) {
        throw new Error("Missing prompt in shot");
      }
    }

    // Configure generation options
    const generationOptions = {
      model: "ray-2" as const,
      mode: "video" as const,
      image: shots[0].imageUrl, // Primary image
      prompt: prompt || "Create a cinematic video",
      negative_prompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy, bad proportions",
      steps: 50,
      seed: Math.floor(Math.random() * 1000000),
      cfg_scale: 7.5,
      motion_bucket_id: 127,
      crf: 20
    };

    console.log("Starting video generation with options:", {
      model: generationOptions.model,
      mode: generationOptions.mode,
      image: generationOptions.image,
      prompt: generationOptions.prompt,
      steps: generationOptions.steps,
      cfg_scale: generationOptions.cfg_scale,
      motion_bucket_id: generationOptions.motion_bucket_id
    });
    
    // Start the video generation with retries
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        console.log("Attempting video generation with options:", JSON.stringify(generationOptions, null, 2));
        const generation = await luma.generations.create(generationOptions);
        console.log("Video generation started with ID:", generation.id);
        
        return NextResponse.json({ 
          id: generation.id,
          status: "processing",
          message: "Video generation started successfully"
        });
      } catch (error) {
        lastError = error;
        console.error(`Video generation attempt ${4 - retries} failed:`, error);
        console.error("Full error details:", JSON.stringify(error, null, 2));
        retries--;
        if (retries > 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // If all retries failed, throw the last error
    throw lastError;
  } catch (error) {
    console.error("Error generating video:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate video",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get('id');
    
    if (!generationId) {
      return NextResponse.json({ error: "No generation ID provided" }, { status: 400 });
    }

    const generation = await checkGenerationStatus(generationId);
    return NextResponse.json(generation);
  } catch (error) {
    console.error("Error checking video generation status:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to check video generation status",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 