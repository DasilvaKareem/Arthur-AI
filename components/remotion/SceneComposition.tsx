import React, { useEffect, useRef } from 'react';
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  Audio
} from 'remotion';
import type { Shot } from '../../types/shared';

// Default shot duration in frames (at 30fps, 5 seconds = 150 frames)
const DEFAULT_SHOT_DURATION = 150;

interface SceneCompositionProps {
  shots: Shot[];
  title: string;
  shotDurations?: Record<string, number>;
  audioVolume?: number; // Volume for dialogue audio (0-1)
  musicVolume?: number; // Volume for background music (0-1)
}

// Scene title component
const SceneTitle: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 100 },
  });
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1
        style={{
          color: 'white',
          fontSize: 80,
          textAlign: 'center',
          opacity,
          fontFamily: 'SF Pro Display, system-ui, sans-serif',
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
};

export const SceneComposition: React.FC<SceneCompositionProps> = ({ 
  shots, 
  title,
  shotDurations = {},
  audioVolume = 0.8, // Default to 80%
  musicVolume = 0.5  // Default to 50%
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Log audio volume settings from props
  console.log("SceneComposition audio settings:", { audioVolume, musicVolume });
  
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Scene title at the beginning */}
      <Sequence durationInFrames={60}>
        <SceneTitle title={title} />
      </Sequence>
      
      {/* Render each shot in sequence */}
      {shots.map((shot, index) => {
        // Use custom duration if available, otherwise use default
        const shotDuration = shotDurations[shot.id] || DEFAULT_SHOT_DURATION;
        
        // Calculate start frame based on previous shots' durations
        let startFrame = 60; // Start after title (60 frames)
        for (let i = 0; i < index; i++) {
          startFrame += shotDurations[shots[i].id] || DEFAULT_SHOT_DURATION;
        }
        
        return (
          <Sequence from={startFrame} durationInFrames={shotDuration} key={shot.id}>
            <ShotSequence shot={shot} index={index} audioVolume={audioVolume} musicVolume={musicVolume} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Component for rendering a single shot
const ShotSequence: React.FC<{ 
  shot: Shot; 
  index: number;
  audioVolume?: number;
  musicVolume?: number;
}> = ({ 
  shot, 
  index,
  audioVolume = 0.8,
  musicVolume = 0.5
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Transition animation using spring
  const opacity = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });
  
  // Use the generated image if available or a placeholder
  const imageUrl = shot.generatedImage || 'https://via.placeholder.com/1920x1080?text=No+Image';
  
  // ENHANCED AUDIO DEBUGGING
  console.log(`SHOT ${index + 1} (${shot.id}) FULL DATA:`, JSON.stringify(shot, null, 2));
  
  // Fix potential null/undefined issues with audio sources
  const audioSource = shot.lipSyncAudio || shot.dialogueAudio || null;
  const hasSoundEffects = shot.hasSoundEffects && !!shot.soundEffectsAudio;
  
  // Log audio info
  console.log(`Shot ${index + 1} audio details:`, {
    hasDialogue: shot.hasDialogue,
    dialogueAudio: shot.dialogueAudio,
    lipSyncAudio: shot.lipSyncAudio,
    finalAudioSource: audioSource,
    hasSoundEffects: shot.hasSoundEffects,
    soundEffectsAudio: shot.soundEffectsAudio,
    willPlaySoundEffects: hasSoundEffects
  });
  
  // Check for video in this priority: videoUrl > generatedVideo > image
  if (shot.videoUrl || shot.generatedVideo) {
    const videoSource = shot.videoUrl || shot.generatedVideo || '';
    console.log('Using video source:', videoSource);
    
    // Create audio components based on what's available
    const DialogueAudioComponent = audioSource ? (
      <React.Fragment>
        {/* Wrap Audio component in try-catch fallback */}
        {(() => {
          try {
            console.log(`Attempting to load audio from: ${audioSource} with volume: ${audioVolume}`);
            return (
              <Audio 
                src={audioSource} 
                volume={audioVolume}
              />
            );
          } catch (error) {
            console.error(`Error loading audio for shot ${index + 1}:`, error);
            return null;
          }
        })()}
      </React.Fragment>
    ) : null;
    
    const SoundEffectsComponent = hasSoundEffects && shot.soundEffectsAudio ? (
      <React.Fragment>
        {/* Wrap Audio component in try-catch fallback */}
        {(() => {
          try {
            console.log(`Attempting to load sound effects from: ${shot.soundEffectsAudio} with volume: ${audioVolume * 0.7}`);
            return (
              <Audio 
                src={shot.soundEffectsAudio || ''} 
                volume={audioVolume * 0.7} // Sound effects slightly quieter than dialogue
              />
            );
          } catch (error) {
            console.error(`Error loading sound effects for shot ${index + 1}:`, error);
            return null;
          }
        })()}
      </React.Fragment>
    ) : null;
    
    return (
      <AbsoluteFill style={{ opacity }}>
        {/* Video component */}
        <video
          src={videoSource}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          muted={true} // Always mute the video since we're providing audio separately
          autoPlay
          playsInline
          loop
        />
        
        {/* Audio components */}
        {DialogueAudioComponent}
        {SoundEffectsComponent}
        
        {/* Shot info overlay */}
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: 40,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px 20px',
          borderRadius: 5,
        }}>
          <p style={{ color: 'white', margin: 0, fontSize: 24 }}>
            {`Shot ${index + 1}: ${shot.type}`}
          </p>
          <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: 18, maxWidth: 600 }}>
            {shot.description}
          </p>
          {audioSource && (
            <p style={{ color: 'lightblue', margin: '5px 0 0 0', fontSize: 14 }}>
              🔊 Audio: {shot.dialogue || "No dialogue text"}
              {audioSource ? ` (${audioSource.substring(0, 40)}...)` : " (missing URL)"}
            </p>
          )}
        </div>
      </AbsoluteFill>
    );
  }
  
  console.log('Falling back to image:', imageUrl);
  
  // Create audio components based on what's available
  const DialogueAudioComponent = audioSource ? (
    <React.Fragment>
      {/* Wrap Audio component in try-catch fallback */}
      {(() => {
        try {
          console.log(`Attempting to load audio from: ${audioSource} with volume: ${audioVolume}`);
          return (
            <Audio 
              src={audioSource} 
              volume={audioVolume}
            />
          );
        } catch (error) {
          console.error(`Error loading audio for shot ${index + 1}:`, error);
          return null;
        }
      })()}
    </React.Fragment>
  ) : null;
  
  const SoundEffectsComponent = hasSoundEffects && shot.soundEffectsAudio ? (
    <React.Fragment>
      {/* Wrap Audio component in try-catch fallback */}
      {(() => {
        try {
          console.log(`Attempting to load sound effects from: ${shot.soundEffectsAudio} with volume: ${audioVolume * 0.7}`);
          return (
            <Audio 
              src={shot.soundEffectsAudio || ''} 
              volume={audioVolume * 0.7} // Sound effects slightly quieter than dialogue
            />
          );
        } catch (error) {
          console.error(`Error loading sound effects for shot ${index + 1}:`, error);
          return null;
        }
      })()}
    </React.Fragment>
  ) : null;
  
  // Fallback to static image if no video
  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={imageUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      
      {/* Audio components */}
      {DialogueAudioComponent}
      {SoundEffectsComponent}
      
      {/* Shot info overlay */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 20px',
        borderRadius: 5,
      }}>
        <p style={{ color: 'white', margin: 0, fontSize: 24 }}>
          {`Shot ${index + 1}: ${shot.type}`}
        </p>
        <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: 18, maxWidth: 600 }}>
          {shot.description}
        </p>
        {audioSource && (
          <p style={{ color: 'lightblue', margin: '5px 0 0 0', fontSize: 14 }}>
            🔊 Audio: {shot.dialogue || "No dialogue text"}
            {audioSource ? ` (${audioSource.substring(0, 40)}...)` : " (missing URL)"}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
}; 