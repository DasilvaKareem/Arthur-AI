import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { getAdminDb } from "../../lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
import type { Shot, Scene, Story } from '../../../types/shared';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize Gemini client with debug logging
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
console.log("🔑 Gemini API Key available:", !!geminiApiKey);
console.log("🔑 Gemini API Key length:", geminiApiKey?.length || 0);
console.log("🔑 Gemini API Key first 4 chars:", geminiApiKey?.slice(0, 4) || "none");

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : undefined;
console.log("🤖 Gemini client initialized:", !!genAI);

interface Message {
  role: string;
  content: string;
}

interface Chunk {
  id: string;
  fileName: string;
  snippet: string;
  score: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Simple keyword extractor
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  const words = text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 0);
    
  // Use Array.from to convert Set to array
  return Array.from(new Set(words));
}

function formatStoryToJson(script: string, userId: string): Story {
  // Split the script into scenes
  const scenes = script.split(/\n\n+/).map((sceneText, sceneIndex) => {
    // Extract scene heading
    const headingMatch = sceneText.match(/^SCENE\s+(\d+):\s+(.+)$/m);
    const locationMatch = sceneText.match(/INT\.|EXT\.\s+(.*?)\s+-/);
    
    // Extract scene description
    const descriptionMatch = sceneText.match(/Description:\n(.*?)(?=\n\n|$)/s);
    const lightingMatch = sceneText.match(/Lighting:\n(.*?)(?=\n\n|$)/s);
    const weatherMatch = sceneText.match(/Weather:\n(.*?)(?=\n\n|$)/s);
    
    // Parse shots
    const shotSections = sceneText.split(/(?=SHOT:|CLOSE-UP:|TRACKING SHOT:|WIDE SHOT:)/);
    const shots = shotSections.map((shotSection, shotIndex) => {
      if (!shotSection.trim()) return null;
      
      const shot: Shot = {
        id: `shot-${shotIndex + 1}`,
        type: "ESTABLISHING SHOT",
        description: "",
        hasNarration: false,
        hasDialogue: false,
        hasSoundEffects: false,
        prompt: ""
      };

      // Extract shot type
      const typeMatch = shotSection.match(/^(SHOT|CLOSE-UP|TRACKING SHOT|WIDE SHOT):/);
      if (typeMatch) {
        shot.type = typeMatch[1];
      }

      // Extract shot description
      const descriptionMatch = shotSection.match(/Description:\n(.*?)(?=\n\n|$)/s);
      if (descriptionMatch) {
        shot.description = descriptionMatch[1].trim();
        shot.prompt = shot.description;
      }

      // Extract narration
      const narrationMatch = shotSection.match(/Narration:\n(.*?)(?=\n\n|$)/s);
      if (narrationMatch) {
        shot.hasNarration = true;
        shot.narration = narrationMatch[1].trim();
      }

      // Extract dialogue
      const dialogueMatch = shotSection.match(/Dialogue:\n(.*?)(?=\n\n|$)/s);
      if (dialogueMatch) {
        shot.hasDialogue = true;
        shot.dialogue = dialogueMatch[1].trim();
      }

      // Extract sound effects
      const soundMatch = shotSection.match(/Sound Effects:\n(.*?)(?=\n\n|$)/s);
      if (soundMatch) {
        shot.hasSoundEffects = true;
        shot.soundEffects = soundMatch[1].trim();
      }

      return shot;
    }).filter((shot): shot is Shot => shot !== null);

    return {
      id: `scene-${sceneIndex + 1}`,
      title: headingMatch ? headingMatch[2] : `SCENE ${sceneIndex + 1}`,
      location: locationMatch ? locationMatch[1] : "",
      description: descriptionMatch ? descriptionMatch[1].trim() : "",
      lighting: lightingMatch ? lightingMatch[1].trim() : "",
      weather: weatherMatch ? weatherMatch[1].trim() : "",
      style: "hyperrealistic",
      shots: shots
    };
  });

  return {
    id: crypto.randomUUID(),
    title: script.split('\n')[0].trim() || "Untitled Story",
    description: script.split('\n')[0].trim() || "Untitled Story",
    script: script,
    scenes: scenes,
    userId: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Main POST request handler
export async function POST(req: Request) {
  try {
    // Extract data from the request body
    const { messages, model, knowledgeBaseId, userId } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }
    
    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      return NextResponse.json({ error: "No message content found" }, { status: 400 });
    }

    console.log("📝 Request details:", {
      model,
      userId,
      knowledgeBaseId,
      messageCount: messages.length,
      latestMessageLength: latestMessage.length
    });

    // Timing for performance monitoring
    const startTime = new Date();
    console.log(`⏱️ [${startTime.toISOString()}] User Input Received: 0.00s`);

    // Initialize variables for story creation context
    let isRagWorking = false;

    // System prompt for script generation
    const systemPrompt = `You are a professional scriptwriter for film, animation, and games. When generating a script, you MUST follow this exact format:

1. Start with a title on the first line
2. Each scene MUST begin with "SCENE X: [Scene Title]" followed by "INT." or "EXT." location
3. Each scene MUST include these sections:
   - Description:
   - Lighting:
   - Weather:
4. Each shot MUST be marked with "SHOT:", "CLOSE-UP:", "TRACKING SHOT:", or "WIDE SHOT:"
5. Each shot MUST include:
   - Description:
   - Dialogue: (if there is dialogue)
   - Narration: (if there is narration)
   - Sound Effects: (if there are sound effects)

Example format:
SCENE 1: Opening Scene
INT. COFFEE SHOP - DAY
Description: A cozy coffee shop with warm lighting
Lighting: Soft, warm lighting from vintage bulbs
Weather: Sunny day visible through windows

SHOT:
Description: Wide shot of the coffee shop interior
Dialogue: "Welcome to our little corner of heaven."
Sound Effects: Coffee machine hissing

CLOSE-UP:
Description: Barista's hands pouring coffee
Narration: "The perfect cup of coffee, crafted with care."

Always maintain this exact format for proper parsing.`;

    // Format messages for API
    const formattedMessages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt
      },
      ...messages.map((msg: Message) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }))
    ];

    // If we have a knowledge base ID, try to get the story directly from Firebase first
    if (knowledgeBaseId && knowledgeBaseId !== 'none') {
      try {
        console.log("🔍 Querying Firebase for story:", knowledgeBaseId);
        const firestore = await getAdminDb();
        
        if (firestore) {
          const storyDoc = await firestore.collection('stories').doc(knowledgeBaseId).get();
          
          if (storyDoc.exists) {
            console.log("✅ Found story in Firebase");
            const storyData = storyDoc.data() as Story | undefined;
            
            if (storyData) {
              // Format the response to match our expected structure
              const responseData = {
                id: storyDoc.id,
                response: `🎬 Story Breakdown:\n\n📝 Title: ${storyData.title || 'Untitled'}\n\n${storyData.script || ''}`,
                thinking: "Retrieved story from database",
                user_mood: "positive",
                suggested_questions: [
                  "How does this scene continue?",
                  "Can you add more dialogue?",
                  "What happens in the next scene?"
                ],
                debug: {
                  context_used: true,
                  hasScriptFormat: true,
                  hasStoryJson: true
                },
                can_generate_project: true,
                story_json: storyData
              };
              
              return NextResponse.json(responseData);
            }
          } else {
            console.log("⚠️ Story not found in Firebase");
          }
        }
      } catch (error: unknown) {
        console.error("❌ Firebase query error:", error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // If we don't have a story in Firebase or the query failed, proceed with model generation
    let response;
    if ((model === "gemini-pro" || model === "gemini-pro-vision") && genAI) {
      try {
        const modelInstance = genAI.getGenerativeModel({ model: model });
        const result = await modelInstance.generateContent({
          contents: formattedMessages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          }))
        });
        
        const responseText = result.response.text();
        if (!responseText) {
          throw new Error("No response from Gemini");
        }
        
        response = {
          choices: [{
            message: {
              content: responseText
            }
          }]
        };
      } catch (error: unknown) {
        console.error("❌ Gemini API error:", error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    } else {
      try {
        response = await groq.chat.completions.create({
          model: "llama3-8b-8192",
          messages: formattedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 1000,
          temperature: 0.3,
        });
      } catch (error: unknown) {
        console.error("❌ Groq API error:", error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }

    if (!response?.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: "No response from AI model" }, { status: 500 });
    }

    const story = formatStoryToJson(response.choices[0].message.content, userId);
    if (!story) {
      return NextResponse.json({ error: "Failed to format story" }, { status: 500 });
    }

    // Format the response
    const responseData = {
      id: story.id,
      response: `🎬 Story Breakdown:\n\n📝 Title: ${story.title}\n\n${story.script}`,
      thinking: "Generated story using AI",
      user_mood: "positive",
      suggested_questions: [
        "How does this scene continue?",
        "Can you add more dialogue?",
        "What happens in the next scene?"
      ],
      debug: {
        context_used: false,
        hasScriptFormat: true,
        hasStoryJson: true
      },
      can_generate_project: true,
      story_json: story
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("❌ General error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
