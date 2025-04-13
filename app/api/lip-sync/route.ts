import { NextResponse } from "next/server";

// Validate Sync Labs configuration
if (!process.env.SYNC_LABS_API_KEY) {
  console.error("SYNC_LABS_API_KEY is not set in environment variables");
  throw new Error("SYNC_LABS_API_KEY is not configured");
}

const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;
const SYNC_LABS_API_URL = "https://api.sync-labs.com/sync";
const SYNC_LABS_POLL_INTERVAL = 5000; // 5 seconds

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received lip sync generation request:", {
      videoUrl: body.videoUrl ? "provided" : "missing",
      audioUrl: body.audioUrl ? "provided" : "missing",
    });
    
    const { videoUrl, audioUrl } = body;
    
    // Validate required fields
    if (!videoUrl) {
      throw new Error("Missing video URL for lip sync");
    }
    
    if (!audioUrl) {
      throw new Error("Missing audio URL for lip sync");
    }

    // Create the Sync Labs lip sync job
    const syncJob = await createSyncLabsJob(videoUrl, audioUrl);
    
    if (!syncJob?.id) {
      throw new Error("Failed to create Sync Labs job");
    }
    
    // Poll for job completion
    const result = await pollForCompletion(syncJob.id);
    
    return NextResponse.json({
      status: "completed",
      syncJobId: syncJob.id,
      lipSyncVideoUrl: result.outputUrl,
      message: "Lip sync generated successfully"
    });
  } catch (error) {
    console.error("Error generating lip sync:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate lip sync",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Create a new lip sync job with Sync Labs
 */
async function createSyncLabsJob(videoUrl: string, audioUrl: string) {
  try {
    const response = await fetch(SYNC_LABS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SYNC_LABS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        video_url: videoUrl,
        webhook_url: null // We'll poll for completion instead of using webhooks
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync Labs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating Sync Labs job:", error);
    throw error;
  }
}

/**
 * Poll for job completion with exponential backoff
 */
async function pollForCompletion(jobId: string, maxAttempts = 60) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch(`${SYNC_LABS_API_URL}/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SYNC_LABS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync Labs status API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Check job status
      if (data.status === 'completed') {
        return {
          status: 'completed',
          outputUrl: data.output_url
        };
      } else if (data.status === 'failed') {
        throw new Error(`Sync Labs job failed: ${data.error || 'Unknown error'}`);
      }
      
      // Log progress
      console.log(`Sync Labs job ${jobId} status: ${data.status}, attempt ${attempts}/${maxAttempts}`);
      
      // Wait before polling again, with exponential backoff
      const waitTime = Math.min(SYNC_LABS_POLL_INTERVAL * Math.pow(1.2, attempts - 1), 30000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    } catch (error) {
      console.error(`Error polling Sync Labs job ${jobId}:`, error);
      // Don't throw, just continue polling
      await new Promise(resolve => setTimeout(resolve, SYNC_LABS_POLL_INTERVAL));
    }
  }
  
  throw new Error(`Sync Labs job ${jobId} timed out after ${maxAttempts} attempts`);
} 