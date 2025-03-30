import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { script, style, duration } = await req.json();
    
    if (!script) {
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    // Call the FastAPI backend
    const response = await fetch("http://localhost:8000/generate-shots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        story_text: script,
        video_length_minutes: duration || 1.0,
        style: style || "hyperrealistic"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { 
          error: "Failed to generate shots",
          details: errorData.detail || "Unknown error" 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({ 
      message: "Shots generated successfully",
      shots: data.shots
    });
  } catch (error) {
    console.error("Error generating shots:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate shots",
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 