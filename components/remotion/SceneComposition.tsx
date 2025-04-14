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
  shotDurations = {} 
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  
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
            <ShotSequence shot={shot} index={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Component for rendering a single shot
const ShotSequence: React.FC<{ shot: Shot; index: number }> = ({ shot, index }) => {
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
  
  console.log('Shot data:', {
    id: shot.id,
    videoUrl: shot.videoUrl,
    generatedVideo: shot.generatedVideo,
    imageUrl
  });
  
  // Check for video in this priority: videoUrl > generatedVideo > image
  if (shot.videoUrl || shot.generatedVideo) {
    const videoSource = shot.videoUrl || shot.generatedVideo || '';
    console.log('Using video source:', videoSource);
    
    return (
      <AbsoluteFill style={{ opacity }}>
        <video
          src={videoSource}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          muted
          autoPlay
          playsInline
          loop
        />
        
        {/* Add dialogue audio if available */}
        {shot.lipSyncAudio && (
          <Audio src={shot.lipSyncAudio} />
        )}
        
        {/* Add sound effects if available */}
        {shot.hasSoundEffects && shot.soundEffectsAudio && (
          <Audio 
            src={shot.soundEffectsAudio} 
            volume={0.7} // Keep sound effects a bit quieter than dialogue
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
        </div>
      </AbsoluteFill>
    );
  }
  
  console.log('Falling back to image:', imageUrl);
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
      
      {/* Add dialogue audio if available */}
      {shot.lipSyncAudio && (
        <Audio src={shot.lipSyncAudio} />
      )}
      
      {/* Add sound effects if available */}
      {shot.hasSoundEffects && shot.soundEffectsAudio && (
        <Audio 
          src={shot.soundEffectsAudio} 
          volume={0.7} // Keep sound effects a bit quieter than dialogue
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
      </div>
    </AbsoluteFill>
  );
}; 