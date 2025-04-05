import { NextResponse } from "next/server";

// Validate Sync Labs configuration
if (!process.env.SYNC_LABS_API_KEY) {
  console.error("SYNC_LABS_API_KEY is not set in environment variables");
  throw new Error("SYNC_LABS_API_KEY is not configured");
}

const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received lip sync request:", {
      videoUrl: body.videoUrl,
      audioUrl: body.audioUrl,
      outputFormat: body.outputFormat
    });
    
    const { videoUrl, audioUrl, outputFormat = "mp4" } = body;
    
    // Validate required fields
    if (!videoUrl || !audioUrl) {
      throw new Error("Missing video or audio URL");
    }

    // Configure generation options
    const options = {
      method: 'POST',
      headers: { 
        'x-api-key': SYNC_LABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'lipsync-1.9.0-beta',
        input: [
          {
            type: 'video',
            url: videoUrl,
          },
          {
            type: 'audio',
            url: audioUrl,
          },
        ],
        options: { output_format: outputFormat },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/lipsync/webhook`,
      }),
    };

    // Start the lip sync generation
    const response = await fetch('https://api.sync.so/v2/generate', options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to start lip sync generation");
    }

    const data = await response.json();
    console.log("Lip sync generation started with ID:", data.id);
    
    return NextResponse.json({ 
      id: data.id,
      status: "processing",
      message: "Lip sync generation started successfully"
    });
  } catch (error) {
    console.error("Error generating lip sync:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate lip sync",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Webhook endpoint to handle generation completion
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    console.log("Received lip sync webhook:", body);

    // Handle the webhook data
    // You can update your database or trigger other actions here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling lip sync webhook:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to handle webhook",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 