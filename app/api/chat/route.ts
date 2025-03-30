import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { getAdminDb } from "../../lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

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

interface Story {
  id: string;
  title: string;
  script: string;
  scenes: Scene[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Scene {
  id: string;
  title: string;
  location: string;
  description: string;
  lighting: string;
  weather: string;
  style: string;
  shots: Shot[];
}

interface Shot {
  id: string;
  type: string;
  description: string;
  hasNarration: boolean;
  hasDialogue: boolean;
  hasSoundEffects: boolean;
  prompt: string;
  narration?: string;
  dialogue?: string;
  soundEffects?: string;
  generatedImage?: string;
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
    const latestMessage = messages[messages.length - 1].content;

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
    const formattedMessages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...messages.map((msg: Message) => ({
        role: msg.role,
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
            const storyData = storyDoc.data();
            
            // Format the response to match our expected structure
            const responseData = {
              id: storyDoc.id,
              response: `🎬 Story Breakdown:\n\n📝 Title: ${storyData?.title || 'Untitled'}\n\n${storyData?.script || ''}`,
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
          } else {
            console.log("⚠️ Story not found in Firebase");
          }
        }
      } catch (error) {
        console.error("❌ Firebase query error:", error);
      }
    }

    // If we don't have a story in Firebase or the query failed, proceed with model generation
    let response;
    if (model?.startsWith('gemini') && genAI) {
      try {
        console.log("🤖 Using Gemini model");
        console.log("🔑 Gemini API Key length:", geminiApiKey?.length || 0);
        
        // Use Gemini model only if API key is available
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("✅ Gemini model initialized");
        
        const chat = geminiModel.startChat({
          history: formattedMessages.map(msg => ({
            role: msg.role,
            parts: msg.content,
          })),
        });
        console.log("✅ Chat session started");
        
        console.log("📤 Sending message to Gemini:", latestMessage.substring(0, 100) + "...");
        const result = await chat.sendMessage(latestMessage);
        console.log("✅ Received response from Gemini");
        
        const responseText = result.response.text();
        console.log("📥 Response text length:", responseText.length);
        
        // Validate the response format
        if (!responseText.includes("SCENE 1:") || !responseText.includes("INT.") && !responseText.includes("EXT.")) {
          throw new Error("Response does not match required script format");
        }
        
        response = {
          choices: [{
            message: {
              content: responseText
            }
          }]
        };
      } catch (error) {
        console.error("❌ Detailed Gemini Error:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
        
        // Fall back to Groq if Gemini fails
        console.log("🔄 Falling back to Groq model");
        response = await groq.chat.completions.create({
          model: "llama3-8b-8192",
          messages: formattedMessages,
          max_tokens: 1000,
          temperature: 0.3,
        });
      }
    } else {
      // Use Groq model
      console.log("🤖 Using Groq model");
      response = await groq.chat.completions.create({
        model: model || "llama3-8b-8192",
        messages: formattedMessages,
        max_tokens: 1000,
        temperature: 0.3,
      });
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`⏱️ [${endTime.toISOString()}] Generation Complete: ${duration.toFixed(2)}s`);
    console.log("✅ Message generation completed");

    // Check if the response contains a script format
    const hasScriptFormat = response.choices[0].message.content.includes("INT.") || 
                            response.choices[0].message.content.includes("EXT.");
    
    console.log("📝 Script format check:", {
      hasScriptFormat,
      contentPreview: response.choices[0].message.content.substring(0, 100) + "...",
      fullContent: response.choices[0].message.content,
      userId: userId
    });
    
    let storyJson = null;
    let formattedResponse = response.choices[0].message.content;
    
    if (hasScriptFormat && userId) {
      try {
        console.log("🔄 Starting story JSON formatting");
        console.log("📝 Input script:", response.choices[0].message.content);
        console.log("👤 User ID:", userId);
        
        storyJson = formatStoryToJson(response.choices[0].message.content, userId);
        console.log("✅ Story JSON created successfully", {
          scenesCount: storyJson.scenes.length,
          title: storyJson.title,
          firstScene: storyJson.scenes[0],
          firstShot: storyJson.scenes[0]?.shots[0],
          userId: storyJson.userId
        });
        
        // Format the response to be more readable in chat
        formattedResponse = `🎬 Story Breakdown:\n\n`;
        
        // Add title
        const title = storyJson.title;
        formattedResponse += `📝 Title: ${title}\n\n`;
        
        // Add scenes
        storyJson.scenes.forEach((scene, sceneIndex) => {
          try {
            console.log(`🎯 Processing scene ${sceneIndex + 1}:`, {
              title: scene.title,
              location: scene.location,
              shotsCount: scene.shots.length,
              description: scene.description.substring(0, 50) + "..."
            });
            
            formattedResponse += `🎯 Scene ${sceneIndex + 1}: ${scene.title}\n`;
            formattedResponse += `📍 Location: ${scene.location}\n`;
            formattedResponse += `📋 Description: ${scene.description}\n`;
            formattedResponse += `💡 Lighting: ${scene.lighting}\n`;
            formattedResponse += `🌤️ Weather: ${scene.weather}\n\n`;
            
            // Add shots
            scene.shots.forEach((shot, shotIndex) => {
              try {
                console.log(`🎥 Processing shot ${shotIndex + 1}:`, {
                  type: shot.type,
                  hasDescription: !!shot.description,
                  hasDialogue: shot.hasDialogue,
                  hasNarration: shot.hasNarration,
                  description: shot.description.substring(0, 50) + "..."
                });
                
                formattedResponse += `🎥 Shot ${shotIndex + 1}: ${shot.type}\n`;
                formattedResponse += `📝 Description: ${shot.description}\n`;
                
                if (shot.hasDialogue) {
                  formattedResponse += `💬 Dialogue: ${shot.dialogue}\n`;
                }
                
                if (shot.hasNarration) {
                  formattedResponse += `🗣️ Narration: ${shot.narration}\n`;
                }
                
                if (shot.hasSoundEffects) {
                  formattedResponse += `🔊 Sound Effects: ${shot.soundEffects}\n`;
                }
                
                formattedResponse += `\n`;
              } catch (shotError) {
                console.error(`❌ Error formatting shot ${shotIndex + 1}:`, {
                  error: shotError,
                  shot: shot
                });
                formattedResponse += `⚠️ Error formatting shot ${shotIndex + 1}\n\n`;
              }
            });
            
            formattedResponse += `\n`;
          } catch (sceneError) {
            console.error(`❌ Error formatting scene ${sceneIndex + 1}:`, {
              error: sceneError,
              scene: scene
            });
            formattedResponse += `⚠️ Error formatting scene ${sceneIndex + 1}\n\n`;
          }
        });
        
        formattedResponse += `\n✨ Ready to create your storyboard! Click "Create Project" to get started.`;
        console.log("✅ Story breakdown formatted successfully");
      } catch (formatError) {
        console.error("❌ Error in story formatting:", {
          error: formatError,
          input: response.choices[0].message.content,
          userId: userId
        });
        formattedResponse = "⚠️ There was an error formatting the story. Please try again.";
        storyJson = null;
      }
    } else {
      console.log("⚠️ No script format detected or missing userId", {
        hasScriptFormat,
        hasUserId: !!userId,
        content: response.choices[0].message.content,
        userId: userId
      });
    }

    // Prepare response
    const responseData = {
      id: crypto.randomUUID(),
      response: formattedResponse,
      thinking: "This is a script about " + latestMessage,
      user_mood: "positive",
      suggested_questions: [
        "How does this scene continue?",
        "Can you add more dialogue?",
        "What happens in the next scene?"
      ],
      debug: {
        context_used: isRagWorking,
        hasScriptFormat,
        hasStoryJson: !!storyJson,
        model: model,
        userId: userId,
        storyJsonPreview: storyJson ? {
          title: storyJson.title,
          scenesCount: storyJson.scenes.length,
          firstSceneTitle: storyJson.scenes[0]?.title,
          userId: storyJson.userId
        } : null
      },
      can_generate_project: hasScriptFormat,
      story_json: storyJson
    };

    console.log("📤 Sending response:", {
      hasStoryJson: !!storyJson,
      responseLength: formattedResponse.length,
      canGenerateProject: hasScriptFormat,
      storyJsonPreview: storyJson ? {
        title: storyJson.title,
        scenesCount: storyJson.scenes.length,
        firstSceneTitle: storyJson.scenes[0]?.title,
        userId: storyJson.userId
      } : null
    });

    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error("💥 Error in message generation:", error);
    
    const errorResponse = {
      response: "Sorry, there was an issue processing your request. Please try again later.",
      thinking: "Error occurred during message generation.",
      user_mood: "neutral",
      debug: { context_used: false },
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
