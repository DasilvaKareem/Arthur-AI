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
  
  // Add comprehensive URL logging
  console.log('🎬 Kareem - All Remotion Media URLs:', shots.map(shot => ({
    shotId: shot.id,
    urls: {
      video: shot.videoUrl || shot.generatedVideo || null,
      image: shot.generatedImage || null,
      dialogueAudio: shot.dialogueAudio || null,
      lipSyncAudio: shot.lipSyncAudio || null,
      soundEffectsAudio: shot.soundEffectsAudio || null
    }
  })));
  
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
}> = ({ shot, index, audioVolume = 1, musicVolume = 0.3 }) => {
  const opacity = useCurrentFrame() / 30;
  const imageUrl = shot.generatedImage || '';
  
  // Debug audio sources
  console.log(`Shot ${index + 1} audio details:`, {
    dialogueAudio: shot.dialogueAudio,
    soundEffectsAudio: shot.soundEffectsAudio
  });
  
  // Check for video in this priority: videoUrl > generatedVideo > image
  if (shot.videoUrl || shot.generatedVideo) {
    const videoSource = shot.videoUrl || shot.generatedVideo || '';
    console.log('Using video source:', videoSource);
    
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
          muted={true}
          autoPlay
          playsInline
          loop
        />
        
        {/* Audio components - just use dialogueAudio directly if it exists */}
        {shot.dialogueAudio && (
          <Audio 
            src={shot.dialogueAudio} 
            volume={audioVolume}
            startFrom={0}
          />
        )}
        
        {shot.soundEffectsAudio && (
          <Audio 
            src={shot.soundEffectsAudio} 
            volume={audioVolume * 0.7}
            startFrom={0}
          />
        )}
        
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
          {shot.dialogueAudio && (
            <p style={{ color: 'lightblue', margin: '5px 0 0 0', fontSize: 14 }}>
              🔊 Audio: {shot.dialogue || "No dialogue text"}
            </p>
          )}
        </div>
      </AbsoluteFill>
    );
  }
  
  console.log('Falling back to image:', imageUrl);
  
  // Create audio components based on what's available
  const DialogueAudioComponent = shot.dialogueAudio ? (
    <Audio 
      src={shot.dialogueAudio} 
      volume={audioVolume}
    />
  ) : null;
  
  const SoundEffectsComponent = shot.soundEffectsAudio ? (
    <Audio 
      src={shot.soundEffectsAudio} 
      volume={audioVolume * 0.7}
    />
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
        {shot.dialogueAudio && (
          <p style={{ color: 'lightblue', margin: '5px 0 0 0', fontSize: 14 }}>
            🔊 Audio: {shot.dialogue || "No dialogue text"}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
}; 