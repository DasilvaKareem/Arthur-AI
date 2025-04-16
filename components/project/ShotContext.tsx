import React, { createContext, useContext, useCallback } from 'react';
import type { Shot } from '../../types/shared';

interface ShotContextType {
  storyId: string | null;
  sceneId: string | null;
  updateShot: (shotId: string, updates: Partial<Shot>) => Promise<void>;
  isImageLoading: boolean;
  isVideoLoading: boolean;
  generateImage: (index: number, prompt: string) => Promise<void>;
  generateVideo: (index: number) => Promise<void>;
  generateLipSync: (index: number) => Promise<void>;
}

export const ShotContext = createContext<ShotContextType | null>(null);

export const useShotContext = () => {
  const context = useContext(ShotContext);
  if (!context) {
    throw new Error('useShotContext must be used within a ShotProvider');
  }
  return context;
};

export const ShotProvider: React.FC<{
  children: React.ReactNode;
  value: ShotContextType;
}> = ({ children, value }) => {
  return (
    <ShotContext.Provider value={value}>
      {children}
    </ShotContext.Provider>
  );
}; 