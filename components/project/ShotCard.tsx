"use client";

import React, { useEffect } from 'react';
import { Button } from "../../components/ui/button";
import { Edit, RefreshCw, Film, Camera } from "lucide-react";
import type { Shot } from '../../types/shared';

interface ShotCardProps {
  shot: Shot;
  index: number;
  isImageLoading: boolean;
  isVideoLoading: boolean;
  onGenerateImage: (index: number, prompt: string) => void;
  onGenerateVideo: (index: number) => void;
  onGenerateLipSync: (index: number) => void;
  onShotDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => void;
  onShotTypeChange: (e: React.ChangeEvent<HTMLSelectElement>, index: number) => void;
  onDialogueChange: (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => void;
  onSoundEffectsChange: (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => void;
  onVoiceSelect: (e: React.ChangeEvent<HTMLSelectElement>, index: number) => void;
}

const ShotCard: React.FC<ShotCardProps> = React.memo(({
  shot,
  index,
  isImageLoading,
  isVideoLoading,
  onGenerateImage,
  onGenerateVideo,
  onGenerateLipSync,
  onShotDescriptionChange,
  onShotTypeChange,
  onDialogueChange,
  onSoundEffectsChange,
  onVoiceSelect
}) => {
  
  // --- DEBUG LOGGING START ---
  console.log(`ShotCard #${index + 1} (ID: ${shot.id}) rendering. Video URL: ${shot.generatedVideo}, Loading: ${isVideoLoading}`);

  useEffect(() => {
    console.log(`ShotCard #${index + 1} (ID: ${shot.id}) received VIDEO PROP update: ${shot.generatedVideo}`);
  }, [shot.generatedVideo, index, shot.id]); // Depend on video URL, index and ID for clarity
  
  useEffect(() => {
      console.log(`ShotCard #${index + 1} (ID: ${shot.id}) received IS_VIDEO_LOADING update: ${isVideoLoading}`);
  }, [isVideoLoading, index, shot.id]);
  // --- DEBUG LOGGING END ---

  return (
    <div className="bg-card rounded-lg p-4 border border-border shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-muted-foreground">#{index + 1}</span>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          {shot.generatedImage && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => {
                  const promptElement = document.getElementById(`shot-${index}-prompt`) as HTMLTextAreaElement;
                  if (promptElement && promptElement.value.trim()) {
                    onGenerateImage(index, promptElement.value);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onGenerateVideo(index)}
              >
                <Film className="h-4 w-4 text-muted-foreground" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Image Preview */}
      {isImageLoading ? (
        <div className="relative aspect-video mb-3 bg-muted flex flex-col items-center justify-center rounded-lg border border-border">
          <div className="animate-pulse flex flex-col items-center justify-center h-full">
            <div className="h-8 w-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm mt-2">Generating image...</p>
          </div>
        </div>
      ) : shot.generatedImage ? (
        <div className="relative aspect-video mb-3">
          <img
            src={shot.generatedImage}
            alt={`Shot ${index + 1}`}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      ) : (
        <div className="relative aspect-video mb-3 bg-muted flex items-center justify-center rounded-lg border border-border">
          <Camera className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm mt-2 absolute bottom-2">Image placeholder</p>
        </div>
      )}

      {/* Video Preview */}
      {isVideoLoading ? (
        <div className="relative aspect-video mb-3 bg-muted flex flex-col items-center justify-center rounded-lg border border-border">
          <div className="animate-pulse flex flex-col items-center justify-center h-full">
            <div className="h-8 w-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm mt-2">Generating video...</p>
          </div>
        </div>
      ) : shot.generatedVideo ? (
        <div className="relative aspect-video mb-3">
          <video
            src={shot.generatedVideo}
            controls
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Generated Shot Video
          </div>
        </div>
      ) : shot.generatedImage && (
        <div className="relative aspect-video mb-3 bg-muted flex flex-col items-center justify-center rounded-lg border border-border">
          <Film className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm mt-2">Video placeholder</p>
        </div>
      )}
      
      {/* Shot Details */}
      <div className="space-y-2">
        <textarea
          id={`shot-${index}-prompt`}
          className="w-full text-sm border rounded p-2 bg-background text-foreground border-input"
          rows={3}
          placeholder="Describe this shot..."
          defaultValue={shot.description}
          onChange={(e) => onShotDescriptionChange(e, index)}
        />
        <div>
          <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-1">Shot Type</h3>
          <select 
            className="w-full bg-background border border-input rounded p-2 text-sm text-foreground"
            value={shot.type}
            onChange={(e) => onShotTypeChange(e, index)}
          >
            <option value="">Select shot type</option>
            <option value="ESTABLISHING SHOT">Establishing Shot</option>
            <option value="CLOSE-UP">Close-Up</option>
            <option value="MEDIUM SHOT">Medium Shot</option>
            <option value="WIDE SHOT">Wide Shot</option>
            <option value="POV">POV</option>
            <option value="TRACKING SHOT">Tracking Shot</option>
          </select>
        </div>
        
        <div>
          <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-1">Character Dialogue</h3>
          <textarea
            className="w-full bg-background border border-input rounded p-2 text-sm text-foreground"
            rows={2}
            placeholder="Add character dialogue..."
            defaultValue={shot.dialogue || ""}
            onChange={(e) => onDialogueChange(e, index)}
          />
        </div>
        
        <div>
          <h3 className="uppercase text-xs tracking-wide text-muted-foreground mb-1">Sound Effects</h3>
          <textarea
            className="w-full bg-background border border-input rounded p-2 text-sm text-foreground"
            rows={2}
            placeholder="Add sound effects..."
            defaultValue={shot.soundEffects || ""}
            onChange={(e) => onSoundEffectsChange(e, index)}
          />
        </div>
      </div>

      {/* Add voice selection dropdown */}
      {shot.hasDialogue && (
        <div className="mt-2">
          <select
            value={shot.voiceId || ""}
            onChange={(e) => onVoiceSelect(e, index)}
            className="w-full bg-background border border-input rounded p-2 text-sm text-foreground"
          >
            <option value="">Select voice</option>
            <option value="21m00Tcm4TlvDq8ikWAM">Rachel</option>
            <option value="AZnzlk1XvdvUeBnXmlld">Domi</option>
            <option value="EXAVITQu4vr4xnSDxMaL">Bella</option>
            <option value="ErXwobaYiN019PkySvjV">Antoni</option>
            <option value="MF3mGyEYCl7XYWbV9V6O">Elli</option>
            <option value="TxGEqnHWrfWFTfGW9XjX">Josh</option>
            <option value="VR6AewLTigWG4xSOukaG">Arnold</option>
            <option value="pNInz6obpgDQGcFmaJgB">Adam</option>
            <option value="yoZ06aMxZJJ28xfdgOL">Sam</option>
          </select>
        </div>
      )}

      {/* Add lip sync button */}
      {shot.hasDialogue && shot.voiceId && (
        <Button
          onClick={() => onGenerateLipSync(index)}
          className="mt-2"
          disabled={!shot.generatedVideo}
        >
          Generate Lip Sync
        </Button>
      )}
    </div>
  );
});

// Add a display name for better debugging
ShotCard.displayName = 'ShotCard';

export default ShotCard; 