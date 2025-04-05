export interface Shot {
  id: string;
  type: string;
  description: string;
  hasNarration: boolean;
  hasDialogue: boolean;
  hasSoundEffects: boolean;
  prompt: string;
  narration?: string | null;
  dialogue?: string | null;
  soundEffects?: string | null;
  generatedImage?: string | null;
  generatedVideo?: string | null;
  lipSyncAudio?: string | null;
  lipSyncVideo?: string | null;
  voiceId?: string | null;
  location?: string | null;
  lighting?: string | null;
  weather?: string | null;
}

export interface Scene {
  id: string;
  title: string;
  location: string;
  description: string;
  lighting: string;
  weather: string;
  style: string;
  shots: Shot[];
  generatedVideo?: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  userId: string;
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
} 