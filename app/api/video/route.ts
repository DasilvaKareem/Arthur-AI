import { NextResponse } from "next/server";
import { LumaAI } from "lumaai";
import { luma } from '../../lib/luma';

// Initialize the Luma client
const lumaAI = new LumaAI({
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
    const generation = await lumaAI.generations.get(generationId);
    console.log("Video generation status:", generation.state);
    return {
      id: generation.id,
      state: generation.state,
      assets: generation.assets,
      failure_reason: generation.failure_reason
    };
  } catch (error) {
    console.error("Error checking video generation status:", error);
    throw error;
  }
}

// Helper function to validate image URL
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    // Check if it's a valid URL
    const parsedUrl = new URL(url);
    
    // Check if the URL is accessible and returns an image
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      console.error('Image URL validation failed:', {
        status: response.status,
        statusText: response.statusText,
        contentType
      });
      return false;
    }

    // Verify it's an image
    if (!contentType?.startsWith('image/')) {
      console.error('URL does not point to an image:', {
        contentType,
        url
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating image URL:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received video generation request:", body);
    
    const { shots, prompt, duration } = body;
    
    // Validate required fields
    if (!shots || !Array.isArray(shots) || shots.length === 0) {
      return NextResponse.json(
        { error: "No shots provided" },
        { status: 400 }
      );
    }

    // Process one shot at a time
    const shot = shots[0]; // Get the first shot
    
    if (!shot.imageUrl) {
      return NextResponse.json(
        { error: "Missing image URL in shot" },
        { status: 400 }
      );
    }

    // Ensure prompt is valid and meets minimum length requirement
    const shotPrompt = shot.prompt || prompt || "Create a cinematic video";
    const cleanedPrompt = shotPrompt.trim();
    
    if (cleanedPrompt.length < 3) {
      return NextResponse.json(
        { error: "Prompt is too short, minimum length is 3 characters" },
        { status: 400 }
      );
    }

    console.log("Processing shot:", {
      imageUrl: shot.imageUrl,
      prompt: cleanedPrompt
    });

    // Log environment variables for debugging
    console.log("API key present:", !!process.env.LUMAAI_API_KEY);
    console.log("API key length:", process.env.LUMAAI_API_KEY?.length || 0);

    // Start the video generation
    try {
      const videoOptions = {
        prompt: cleanedPrompt,
        keyframes: {
          frame0: {
            type: "image" as const,
            url: shot.imageUrl
          }
        },
        model: "ray-2" as const,
        resolution: "720p" as const,
        duration: duration || "5s"
      };
      
      console.log("Starting video generation with options:", JSON.stringify(videoOptions, null, 2));
      
      const generation = await luma.generations.create(videoOptions);
      console.log("Video generation started with ID:", generation.id);
      
      return NextResponse.json({ 
        id: generation.id,
        status: "dreaming",
        message: "Video generation started successfully"
      });
    } catch (lumaError) {
      console.error("Luma API Error:", lumaError);
      return NextResponse.json(
        { 
          error: "Luma API Error",
          details: (lumaError as Error).message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating video:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate video",
        details: (error as Error).message 
      },
      { status: 500 }
    );
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