import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Save, Music, Play } from 'lucide-react';

interface SoundEffectsEditorProps {
  shotId: string;
  initialHasSoundEffects: boolean;
  initialSoundEffects: string;
  soundEffectsAudio?: string | null;
  onSave: (shotId: string, hasSoundEffects: boolean, soundEffects: string) => void;
  onGenerateAudio?: (shotId: string) => void;
  onClose?: () => void;
}

export function SoundEffectsEditor({ 
  shotId,
  initialSoundEffects,
  soundEffectsAudio,
  onSave,
  onGenerateAudio,
  onClose
}: SoundEffectsEditorProps) {
  const [soundEffects, setSoundEffects] = useState(initialSoundEffects || '');
  const [isDirty, setIsDirty] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSoundEffects(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    // Only save if there are actual changes
    if (isDirty) {
      // If soundEffects has content, set hasSoundEffects to true
      const hasSoundEffects = soundEffects.trim().length > 0;
      onSave(shotId, hasSoundEffects, soundEffects);
      setIsDirty(false);
    }
    
    // Close if requested
    if (onClose) {
      onClose();
    }
  };

  const handleGenerateAudio = () => {
    if (onGenerateAudio) {
      onGenerateAudio(shotId);
    }
  };

  const hasAudio = !!soundEffectsAudio;

  return (
    <div className="space-y-2 p-2 border rounded-md bg-background">
      <textarea
        value={soundEffects}
        onChange={handleTextChange}
        placeholder="Describe sound effects here..."
        className="w-full min-h-[60px] p-1.5 border rounded-md resize-none text-xs"
      />
      
      {/* Example sound effects */}
      <div className="text-xs text-muted-foreground mb-1">
        Examples: "birds chirping", "door creaking", "thunder", "footsteps"
      </div>
      
      {/* Audio preview if available */}
      {hasAudio && (
        <div className="mb-2">
          <div className="text-xs font-medium mb-1 flex items-center">
            <Music className="h-3 w-3 mr-1 text-green-500" /> 
            Audio available
          </div>
          <audio 
            src={soundEffectsAudio || undefined} 
            controls 
            className="w-full h-8"
          />
        </div>
      )}
      
      <div className="flex justify-between items-center">
        {/* Generate Audio button - only show if we have saved sound effects */}
        {onGenerateAudio && soundEffects.trim() && (
          <Button 
            onClick={handleGenerateAudio} 
            className="flex items-center gap-1"
            size="sm"
            variant={hasAudio ? "outline" : "default"}
          >
            <Play className="h-3 w-3" />
            {hasAudio ? "Regenerate" : "Generate"} Audio
          </Button>
        )}
        
        {/* Save button */}
        <Button 
          onClick={handleSave} 
          disabled={!isDirty}
          className="flex items-center gap-1"
          size="sm"
        >
          <Save className="h-3 w-3" />
          Save
        </Button>
      </div>
    </div>
  );
} 