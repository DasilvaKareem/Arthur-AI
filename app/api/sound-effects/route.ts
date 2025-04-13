import { NextResponse } from "next/server";

// Validate ElevenLabs configuration
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set in environment variables");
  throw new Error("ELEVENLABS_API_KEY is not configured");
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Default voice for sound effects - using a deep male voice for most sound effects
const DEFAULT_SOUND_EFFECTS_VOICE = "ErXwobaYiN019PkySvjV"; // Antoni

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received sound effects generation request:", {
      description: body.description,
      voiceId: body.voiceId || DEFAULT_SOUND_EFFECTS_VOICE
    });
    
    const { description, voiceId = DEFAULT_SOUND_EFFECTS_VOICE } = body;
    
    // Validate required fields
    if (!description) {
      throw new Error("Missing sound effects description");
    }

    // Process the sound effects description to make it more like audio instructions
    // For example, turn "birds chirping" into "Birds are chirping loudly in the background"
    const processedPrompt = processSoundEffectsDescription(description);

    // Configure generation options with specific settings for sound effects
    // - Higher stability for more consistent sound
    // - Lower similarity boost to make it more expressive
    const options = {
      method: 'POST',
      headers: { 
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: processedPrompt,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.5
        }
      }),
    };

    // Start the text-to-speech generation
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate sound effects audio");
    }

    // Get the audio data as an ArrayBuffer
    const audioData = await response.arrayBuffer();
    
    // Convert ArrayBuffer to base64
    const base64Audio = Buffer.from(audioData).toString('base64');
    
    return NextResponse.json({ 
      audio: base64Audio,
      processedPrompt,
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

// Function to process sound effects descriptions into better audio prompts
function processSoundEffectsDescription(description: string): string {
  // Split the description by commas, new lines, or semicolons
  const effectParts = description.split(/[,;\n]+/).map(part => part.trim()).filter(Boolean);
  
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