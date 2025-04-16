import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VoiceSelect } from './VoiceSelect';
import { toast } from 'sonner';

interface UnifiedDialogueDialogProps {
  onClose: () => void;
  initialValue?: string;
  initialVoiceId?: string;
  dialogueAudio?: string | null;
  onSave: (value: string, voiceId: string) => Promise<void>;
  onGenerateAudio: (value: string, voiceId: string) => Promise<string | undefined>;
  onGenerateLipSync?: () => void;
  isLoading?: boolean;
  hasVideo?: boolean;
}

export function UnifiedDialogueDialog({
  onClose,
  initialValue = "",
  initialVoiceId = "21m00Tcm4TlvDq8ikWAM",
  dialogueAudio,
  onSave,
  onGenerateAudio,
  onGenerateLipSync,
  isLoading = false,
  hasVideo = false
}: UnifiedDialogueDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [voiceId, setVoiceId] = useState(initialVoiceId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!value.trim()) {
      setError("Please enter dialogue text");
      return;
    }

    if (!voiceId) {
      setError("Please select a voice");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // First save the text and voice selection
      await onSave(value, voiceId);
      
      // Then generate audio
      const audioUrl = await onGenerateAudio(value, voiceId);
      
      if (!audioUrl) {
        throw new Error("Failed to generate audio");
      }
      
      toast.success("Dialogue generated successfully");
    } catch (err) {
      console.error("Error generating dialogue:", err);
      setError(err instanceof Error ? err.message : "Failed to generate dialogue");
      toast.error("Failed to generate dialogue");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Dialogue</DialogTitle>
          <DialogDescription>
            Enter the dialogue text and select a voice for this shot.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="dialogue">Dialogue Text</Label>
            <Textarea
              id="dialogue"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter the dialogue text..."
              className="min-h-[100px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="voice">Voice</Label>
            <VoiceSelect
              value={voiceId}
              onChange={setVoiceId}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          {dialogueAudio && hasVideo && onGenerateLipSync && (
            <Button
              variant="outline"
              onClick={onGenerateLipSync}
              disabled={isSaving}
            >
              Generate Lip Sync
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !value.trim() || !voiceId}
          >
            {isSaving ? "Saving..." : dialogueAudio ? "Regenerate" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 