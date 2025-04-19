import { storage } from '../firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface AudioGenerationResult {
  audioUrl: string;
  processedPrompt?: string;
  success?: boolean;
}

export class AudioService {
  static async generateSoundEffects(
    prompt: string,
    storyId: string,
    sceneId: string,
    shotId: string
  ): Promise<AudioGenerationResult> {
    try {
      console.log('🎵 Kareem - AudioService.generateSoundEffects called with:', {
        prompt,
        storyId,
        sceneId,
        shotId
      });

      if (!prompt.trim()) {
        throw new Error("Sound effects prompt is required");
      }

      if (!storyId || !sceneId || !shotId) {
        throw new Error("Missing required IDs for sound effects generation");
      }

      const response = await fetch("/api/sound-effects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎵 Kareem - Sound Effects API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to generate sound effects: ${errorText}`);
      }

      const data = await response.json();
      console.log('🎵 Kareem - Sound Effects API response:', data);

      if (!data.audio) {
        console.error('🎵 Kareem - No audio data in response:', data);
        throw new Error("No audio data received from sound effects API");
      }

      // Upload the audio to Firebase Storage with proper path structure
      console.log('🎵 Kareem - Uploading audio to Firebase Storage...');
      const audioUrl = await this.uploadAudioToStorage(
        data.audio,
        "audio/mp3",
        "sound-effects",
        storyId,
        sceneId,
        shotId
      );

      console.log('🎵 Kareem - Audio uploaded successfully:', audioUrl);

      return {
        audioUrl,
        processedPrompt: prompt,
        success: true
      };
    } catch (error) {
      console.error('🎵 Kareem - Error in generateSoundEffects:', error);
      throw error;
    }
  }

  static async generateDialogue(
    text: string,
    voiceId: string,
    storyId: string,
    sceneId: string,
    shotId: string
  ): Promise<AudioGenerationResult> {
    try {
      console.log('🎤 Kareem - AudioService.generateDialogue called with:', {
        text,
        voiceId,
        storyId,
        sceneId,
        shotId
      });

      if (!text.trim()) {
        throw new Error("Dialogue text is required");
      }

      if (!storyId || !sceneId || !shotId) {
        throw new Error("Missing required IDs for dialogue generation");
      }

      console.log('🎤 Kareem - Making TTS API request...');
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId,
          modelId: "eleven_multilingual_v2"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎤 Kareem - TTS API error:', errorText);
        throw new Error("Failed to generate dialogue audio");
      }

      const data = await response.json();
      console.log('🎤 Kareem - TTS API response:', data);

      if (!data.audio) {
        throw new Error("No audio data received");
      }

      // Upload the audio to Firebase Storage with proper path structure
      console.log('🎤 Kareem - Uploading audio to Firebase Storage...');
      const audioUrl = await this.uploadAudioToStorage(
        data.audio,
        "audio/mp3",
        "dialogue",
        storyId,
        sceneId,
        shotId
      );

      console.log('🎤 Kareem - Audio uploaded successfully:', audioUrl);

      return {
        audioUrl,
        success: true
      };
    } catch (error) {
      console.error('🎤 Kareem - Error in generateDialogue:', error);
      throw error;
    }
  }

  private static async uploadAudioToStorage(
    base64Data: string,
    contentType: string,
    type: "sound-effects" | "dialogue",
    storyId?: string,
    sceneId?: string,
    shotId?: string
  ): Promise<string> {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: contentType });
      
      // Create storage reference based on type
      let storageRef;
      if (type === "dialogue" && storyId && sceneId && shotId) {
        // Use structured path for dialogue
        storageRef = ref(storage, `stories/${storyId}/scenes/${sceneId}/shots/${shotId}/dialogue.mp3`);
      } else if (type === "sound-effects" && storyId && sceneId && shotId) {
        // Use structured path for sound effects
        storageRef = ref(storage, `stories/${storyId}/scenes/${sceneId}/shots/${shotId}/sound-effects.mp3`);
      } else {
        throw new Error("Missing required IDs for audio storage");
      }
      
      await uploadBytes(storageRef, blob);
      
      // Get download URL
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading audio to storage:", error);
      throw error;
    }
  }
} 