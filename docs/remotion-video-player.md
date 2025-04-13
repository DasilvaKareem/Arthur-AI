# Remotion Video Player Integration

This document explains how we've integrated the Remotion video player (@remotion/player@4.0.286) as our native video player for shot and scene playback.

## Overview

We've replaced the standard HTML5 video element with the professional-grade Remotion Player to provide:

1. Better video playback controls
2. Consistent playback across browsers
3. Professional-looking timeline scrubbing
4. Support for frame-by-frame navigation

## Components

### 1. ShotVideoPlayer

The `ShotVideoPlayer` component wraps the Remotion Player for individual shots. It provides:

- Clean, minimalist player interface
- Overlay information for shot type and description
- Consistent playback controls

Usage example:
```jsx
<ShotVideoPlayer
  videoUrl={shot.generatedVideo}
  controls={true}
  autoPlay={false}
  loop={true}
  overlayInfo={{
    title: `Shot ${index}: ${shot.type}`,
    description: shot.description
  }}
/>
```

### 2. RemotionTimeline 

The `RemotionTimeline` component provides a full scene editing experience:

- Preview the entire scene as a composition
- Adjust timing for each shot
- Render the final video

## Installation

The Remotion packages should be installed at version 4.0.286 for compatibility. Run the installation script:

```bash
chmod +x install-remotion.sh
./install-remotion.sh
```

Or install manually:

```bash
npm install @remotion/player@4.0.286 remotion@4.0.286
```

## Implementation Details

1. **ShotVideoPlayer**: Located at `components/project/ShotVideoPlayer.tsx`
   - Wraps individual videos in a Remotion composition
   - Provides consistent UI for all video previews

2. **Video Player Integration**:
   - Used in shot previews on the main storyboard
   - Used in scene video previews in the sidebar
   - Used in the Remotion timeline for rendering full scenes

## Customizing the Player

You can customize the player behavior by passing different props:

```jsx
<ShotVideoPlayer
  videoUrl={videoUrl}
  controls={true}   // Show/hide player controls
  autoPlay={false}  // Auto-play on load
  loop={true}       // Loop the video
  clickToPlay={true} // Click on video to play/pause
  className="custom-class" // Add custom CSS classes
/>
```

## Troubleshooting

If you encounter issues with the video player:

1. Make sure all Remotion packages are at version 4.0.286
2. Check browser console for any errors
3. Try using `loop={false}` if videos are stuttering on repeat
4. For performance issues, reduce video resolution or use compressed videos

## Learn More

- [Remotion Player Documentation](https://www.remotion.dev/docs/player)
- [Remotion Compositions](https://www.remotion.dev/docs/the-fundamentals) 