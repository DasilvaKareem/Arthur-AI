import React from 'react';
import Image from 'next/image';
import { Button } from "../ui/button";
import { Camera, Play, X } from "lucide-react";
import ShotVideoPlayer from './ShotVideoPlayer';

interface ShotMediaPreviewProps {
  image?: string | null;
  video?: string | null;
  lipSyncVideo?: string | null;
  type: string;
  isLoading: boolean;
  isPlaying: boolean;
  onPlayToggle: () => void;
  width?: number;
}

export const ShotMediaPreview: React.FC<ShotMediaPreviewProps> = ({
  image,
  video,
  lipSyncVideo,
  type,
  isLoading,
  isPlaying,
  onPlayToggle,
  width = 825
}) => {
  return (
    <div 
      className="relative aspect-video mb-4 rounded-lg overflow-hidden"
      style={{ width: `${width}px`, margin: '0 auto' }}
    >
      {isLoading ? (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm mt-2">Generating image...</p>
          </div>
        </div>
      ) : image ? (
        <div className="absolute inset-0">
          <Image
            src={image}
            alt={`Shot type: ${type}`}
            fill
            className="object-cover"
          />
          {(video || lipSyncVideo) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Button 
                size="icon" 
                className="w-12 h-12 rounded-full bg-black/70 hover:bg-black/90"
                onClick={onPlayToggle}
              >
                {isPlaying ? <X className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <Camera className="h-10 w-10 text-muted-foreground" />
        </div>
      )}

      {/* Shot Type Badge */}
      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {type}
      </div>

      {/* Video Player Overlay */}
      {isPlaying && (video || lipSyncVideo) && (
        <div className="absolute inset-0 z-20">
          <ShotVideoPlayer
            videoUrl={video || ''}
            lipSyncVideo={lipSyncVideo || undefined}
            className="w-full h-full"
            controls={true}
            autoPlay={true}
            loop={true}
            overlayInfo={{
              title: `Shot type: ${type}`,
              description: ''
            }}
          />
        </div>
      )}
    </div>
  );
}; 