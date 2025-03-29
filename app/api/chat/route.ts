import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import crypto from "crypto";
import { getAdminDb } from "../../lib/firebase-admin";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

// Main POST request handler
export async function POST(req) {
  try {
    // Extract data from the request body
    const { messages, model, knowledgeBaseId } = await req.json();
    const latestMessage = messages[messages.length - 1].content;

    console.log("📝 Latest Query:", latestMessage);
    console.log("🚀 API route called", {
      messagesReceived: messages.length,
      latestMessageLength: latestMessage.length,
      groqKeySlice: process.env.GROQ_API_KEY?.slice(0, 4) + '****'
    });

    // Timing for performance monitoring
    const startTime = new Date();
    console.log(`⏱️ [${startTime.toISOString()}] User Input Received: 0.00s`);

    // Initialize variables for story creation context
    let retrievedContext = "";
    let isRagWorking = false;
    let ragSources = [];

    // Retrieve context from Firebase knowledge base if a knowledge base ID is provided
    if (knowledgeBaseId && knowledgeBaseId !== 'none') {
      try {
        console.log("🔍 Querying knowledge base:", knowledgeBaseId);
        console.log(`⏱️ [${startTime.toISOString()}] Story Context Setup: 0.00s`);
        
        // Get Firestore instance using our utility
        const firestore = await getAdminDb();
        
        // Extract keywords from the query for simple search
        const keywords = extractKeywords(latestMessage);
        
        if (keywords.length > 0 && firestore) {
          try {
            // Query the knowledge base collection
            const kbRef = firestore.collection('knowledgeBases').doc(knowledgeBaseId);
            const chunksRef = kbRef.collection('chunks');
            
            // Simple query to find chunks matching keywords
            const chunks = await chunksRef
              .where('keywords', 'array-contains-any', keywords)
              .limit(3)
              .get();
            
            const foundChunks = [];
            chunks.forEach(doc => {
              foundChunks.push({
                id: doc.id,
                fileName: doc.data().fileName,
                snippet: doc.data().content,
                score: doc.data().relevance || 0.5
              });
            });
            
            if (foundChunks.length > 0) {
              ragSources = foundChunks;
              retrievedContext = foundChunks.map(chunk => chunk.snippet).join("\n\n");
              isRagWorking = true;
              console.log(`✅ Found ${foundChunks.length} relevant chunks`);
            } else {
              console.log("⚠️ No relevant chunks found in knowledge base");
              // Fall back to sample data for development
              ragSources = [{
                id: 'sample-chunk',
                fileName: 'sample.txt',
                snippet: 'Sample content for screenwriting',
                score: 0.95
              }];
              retrievedContext = 'Sample content for screenwriting';
              isRagWorking = true;
            }
          } catch (error) {
            console.error("💀 Firebase Query Error:", error);
            // Continue without knowledge base
          }
        }
      } catch (error) {
        console.error("💀 Firebase Error:", error);
        // Continue without knowledge base
      }
    }

    // System prompt for script generation
    const systemPrompt = `You are a professional scriptwriter for film, animation, and games. When generating a scene, include structured elements like Scene Heading, Description, Timing, Character Introductions, Dialogue, Sound Effects, and Camera Directions.`;

    // Generate response with Groq
    console.log("🚀 Query Processing");
    console.log(`⏱️ [${startTime.toISOString()}] Groq Generation Start: 0.00s`);
    
    // Format messages for Groq API - remove id property and ensure correct format
    const formattedMessages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    // If we have context from the knowledge base, add it to the system message
    if (retrievedContext) {
      formattedMessages[0].content += `\n\nUse the following context to inform your writing:\n${retrievedContext}`;
    }
    
    const response = await groq.chat.completions.create({
      model: model || "llama3-8b-8192",
      messages: formattedMessages,
      max_tokens: 1000,
      temperature: 0.3,
    });

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`⏱️ [${endTime.toISOString()}] Groq Generation Complete: ${duration.toFixed(2)}s`);
    console.log("✅ Message generation completed");

    // Check if the response contains a script format
    const hasScriptFormat = response.choices[0].message.content.includes("INT.") || 
                            response.choices[0].message.content.includes("EXT.");
    
    // Prepare response
    const responseData = {
      id: crypto.randomUUID(),
      response: response.choices[0].message.content,
      thinking: "This is a script about " + latestMessage,
      user_mood: "positive",
      suggested_questions: [
        "How does this scene continue?",
        "Can you add more dialogue?",
        "What happens in the next scene?"
      ],
      debug: {
        context_used: isRagWorking
      },
      can_generate_project: hasScriptFormat
    };

    console.log(`⏱️ [${endTime.toISOString()}] API Complete: ${duration.toFixed(2)}s`);
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
