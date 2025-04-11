import { NextResponse } from "next/server";
import { spawn } from "child_process";

// Helper function to validate image URL
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error("Error validating image URL:", error);
    return false;
  }
}

// Helper function to run MCP command
async function runMcpCommand(imageUrl: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('uv', [
      'run',
      '--project',
      '/path/to/your/luma-ai-mcp-server',
      '-m',
      'luma_ai_mcp_server',
      '--',
      '--image',
      imageUrl,
      '--prompt',
      prompt
    ]);

    let output = '';
    let errorOutput = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mcpProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`MCP process failed with code ${code}: ${errorOutput}`));
      }
    });
  });
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received MCP video generation request:", {
      hasShots: !!body.shots,
      shotsCount: body.shots?.length,
      style: body.style,
      prompt: body.prompt,
      duration: body.duration
    });
    
    const { shots, prompt, style } = body;
    
    // Validate required fields
    if (!shots || !Array.isArray(shots) || shots.length === 0) {
      throw new Error("No shots provided");
    }

    // Validate each shot has a valid image URL
    for (const shot of shots) {
      if (!shot.imageUrl) {
        throw new Error("Missing image URL in shot");
      }
      if (!shot.prompt) {
        throw new Error("Missing prompt in shot");
      }
      // Validate image URL is accessible
      const isValid = await validateImageUrl(shot.imageUrl);
      if (!isValid) {
        throw new Error(`Invalid or inaccessible image URL: ${shot.imageUrl}`);
      }
    }

    // Process one shot at a time
    const shot = shots[0]; // Get the first shot
    console.log("Processing shot with MCP:", {
      imageUrl: shot.imageUrl,
      prompt: shot.prompt
    });

    try {
      // Run MCP command for video generation
      const result = await runMcpCommand(shot.imageUrl, shot.prompt || prompt || "Create a cinematic video");
      
      // Parse the result to get video URL
      const videoUrl = result; // Adjust this based on your MCP server's output format
      
      return NextResponse.json({ 
        status: "completed",
        assets: {
          video: videoUrl
        },
        remainingShots: shots.length - 1
      });
    } catch (error) {
      console.error("MCP video generation failed:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in MCP video generation:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate video",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url');
    
    if (!videoUrl) {
      return NextResponse.json({ error: "No video URL provided" }, { status: 400 });
    }

    // Check if the video is accessible
    const isValid = await validateImageUrl(videoUrl);
    if (!isValid) {
      throw new Error("Video URL is not accessible");
    }

    return NextResponse.json({
      status: "completed",
      assets: {
        video: videoUrl
      }
    });
  } catch (error) {
    console.error("Error checking video status:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to check video status",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 