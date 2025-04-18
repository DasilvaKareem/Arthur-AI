"use client";

import React, { useState } from 'react';
import { Button } from "../ui/button";
import { MessageSquare, Music, Volume2, Trash } from "lucide-react";
import type { Shot } from '../../types/shared';
import { useShotContext } from './ShotContext';
import { ShotMediaPreview } from './ShotMediaPreview';
import { UnifiedSoundEffectsDialog } from './UnifiedSoundEffectsDialog';
import { UnifiedDialogueDialog } from './UnifiedDialogueDialog';
import { AudioService } from '../../lib/services/audioService';
import { toast } from 'sonner';

interface EnhancedShotCardProps {
  shot: Shot;
  index: number;
}

const EnhancedShotCard: React.FC<EnhancedShotCardProps> = React.memo(({
  shot,
  index
}) => {
  const {
    isImageLoading,
    isVideoLoading,
    generateImage,
    generateVideo,
    updateShot,
    storyId,
    sceneId,
    generateLipSync,
    deleteShot
  } = useShotContext();

  const [showSoundEffects, setShowSoundEffects] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAudioPreview, setShowAudioPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSoundEffectsSave = async (value: string) => {
    try {
      await updateShot(shot.id, {
        soundEffects: value,
        hasSoundEffects: value.trim().length > 0
      });
      toast.success("Sound effects saved");
    } catch (error) {
      console.error("Error saving sound effects:", error);
      toast.error("Failed to save sound effects");
    }
  };

  const handleDialogueSave = async (value: string, voiceId: string) => {
    try {
      await updateShot(shot.id, {
        dialogue: value,
        voiceId,
        hasDialogue: value.trim().length > 0
      });
      toast.success("Dialogue saved");
    } catch (error) {
      console.error("Error saving dialogue:", error);
      toast.error("Failed to save dialogue");
    }
  };

  const handleGenerateSoundEffects = async (soundEffects?: string) => {
    const currentSoundEffects = soundEffects || shot.soundEffects;

    if (!currentSoundEffects) {
      toast.error("Please add sound effects description first");
      return;
    }

    if (!storyId || !sceneId) {
      toast.error("Missing story or scene information");
      return;
    }
    
    try {
      setIsGeneratingAudio(true);
      console.log('🎵 Generating sound effects audio for shot:', {
        shotId: shot.id,
        soundEffects: currentSoundEffects,
        storyId,
        sceneId
      });
      
      const result = await AudioService.generateSoundEffects(
        currentSoundEffects,
        storyId,
        sceneId,
        shot.id
      );
      
      if (!result.success || !result.audioUrl) {
        throw new Error("Failed to generate sound effects audio");
      }
      
      console.log('🎵 Sound effects audio generated:', {
        shotId: shot.id,
        audioUrl: result.audioUrl
      });
      
      if (result.audioUrl) {
        await updateShot(shot.id, {
          soundEffectsAudio: result.audioUrl,
          hasSoundEffects: true
        });
        
        setShowAudioPreview(true);
        
        console.log('🎵 Sound effects audio saved to shot:', {
          shotId: shot.id,
          soundEffectsAudio: result.audioUrl
        });
        
        toast.success("Sound effects audio generated");
        return result.audioUrl;
      } else {
        throw new Error("No audio URL returned from generation");
      }
    } catch (error) {
      console.error("Error generating sound effects audio:", error);
      toast.error("Failed to generate sound effects audio");
      throw error;
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateDialogue = async (dialogue?: string, voiceId?: string) => {
    const currentDialogue = dialogue || shot.dialogue;
    const currentVoiceId = voiceId || shot.voiceId;

    if (!currentDialogue || !currentVoiceId) {
      toast.error("Please add dialogue text and select a voice first");
      return;
    }

    if (!storyId || !sceneId) {
      toast.error("Missing story or scene information");
      return;
    }
    
    try {
      setIsGeneratingAudio(true);
      console.log('🎤 Generating dialogue audio for shot:', {
        shotId: shot.id,
        dialogue: currentDialogue,
        voiceId: currentVoiceId,
        storyId,
        sceneId
      });
      
      const result = await AudioService.generateDialogue(
        currentDialogue, 
        currentVoiceId,
        storyId,
        sceneId,
        shot.id
      );
      
      if (!result.success || !result.audioUrl) {
        throw new Error("Failed to generate dialogue audio");
      }
      
      console.log('🎤 Dialogue audio generated:', {
        shotId: shot.id,
        audioUrl: result.audioUrl
      });
      
      if (result.audioUrl) {
        await updateShot(shot.id, {
          dialogueAudio: result.audioUrl,
          hasDialogue: true
        });
        
        setShowAudioPreview(true);
        
        console.log('🎤 Dialogue audio saved to shot:', {
          shotId: shot.id,
          dialogueAudio: result.audioUrl
        });
        
        toast.success("Dialogue audio generated");
        return result.audioUrl;
      } else {
        throw new Error("No audio URL returned from generation");
      }
    } catch (error) {
      console.error("Error generating dialogue audio:", error);
      toast.error("Failed to generate dialogue audio");
      throw error;
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDeleteShot = async () => {
    if (!storyId || !sceneId) {
      toast.error("Missing story or scene information");
      return;
    }

    try {
      setIsDeleting(true);
      
      // Use the context's deleteShot function
      await deleteShot(shot.id);
      
      toast.success("Shot deleted successfully");
    } catch (error) {
      console.error("Error deleting shot:", error);
      toast.error("Failed to delete shot");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="relative w-full h-full pb-16">
      {/* Shot Number Badge */}
      <div className="absolute top-2 left-2 bg-primary/80 text-white text-sm px-2 py-1 rounded-full z-20 shadow-md">
        Shot {index + 1}
      </div>
      
      {/* Shot content */}
      <div className="w-full h-full">
        {/* Media Preview */}
        <div className="relative">
          <ShotMediaPreview
            image={shot.generatedImage}
            video={shot.generatedVideo}
            type={shot.type}
            isLoading={isImageLoading}
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
          />
          
          {/* Delete Shot Button - Now inside the Media Preview */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-3 right-3 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400 rounded-full shadow-md z-30 hover:animate-pulse"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            title="Delete shot"
          >
            {isDeleting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            ) : (
              <Trash className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Shot Details */}
        <div className="space-y-3">
          <textarea
            id={`shot-${index}-prompt`}
            className="w-full text-sm border rounded p-2 bg-background text-foreground border-input"
            rows={3}
            placeholder="Describe this shot..."
            defaultValue={shot.description}
            onChange={(e) => {
              // Handle through context
            }}
          />

          <div className="flex flex-wrap gap-2">
            {shot.hasDialogue && (
              <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">Dialogue</span>
            )}
            {shot.hasNarration && (
              <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">Narration</span>
            )}
            {shot.hasSoundEffects && (
              <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">SFX</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const promptElement = document.getElementById(`shot-${index}-prompt`) as HTMLTextAreaElement;
                if (promptElement && promptElement.value.trim()) {
                  generateImage(index, promptElement.value);
                }
              }}
            >
              Regenerate Image
            </Button>
            {shot.generatedImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateVideo(index)}
              >
                Generate Video
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sound Effects Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-white"
        onClick={() => setShowSoundEffects(true)}
      >
        <Music className={`h-4 w-4 ${shot.soundEffectsAudio ? 'text-green-500' : ''}`} />
      </Button>

      {/* Dialogue Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-10 text-white"
        onClick={() => setShowDialogue(true)}
      >
        <MessageSquare className={`h-4 w-4 ${shot.dialogueAudio ? 'text-green-500' : ''}`} />
      </Button>

      {/* Audio Preview */}
      {(shot.soundEffectsAudio || shot.dialogueAudio) && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-18 text-white"
            onClick={() => setShowAudioPreview(!showAudioPreview)}
          >
            <Volume2 className="h-4 w-4" />
          </Button>

          {/* Audio Preview Panel */}
          {showAudioPreview && (
            <div className="absolute top-12 right-2 bg-background/90 p-3 rounded-lg border border-border shadow-lg space-y-2">
              {shot.dialogueAudio && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Dialogue</span>
                  </div>
                  <audio
                    src={shot.dialogueAudio}
                    controls
                    className="w-full h-8"
                  />
                </div>
              )}
              {shot.soundEffectsAudio && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Sound Effects</span>
                  </div>
                  <audio
                    src={shot.soundEffectsAudio}
                    controls
                    className="w-full h-8"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Sound Effects Dialog */}
      {showSoundEffects && (
        <UnifiedSoundEffectsDialog
          onClose={() => setShowSoundEffects(false)}
          initialValue={shot.soundEffects || ""}
          soundEffectsAudio={shot.soundEffectsAudio}
          onSave={handleSoundEffectsSave}
          onGenerateAudio={handleGenerateSoundEffects}
        />
      )}

      {/* Dialogue Dialog */}
      {showDialogue && (
        <UnifiedDialogueDialog
          onClose={() => setShowDialogue(false)}
          initialValue={shot.dialogue || ""}
          initialVoiceId={shot.voiceId || "21m00Tcm4TlvDq8ikWAM"}
          dialogueAudio={shot.dialogueAudio}
          onSave={handleDialogueSave}
          onGenerateAudio={handleGenerateDialogue}
          onGenerateLipSync={() => generateLipSync(index)}
          isLoading={isGeneratingAudio}
          hasVideo={!!shot.generatedVideo}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center z-40 p-4 rounded-lg border-2 border-red-500">
          <Trash className="h-8 w-8 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Delete Shot {index + 1}?</h3>
          <p className="text-center text-sm text-muted-foreground mb-4">
            This action cannot be undone. All shot data including audio and video will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteShot}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedShotCard.displayName = 'EnhancedShotCard';

export default EnhancedShotCard; 