import { Composition } from 'remotion';
import { SceneComposition } from './SceneComposition';
import type { Shot } from '../../types/shared';

// Common aspect ratio is 16:9 with common HD resolution
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const VIDEO_FPS = 30;

// Set a generous maximum duration to accommodate varying numbers of shots
// For a scene with 10 shots at 5 seconds each, plus a 2-second title, we need 52 seconds
// At 30fps, this would be 1560 frames, but we'll round up
const MAX_DURATION_IN_FRAMES = 3000;

interface RemotionRootProps {
  shots: Shot[];
  title: string;
}

// Create a wrapper with correct typing
const SceneVideoWrapper = (props: Record<string, unknown>) => {
  return <SceneComposition 
    shots={(props.shots as Shot[]) || []} 
    title={(props.title as string) || ''} 
    shotDurations={(props.shotDurations as Record<string, number>) || {}} 
    audioVolume={(props.audioVolume as number) || 0.8}
    musicVolume={(props.musicVolume as number) || 0.5}
  />;
};

export const RemotionRoot: React.FC<RemotionRootProps> = ({ shots, title }) => {
  // Calculate actual duration based on shots
  // Title (2 seconds) + Each shot (5 seconds)
  const actualDurationInFrames = 60 + shots.length * 150;
  
  return (
    <>
      <Composition
        id="SceneVideo"
        component={SceneVideoWrapper}
        durationInFrames={actualDurationInFrames}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{ shots, title }}
      />
    </>
  );
}; 