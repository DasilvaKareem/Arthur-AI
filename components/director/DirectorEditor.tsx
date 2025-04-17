import React, { useState, useRef, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { AbsoluteFill } from 'remotion';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SceneComposition } from '../remotion/SceneComposition';
import { Settings, Subtitles, Languages, Download, Play, Pause, SkipBack, SkipForward, Save, Trash2 } from 'lucide-react';
import type { Scene, Shot } from '../../types/shared';
import { useTheme } from 'next-themes';

interface DirectorEditorProps {
  scene: Scene;
  storyId: string;
}

const VideoPreview: React.FC<{
  shots: Shot[];
  title: string;
  shotDurations: Record<string, number>;
  audioVolume?: number;
}> = (props) => {
  console.log("VideoPreview props:", {
    shots: props.shots.map(shot => ({
      id: shot.id,
      videoUrl: shot.videoUrl,
      generatedVideo: shot.generatedVideo,
      dialogueAudio: shot.dialogueAudio,
      lipSyncAudio: shot.lipSyncAudio,
      soundEffectsAudio: shot.soundEffectsAudio,
      hasDialogue: shot.hasDialogue,
      hasSoundEffects: shot.hasSoundEffects
    }))
  });
  
  // Check if any shots have audio
  const hasAudioSources = props.shots.some(shot => 
    shot.dialogueAudio || shot.lipSyncAudio || (shot.hasSoundEffects && shot.soundEffectsAudio)
  );
  
  if (hasAudioSources) {
    console.log("Found audio sources in shots - audio should play!");
  } else {
    console.warn("No audio sources found in any shots");
  }
  
  return <SceneComposition {...props} />;
};

export const DirectorEditor = ({ scene, storyId }: DirectorEditorProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [audioVolume, setAudioVolume] = useState(80);
  const [language, setLanguage] = useState('en');
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [subtitle, setSubtitle] = useState<Record<string, string[]>>({
    en: scene.shots.map(shot => shot.dialogue || ''),
  });
  
  // Calculate duration based on shots
  const shotDuration = 150; // 5 seconds at 30fps
  const titleDuration = 60; // 2 seconds at 30fps
  
  // State for customizing shots and their durations
  const [customShots, setCustomShots] = useState<Shot[]>(scene.shots || []);
  const [shotDurations, setShotDurations] = useState<Record<string, number>>(
    Object.fromEntries((scene.shots || []).map(shot => [shot.id, shotDuration]))
  );

  // Calculate total duration based on all shots
  const totalDurationInFrames = titleDuration + 
    (scene.shots || []).reduce((total, shot) => total + (shotDurations[shot.id] || shotDuration), 0);
    
  // Update shots when scene changes
  useEffect(() => {
    const updatedShots = (scene.shots || []).map(shot => {
      // Check if shot has dialogue but no dialogueAudio
      const needsAudioURL = shot.hasDialogue && !shot.dialogueAudio && shot.dialogue;
      
      return {
        ...shot,
        // If videoUrl is not set but generatedVideo is available, use generatedVideo
        videoUrl: shot.videoUrl || shot.generatedVideo || null,
        // Add a test audio URL for debugging if needed
        dialogueAudio: shot.dialogueAudio || (needsAudioURL 
          ? "https://firebasestorage.googleapis.com/v0/b/arthurai-12fda.appspot.com/o/temp%2F1744600708741.wav?alt=media&token=a1cc3071-2268-438b-9eb7-9f87e2517c88" 
          : null)
      };
    });
    
    setCustomShots(updatedShots);
    setShotDurations(
      Object.fromEntries(updatedShots.map(shot => [shot.id, shotDuration]))
    );
    setSubtitle({
      en: updatedShots.map(shot => shot.dialogue || ''),
    });
    
    console.log("Updated shots with media URLs:", updatedShots.map(shot => ({
      id: shot.id,
      videoUrl: shot.videoUrl || shot.generatedVideo,
      dialogueAudio: shot.dialogueAudio,
      lipSyncAudio: shot.lipSyncAudio,
      soundEffectsAudio: shot.soundEffectsAudio,
      hasDialogue: shot.hasDialogue,
      hasSoundEffects: shot.hasSoundEffects,
      dialogue: shot.dialogue
    })));
  }, [scene]);
  
  // Refresh player when a video URL changes
  useEffect(() => {
    if (playerRef.current) {
      // Force a seek to current position to refresh the video
      const currentPosition = currentFrame;
      playerRef.current.seekTo(0);
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.seekTo(currentPosition);
        }
      }, 100);
    }
    
  }, [
    JSON.stringify(customShots.map(shot => 
      shot.id + 
      (shot.videoUrl || shot.generatedVideo || '') + 
      (shot.dialogueAudio || '') +
      (shot.lipSyncAudio || '') +
      (shot.soundEffectsAudio || '')
    )), 
    currentFrame,
    audioVolume
  ]);
  
  // Add support for video URLs
  const updateShotVideoUrl = (shotId: string, videoUrl: string) => {
    setCustomShots(prev => 
      prev.map(shot => {
        if (shot.id === shotId) {
          // If videoUrl is empty and generatedVideo exists, use generatedVideo as the source
          if (!videoUrl && shot.generatedVideo) {
            return { ...shot, videoUrl: null }; // Clear videoUrl to use generatedVideo
          } else {
            return { ...shot, videoUrl };
          }
        }
        return shot;
      })
    );
    
    console.log(`Updated shot ${shotId} with new videoUrl: ${videoUrl}`);
  };
  
  // Handle frame change
  const handleFrameChange = (frame: number) => {
    setCurrentFrame(frame);
  };
  
  // Play/pause the video
  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Seek to previous/next shot
  const seekToPreviousShot = () => {
    // Find the previous shot start frame
    let previousShotFrame = 0;
    let currentTime = 0;
    
    for (let i = 0; i < customShots.length; i++) {
      const shotId = customShots[i].id;
      const duration = shotDurations[shotId] || shotDuration;
      
      if (currentTime + duration > currentFrame) {
        // We found the current shot, go to the previous one
        if (i > 0) {
          previousShotFrame = currentTime - (shotDurations[customShots[i-1].id] || shotDuration);
        } else {
          previousShotFrame = 0; // Go to the beginning if we're in the first shot
        }
        break;
      }
      
      currentTime += duration;
    }
    
    if (playerRef.current) {
      playerRef.current.seekTo(Math.max(0, previousShotFrame));
    }
  };
  
  const seekToNextShot = () => {
    // Find the next shot start frame
    let nextShotFrame = 0;
    let currentTime = 0;
    
    for (let i = 0; i < customShots.length; i++) {
      const shotId = customShots[i].id;
      const duration = shotDurations[shotId] || shotDuration;
      currentTime += duration;
      
      if (currentTime > currentFrame) {
        nextShotFrame = currentTime;
        break;
      }
    }
    
    if (playerRef.current) {
      playerRef.current.seekTo(Math.min(nextShotFrame, totalDurationInFrames));
    }
  };
  
  // Update shot duration
  const updateShotDuration = (shotId: string, frames: number) => {
    setShotDurations(prev => ({
      ...prev,
      [shotId]: frames
    }));
  };
  
  // Update subtitle for a specific shot
  const updateSubtitle = (shotIndex: number, text: string) => {
    setSubtitle(prev => {
      const newSubtitles = { ...prev };
      newSubtitles[language] = [...(newSubtitles[language] || [])];
      newSubtitles[language][shotIndex] = text;
      return newSubtitles;
    });
  };
  
  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Mock export process for now
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setExportProgress(i);
      }
      
      // Once complete
      setIsExporting(false);
      alert('Video exported successfully!');
    } catch (error) {
      console.error('Error exporting video:', error);
      setIsExporting(false);
      alert('Failed to export video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  if (!scene) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">Please select a scene to edit</p>
      </div>
    );
  }
  
  if (playerError) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error loading video editor</h3>
          <p className="text-sm text-muted-foreground mb-4">{playerError}</p>
          <Button onClick={() => setPlayerError(null)}>Retry</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">{scene.title} - Director View</h2>
        <div className="flex space-x-2">
          <Button variant="outline" disabled={isExporting} onClick={() => {}}>
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
          <Button variant="default" disabled={isExporting} onClick={handleExport}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {exportProgress > 0 ? `${exportProgress}%` : 'Starting...'}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Video
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Video preview */}
        <div className="flex-1 p-4">
          <div className="rounded-lg overflow-hidden shadow-md bg-black aspect-video mb-4 relative">
            <Player
              ref={playerRef}
              component={VideoPreview}
              durationInFrames={totalDurationInFrames}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{
                width: '100%',
                height: '100%',
              }}
              inputProps={{
                shots: customShots,
                title: scene.title,
                shotDurations: shotDurations,
                audioVolume: audioVolume / 100,
              }}
              controls
              key={JSON.stringify(customShots.map(shot => 
                shot.id + 
                (shot.videoUrl || shot.generatedVideo || '') + 
                (shot.dialogueAudio || '') +
                (shot.lipSyncAudio || '') +
                (shot.soundEffectsAudio || '')
              ))}
            />
            
            {/* Video controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 flex items-center justify-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={seekToPreviousShot}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={seekToNextShot}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              
              <div className="text-xs text-white">
                {Math.floor(currentFrame / 30)}s / {Math.floor(totalDurationInFrames / 30)}s
              </div>
            </div>
          </div>
          
          {/* Editor tabs */}
          <Tabs defaultValue="shots" className="w-full">
            <TabsList>
              <TabsTrigger value="shots">Shots</TabsTrigger>
              <TabsTrigger value="subtitles">Subtitles</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shots" className="p-4 border rounded-md mt-2">
              <h3 className="text-lg font-medium mb-4">Shot Timeline</h3>
              
              <div className="space-y-4">
                {customShots.map((shot, index) => (
                  <div key={shot.id} className="p-3 border rounded-md bg-card">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Shot {index + 1}: {shot.type}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          Duration: {(shotDurations[shot.id] || shotDuration) / 30}s
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {shot.description}
                    </p>
                    
                    <div className="mb-3">
                      <Label className="mb-2 block">Video URL</Label>
                      <Input 
                        placeholder="https://example.com/video.mp4" 
                        value={shot.videoUrl || ''}
                        onChange={(e) => updateShotVideoUrl(shot.id, e.target.value)}
                        className="mb-2"
                      />
                      {shot.generatedVideo && !shot.videoUrl && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Using generated video: {shot.generatedVideo.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Duration:</span>
                      <div className="flex-1">
                        <Slider
                          value={[(shotDurations[shot.id] || shotDuration) / 30]}
                          min={1}
                          max={20}
                          step={0.5}
                          onValueChange={(value: number[]) => updateShotDuration(shot.id, value[0] * 30)}
                        />
                      </div>
                      <span className="text-sm w-8 text-right">
                        {((shotDurations[shot.id] || shotDuration) / 30).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="subtitles" className="p-4 border rounded-md mt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Subtitle Editor</h3>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-subtitles"
                      checked={showSubtitles}
                      onCheckedChange={setShowSubtitles}
                    />
                    <Label htmlFor="show-subtitles">Show Subtitles</Label>
                  </div>
                  
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                {customShots.map((shot, index) => (
                  <div key={shot.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Shot {index + 1}: {shot.type}</h4>
                      <span className="text-sm text-muted-foreground">
                        {(shotDurations[shot.id] || shotDuration) / 30}s
                      </span>
                    </div>
                    
                    <Input
                      placeholder="Enter subtitle text..."
                      value={subtitle[language]?.[index] || ''}
                      onChange={(e) => updateSubtitle(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="p-4 border rounded-md mt-2">
              <h3 className="text-lg font-medium mb-4">Project Settings</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-title">Project Title</Label>
                    <Input id="project-title" value={scene.title} readOnly />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="video-resolution">Resolution</Label>
                    <Select defaultValue="1080p">
                      <SelectTrigger id="video-resolution">
                        <SelectValue placeholder="Resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        <SelectItem value="2160p">2160p (4K)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="framerate">Frame Rate</Label>
                    <Select defaultValue="30">
                      <SelectTrigger id="framerate">
                        <SelectValue placeholder="Frame Rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 fps (Film)</SelectItem>
                        <SelectItem value="30">30 fps (Standard)</SelectItem>
                        <SelectItem value="60">60 fps (Smooth)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="output-format">Output Format</Label>
                    <Select defaultValue="mp4">
                      <SelectTrigger id="output-format">
                        <SelectValue placeholder="Output Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                        <SelectItem value="webm">WebM (VP9)</SelectItem>
                        <SelectItem value="gif">GIF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 