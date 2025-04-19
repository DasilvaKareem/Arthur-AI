import React, { useCallback, useEffect, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { AbsoluteFill } from 'remotion';
import { SceneComposition } from './SceneComposition';
import { Button } from '../ui/button';
import { Film, Settings, Save, Download, Loader2, AlertTriangle } from 'lucide-react';
import type { Scene, Shot } from '../../types/shared';

interface RemotionTimelineProps {
  scene: Scene;
  storyId: string;
}

// Create a wrapper component to fix typing issues
const SceneVideoWrapper: React.FC<{
  shots: Shot[];
  title: string;
  shotDurations: Record<string, number>;
  audioVolume?: number;
  musicVolume?: number;
}> = (props) => {
  return <SceneComposition {...props} />;
};

export const RemotionTimeline: React.FC<RemotionTimelineProps> = ({ scene, storyId }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const playerRef = React.useRef<PlayerRef>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Calculate duration based on shots
  const shotDuration = 150; // 5 seconds at 30fps
  const titleDuration = 60; // 2 seconds at 30fps
  
  // State for customizing shots and their durations
  const [customShots, setCustomShots] = useState<Shot[]>(scene.shots);
  const [shotDurations, setShotDurations] = useState<Record<string, number>>(
    Object.fromEntries(scene.shots.map(shot => [shot.id, shotDuration]))
  );

  // Calculate total duration based on all shots
  const totalDurationInFrames = titleDuration + 
    scene.shots.reduce((total, shot) => total + (shotDurations[shot.id] || shotDuration), 0);
  
  // Update custom shots when scene shots change
  useEffect(() => {
    setCustomShots(scene.shots);
    setShotDurations(
      Object.fromEntries(scene.shots.map(shot => [shot.id, shotDuration]))
    );
  }, [scene.shots]);

  // Try to load Remotion and catch any errors
  useEffect(() => {
    try {
      // Just accessing these to check if they're loaded
      if (!Player) {
        setPlayerError('Remotion Player component not loaded correctly');
      }
    } catch (error) {
      console.error('Error loading Remotion components:', error);
      setPlayerError(`Error loading Remotion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);
  
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
          shots: customShots,
          shotDurations: shotDurations,
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
  
  const updateShotDuration = useCallback((shotId: string, frames: number) => {
    setShotDurations(prev => ({
      ...prev,
      [shotId]: frames
    }));
  }, []);

  // If there's an error loading Remotion, show a fallback UI
  if (playerError) {
    return (
      <div className="flex flex-col border border-border rounded-lg overflow-hidden bg-background">
        <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-red-50 dark:bg-red-900/20">
          <h3 className="text-base font-semibold text-red-700 dark:text-red-300">Remotion Player Error</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-red-600"
          >
            {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
          </Button>
        </div>
        <div className="p-6 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <span className="font-medium">Could not load Remotion Player</span>
          </div>
          <p className="text-sm text-center max-w-lg">
            There was an error loading the Remotion video editor. Try the following:
          </p>
          <ul className="list-disc pl-6 text-sm space-y-1">
            <li>Make sure you have installed all the required Remotion packages</li>
            <li>Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npm install</code> to update dependencies</li>
            <li>Check your browser console for specific error messages</li>
            <li>Try using the basic video exporter instead</li>
          </ul>
          {showDebugInfo && (
            <div className="w-full mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto text-xs">
              <h4 className="font-mono font-bold mb-2">Debug Information:</h4>
              <pre className="whitespace-pre-wrap">{playerError}</pre>
              <h4 className="font-mono font-bold mt-4 mb-2">Environment:</h4>
              <pre>Browser: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'}</pre>
              <pre>Packages loaded: {typeof Player !== 'undefined' ? 'Player ✅' : 'Player ❌'}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col border border-border rounded-lg overflow-hidden bg-background">
      <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-muted/30">
        <h3 className="text-base font-semibold">Scene Timeline: {scene.title}</h3>
        <div className="flex items-center gap-2">
          {exportedVideoUrl && (
            <Button variant="outline" onClick={() => window.open(exportedVideoUrl, '_blank')}>
              <Download className="mr-2 h-4 w-4" />
              Download Video
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
                {exportProgress > 0 ? `Rendering ${exportProgress.toFixed(0)}%` : 'Starting render...'}
              </>
            ) : (
              <>
                <Film className="mr-2 h-4 w-4" />
                Render Video
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col h-[400px]">
        <div className="flex-1 min-h-0">
          {/* Wrap in an error boundary */}
          <div className="w-full h-full">
            <Player
              ref={playerRef}
              component={SceneVideoWrapper}
              durationInFrames={totalDurationInFrames}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{
                width: '100%',
                height: '100%',
              }}
              controls
              inputProps={{
                shots: customShots,
                title: scene.title,
                shotDurations: shotDurations,
                audioVolume: 0.8, // Default to 80% volume
                musicVolume: 0.8 // Default to 80% volume
              }}
              errorFallback={(error) => {
                console.error('Remotion Player error:', error);
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 p-4">
                    <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
                    <h4 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">Video Preview Error</h4>
                    <p className="text-sm text-center max-w-md mb-4">
                      There was an error rendering the video preview. You can still adjust durations and export.
                    </p>
                    <details className="text-xs w-full max-w-lg bg-white dark:bg-gray-800 p-2 rounded">
                      <summary className="cursor-pointer font-medium">Show error details</summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded whitespace-pre-wrap">
                        {String(error)}
                      </pre>
                    </details>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-border bg-muted/10">
        <h4 className="text-sm font-medium mb-2">Shot Durations (in seconds)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {customShots.map((shot, index) => (
            <div key={shot.id} className="flex items-center space-x-2">
              <span className="text-sm">{index + 1}. {shot.type}</span>
              <input 
                type="range" 
                min="30" 
                max="300" 
                step="30"
                value={shotDurations[shot.id] || shotDuration}
                onChange={(e) => updateShotDuration(shot.id, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">
                {((shotDurations[shot.id] || shotDuration) / 30).toFixed(1)}s
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 