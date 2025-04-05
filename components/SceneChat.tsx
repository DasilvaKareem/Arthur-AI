import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface SceneChatProps {
  onAddScene: (scene: any) => void;
  onAddShot: (sceneId: string, shot: any) => void;
  currentSceneId: string | null;
}

export default function SceneChat({ onAddScene, onAddShot, currentSceneId }: SceneChatProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [input]);

  const validateScene = (scene: any) => {
    console.log('Validating scene:', scene);
    
    const requiredFields = ['title', 'location', 'description', 'lighting', 'weather'];
    const missingFields = requiredFields.filter(field => !scene[field] || scene[field] === 'N/A');
    
    if (missingFields.length > 0) {
      console.error('Missing or invalid fields:', missingFields);
      throw new Error(`Missing or invalid fields: ${missingFields.join(', ')}`);
    }

    // Validate field content
    if (!scene.title.trim()) {
      throw new Error('Title cannot be empty');
    }
    if (!scene.location.includes('INT.') && !scene.location.includes('EXT.')) {
      throw new Error('Location must include INT. or EXT.');
    }
    if (!scene.description.trim() || scene.description === 'N/A') {
      throw new Error('Description cannot be empty or N/A');
    }
    if (!scene.lighting.trim() || scene.lighting === 'N/A') {
      throw new Error('Lighting cannot be empty or N/A');
    }
    if (!scene.weather.trim() || scene.weather === 'N/A') {
      throw new Error('Weather cannot be empty or N/A');
    }

    console.log('Scene validation passed');
    return true;
  };

  const validateShot = (shot: any) => {
    console.log('Validating shot:', shot);
    
    if (!shot.description || shot.description === 'N/A') {
      throw new Error('Shot description cannot be empty or N/A');
    }
    if (!shot.type) {
      throw new Error('Shot type is required');
    }

    console.log('Shot validation passed');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      console.log('Processing input:', input);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a script assistant. Format your response EXACTLY as follows:

For a new scene:
SCENE X: [Scene Title]
INT./EXT. [Location] - DAY/NIGHT
Description: [scene description]
Lighting: [lighting description]
Weather: [weather description]

For shots:
SHOT:
Description: [shot description]
Dialogue: [if there is dialogue]
Narration: [if there is narration]
Sound Effects: [if there are sound effects]

IMPORTANT:
- Use exact line breaks as shown above
- Include all fields even if empty
- Don't add any additional formatting or text
- Use "N/A" for empty fields
- Each scene or shot should be separated by a blank line
- Always include INT./EXT. and DAY/NIGHT in location`
            },
            {
              role: "user",
              content: input
            }
          ],
          model: "gemini-pro"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process input");
      }

      const data = await response.json();
      const content = data.response;
      console.log('AI Response:', content);

      // Split content into sections
      const sections = content.split(/\n\s*\n/).filter(Boolean);
      
      for (const section of sections) {
        // Check if it's a scene
        if (section.includes("SCENE")) {
          console.log('Processing scene section:', section);
          
          // More flexible regex pattern for scene matching
          const sceneMatch = section.match(/SCENE\s*(\d+):\s*(.+?)(?:\n|$).*?(?:INT\.|EXT\.)\s*([^-\n]+)(?:-\s*(DAY|NIGHT))?.*?Description:\s*(.+?)(?:\n|$).*?Lighting:\s*(.+?)(?:\n|$).*?Weather:\s*(.+?)(?:\n|$)/s);
          console.log('Scene Match:', sceneMatch);
          
          if (sceneMatch) {
            const [_, sceneNum, title, location, timeOfDay, description, lighting, weather] = sceneMatch;
            
            // Clean up the extracted data
            const cleanTitle = title.trim();
            const cleanLocation = `${location.trim()}${timeOfDay ? ` - ${timeOfDay}` : ''}`;
            const cleanDescription = description?.trim() || "N/A";
            const cleanLighting = lighting?.trim() || "N/A";
            const cleanWeather = weather?.trim() || "N/A";

            console.log('Extracted Scene Data:', {
              title: cleanTitle,
              location: cleanLocation,
              description: cleanDescription,
              lighting: cleanLighting,
              weather: cleanWeather
            });

            const newScene = {
              id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: cleanTitle,
              location: cleanLocation,
              description: cleanDescription,
              lighting: cleanLighting,
              weather: cleanWeather,
              style: "hyperrealistic",
              shots: []
            };

            try {
              validateScene(newScene);
              console.log('Validated scene:', newScene);
              onAddScene(newScene);
              toast.success("New scene added!");
            } catch (error) {
              console.error("Scene validation error:", error);
              toast.error(error instanceof Error ? error.message : "Invalid scene format");
            }
          }
        }
        // Check if it's a shot
        else if (section.includes("SHOT:")) {
          // More flexible regex pattern for shot matching
          const shotMatch = section.match(/SHOT:.*?Description:\s*(.+?)(?:\n\n|$).*?(?:Dialogue:\s*(.+?)(?:\n\n|$))?.*?(?:Narration:\s*(.+?)(?:\n\n|$))?.*?(?:Sound Effects:\s*(.+?)(?:\n\n|$))?/s);
          console.log('Shot Match:', shotMatch);
          
          if (shotMatch && currentSceneId) {
            const [_, description, dialogue, narration, soundEffects] = shotMatch;
            const newShot = {
              id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: "MEDIUM SHOT",
              description: description?.trim() || "",
              hasNarration: !!narration,
              hasDialogue: !!dialogue,
              hasSoundEffects: !!soundEffects,
              prompt: description?.trim() || "",
              narration: narration?.trim() || null,
              dialogue: dialogue?.trim() || null,
              soundEffects: soundEffects?.trim() || null,
              location: null,
              lighting: null,
              weather: null,
              generatedImage: null,
              generatedVideo: null
            };

            try {
              validateShot(newShot);
              onAddShot(currentSceneId, newShot);
              toast.success("New shot added!");
            } catch (error) {
              console.error("Shot validation error:", error);
              toast.error(error instanceof Error ? error.message : "Invalid shot format");
            }
          }
        }
      }

      setInput("");
    } catch (error) {
      console.error("Error processing input:", error);
      toast.error("Failed to process input. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Scene Assistant</h3>
        <p className="text-sm text-gray-500">Add scenes and shots through chat</p>
      </div>
      
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe a scene or shot..."
            className="min-h-[100px]"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full" />
            ) : (
              <>
                Send
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  );
} 