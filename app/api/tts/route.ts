import { NextResponse } from "next/server";

// Validate ElevenLabs configuration
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set in environment variables");
  throw new Error("ELEVENLABS_API_KEY is not configured");
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received TTS request:", {
      text: body.text,
      voiceId: body.voiceId,
      modelId: body.modelId
    });
    
    const { text, voiceId, modelId = "eleven_multilingual_v2" } = body;
    
    // Validate required fields
    if (!text || !voiceId) {
      throw new Error("Missing text or voice ID");
    }

    // Configure generation options
    const options = {
      method: 'POST',
      headers: { 
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }),
    };

    // Start the text-to-speech generation
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate speech");
    }

    // Get the audio data as an ArrayBuffer
    const audioData = await response.arrayBuffer();
    
    // Convert ArrayBuffer to base64
    const base64Audio = Buffer.from(audioData).toString('base64');
    
    return NextResponse.json({ 
      audio: base64Audio,
      status: "completed",
      message: "Speech generated successfully"
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate speech",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 