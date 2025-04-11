import { NextResponse } from "next/server";
import { luma } from '../../lib/luma';
import crypto from "crypto";

// Helper function to check generation status
async function checkGenerationStatus(generationId: string) {
  try {
    console.log("Checking generation status for ID:", generationId);
    const generation = await luma.generations.get(generationId);
    console.log("Generation status:", generation.state);
    return generation;
  } catch (error) {
    console.error("Error checking generation status:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { prompt, aspectRatio, model, imageRef, styleRef, characterRef, modifyImageRef } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Log environment variables for debugging (without exposing sensitive info)
    console.log("API key present:", !!process.env.LUMAAI_API_KEY);
    console.log("API key length:", process.env.LUMAAI_API_KEY?.length || 0);
    
    // Configure generation options
    const generationOptions: any = {
      prompt,
      aspect_ratio: aspectRatio || "16:9",
      model: model || "photon-1",
    };

    // Add optional parameters if they exist
    if (imageRef) generationOptions.image_ref = imageRef;
    if (styleRef) generationOptions.style_ref = styleRef;
    if (characterRef) generationOptions.character_ref = characterRef;
    if (modifyImageRef) generationOptions.modify_image_ref = modifyImageRef;

    // Start the image generation
    console.log("Starting image generation with options:", generationOptions);
    
    try {
      const generation = await luma.generations.image.create(generationOptions);
      console.log("Generation started with ID:", generation.id);
      
      // Return the generation ID for client-side polling
      return NextResponse.json({ 
        id: generation.id,
        status: "dreaming",
        message: "Image generation started successfully"
      });
    } catch (error) {
      console.error("Luma API Error:", error);
      return NextResponse.json(
        { 
          error: "Luma API Error",
          details: (error as Error).message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate image",
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status of a generation
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }
    
    const generation = await checkGenerationStatus(id);
    
    // Map the generation state to our response format
    const state = generation.state === "completed" ? "completed" :
                 generation.state === "failed" ? "failed" : "processing";

    return NextResponse.json({
      id: generation.id,
      state,
      assets: generation.assets,
      failure_reason: generation.failure_reason
    });
  } catch (error) {
    console.error("Error checking generation status:", error);
    return NextResponse.json(
      { 
        error: "Failed to check generation status",
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 