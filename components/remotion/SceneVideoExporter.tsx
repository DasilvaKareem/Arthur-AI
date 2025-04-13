import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { SceneComposition } from './SceneComposition';
import { Button } from '../ui/button';
import { FilmIcon, DownloadIcon, Loader2 } from 'lucide-react';
import type { Scene, Shot } from '../../types/shared';

interface SceneVideoExporterProps {
  scene: Scene;
  storyId: string;
}

// Create a wrapper with correct typing for Remotion Player
const SceneVideoWrapper = (props: Record<string, unknown>) => {
  return <SceneComposition 
    shots={(props.shots as Shot[]) || []} 
    title={(props.title as string) || ''} 
    shotDurations={(props.shotDurations as Record<string, number>) || {}} 
  />;
};

export const SceneVideoExporter: React.FC<SceneVideoExporterProps> = ({ scene, storyId }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // Calculate duration based on shots
  const durationInFrames = 60 + (scene.shots.length * 150); // Title + all shots

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Call the API to render the video
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          sceneId: scene.id,
          composition: 'SceneVideo',
          title: scene.title,
          shots: scene.shots,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start rendering');
      }
      
      const data = await response.json();
      const renderId = data.id;
      
      // Poll for render status
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/render/status?id=${renderId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'done') {
          clearInterval(pollInterval);
          setExportProgress(100);
          setExportedVideoUrl(statusData.url);
          setIsExporting(false);
        } else if (statusData.status === 'error') {
          clearInterval(pollInterval);
          throw new Error(statusData.error || 'Rendering failed');
        } else {
          // Update progress
          setExportProgress(statusData.progress || 0);
        }
      }, 2000);
    } catch (error) {
      console.error('Error rendering video:', error);
      setIsExporting(false);
      alert('Failed to render video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-video border border-border rounded-lg overflow-hidden relative">
        {scene.shots.length > 0 ? (
          <Player
            component={SceneVideoWrapper}
            durationInFrames={durationInFrames}
            fps={30}
            compositionWidth={1920}
            compositionHeight={1080}
            style={{
              width: '100%',
              height: '100%',
            }}
            controls
            inputProps={{
              shots: scene.shots,
              title: scene.title,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
            No shots available to render
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Scene Video Preview</h3>
        
        <div className="flex gap-2">
          {exportedVideoUrl && (
            <Button variant="outline" onClick={() => window.open(exportedVideoUrl, '_blank')}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
          
          <Button 
            onClick={handleExport} 
            disabled={isExporting || scene.shots.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {exportProgress > 0 ? `Exporting ${exportProgress.toFixed(0)}%` : 'Starting export...'}
              </>
            ) : (
              <>
                <FilmIcon className="mr-2 h-4 w-4" />
                Export Scene Video
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}; 