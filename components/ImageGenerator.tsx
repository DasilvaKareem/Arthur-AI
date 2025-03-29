"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon, RefreshCw } from "lucide-react";

const aspectRatioOptions = [
  { value: "16:9", label: "16:9 (Default)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "3:4", label: "3:4 (Portrait)" },
  { value: "4:3", label: "4:3 (Landscape)" },
  { value: "9:16", label: "9:16 (Mobile Portrait)" },
  { value: "9:21", label: "9:21 (Panorama Portrait)" },
  { value: "21:9", label: "21:9 (Panorama Landscape)" },
];

const modelOptions = [
  { value: "photon-1", label: "Photon-1 (Default)" },
  { value: "photon-flash-1", label: "Photon-Flash-1 (Faster)" },
];

interface ImageGenerationProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export default function ImageGenerator({ onImageGenerated }: ImageGenerationProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [model, setModel] = useState("photon-1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);

  // Function to start image generation
  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);
    setPollingStatus("Starting generation...");

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          model,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start image generation");
      }

      setGenerationId(data.id);
      setPollingStatus("Generation started, waiting for results...");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Poll for image generation status
  useEffect(() => {
    if (!generationId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/image?id=${generationId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to check generation status");
        }

        setPollingStatus(`Status: ${data.state}`);

        if (data.state === "completed") {
          setImageUrl(data.assets.image);
          setLoading(false);
          setPollingStatus("Generation completed!");
          if (onImageGenerated) {
            onImageGenerated(data.assets.image);
          }
        } else if (data.state === "failed") {
          setError(`Generation failed: ${data.failure_reason || "Unknown error"}`);
          setLoading(false);
          setPollingStatus(null);
        } else {
          // Continue polling
          setTimeout(pollStatus, 3000);
        }
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
        setPollingStatus(null);
      }
    };

    pollStatus();
  }, [generationId, onImageGenerated]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Image with Luma</CardTitle>
        <CardDescription>
          Create AI-generated images using the Luma Labs API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select
                value={aspectRatio}
                onValueChange={setAspectRatio}
                disabled={loading}
              >
                <SelectTrigger id="aspect-ratio">
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatioOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={model}
                onValueChange={setModel}
                disabled={loading}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}

          {pollingStatus && (
            <div className="text-sm text-blue-500 bg-blue-50 p-2 rounded-md flex items-center space-x-2">
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>{pollingStatus}</span>
            </div>
          )}

          {imageUrl && (
            <div className="mt-4">
              <img
                src={imageUrl}
                alt="Generated image"
                className="w-full rounded-md shadow-md"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={generateImage}
          disabled={loading || !prompt.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 