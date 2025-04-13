import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Save } from 'lucide-react';

interface SoundEffectsEditorProps {
  shotId: string;
  initialHasSoundEffects: boolean;
  initialSoundEffects: string;
  onSave: (shotId: string, hasSoundEffects: boolean, soundEffects: string) => void;
  onClose?: () => void;
}

export function SoundEffectsEditor({ 
  shotId,
  initialSoundEffects,
  onSave,
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

  return (
    <div className="space-y-2 p-2 border rounded-md bg-background">
      
      <textarea
        value={soundEffects}
        onChange={handleTextChange}
        placeholder="Describe sound effects here..."
        className="w-full min-h-[60px] p-1.5 border rounded-md resize-none text-xs"
      />
      
      <div className="flex justify-end items-center">
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