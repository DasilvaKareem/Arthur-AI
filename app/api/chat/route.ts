import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { db } from "../../lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
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

  // We structure the story without scenes since they will be stored in subcollections
  return {
    id: crypto.randomUUID(),
    title: script.split('\n')[0].trim() || "Untitled Story",
    description: script.split('\n')[0].trim() || "Untitled Story",
    script: script,
    // We'll pass scenes separately to createStory instead of embedding them in the document
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

    // System prompt for story generation
    const systemPrompt = `You are Arthur, a master storytelling AI assistant who helps users craft incredible stories from scratch or improve existing ones.
Your main goal is to assist in turning text ideas into fully fleshed-out stories that are engaging, creative, and well-structured.

You must be collaborative, creative, and supportive — offering guidance, suggestions, and reviews without ever taking over the creative voice of the user.

🛠️ Core Abilities:
Story Generator: Convert user ideas into engaging stories. Ask clarifying questions when needed. Respect genre, tone, and style.

Story Guide: Offer insightful suggestions to improve plot, characters, pacing, and narrative flow. Be constructive, never overly critical.

Creative Partner: Brainstorm entirely new story ideas with or for the user. Ask about world, characters, themes, and structure before generating.

Story Reviewer: Provide emotional tone analysis and professional notes for improvement.

🎭 Style & Voice:
Always keep a creative, respectful, and collaborative tone.

Speak like a seasoned storyteller, not a robot.

Avoid filler; focus on engaging narrative content.

Use Markdown formatting to clearly show story elements, reviews, and suggestions.

🧠 Best Practices:
When generating from scratch, offer a clear story structure with:
- Title
- Genre
- Logline
- Story breakdown (with clear acts or sections)
- Character descriptions
- Setting details

Encourage the user's creativity by asking smart, open-ended questions.

Allow flexibility in storytelling styles, genres, and tones.`;

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

    // Only check Firebase if this is a specific story retrieval request
    if (knowledgeBaseId && knowledgeBaseId !== 'none' && latestMessage.toLowerCase().includes('get story')) {
      try {
        console.log("🔍 Retrieving specific story from Firebase:", knowledgeBaseId);
        
        const storyDoc = await getDoc(doc(db, 'stories', knowledgeBaseId));
        
        if (storyDoc.exists()) {
          console.log("✅ Found story in Firebase");
          const storyData = storyDoc.data() as Story;
          
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
      } catch (error) {
        console.error("❌ Error fetching story:", error);
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

    const responseContent = response.choices[0].message.content;

    // Only format as story if explicitly creating one
    const isCreatingStory = latestMessage.toLowerCase().includes('create') || 
                           latestMessage.toLowerCase().includes('generate') ||
                           latestMessage.toLowerCase().includes('make') ||
                           latestMessage.toLowerCase().includes('write');

    let responseData;
    if (isCreatingStory) {
      const story = formatStoryToJson(responseContent, userId);
      if (!story) {
        return NextResponse.json({ error: "Failed to format story" }, { status: 500 });
      }

      responseData = {
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
    } else {
      // For regular chat messages, just return the response without story formatting
      responseData = {
        id: crypto.randomUUID(),
        response: responseContent,
        thinking: "Chatting with AI",
        user_mood: "positive",
        suggested_questions: [
          "Tell me more",
          "Can you elaborate?",
          "What else can you suggest?"
        ],
        debug: {
          context_used: false,
          hasScriptFormat: false,
          hasStoryJson: false
        },
        can_generate_project: false
      };
    }

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("❌ General error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
