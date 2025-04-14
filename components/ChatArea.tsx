"use client";

import { useEffect, useRef, useState } from "react";
import config from "@/config";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import {
  HandHelping,
  WandSparkles,
  LifeBuoyIcon,
  BookOpenText,
  ChevronDown,
  Send,
  ImageIcon,
} from "lucide-react";
import "highlight.js/styles/atom-one-dark.css";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImageGenerator from "./ImageGenerator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { createStory } from "@/app/lib/firebase/stories";
import { usePreferences } from "@/app/context/preferences-context";
import { ArthurAvatar } from "./ArthurAvatar";

const TypedText = ({ text = "", delay = 5 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) return;
    const timer = setTimeout(() => {
      setDisplayedText(text.substring(0, displayedText.length + 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [text, displayedText, delay]);

  return <>{displayedText}</>;
};

type ThinkingContent = {
  id: string;
  content: string;
  user_mood: string;
  debug: any;
  matched_categories?: string[];
};

interface ConversationHeaderProps {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  models: Model[];
  showAvatar: boolean;
}

const UISelector = ({
  redirectToAgent,
}: {
  redirectToAgent: { should_redirect: boolean; reason: string };
}) => {
  if (redirectToAgent.should_redirect) {
    return (
      <Button
        size="sm"
        className="mt-2 flex items-center space-x-2"
        onClick={() => {
          console.log("🔥 Human Agent Connection Requested!", redirectToAgent);
          const event = new CustomEvent("humanAgentRequested", {
            detail: {
              reason: redirectToAgent.reason || "Unknown",
              mood: "frustrated",
              timestamp: new Date().toISOString(),
            },
          });
          window.dispatchEvent(event);
        }}
      >
        <LifeBuoyIcon className="w-4 h-4" />
        <small className="text-sm leading-none">Talk to a human</small>
      </Button>
    );
  }

  return null;
};

const SuggestedQuestions = ({
  questions,
  onQuestionClick,
  isLoading,
}: {
  questions: string[];
  onQuestionClick: (question: string) => void;
  isLoading: boolean;
}) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-2 pl-10">
      {questions.map((question, index) => (
        <Button
          key={index}
          className="text-sm mb-2 mr-2 ml-0 text-gray-500 shadow-sm"
          variant="outline"
          size="sm"
          onClick={() => onQuestionClick(question)}
          disabled={isLoading}
        >
          {question}
        </Button>
      ))}
    </div>
  );
};

const MessageContent = ({
  content,
  role,
  projectId,
  createShotFromDescription,
  onShotCreated,
  setMessages,
  user,
}: {
  content: string;
  role: string;
  projectId: string | null;
  createShotFromDescription: (description: string, shotType?: string) => Promise<string | null>;
  onShotCreated?: () => void;
  setMessages: (update: React.SetStateAction<Message[]>) => void;
  user: any;
}) => {
  const [thinking, setThinking] = useState(true);
  const [parsed, setParsed] = useState<{
    response?: string;
    thinking?: string;
    user_mood?: string;
    suggested_questions?: string[];
    redirect_to_agent?: { should_redirect: boolean; reason: string };
    can_generate_project?: boolean;
    debug?: {
      context_used: boolean;
    };
  }>({});
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!content || role !== "assistant") return;

    const timer = setTimeout(() => {
      setError(true);
      setThinking(false);
    }, 30000);

    try {
      const result = JSON.parse(content);
      console.log("🔍 Parsed Result:", result);
      console.log("🟢 Can Generate Project Flag:", result.can_generate_project);

      if (
        result.response &&
        result.response.length > 0 &&
        result.response !== "..."
      ) {
        setParsed(result);
        setThinking(false);
        clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      setError(true);
      setThinking(false);
    }

    return () => clearTimeout(timer);
  }, [content, role]);

  const handleGenerateShots = async () => {
    if (!parsed.response || !user) {
      toast.error("Please sign in to create shots");
      return;
    }

    try {
      console.log("🎬 Generating shots from story!");
      toast.loading("Preparing shots...");
      
      if (!projectId) {
        throw new Error("No project selected");
      }
      
      // Parse the story into potential shots
      const paragraphs = parsed.response.split('\n\n');
      
      // Extract shot descriptions from paragraphs
      const shotDescriptions = [];
      
      // Try to extract some logical shots from the content
      if (paragraphs.length > 1) {
        // Look for character descriptions, dialogue, or action sequences
        for (let i = 0; i < Math.min(paragraphs.length, 6); i++) {
          if (paragraphs[i] && paragraphs[i].length > 20) {
            shotDescriptions.push(paragraphs[i].substring(0, 150)); // Limit description length
          }
        }
      }
      
      // If we couldn't find good shots, create some generic ones
      if (shotDescriptions.length === 0) {
        shotDescriptions.push("Establishing shot of the main location");
        shotDescriptions.push("Medium shot of the main character");
        shotDescriptions.push("Wide shot showing the environment and characters");
      }
      
      // Limit the number of shots to create at once to avoid overwhelming the API
      const shotsToCreate = shotDescriptions.slice(0, 3);
      
      // Create each shot sequentially, not in parallel
      const createdShotIds = [];
      for (const description of shotsToCreate) {
        try {
          // Add a small delay between shot creation attempts
          if (createdShotIds.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const shotId = await createShotFromDescription(description);
          if (shotId) {
            createdShotIds.push(shotId);
          }
        } catch (shotError) {
          console.error("Error creating individual shot:", shotError);
          // If we have at least one error, stop trying to create more shots
          if (createdShotIds.length === 0) {
            throw shotError; // Re-throw the error if we haven't created any shots
          } else {
            break; // Stop creating more shots but don't throw an error
          }
        }
      }
      
      // Add a message about shot creation
      const message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: JSON.stringify({
          thinking: "Explaining shots that were created",
          response: `Created ${createdShotIds.length} new shots based on the story! ${
            createdShotIds.length > 0 ? "You can now see them in your storyboard." : 
            "There was an issue creating the shots. Please make sure your project is set up correctly."
          }`,
          suggested_questions: [
            ...(createdShotIds.length > 0 ? [
              "Generate images for these shots",
              "Add another shot",
              "What shot types can I use?"
            ] : [
              "How do I set up my project?",
              "Create a new scene",
              "Help me troubleshoot"
            ])
          ]
        })
      };
      
      setMessages(prev => [...prev, message]);
      
      if (onShotCreated && createdShotIds.length > 0) {
        onShotCreated();
      }
      
      if (createdShotIds.length > 0) {
        toast.success(`${createdShotIds.length} shots created successfully!`);
      } else {
        toast.error("No shots could be created. There might be an issue with the project setup.");
      }
    } catch (error) {
      console.error("Error creating shots:", error);
      toast.error("Failed to create shots: " + (error instanceof Error ? error.message : "Please try again."));
    } finally {
      toast.dismiss();
    }
  };

  const isScriptResponse = (response: string | undefined): boolean => {
    if (!response) return false;
    
    // Check for script-specific elements
    const hasSceneHeading = response.includes("INT.") || response.includes("EXT.");
    const hasDuration = response.includes("DURATION:");
    const hasCharacterDialogue = /[A-Z]{2,}\s*\n/.test(response);
    
    console.log("📝 Script detection:", { hasSceneHeading, hasDuration, hasCharacterDialogue });
    
    return hasSceneHeading && (hasDuration || hasCharacterDialogue);
  };

  if (thinking && role === "assistant") {
    return (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
        <span>Thinking...</span>
      </div>
    );
  }

  if (error && !parsed.response) {
    return <div>Something went wrong. Please try again.</div>;
  }

  return (
    <div className="space-y-4">
      {parsed.response && (
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              // @ts-ignore
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {parsed.response}
          </ReactMarkdown>
        </div>
      )}

      {parsed.can_generate_project && parsed.response && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleGenerateShots}
            className="w-[200px]"
            disabled={!user || !projectId}
          >
            {user ? "Create Shots" : "Sign in to Create Shots"}
          </Button>
        </div>
      )}

      {parsed.suggested_questions && (
        <SuggestedQuestions
          questions={parsed.suggested_questions}
          onQuestionClick={(question) => {
            // Handle question click
          }}
          isLoading={false}
        />
      )}

      {parsed.redirect_to_agent && (
        <UISelector redirectToAgent={parsed.redirect_to_agent} />
      )}
    </div>
  );
};

// Define a type for the model
type Model = {
  id: string;
  name: string;
};

interface Message {
  id: string;
  role: string;
  content: string;
}

// Define the props interface for ConversationHeader
interface ConversationHeaderProps {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  models: Model[];
  showAvatar: boolean;
  selectedKnowledgeBase: string;
  setSelectedKnowledgeBase: (knowledgeBaseId: string) => void;
  knowledgeBases: KnowledgeBase[];
}

type KnowledgeBase = {
  id: string;
  name: string;
};

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  selectedModel,
  setSelectedModel,
  models,
  showAvatar,
  selectedKnowledgeBase,
  setSelectedKnowledgeBase,
  knowledgeBases,
}) => {
  const { preferences } = usePreferences();

  // Helper function to get avatar background color
  const getAvatarStyle = () => {
    if (preferences.chatColor) {
      return {
        backgroundColor: preferences.chatColor,
        color: '#e6e6e6',
        border: `1px solid ${preferences.chatColor}`
      };
    }
    return {
      backgroundColor: '#333',
      color: '#e6e6e6',
      border: '1px solid #333'
    };
  };

  return (
    <div className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 animate-fade-in">
      <div className="flex items-center space-x-4 mb-2 sm:mb-0">
        {showAvatar && (
          <>
            <ArthurAvatar size="md" />
            <div>
              <h3 className="text-sm font-medium leading-none">AI Agent</h3>
              <p className="text-sm text-muted-foreground">Customer support</p>
            </div>
          </>
        )}
      </div>
      <div className="flex space-x-2 w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-grow text-muted-foreground sm:flex-grow-0"
            >
              {models.find((m) => m.id === selectedModel)?.name}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => setSelectedModel(model.id)}
              >
                {model.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-grow text-muted-foreground  sm:flex-grow-0"
            >
              {knowledgeBases.find((kb) => kb.id === selectedKnowledgeBase)
                ?.name || "Select KB"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {knowledgeBases.map((kb) => (
              <DropdownMenuItem
                key={kb.id}
                onSelect={() => setSelectedKnowledgeBase(kb.id)}
              >
                {kb.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// Extend the ChatAreaProps interface to include projectId
interface ChatAreaProps {
  initialMessage?: string;
  onMessageSubmit?: (message: string) => void;
  isCreating?: boolean;
  projectId?: string | null;
  onShotCreated?: () => void;
}

function ChatArea({ initialMessage, onMessageSubmit, isCreating, projectId, onShotCreated }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3-8b-8192");
  const [showAvatar, setShowAvatar] = useState(false);
  const { preferences } = usePreferences();
  const { user } = useAuth();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(
    "your-knowledge-base-id",
  );

  const knowledgeBases: KnowledgeBase[] = [
    { id: "your-knowledge-base-id", name: "Your KB Name" },
    // Add more knowledge bases as needed
  ];

  const models: Model[] = [
    { id: "gemini-pro-vision", name: "Gemini Pro Vision (128K)" },
    { id: "gemini-pro", name: "Gemini Pro (32K)" },
    { id: "llama3-70b-8192", name: "Llama-3 70B" },
    { id: "llama3-8b-8192", name: "Llama-3 8B" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
    { id: "gemma-7b-it", name: "Gemma 7B" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
    { id: "deepseek-r1-distill-qwen-32b", name: "DeepSeek Qwen 32B" },
    { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek Llama 70B" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log("🔍 Messages changed! Count:", messages.length);

    const scrollToNewestMessage = () => {
      if (messagesEndRef.current) {
        console.log("📜 Scrolling to newest message...");
        const behavior = messages.length <= 2 ? "auto" : "smooth";
        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
      } else {
        console.log("❌ No scroll anchor found!");
      }
    };

    if (messages.length > 0) {
      setTimeout(scrollToNewestMessage, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!config.includeLeftSidebar) {
      // If LeftSidebar is not included, we need to handle the 'updateSidebar' event differently
      const handleUpdateSidebar = (event: CustomEvent<ThinkingContent>) => {
        console.log("LeftSidebar not included. Event data:", event.detail);
        // You might want to handle this data differently when LeftSidebar is not present
      };

      window.addEventListener(
        "updateSidebar" as any,
        handleUpdateSidebar as EventListener,
      );
      return () =>
        window.removeEventListener(
          "updateSidebar" as any,
          handleUpdateSidebar as EventListener,
        );
    }
  }, []);

  useEffect(() => {
    if (!config.includeRightSidebar) {
      // If RightSidebar is not included, we need to handle the 'updateRagSources' event differently
      const handleUpdateRagSources = (event: CustomEvent) => {
        console.log("RightSidebar not included. RAG sources:", event.detail);
        // You might want to handle this data differently when RightSidebar is not present
      };

      window.addEventListener(
        "updateRagSources" as any,
        handleUpdateRagSources as EventListener,
      );
      return () =>
        window.removeEventListener(
          "updateRagSources" as any,
          handleUpdateRagSources as EventListener,
        );
    }
  }, []);

  const decodeDebugData = (response: Response) => {
    const debugData = response.headers.get("X-Debug-Data");
    if (debugData) {
      try {
        const parsed = JSON.parse(debugData);
        console.log("🔍 Server Debug:", parsed.msg, parsed.data);
      } catch (e) {
        console.error("Debug decode failed:", e);
      }
    }
  };

  const logDuration = (label: string, duration: number) => {
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
  };

  // Add a ref to the current project ID
  const projectIdRef = useRef<string | null>(null);
  
  // Update the ref when projectId changes
  useEffect(() => {
    projectIdRef.current = projectId || null;
  }, [projectId]);

  // Add a function to create a new shot
  const createShotFromDescription = async (description: string, shotType: string = "MEDIUM SHOT") => {
    if (!projectIdRef.current) {
      console.error("No project ID available");
      toast.error("Cannot create shot: No project selected");
      return null;
    }
    
    const MAX_RETRIES = 2;
    let retryCount = 0;
    
    while (retryCount <= MAX_RETRIES) {
      try {
        if (retryCount > 0) {
          console.log(`Retrying shot creation (attempt ${retryCount} of ${MAX_RETRIES})...`);
          toast.loading(`Retrying shot creation (attempt ${retryCount} of ${MAX_RETRIES})...`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        } else {
          toast.loading("Creating new shot...");
        }
        
        console.log("Creating shot for project:", projectIdRef.current);
        console.log("Shot description:", description);
        console.log("Current user:", user?.uid || "Not logged in");
        
        // Create the shot directly in the first scene (or create a new one if needed)
        const shotResponse = await fetch(`/api/shot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            storyId: projectIdRef.current,
            type: shotType,
            description: description,
            prompt: description,
            hasDialogue: false,
            hasNarration: false,
            hasSoundEffects: false,
            userId: user?.uid // Use the user from component level scope
          })
        });
        
        // Log the response status for debugging
        console.log(`Shot creation API response status: ${shotResponse.status}`);
        
        // Check for specific HTTP status codes
        if (shotResponse.status === 404) {
          throw new Error("API endpoint not found. The server might need to be restarted.");
        } else if (shotResponse.status === 401) {
          throw new Error("Please sign in to create shots.");
        } else if (!shotResponse.ok) {
          // Try to get more details about the error
          let errorDetails = "";
          try {
            const errorData = await shotResponse.json();
            errorDetails = errorData.error || shotResponse.statusText;
            console.error("Shot creation API error details:", errorData);
            
            // Check for Firebase initialization error and retry
            if (errorDetails.includes("Expected first argument to collection()") ||
                errorDetails.includes("Firebase") ||
                errorDetails.includes("Firestore") ||
                errorDetails.includes("not initialized")) {
              if (retryCount < MAX_RETRIES) {
                console.log("Firebase initialization error detected, will retry");
                retryCount++;
                continue;
              }
            }
          } catch (parseError) {
            errorDetails = shotResponse.statusText;
          }
          
          throw new Error(`Failed to create shot: ${errorDetails}`);
        }
        
        // If we get here, the response was successful
        const shotData = await shotResponse.json();
        console.log("Shot created successfully:", shotData);
        toast.success("New shot created successfully!");
        
        // Call the onShotCreated callback if provided
        if (onShotCreated) {
          onShotCreated();
        }
        
        return shotData.id;
      } catch (error) {
        console.error("Error creating shot:", error);
        
        // Check if we should retry based on the error
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const shouldRetry = 
          errorMessage.includes("Firebase") || 
          errorMessage.includes("Firestore") ||
          errorMessage.includes("initialization") ||
          errorMessage.includes("Expected first argument to collection()");
          
        if (shouldRetry && retryCount < MAX_RETRIES) {
          console.log(`Will retry shot creation due to error: ${errorMessage}`);
          retryCount++;
          continue;
        }
        
        // Provide more specific error messages
        if (error instanceof Error) {
          // Handle specific error cases
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            toast.error("Network error: Please make sure the app server is running");
          } else if (error.message.includes("invalid-argument") || error.message.includes("Expected first argument")) {
            toast.error("Firebase initialization error. Please try again in a moment.");
          } else {
            toast.error("Failed to create shot: " + error.message);
          }
        } else {
          toast.error("Failed to create shot: Unknown error");
        }
        
        return null;
      } finally {
        toast.dismiss();
      }
    }
    
    return null;
  };
  
  // Modify the handleSubmit function to check for shot creation requests
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | string) => {
    if (typeof e !== "string") {
      e.preventDefault();
    }
    if (!showHeader) setShowHeader(true);
    if (!showAvatar) setShowAvatar(true);
    setIsLoading(true);

    const clientStart = performance.now();
    console.log("🔄 Starting request: " + new Date().toISOString());

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: typeof e === "string" ? e : input,
    };

    const placeholderMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: JSON.stringify({
        response: "",
        thinking: "AI is processing...",
        user_mood: "neutral",
        debug: {
          context_used: false,
        },
      }),
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      placeholderMessage,
    ]);
    setInput("");

    const placeholderDisplayed = performance.now();
    logDuration("Perceived Latency", placeholderDisplayed - clientStart);

    try {
      console.log("➡️ Sending message to API:", userMessage.content);
      const startTime = performance.now();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          knowledgeBaseId: selectedKnowledgeBase,
        }),
      });

      const responseReceived = performance.now();
      logDuration("Full Round Trip", responseReceived - startTime);
      logDuration("Network Duration", responseReceived - startTime);

      decodeDebugData(response);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      logDuration("JSON Parse Duration", endTime - responseReceived);
      logDuration("Total API Duration", endTime - startTime);
      console.log("⬅️ Received response from API:", data);

      const suggestedQuestionsHeader = response.headers.get(
        "x-suggested-questions",
      );
      if (suggestedQuestionsHeader) {
        data.suggested_questions = JSON.parse(suggestedQuestionsHeader);
      }

      const ragHeader = response.headers.get("x-rag-sources");
      if (ragHeader) {
        const ragProcessed = performance.now();
        logDuration(
          "🔍 RAG Processing Duration",
          ragProcessed - responseReceived,
        );
        const sources = JSON.parse(ragHeader);
        window.dispatchEvent(
          new CustomEvent("updateRagSources", {
            detail: {
              sources,
              query: userMessage.content,
              debug: data.debug,
            },
          }),
        );
      }

      const readyToRender = performance.now();
      logDuration("Response Processing", readyToRender - responseReceived);

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: JSON.stringify(data),
        };
        return newMessages;
      });

      const sidebarEvent = new CustomEvent("updateSidebar", {
        detail: {
          id: data.id,
          content: data.thinking?.trim(),
          user_mood: data.user_mood,
          debug: data.debug,
          matched_categories: data.matched_categories,
        },
      });
      window.dispatchEvent(sidebarEvent);

      if (data.redirect_to_agent && data.redirect_to_agent.should_redirect) {
        window.dispatchEvent(
          new CustomEvent("agentRedirectRequested", {
            detail: data.redirect_to_agent,
          }),
        );
      }

      // Check if the message is a shot creation request
      if (userMessage.content.toLowerCase().includes("create shot") && projectIdRef.current) {
        // Extract description from the user message
        const description = userMessage.content.replace(/create shot/i, "").trim();
        
        // Add an AI response that we're creating a shot
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: JSON.stringify({
              thinking: `Creating a new shot with description: "${description}"`,
              response: `I'll create a new shot with that description. One moment...`,
              suggested_questions: []
            })
          }
        ]);
        
        // Create the shot (user is already available at the component level)
        const shotId = await createShotFromDescription(description);
        
        if (shotId) {
          // Add confirmation message
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: JSON.stringify({
                thinking: `Successfully created a new shot with ID: ${shotId}`,
                response: `I've created a new shot with that description. You may need to refresh the storyboard to see it.`,
                suggested_questions: [
                  "Generate an image for this shot",
                  "Create another shot",
                  "What shot types can I use?"
                ]
              })
            }
          ]);
        }
        
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error fetching chat response:", error);
      console.error("Failed to process message:", userMessage.content);
    } finally {
      setIsLoading(false);
      const clientEnd = performance.now();
      logDuration("Total Client Operation", clientEnd - clientStart);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() !== "") {
        handleSubmit(e as any);
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setInput(textarea.value);

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  };

  const handleSuggestedQuestionClick = (question: string) => {
    handleSubmit(question);
  };

  useEffect(() => {
    const handleToolExecution = (event: Event) => {
      const customEvent = event as CustomEvent<{
        ui: { type: string; props: any };
      }>;
      console.log("Tool execution event received:", customEvent.detail);
    };

    window.addEventListener("toolExecution", handleToolExecution);
    return () =>
      window.removeEventListener("toolExecution", handleToolExecution);
  }, []);

  return (
    <Card className="flex-1 flex flex-col mb-4 mr-4 ml-4 border-none">
      <CardContent className="flex-1 flex flex-col overflow-hidden pt-4 px-4 pb-0">
        <ConversationHeader
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          models={models}
          showAvatar={showAvatar}
          selectedKnowledgeBase={selectedKnowledgeBase}
          setSelectedKnowledgeBase={setSelectedKnowledgeBase}
          knowledgeBases={knowledgeBases}
        />
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
              <ArthurAvatar size="md" className="mb-4" />
              <h2 className="text-2xl font-mono mb-8">
                {initialMessage || "Create Amazing Content"}
              </h2>
              <div className="space-y-4 text-sm font-mono">
                <div className="flex items-center gap-3">
                  <WandSparkles className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Create short films, commercials, and storyboards with AI-powered creativity.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpenText className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Generate professional business memos and presentations in seconds.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <HandHelping className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Transform your ideas into stunning visual content with our AI tools.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <div
                    className={`flex items-start ${
                      message.role === "user" ? "justify-end" : ""
                    } ${
                      index === messages.length - 1 ? "animate-fade-in-up" : ""
                    }`}
                    style={{
                      animationDuration: "300ms",
                      animationFillMode: "backwards",
                    }}
                  >
                    {message.role === "assistant" && (
                      <ArthurAvatar size="sm" className="mr-2" />
                    )}
                    <div
                      className={`p-3 rounded-md text-sm max-w-[65%] font-mono ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : `${preferences.chatColor ? `bg-${preferences.chatColor}` : 'bg-secondary'} border border-border`
                      }`}
                      style={message.role === "assistant" && preferences.chatColor ? {
                        backgroundColor: preferences.chatColor,
                        color: 'var(--primary-foreground)'
                      } : undefined}
                    >
                      <MessageContent
                        content={message.content}
                        role={message.role}
                        projectId={projectId || null}
                        createShotFromDescription={createShotFromDescription}
                        onShotCreated={onShotCreated}
                        setMessages={setMessages}
                        user={user}
                      />
                    </div>
                  </div>
                  {message.role === "assistant" && (
                    <SuggestedQuestions
                      questions={
                        JSON.parse(message.content).suggested_questions || []
                      }
                      onQuestionClick={handleSuggestedQuestionClick}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} style={{ height: "1px" }} />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full relative bg-secondary border border-border rounded-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={isLoading || isCreating}
            className="resize-none min-h-[44px] bg-secondary text-secondary-foreground border-0 p-3 rounded-xl shadow-none focus-visible:ring-0 font-mono"
            rows={1}
          />
          <div className="flex justify-between items-center p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: preferences.chatColor || 'var(--muted-foreground)' }}>Arthur</span>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-auto border-border">
                  <DialogHeader>
                    <DialogTitle className="font-mono">Generate Image with Luma</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-mono">
                      Create AI-generated images using Luma Labs
                    </DialogDescription>
                  </DialogHeader>
                  <ImageGenerator 
                    onImageGenerated={(imageUrl) => {
                      setInput((prev) => 
                        prev + `\n\nGenerated image: ${imageUrl}\n`
                      );
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <Button
              type="submit"
              disabled={isLoading || isCreating || input.trim() === ""}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
              size="sm"
            >
              {isLoading || isCreating ? (
                <div className="animate-spin h-5 w-5 border-t-2 border-primary-foreground rounded-full" />
              ) : (
                <>
                  Send Message
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}

export default ChatArea;
