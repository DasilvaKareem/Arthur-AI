import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

// Validate ElevenLabs configuration
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set in environment variables");
  throw new Error("ELEVENLABS_API_KEY is not configured");
}

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

// Default voice for sound effects - using a deep male voice for most sound effects
const DEFAULT_SOUND_EFFECTS_VOICE = "ErXwobaYiN019PkySvjV"; // Antoni

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received sound effects generation request:", {
      prompt: body.prompt
    });
    
    const { prompt } = body;
    
    // Validate required fields
    if (!prompt) {
      throw new Error("Missing sound effects prompt");
    }

    // Process the sound effects prompt to make it more descriptive
    const processedPrompt = processSoundEffectsPrompt(prompt);
    console.log("Processed sound effects prompt:", processedPrompt);

    // Make a direct fetch call to the sound effects endpoint
    const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: processedPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sound effects generation failed:", {
        status: response.status,
        error: errorText
      });
      throw new Error(`Failed to generate sound effects: ${errorText}`);
    }

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    // Convert to base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({ 
      audio: base64Audio,
      prompt: processedPrompt,
      status: "completed",
      message: "Sound effects generated successfully"
    });
  } catch (error) {
    console.error("Error generating sound effects:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate sound effects",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Function to process sound effects prompts into better audio instructions
function processSoundEffectsPrompt(prompt: string): string {
  // Split the prompt by commas, new lines, or semicolons
  const effectParts = prompt.split(/[,;\n]+/).map(part => part.trim()).filter(Boolean);
  
  // Process each effect and combine with pauses
  const processedEffects = effectParts.map(effect => {
    // Check for common sound effects patterns and enhance them
    if (/birds?|chirping/i.test(effect)) {
      return `[Sound of birds chirping in the background. ${effect}]`;
    } else if (/rain|thunder|storm/i.test(effect)) {
      return `[Sound of ${effect} pouring down heavily.]`;
    } else if (/footsteps|walking|running/i.test(effect)) {
      return `[Sound of ${effect} getting louder and then fading away.]`;
    } else if (/door|closing|opening|slam/i.test(effect)) {
      return `[Sound of a ${effect} with a distinct echo.]`;
    } else if (/wind|breeze|blowing/i.test(effect)) {
      return `[Sound of ${effect} whistling through the scene.]`;
    } else if (/music|melody|tune/i.test(effect)) {
      return `[${effect} playing softly in the background.]`;
    } else if (/explosion|blast|bang/i.test(effect)) {
      return `[A loud ${effect} followed by ringing silence.]`;
    } else if (/car|engine|vehicle/i.test(effect)) {
      return `[Sound of ${effect} revving and moving past.]`;
    } else if (/water|splash|drip/i.test(effect)) {
      return `[Sound of ${effect} with gentle flowing water.]`;
    } else if (/animal|creature|growl|roar/i.test(effect)) {
      return `[${effect} sounds approaching and then receding.]`;
    } else {
      // Generic fallback for other effects
      return `[Sound of ${effect}.]`;
    }
  });
  
  // Join all effects with pauses
  return processedEffects.join("\n\n");
} 