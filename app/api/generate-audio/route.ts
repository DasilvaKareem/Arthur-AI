import { NextResponse } from "next/server";

// Validate ElevenLabs configuration
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set in environment variables");
  throw new Error("ELEVENLABS_API_KEY is not configured");
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_LABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received audio generation request:", {
      text: body.text ? "provided" : "missing",
      voiceId: body.voiceId || "default",
    });
    
    const { text, voiceId } = body;
    
    // Validate required fields
    if (!text || text.trim() === "") {
      throw new Error("Missing or empty text for audio generation");
    }
    
    // Use a default voice if not provided
    const selectedVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default voice (Rachel)
    
    // Generate audio with ElevenLabs
    const audioData = await generateAudio(text, selectedVoiceId);
    
    return NextResponse.json({
      status: "completed",
      audioUrl: audioData.audioUrl,
      message: "Audio generated successfully"
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate audio",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Generate audio with ElevenLabs
 */
async function generateAudio(text: string, voiceId: string) {
  try {
    const response = await fetch(`${ELEVEN_LABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ELEVENLABS_API_KEY}`,
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // The response is an audio file blob
    const audioBlob = await response.blob();
    
    // Convert blob to data URL for server-side usage
    const audioUrl = await blobToDataURL(audioBlob);
    
    return {
      status: "completed",
      audioUrl
    };
  } catch (error) {
    console.error("Error generating audio with ElevenLabs:", error);
    throw error;
  }
}

// Helper function to convert blob to data URL (for demo purposes)
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 