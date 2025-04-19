import React, { useState } from 'react';
import { Button } from "../ui/button";
import { X, Music, Save } from "lucide-react";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UnifiedSoundEffectsDialogProps {
  onClose: () => void;
  initialValue?: string;
  soundEffectsAudio?: string | null;
  onSave: (value: string) => Promise<void>;
  onGenerateAudio: (value: string) => Promise<string | undefined>;
}

export function UnifiedSoundEffectsDialog({
  onClose,
  initialValue = "",
  soundEffectsAudio,
  onSave,
  onGenerateAudio
}: UnifiedSoundEffectsDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!value.trim()) {
      setError("Please enter a description for the sound effects");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // First save the text
      await onSave(value);
      
      // Then generate audio
      const audioUrl = await onGenerateAudio(value);
      
      if (!audioUrl) {
        throw new Error("Failed to generate audio");
      }
      
      toast.success("Sound effects generated successfully");
    } catch (err) {
      console.error("Error generating sound effects:", err);
      setError(err instanceof Error ? err.message : "Failed to generate sound effects");
      toast.error("Failed to generate sound effects");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Sound Effects</DialogTitle>
          <DialogDescription>
            Describe the sound effects you want to generate for this shot.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sound-effects">Sound Effects Description</Label>
            <Textarea
              id="sound-effects"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Describe the sound effects you want to generate..."
              className="min-h-[100px]"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !value.trim()}
          >
            {isSaving ? "Saving..." : soundEffectsAudio ? "Regenerate" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 