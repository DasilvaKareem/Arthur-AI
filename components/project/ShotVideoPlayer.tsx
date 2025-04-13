import React, { useEffect, useRef, useState } from 'react';

interface ShotVideoPlayerProps {
  videoUrl: string;
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
  className = '',
  autoPlay = false,
  loop = true,
  controls = true,
  overlayInfo,
  clickToPlay = true
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isValidUrl, setIsValidUrl] = useState<boolean>(true);
  
  useEffect(() => {
    // Log the video URL for debugging
    console.log("ShotVideoPlayer received URL:", videoUrl);
    
    // Basic URL validation
    const isValidVideoUrl = videoUrl && 
      (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'));
    
    setIsValidUrl(!!isValidVideoUrl);
  }, [videoUrl]);
  
  const handleVideoClick = () => {
    if (clickToPlay && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Don't try to render video if URL is invalid
  if (!isValidUrl) {
    return (
      <div className={`relative overflow-hidden ${className} bg-black/90 flex flex-col items-center justify-center text-white`}>
        <div className="p-4 text-center">
          <p className="text-red-400 mb-2">⚠️ Video URL Invalid</p>
          <p className="text-xs opacity-70 mb-1">{videoUrl || "No URL provided"}</p>
          <p className="text-xs opacity-70">Please check console for details</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
    >
      <video 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        loop={loop}
        controls={controls}
        onClick={handleVideoClick}
        playsInline
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