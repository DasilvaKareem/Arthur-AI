import React, { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { Video } from 'remotion';

interface ShotVideoPlayerProps {
  videoUrl: string;
  lipSyncVideo?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  overlayInfo?: {
    title?: string;
    description?: string;
  };
  clickToPlay?: boolean;
}

const ShotVideoPlayer: React.FC<ShotVideoPlayerProps> = ({
  videoUrl,
  lipSyncVideo,
  className = '',
  autoPlay = false,
  loop = true,
  controls = true,
  overlayInfo,
  clickToPlay = true
}) => {
  const [isValidUrl, setIsValidUrl] = useState<boolean>(true);
  
  const effectiveVideoUrl = lipSyncVideo || videoUrl;
  
  useEffect(() => {
    // Log the video URL for debugging
    console.log("ShotVideoPlayer using URL:", effectiveVideoUrl);
    
    // Basic URL validation
    const isValidVideoUrl = effectiveVideoUrl && 
      (effectiveVideoUrl.startsWith('http://') || effectiveVideoUrl.startsWith('https://'));
    
    setIsValidUrl(!!isValidVideoUrl);
  }, [effectiveVideoUrl]);
  
  // Don't try to render video if URL is invalid
  if (!isValidUrl) {
    return (
      <div className={`relative overflow-hidden ${className} bg-black/90 flex flex-col items-center justify-center text-white`}>
        <div className="p-4 text-center">
          <p className="text-red-400 mb-2">⚠️ Video URL Invalid</p>
          <p className="text-xs opacity-70 mb-1">{effectiveVideoUrl || "No URL provided"}</p>
          <p className="text-xs opacity-70">Please check console for details</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Player
        component={() => (
          <Video
            src={effectiveVideoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: 'black'
            }}
          />
        )}
        durationInFrames={300} // 10 seconds at 30fps
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{
          width: '100%',
          height: '100%',
        }}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        clickToPlay={clickToPlay}
      />
      
      {overlayInfo && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pointer-events-none">
          {overlayInfo.title && (
            <h3 className="text-white font-medium text-sm">{overlayInfo.title}</h3>
          )}
          {overlayInfo.description && (
            <p className="text-white/80 text-xs mt-1">{overlayInfo.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ShotVideoPlayer; 