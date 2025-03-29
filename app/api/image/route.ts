import { NextResponse } from "next/server";
import { LumaAI } from "lumaai";
import crypto from "crypto";

// Initialize the Luma client
const luma = new LumaAI({
  authToken: process.env.LUMAAI_API_KEY,
});

// Helper function to check generation status
async function checkGenerationStatus(generationId: string) {
  try {
    const generation = await luma.generations.get(generationId);
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
    
    // Configure generation options
    const generationOptions: any = {
      prompt,
    };

    // Add optional parameters if they exist
    if (aspectRatio) generationOptions.aspect_ratio = aspectRatio;
    if (model) generationOptions.model = model;
    if (imageRef) generationOptions.image_ref = imageRef;
    if (styleRef) generationOptions.style_ref = styleRef;
    if (characterRef) generationOptions.character_ref = characterRef;
    if (modifyImageRef) generationOptions.modify_image_ref = modifyImageRef;

    // Start the image generation
    console.log("Starting image generation with options:", generationOptions);
    const generation = await luma.generations.image.create(generationOptions);
    
    // Return the generation ID for client-side polling
    return NextResponse.json({ 
      id: generation.id,
      status: "dreaming",
      message: "Image generation started successfully"
    });
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
    
    return NextResponse.json({
      id: generation.id,
      state: generation.state,
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