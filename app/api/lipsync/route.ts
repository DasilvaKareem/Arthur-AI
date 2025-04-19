import { NextResponse } from "next/server";

// Validate Sync Labs configuration
if (!process.env.SYNC_LABS_API_KEY) {
  console.error("SYNC_LABS_API_KEY is not set in environment variables");
  throw new Error("SYNC_LABS_API_KEY is not configured");
}

const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;
const SYNC_LABS_API_URL = "https://api.sync.so/v2";

// Configure fetch options
const fetchOptions = {
  headers: {
    'x-api-key': SYNC_LABS_API_KEY,
    'Content-Type': 'application/json'
  }
};

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received lip sync generation request:", {
      hasVideoUrl: !!body.input?.video_url,
      hasAudioUrl: !!body.input?.audio_url
    });
    
    const { input } = body;
    
    // Validate required fields
    if (!input?.video_url) {
      throw new Error("Missing video URL for lip sync");
    }
    
    if (!input?.audio_url) {
      throw new Error("Missing audio URL for lip sync");
    }

    // Log the full request for debugging
    console.log("Sending request to Sync Labs:", {
      url: `${SYNC_LABS_API_URL}/generate`,
      videoUrl: input.video_url,
      audioUrl: input.audio_url
    });

    // Create the Sync Labs lip sync job with the new format
    const response = await fetch(`${SYNC_LABS_API_URL}/generate`, {
      ...fetchOptions,
      method: 'POST',
      body: JSON.stringify({
        model: "lipsync-1.9.0-beta",
        options: {
          output_format: "mp4"
        },
        input: [
          { type: "video", url: input.video_url },
          { type: "audio", url: input.audio_url }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sync Labs API error response:", errorText);
      throw new Error(`Sync Labs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Sync Labs job created:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating lip sync:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate lip sync",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    // Check job status with Sync Labs using the new endpoint
    const response = await fetch(`${SYNC_LABS_API_URL}/generate/${id}`, {
      ...fetchOptions,
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sync Labs status API error response:", errorText);
      throw new Error(`Sync Labs status API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Sync Labs job status:", data);

    // Map Sync Labs status to our format
    return NextResponse.json({
      status: data.status,
      outputUrl: data.outputUrl,
      error: data.error
    });
  } catch (error) {
    console.error("Error checking lip sync status:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to check job status",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Webhook endpoint to handle generation completion
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    console.log("Received webhook:", body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to handle webhook",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 