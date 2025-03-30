import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "crypto";
import { promisify } from "util";
import { exec } from "child_process";
import fs from "fs/promises";

const execAsync = promisify(exec);

// In-memory store for video generation jobs
const VIDEO_JOBS = new Map();

export async function POST(req: Request) {
  try {
    const { shots, title, style } = await req.json();
    
    if (!shots || !Array.isArray(shots) || shots.length === 0) {
      return NextResponse.json({ error: "Shots array is required" }, { status: 400 });
    }

    // Check if all shots have image URLs
    const missingImages = shots.some(shot => !shot.imageUrl);
    if (missingImages) {
      return NextResponse.json({ error: "All shots must have image URLs" }, { status: 400 });
    }

    // Generate a unique job ID
    const jobId = uuidv4();
    
    // Store the job in memory
    VIDEO_JOBS.set(jobId, {
      id: jobId,
      title: title || "Scene Video",
      style: style || "hyperrealistic",
      shots,
      state: "pending",
      videoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Start the video generation process in the background
    generateSceneVideo(jobId).catch(error => {
      console.error(`Error generating scene video for job ${jobId}:`, error);
      const job = VIDEO_JOBS.get(jobId);
      if (job) {
        job.state = "failed";
        job.failure_reason = error.message || "Unknown error";
        job.updatedAt = new Date();
        VIDEO_JOBS.set(jobId, job);
      }
    });
    
    return NextResponse.json({ id: jobId, message: "Scene video generation started" });
  } catch (error) {
    console.error("Error processing scene video request:", error);
    return NextResponse.json(
      { error: "Failed to start scene video generation", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("id");
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }
    
    const job = VIDEO_JOBS.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    
    return NextResponse.json(job);
  } catch (error) {
    console.error("Error checking scene video status:", error);
    return NextResponse.json(
      { error: "Failed to check scene video status", details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function generateSceneVideo(jobId: string) {
  const job = VIDEO_JOBS.get(jobId);
  if (!job) {
    throw new Error("Job not found");
  }
  
  try {
    job.state = "in_progress";
    job.updatedAt = new Date();
    VIDEO_JOBS.set(jobId, job);
    
    // Create a temporary directory for this job
    const jobDir = path.join(process.cwd(), "tmp", "scene-videos", jobId);
    await mkdir(jobDir, { recursive: true });
    
    // First, generate individual videos for each shot
    const shotVideos = [];
    for (let i = 0; i < job.shots.length; i++) {
      const shot = job.shots[i];
      
      // We'll simulate video generation here by just using the image URL
      // In a real implementation, you would call your video generation API
      // For now, we'll just create a text file with the image URL
      const shotVideoPath = path.join(jobDir, `shot-${i+1}.txt`);
      await fs.writeFile(shotVideoPath, `Video for shot ${i+1} - ${shot.imageUrl}`);
      
      shotVideos.push(shotVideoPath);
    }
    
    // Combine the videos (simulated)
    const finalVideoPath = path.join(jobDir, "final.mp4");
    await fs.writeFile(finalVideoPath, `Combined video for ${job.title}`);
    
    // In a real implementation, you would use FFmpeg to combine the videos
    // const ffmpegCommands = shotVideos.map(video => `file '${video}'`).join("\n");
    // const listFile = path.join(jobDir, "videos.txt");
    // await fs.writeFile(listFile, ffmpegCommands);
    // await execAsync(`ffmpeg -f concat -safe 0 -i ${listFile} -c copy ${finalVideoPath}`);
    
    // For now, we'll simulate a delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Generate a URL for the final video
    // In a real implementation, you would upload the video to a cloud storage provider
    const videoUrl = `https://example.com/videos/${jobId}/final.mp4`;
    
    // Update the job with the completed state
    job.state = "completed";
    job.videoUrl = videoUrl;
    job.updatedAt = new Date();
    VIDEO_JOBS.set(jobId, job);
    
    return videoUrl;
  } catch (error) {
    console.error(`Error generating scene video for job ${jobId}:`, error);
    job.state = "failed";
    job.failure_reason = (error as Error).message || "Unknown error";
    job.updatedAt = new Date();
    VIDEO_JOBS.set(jobId, job);
    throw error;
  }
} 